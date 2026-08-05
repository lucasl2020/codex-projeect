#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cloudflare 验证绕过脚本
======================
集成多种策略，自动检测并绕过 Cloudflare 的 5 秒盾 / JS Challenge / Turnstile 验证。

策略按效率从高到低自动降级：
  1. curl_cffi      —— TLS 指纹伪装（轻量级，能过低安全级别 CF 站）
  2. cloudscraper   —— 纯 Python 解析免费版 5 秒盾
  3. FlareSolverr   —— Docker 服务，过付费版 CF（需要预先启动容器）
  4. DrissionPage   —— CDP 协议操控真实 Chrome（成功率最高，推荐）
  5. Playwright     —— 浏览器自动化兜底方案

当遇到 Cloudflare Turnstile 验证码时，自动调用 captcha_solver 模块处理：
  - Turnstile 无感验证 → 第三方打码平台 (2captcha/capsolver/yescaptcha)
  - 图形验证码         → ddddocr OCR 识别
  - 算术验证码         → OCR + 表达式求值
  - 点选验证码         → ddddocr 目标检测
  - 滑块验证码         → ddddocr 缺口检测 + 轨迹模拟

参考来源：
  - https://zhuanlan.zhihu.com/p/2060717235057047145
  - https://juejin.cn/post/7238920970563027003
  - https://blog.dairoot.cn/2024/08/05/cloudflare5s-bypass/
  - https://cloud.tencent.com/developer/article/1835814
  - https://www.flftuu.com/2020/12/12/使用Splash跳过CloudFlare-5秒盾和浏览器检查/
  - https://www.kingname.info/2023/02/25/crack-cf-2/

合规提醒：本脚本仅供技术研究和学习使用，请在合法合规的前提下使用，
遵守目标网站的 robots.txt 和相关法律法规。

用法示例：
    from cf_bypass import CloudflareBypasser

    bypasser = CloudflareBypasser()
    result = bypasser.bypass("https://example.com")

    if result.success:
        # 用拿到的 cookies + UA 继续发请求
        import requests
        resp = requests.get("https://example.com/api/data",
                            cookies=result.cookies,
                            headers={"User-Agent": result.user_agent})
        print(resp.text)
