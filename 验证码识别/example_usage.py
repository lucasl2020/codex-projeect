#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cloudflare 绕过脚本 —— 使用示例
================================

演示如何在爬虫项目中集成 cf_bypass 模块。
当网站需要 Cloudflare 验证时，调用此脚本获取 Cookie 和 UA。
"""

from cf_bypass import CloudflareBypasser, CachedCloudflareBypasser


# =========================================================================
# 示例 1: 基本用法（自动降级策略）
# =========================================================================
def example_basic():
    """
    最简单的用法：传入 URL，自动检测 CF 并绕过。
    脚本会按 curl_cffi → cloudscraper → FlareSolverr → DrissionPage → Playwright
    的顺序依次尝试，成功即返回。
    """
    bypasser = CloudflareBypasser()
    result = bypasser.bypass("https://nowsecure.nl")

    if result.success:
        print(f"绕过成功，策略: {result.strategy}")
        print(f"User-Agent: {result.user_agent}")
        print(f"Cookies: {list(result.cookies.keys())}")

        # 拿到 cookie 后，用 requests 继续抓数据
        import requests
        resp = requests.get(
            "https://nowsecure.nl",
            cookies=result.cookies,
            headers={"User-Agent": result.user_agent},
        )
        print(f"后续请求状态码: {resp.status_code}")
    else:
        print(f"绕过失败: {result.error}")


# =========================================================================
# 示例 2: 带代理使用
# =========================================================================
def example_with_proxy():
    """
    如果目标站需要代理访问，传入 proxy 参数。
    注意：CF 的 cf_clearance 绑定 IP，生成 Cookie 时的 IP 必须与后续请求一致。
    """
    bypasser = CloudflareBypasser(
        proxy="socks5://127.0.0.1:7890",
        timeout=40,
    )
    result = bypasser.bypass("https://example.com")

    if result.success:
        import requests
        # 后续请求必须使用同一个代理（同一个 IP）
        resp = requests.get(
            "https://example.com/api/data",
            cookies=result.cookies,
            headers={"User-Agent": result.user_agent},
            proxies={"http": "socks5://127.0.0.1:7890",
                     "https": "socks5://127.0.0.1:7890"},
        )
        print(resp.text)


# =========================================================================
# 示例 3: 指定单一策略（如只用 DrissionPage）
# =========================================================================
def example_single_strategy():
    """
    如果你知道目标站的 CF 级别，可以指定策略避免不必要的尝试。
    DrissionPage 成功率最高，适合高安全级别站点。
    """
    bypasser = CloudflareBypasser(
        headless=False,  # CF 对 headless 敏感，调试时建议设为 False
        timeout=40,
    )
    result = bypasser.bypass(
        "https://example.com",
        strategies=["drissionpage"],  # 只用 DrissionPage
    )

    if result.success:
        print(f"页面内容长度: {len(result.html)}")


# =========================================================================
# 示例 4: 带缓存的绕过器（推荐用于生产环境）
# =========================================================================
def example_cached():
    """
    CF 的 Cookie 有效期约 30 分钟。
    CachedCloudflareBypasser 会自动缓存 Cookie，避免每次都启动浏览器。
    默认 20 分钟刷新一次（在过期前提前刷新）。
    """
    bypasser = CachedCloudflareBypasser(
        cache_file="cf_cookies_cache.json",
        cache_ttl=1200,  # 20 分钟
        headless=True,
        timeout=30,
    )

    # 第一次调用：启动浏览器绕过，缓存 Cookie
    result1 = bypasser.bypass("https://example.com")
    print(f"第一次: 策略={result1.strategy}")  # 策略=drissionpage

    # 第二次调用（20分钟内）：直接使用缓存，无需浏览器
    result2 = bypasser.bypass("https://example.com")
    print(f"第二次: 策略={result2.strategy}")  # 策略=cache


# =========================================================================
# 示例 5: 在 Scrapy / 爬虫框架中集成
# =========================================================================
def example_in_spider():
    """
    在爬虫中使用：检测到 CF 验证时自动调用绕过脚本。
    """
    import requests

    target_url = "https://cf-protected-site.com/api/data"
    bypasser = CloudflareBypasser()

    # 先正常请求
    resp = requests.get(target_url, timeout=15)

    # 检测是否被 CF 拦截
    if resp.status_code in (403, 503) or "just a moment" in resp.text.lower():
        print("检测到 Cloudflare 验证，启动绕过...")

        # 调用绕过脚本
        result = bypasser.bypass(target_url)

        if result.success:
            # 用绕过后的 Cookie 重新请求
            resp = requests.get(
                target_url,
                cookies=result.cookies,
                headers={"User-Agent": result.user_agent},
            )
            print(f"绕过后请求成功: {resp.status_code}")
        else:
            print(f"绕过失败: {result.error}")
    else:
        print("无需绕过，直接获取数据")


# =========================================================================
# 示例 6: 使用 FlareSolverr（适合付费版 CF）
# =========================================================================
def example_flaresolverr():
    """
    FlareSolverr 可以过付费版 CF，但需要预先启动 Docker 容器:
      docker run -d --name=flaresolverr -p 8191:8191 \\
        -e LOG_LEVEL=info --restart unless-stopped \\
        ghcr.io/flaresolverr/flaresolverr:latest
    """
    bypasser = CloudflareBypasser(
        flaresolverr_url="http://localhost:8191/v1",
    )
    result = bypasser.bypass(
        "https://example.com",
        strategies=["flaresolverr"],  # 只用 FlareSolverr
    )

    if result.success:
        print(f"FlareSolverr 绕过成功")
        print(f"HTML: {result.html[:200]}...")


# =========================================================================
# 主函数
# =========================================================================
if __name__ == "__main__":
    print("=" * 60)
    print("Cloudflare 绕过脚本 - 使用示例")
    print("=" * 60)
    print()
    print("可用示例:")
    print("  1. 基本用法（自动降级）")
    print("  2. 带代理使用")
    print("  3. 指定单一策略")
    print("  4. 带缓存的绕过器")
    print("  5. 爬虫集成示例")
    print("  6. FlareSolverr（付费版）")
    print()

    choice = input("选择示例 (1-6): ").strip()

    examples = {
        "1": example_basic,
        "2": example_with_proxy,
        "3": example_single_strategy,
        "4": example_cached,
        "5": example_in_spider,
        "6": example_flaresolverr,
    }

    func = examples.get(choice)
    if func:
        func()
    else:
        print("无效选择")