"""

import re
import time
import json
import logging
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from urllib.parse import urlparse

# ---------------------------------------------------------------------------
# 日志配置
# ---------------------------------------------------------------------------
logger = logging.getLogger("cf_bypass")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(
        "[%(asctime)s] [CF-Bypass] %(levelname)s: %(message)s",
        datefmt="%H:%M:%S"
    ))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)


# ---------------------------------------------------------------------------
# 数据结构
# ---------------------------------------------------------------------------
@dataclass
class BypassResult:
    """绕过结果"""
    success: bool = False
    cookies: Dict[str, str] = field(default_factory=dict)
    user_agent: str = ""
    strategy: str = ""           # 使用的策略名称
    html: str = ""               # 绕过后拿到的页面 HTML
    response: Any = None         # 原始响应对象（策略不同类型不同）
    error: str = ""              # 失败原因


# ---------------------------------------------------------------------------
# 核心类
# ---------------------------------------------------------------------------
class CloudflareBypasser:
    """
    Cloudflare 验证绕过器

    自动检测目标网站是否受到 Cloudflare 保护，并依次尝试多种策略进行绕过。
    成功后返回 cookies 和 User-Agent，可用于后续的 requests 请求。

    关键原理（来自参考资料）：
      - cf_clearance / __cf_bm Cookie 绑定 IP + UA，三者必须一致
      - 低安全级别：仅校验 TLS 指纹（JA3），curl_cffi 可直接过
      - 免费版 5 秒盾：下发 JS Challenge，cloudscraper 可解析
      - 付费版：更严格的指纹检测，需要真实浏览器渲染
      - 高安全级别：校验 JA3 + TLS + HTTP/2 指纹，需 DrissionPage / Playwright
    """

    # CF 挑战页的特征字符串
    CF_CHALLENGE_PATTERNS = [
        r"just a moment",
        r"checking your browser",
        r"cf-browser-verification",
        r"cf_chl_opt",
        r"__cf_chl_jschl_tk__",
        r"challenge-platform",
        r"cdn-cgi/challenge-platform",
        r"Please allow up to 5 seconds",
        r"ray id",
        r"cf-mitigated",
    ]

    # CF 相关 Cookie 名称
    CF_COOKIE_NAMES = {"cf_clearance", "__cf_bm", "__cf_chl_tk", "cf_chl_rc"}

    def __init__(
        self,
        proxy: Optional[str] = None,
        flaresolverr_url: str = "http://localhost:8191/v1",
        browser_path: Optional[str] = None,
        headless: bool = True,
        timeout: int = 30,
        max_retries: int = 2,
        captcha_platform: str = "",
        captcha_api_key: str = "",
    ):
        """
        :param proxy:            代理地址，如 "socks5://127.0.0.1:7890" 或 "http://127.0.0.1:7890"
        :param flaresolverr_url: FlareSolverr 服务地址（需预先 Docker 启动）
        :param browser_path:     Chrome / Edge 可执行文件路径（DrissionPage / Playwright 使用）
        :param headless:         浏览器是否无头模式（CF 对 headless 敏感，必要时设为 False）
        :param timeout:          每个策略的超时时间（秒）
        :param max_retries:      单个策略的最大重试次数
        :param captcha_platform: 验证码打码平台 ("2captcha" / "capsolver" / "yescaptcha")
        :param captcha_api_key:  打码平台 API Key
        """
        self.proxy = proxy
        self.flaresolverr_url = flaresolverr_url
        self.browser_path = browser_path
        self.headless = headless
        self.timeout = timeout
        self.max_retries = max_retries
        self.captcha_platform = captcha_platform
        self.captcha_api_key = captcha_api_key
        self._captcha_solver = None  # 延迟初始化

    @property
    def captcha_solver(self):
        """延迟初始化验证码解决器"""
        if self._captcha_solver is None:
            try:
                from captcha_solver import CaptchaSolver
                self._captcha_solver = CaptchaSolver(
                    third_party_platform=self.captcha_platform or "2captcha",
                    third_party_api_key=self.captcha_api_key,
                    max_wait=self.timeout * 4,
                )
            except ImportError:
                logger.warning("captcha_solver 模块未找到，验证码功能不可用")
        return self._captcha_solver

    def solve_turnstile(self, site_key: str, page_url: str) -> Optional[str]:
        """
        解决 Cloudflare Turnstile 验证码。

        :param site_key: Turnstile data-sitekey
        :param page_url: 页面 URL
        :return: cf-turnstile-response token，失败返回 None
        """
        if not self.captcha_api_key:
            logger.warning("未配置打码平台 API Key，无法解决 Turnstile")
            return None

        solver = self.captcha_solver
        if solver is None:
            return None

        result = solver.third_party.solve_turnstile(site_key, page_url)
        if result.success:
            logger.info(f"Turnstile 验证码已解决")
            return result.answer
        else:
            logger.error(f"Turnstile 解决失败: {result.error}")
            return None

    # ===================================================================
    #  公共接口
    # ===================================================================

    def bypass(self, url: str, strategies: Optional[list] = None) -> BypassResult:
        """
        主入口：自动检测 CF 并尝试绕过。

        :param url:       目标 URL
        :param strategies: 自定义策略顺序，默认按效率降级
                           可选: ["curl_cffi", "cloudscraper", "flaresolverr",
                                  "drissionpage", "playwright"]
        :return: BypassResult
        """
        if strategies is None:
            strategies = [
                "curl_cffi",
                "cloudscraper",
                "flaresolverr",
                "drissionpage",
                "playwright",
            ]

        logger.info(f"开始处理: {url}")

        # ---- 先用 curl_cffi 探测是否真的有 CF 防护 ----
        is_cf, probe_resp = self._probe_cloudflare(url)
        if not is_cf:
            logger.info("未检测到 Cloudflare 验证，直接返回响应")
            return BypassResult(
                success=True,
                cookies={},
                user_agent="",
                strategy="direct",
                html=probe_resp if probe_resp else "",
            )

        logger.warning(f"检测到 Cloudflare 验证，开始尝试绕过 (策略: {strategies})")

        # ---- 依次尝试策略 ----
        strategy_map = {
            "curl_cffi": self._try_curl_cffi,
            "cloudscraper": self._try_cloudscraper,
            "flaresolverr": self._try_flaresolverr,
            "drissionpage": self._try_drissionpage,
            "playwright": self._try_playwright,
        }

        for strategy_name in strategies:
            strategy_func = strategy_map.get(strategy_name)
            if strategy_func is None:
                logger.warning(f"未知策略: {strategy_name}，跳过")
                continue

            for attempt in range(1, self.max_retries + 1):
                logger.info(f"尝试策略 [{strategy_name}] 第 {attempt}/{self.max_retries} 次")
                try:
                    result = strategy_func(url)
                    if result.success:
                        logger.info(f"✅ 策略 [{strategy_name}] 成功绕过 Cloudflare!")
                        return result
                    else:
                        logger.warning(f"策略 [{strategy_name}] 失败: {result.error}")
                except Exception as e:
                    logger.error(f"策略 [{strategy_name}] 异常: {e}")
                time.sleep(1)

        logger.error("所有策略均失败，无法绕过 Cloudflare 验证")
        return BypassResult(success=False, error="所有策略均失败")

    def get(self, url: str, **kwargs) -> BypassResult:
        """便捷方法：等同于 bypass()"""
        return self.bypass(url, **kwargs)

    # ===================================================================
    #  CF 检测
    # ===================================================================

    def _probe_cloudflare(self, url: str):
        """
        用 curl_cffi 探测目标是否受 CF 保护。
        返回 (is_cf: bool, html: str)
        """
        try:
            from curl_cffi import requests as cf_requests
        except ImportError:
            logger.debug("curl_cffi 未安装，跳过探测，假设存在 CF 验证")
            return True, ""

        try:
            resp = cf_requests.get(
                url,
                impersonate="chrome120",
                proxies={"https": self.proxy, "http": self.proxy} if self.proxy else None,
                timeout=self.timeout,
                allow_redirects=True,
            )

            # 状态码 403/503 + CF 特征 → 确认是 CF 验证
            if resp.status_code in (403, 503) and self._is_cf_challenge_html(resp.text):
                return True, resp.text

            # 状态码 200 但内容是挑战页
            if resp.status_code == 200 and self._is_cf_challenge_html(resp.text):
                return True, resp.text

            # 正常响应
            return False, resp.text

        except Exception as e:
            logger.debug(f"探测异常: {e}")
            return True, ""

    def _is_cf_challenge_html(self, html: str) -> bool:
        """检测 HTML 是否为 CF 挑战页"""
        if not html:
            return False
        html_lower = html.lower()
        for pattern in self.CF_CHALLENGE_PATTERNS:
            if re.search(pattern, html_lower, re.IGNORECASE):
                return True
        return False

    # ===================================================================
    #  策略 1: curl_cffi —— TLS 指纹伪装
    # ===================================================================

    def _try_curl_cffi(self, url: str) -> BypassResult:
        """
        使用 curl_cffi 模拟真实浏览器的 TLS 指纹（JA3）。
        适用于 CF 安全级别为 Low / Essentially Off 的站点。
        """
        try:
            from curl_cffi import requests as cf_requests
        except ImportError:
            return BypassResult(success=False, error="curl_cffi 未安装 (pip install curl_cffi)")

        # 依次尝试多个浏览器指纹
        impersonate_list = ["chrome120", "chrome124", "safari17_0", "firefox120", "edge101"]
        proxies = {"https": self.proxy, "http": self.proxy} if self.proxy else None

        # 模拟真实浏览器的请求头
        headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,"
                      "image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Sec-Ch-Ua": '"Chromium";v="120", "Not(A:Brand";v="24", "Google Chrome";v="120"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
        }

        for imp in impersonate_list:
            try:
                resp = cf_requests.get(
                    url,
                    impersonate=imp,
                    headers=headers,
                    proxies=proxies,
                    timeout=self.timeout,
                    allow_redirects=True,
                )

                if resp.status_code == 200 and not self._is_cf_challenge_html(resp.text):
                    cookies = dict(resp.cookies)
                    ua = resp.request.headers.get("User-Agent", "")
                    return BypassResult(
                        success=True,
                        cookies=cookies,
                        user_agent=ua,
                        strategy="curl_cffi",
                        html=resp.text,
                        response=resp,
                    )
            except Exception as e:
                logger.debug(f"curl_cffi impersonate={imp} 失败: {e}")
                continue

        return BypassResult(success=False, error="所有 TLS 指纹均被 CF 拦截")

    # ===================================================================
    #  策略 2: cloudscraper —— 免费版 5 秒盾
    # ===================================================================

    def _try_cloudscraper(self, url: str) -> BypassResult:
        """
        使用 cloudscraper 库解析 CF 的 JS Challenge。
        适用于 CF 免费版的 5 秒盾，对付费版无效。
        """
        try:
            import cloudscraper
        except ImportError:
            return BypassResult(success=False, error="cloudscraper 未安装 (pip install cloudscraper)")

        try:
            scraper = cloudscraper.create_scraper(
                browser={
                    "browser": "chrome",
                    "platform": "windows",
                    "desktop": True,
                },
                delay=self.timeout,
            )

            proxies = {"http": self.proxy, "https": self.proxy} if self.proxy else None
            resp = scraper.get(url, proxies=proxies, timeout=self.timeout)

            if resp.status_code == 200 and not self._is_cf_challenge_html(resp.text):
                cookies = dict(resp.cookies)
                ua = resp.request.headers.get("User-Agent", "")
                return BypassResult(
                    success=True,
                    cookies=cookies,
                    user_agent=ua,
                    strategy="cloudscraper",
                    html=resp.text,
                    response=resp,
                )

            return BypassResult(
                success=False,
                error=f"cloudscraper 返回状态码 {resp.status_code} 或仍为挑战页"
            )

        except Exception as e:
            return BypassResult(success=False, error=f"cloudscraper 异常: {e}")

    # ===================================================================
    #  策略 3: FlareSolverr —— Docker 服务（付费版）
    # ===================================================================

    def _try_flaresolverr(self, url: str) -> BypassResult:
        """
        通过 FlareSolverr Docker 服务绕过 CF（包括付费版）。
        需要预先启动容器：
            docker run -d --name=flaresolverr -p 8191:8191 \
              -e LOG_LEVEL=info --restart unless-stopped \
              ghcr.io/flaresolverr/flaresolverr:latest
        """
        try:
            import requests as std_requests
        except ImportError:
            return BypassResult(success=False, error="requests 未安装")

        try:
            payload = {
                "cmd": "request.get",
                "url": url,
                "maxTimeout": self.timeout * 1000,
            }

            if self.proxy:
                payload["proxy"] = {"url": self.proxy}

            resp = std_requests.post(
                self.flaresolverr_url,
                json=payload,
                timeout=self.timeout + 30,  # 给 FlareSolverr 额外时间
            )
            data = resp.json()

            if data.get("status") == "ok":
                solution = data.get("solution", {})
                html = solution.get("response", "")
                ua = solution.get("userAgent", "")

                # 提取 cookies
                cookies_dict = {}
                for cookie in solution.get("cookies", []):
                    cookies_dict[cookie.get("name", "")] = cookie.get("value", "")

                if not self._is_cf_challenge_html(html):
                    return BypassResult(
                        success=True,
                        cookies=cookies_dict,
                        user_agent=ua,
                        strategy="flaresolverr",
                        html=html,
                        response=data,
                    )
                else:
                    return BypassResult(success=False, error="FlareSolverr 返回的仍是挑战页")

            return BypassResult(
                success=False,
                error=f"FlareSolverr 返回错误: {data.get('message', 'unknown')}"
            )

        except std_requests.exceptions.ConnectionError:
            return BypassResult(
                success=False,
                error=f"无法连接 FlareSolverr 服务 ({self.flaresolverr_url})，请确认容器已启动"
            )
        except Exception as e:
            return BypassResult(success=False, error=f"FlareSolverr 异常: {e}")

    # ===================================================================
    #  策略 4: DrissionPage —— CDP 协议操控真实 Chrome（推荐）
    # ===================================================================

    def _try_drissionpage(self, url: str) -> BypassResult:
        """
        使用 DrissionPage 通过 CDP 协议操控真实 Chrome 浏览器。
        不经过 WebDriver 层，CF 难以检测，成功率最高。

        原理：CF 下发 JS 挑战 → 真实浏览器执行 JS → 生成 cf_clearance / __cf_bm
        → 提取 Cookie 和 UA → 后续用 requests 复用（30 分钟有效）
        """
        try:
            from DrissionPage import ChromiumPage, ChromiumOptions
        except ImportError:
            return BypassResult(
                success=False,
                error="DrissionPage 未安装 (pip install DrissionPage)"
            )

        page = None
        try:
            # 配置浏览器选项
            co = ChromiumOptions()
            if self.browser_path:
                co.set_browser_path(self.browser_path)
            if self.headless:
                co.headless(True)
            else:
                co.headless(False)

            # 反检测参数
            co.set_argument("--disable-blink-features=AutomationControlled")
            co.set_argument("--no-sandbox")
            co.set_argument("--disable-dev-shm-usage")
            co.set_argument("--disable-infobars")
            co.set_argument("--disable-extensions")

            if self.proxy:
                co.set_argument(f"--proxy-server={self.proxy}")

            page = ChromiumPage(co)

            logger.info("DrissionPage 浏览器已启动，正在访问目标页面...")
            page.get(url)

            # 等待 CF 挑战完成（页面会自动刷新）
            # CF 挑战通常 5-15 秒，这里循环检测
            max_wait = self.timeout
            start_time = time.time()

            while time.time() - start_time < max_wait:
                current_html = page.html or ""
                if not self._is_cf_challenge_html(current_html):
                    logger.info("CF 挑战已完成，页面已加载")
                    break
                time.sleep(2)
            else:
                return BypassResult(success=False, error="DrissionPage 等待超时，CF 挑战未完成")

            # 额外等待页面稳定
            time.sleep(2)

            # 提取 cookies（兼容新旧 DrissionPage API）
            cookies_dict = {}
            try:
                cookies_list = page.cookies()
            except TypeError:
                cookies_list = page.cookies(all_domains=True)
            except Exception:
                cookies_list = []
            if isinstance(cookies_list, dict):
                cookies_dict = {str(k): str(v) for k, v in cookies_list.items() if k and v is not None}
            else:
                for cookie in cookies_list or []:
                    if isinstance(cookie, dict):
                        name = cookie.get("name", "")
                        value = cookie.get("value", "")
                    else:
                        name = getattr(cookie, "name", "")
                        value = getattr(cookie, "value", "")
                    if name and value:
                        cookies_dict[str(name)] = str(value)

            # 提取 User-Agent
            ua = page.run_js("return navigator.userAgent;") or ""

            # 检查是否拿到关键 CF cookie
            cf_cookies = {k: v for k, v in cookies_dict.items()
                          if k in self.CF_COOKIE_NAMES}
            if cf_cookies:
                logger.info(f"获取到 CF Cookie: {list(cf_cookies.keys())}")

            html = page.html or ""

            if not self._is_cf_challenge_html(html):
                return BypassResult(
                    success=True,
                    cookies=cookies_dict,
                    user_agent=ua,
                    strategy="drissionpage",
                    html=html,
                )
            else:
                return BypassResult(success=False, error="DrissionPage 拿到的仍是挑战页")

        except Exception as e:
            return BypassResult(success=False, error=f"DrissionPage 异常: {e}")

        finally:
            if page is not None:
                try:
                    page.quit()
                except Exception:
                    pass

    # ===================================================================
    #  策略 5: Playwright —— 浏览器自动化兜底
    # ===================================================================

    def _try_playwright(self, url: str) -> BypassResult:
        """
        使用 Playwright + cf-clearance 库绕过 CF。
        作为 DrissionPage 的备选方案。

        需要：pip install playwright cf-clearance && playwright install chromium
        """
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            return BypassResult(
                success=False,
                error="Playwright 未安装 (pip install playwright && playwright install chromium)"
            )

        # 尝试加载 cf-clearance 的 stealth 模块
        try:
            from cf_clearance import sync_cf_retry, sync_stealth
            has_cf_clearance = True
        except ImportError:
            has_cf_clearance = False
            logger.debug("cf-clearance 未安装，使用纯 Playwright 模式")

        browser = None
        try:
            with sync_playwright() as p:
                launch_args = [
                    "--disable-blink-features=AutomationControlled",
                    "--disable-features=IsolateOrigins,site-per-process",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                ]

                launch_kwargs = {
                    "headless": self.headless,
                    "args": launch_args,
                }
                if self.browser_path:
                    launch_kwargs["executable_path"] = self.browser_path
                    launch_kwargs["channel"] = None
                else:
                    # Prefer system Chrome channel when Playwright browser pack is absent.
                    launch_kwargs["channel"] = "chrome"

                if self.proxy:
                    launch_kwargs["proxy"] = {"server": self.proxy}

                try:
                    browser = p.chromium.launch(**{k: v for k, v in launch_kwargs.items() if v is not None})
                except Exception:
                    # Final fallback without channel/executable constraints.
                    launch_kwargs.pop("channel", None)
                    launch_kwargs.pop("executable_path", None)
                    browser = p.chromium.launch(**launch_kwargs)
                context = browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                               "AppleWebKit/537.36 (KHTML, like Gecko) "
                               "Chrome/120.0.0.0 Safari/537.36",
                    viewport={"width": 1920, "height": 1080},
                    locale="zh-CN",
                )

                page = context.new_page()

                # 注入反检测脚本
                if has_cf_clearance:
                    sync_stealth(page, pure=True)
                else:
                    # 手动注入反检测脚本
                    page.add_init_script("""
                        Object.defineProperty(navigator, 'webdriver', {
                            get: () => undefined
                        });
                        Object.defineProperty(navigator, 'plugins', {
                            get: () => [1, 2, 3, 4, 5]
                        });
                        Object.defineProperty(navigator, 'languages', {
                            get: () => ['zh-CN', 'zh', 'en']
                        });
                        window.chrome = { runtime: {} };
                    """)

                logger.info("Playwright 浏览器已启动，正在访问目标页面...")
                page.goto(url, wait_until="domcontentloaded", timeout=self.timeout * 1000)

                # 如果有 cf-clearance 库，使用它的重试机制
                if has_cf_clearance:
                    cf_ok = sync_cf_retry(page)
                    if not cf_ok:
                        return BypassResult(success=False, error="cf-clearance 重试失败")
                else:
                    # 手动等待 CF 挑战完成
                    max_wait = self.timeout
                    start_time = time.time()
                    while time.time() - start_time < max_wait:
                        content = page.content()
                        if not self._is_cf_challenge_html(content):
                            break
                        time.sleep(2)

                # 等待网络空闲
                try:
                    page.wait_for_load_state("networkidle", timeout=15000)
                except Exception:
                    pass

                time.sleep(2)

                # 提取 cookies
                cookies_list = context.cookies()
                cookies_dict = {}
                for cookie in cookies_list:
                    name = cookie.get("name", "")
                    value = cookie.get("value", "")
                    if name and value:
                        cookies_dict[name] = value

                # 提取 UA
                ua = page.evaluate("() => navigator.userAgent") or ""
                html = page.content()

                if not self._is_cf_challenge_html(html):
                    return BypassResult(
                        success=True,
                        cookies=cookies_dict,
                        user_agent=ua,
                        strategy="playwright",
                        html=html,
                    )
                else:
                    return BypassResult(success=False, error="Playwright 拿到的仍是挑战页")

        except Exception as e:
            return BypassResult(success=False, error=f"Playwright 异常: {e}")

        finally:
            if browser is not None:
                try:
                    browser.close()
                except Exception:
                    pass


# ---------------------------------------------------------------------------
# Cookie 缓存管理器（可选使用）
# ---------------------------------------------------------------------------
class CookieCache:
    """
    Cookie 缓存管理器。

    CF 的 cf_clearance / __cf_bm 有效期约 30 分钟，
    缓存后可避免每次请求都启动浏览器。

    用法：
        cache = CookieCache()
        cache.save("example.com", cookies={"cf_clearance": "..."}, ua="...")
        cached = cache.get("example.com")
        if cached:
            # 使用缓存的 cookie
    """

    def __init__(self, cache_file: str = "cf_cookies_cache.json", ttl: int = 1200):
        """
        :param cache_file: 缓存文件路径
        :param ttl:        缓存有效期（秒），默认 20 分钟（CF cookie 30 分钟过期，提前刷新）
        """
        self.cache_file = cache_file
        self.ttl = ttl

    def save(self, domain: str, cookies: Dict[str, str], ua: str):
        """保存 cookie 到缓存"""
        cache_data = self._load_cache()
        cache_data[domain] = {
            "cookies": cookies,
            "user_agent": ua,
            "timestamp": time.time(),
        }
        self._save_cache(cache_data)
        logger.info(f"Cookie 已缓存: {domain}")

    def get(self, domain: str) -> Optional[Dict[str, Any]]:
        """获取缓存的 cookie，过期返回 None"""
        cache_data = self._load_cache()
        entry = cache_data.get(domain)
        if not entry:
            return None

        elapsed = time.time() - entry.get("timestamp", 0)
        if elapsed > self.ttl:
            logger.info(f"Cookie 缓存已过期: {domain} (已过 {elapsed:.0f}s)")
            return None

        return entry

    def clear(self, domain: Optional[str] = None):
        """清除缓存"""
        cache_data = self._load_cache()
        if domain:
            cache_data.pop(domain, None)
        else:
            cache_data.clear()
        self._save_cache(cache_data)

    def _load_cache(self) -> Dict:
        try:
            with open(self.cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def _save_cache(self, data: Dict):
        try:
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning(f"保存缓存失败: {e}")


# ---------------------------------------------------------------------------
# 高级封装：带缓存的绕过器
# ---------------------------------------------------------------------------
class CachedCloudflareBypasser(CloudflareBypasser):
    """
    带 Cookie 缓存的 Cloudflare 绕过器。

    首次绕过后缓存 Cookie，后续请求在 TTL 内直接复用，
    避免每次都启动浏览器。

    用法：
        bypasser = CachedCloudflareBypasser()
        result = bypasser.bypass("https://example.com")
        # 第一次：启动浏览器绕过，缓存 cookie
        # 第二次（20分钟内）：直接返回缓存，无需浏览器
    """

    def __init__(self, cache_file: str = "cf_cookies_cache.json",
                 cache_ttl: int = 1200, **kwargs):
        super().__init__(**kwargs)
        self.cache = CookieCache(cache_file=cache_file, ttl=cache_ttl)

    def bypass(self, url: str, strategies: Optional[list] = None) -> BypassResult:
        domain = urlparse(url).netloc

        # 先查缓存
        cached = self.cache.get(domain)
        if cached:
            logger.info(f"命中缓存: {domain}")
            cookies = cached.get("cookies", {})
            ua = cached.get("user_agent", "")

            # 用缓存的 cookie 验证是否仍然有效
            try:
                from curl_cffi import requests as cf_requests
                proxies = {"https": self.proxy, "http": self.proxy} if self.proxy else None
                resp = cf_requests.get(
                    url,
                    impersonate="chrome120",
                    cookies=cookies,
                    headers={"User-Agent": ua} if ua else {},
                    proxies=proxies,
                    timeout=self.timeout,
                )
                if resp.status_code == 200 and not self._is_cf_challenge_html(resp.text):
                    logger.info("缓存 Cookie 仍然有效")
                    return BypassResult(
                        success=True,
                        cookies=cookies,
                        user_agent=ua,
                        strategy="cache",
                        html=resp.text,
                        response=resp,
                    )
                else:
                    logger.warning("缓存 Cookie 已失效，重新绕过")
            except Exception as e:
                logger.warning(f"验证缓存失败: {e}，重新绕过")

        # 缓存失效或不存在，执行正常绕过
        result = super().bypass(url, strategies)

        # 成功后缓存
        if result.success and result.cookies:
            self.cache.save(domain, result.cookies, result.user_agent)

        return result


# ---------------------------------------------------------------------------
# 命令行入口
# ---------------------------------------------------------------------------
def main():
    """命令行模式：python cf_bypass.py <url> [--proxy PROXY] [--no-headless]"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Cloudflare 验证绕过脚本",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python cf_bypass.py https://example.com
  python cf_bypass.py https://example.com --proxy socks5://127.0.0.1:7890
  python cf_bypass.py https://example.com --no-headless --strategy drissionpage
  python cf_bypass.py https://example.com --output result.html

合规提醒：仅供技术研究学习，请遵守目标网站服务条款和相关法律法规。
        """,
    )
    parser.add_argument("url", help="目标 URL")
    parser.add_argument("--proxy", default=None, help="代理地址，如 socks5://127.0.0.1:7890")
    parser.add_argument("--no-headless", action="store_true", help="浏览器可见模式（调试用）")
    parser.add_argument(
        "--strategy",
        default=None,
        help="指定策略: curl_cffi / cloudscraper / flaresolverr / drissionpage / playwright",
    )
    parser.add_argument("--output", "-o", default=None, help="将结果 HTML 保存到文件")
    parser.add_argument("--timeout", type=int, default=30, help="超时时间（秒）")
    parser.add_argument("--flaresolverr-url", default="http://localhost:8191/v1",
                        help="FlareSolverr 服务地址")
    parser.add_argument("--verbose", "-v", action="store_true", help="详细日志")

    args = parser.parse_args()

    if args.verbose:
        logger.setLevel(logging.DEBUG)

    # 构建策略列表
    if args.strategy:
        strategies = [args.strategy]
    else:
        strategies = None  # 使用默认全策略降级

    bypasser = CloudflareBypasser(
        proxy=args.proxy,
        flaresolverr_url=args.flaresolverr_url,
        headless=not args.no_headless,
        timeout=args.timeout,
    )

    result = bypasser.bypass(args.url, strategies=strategies)

    if result.success:
        print(f"\n{'='*60}")
        print(f"✅ 绕过成功！使用策略: {result.strategy}")
        print(f"{'='*60}")
        print(f"User-Agent: {result.user_agent}")
        print(f"Cookies:")
        for k, v in result.cookies.items():
            # 只显示 CF 相关 cookie 的前 20 字符
            display_v = v[:20] + "..." if len(v) > 20 else v
            print(f"  {k} = {display_v}")
        print(f"HTML 长度: {len(result.html)} 字符")

        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(result.html)
            print(f"\nHTML 已保存到: {args.output}")
    else:
        print(f"\n{'='*60}")
        print(f"❌ 绕过失败: {result.error}")
        print(f"{'='*60}")
        return 1

    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
