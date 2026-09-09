"""
Cloudflare Turnstile 独立穿透与求解器模块
- 注入反自动化指纹抹除（去除 navigator.webdriver，去除自动化控制特征）
- 自动探测 Cloudflare 5秒盾与 Turnstile 挑战框架
- 自动定位并点击 Turnstile 勾选框，提取 cf-turnstile-response Token
"""
import sys
import time
from urllib.parse import urlsplit


def _log(msg):
    try:
        enc = getattr(sys.stdout, "encoding", "utf-8") or "utf-8"
        print(str(msg).encode(enc, errors="replace").decode(enc))
    except Exception:
        pass


def visible(root, selector):
    for element in root.locator(selector).all():
        if element.is_visible():
            return element
    return None


def provider_frame(frame, domain="challenges.cloudflare.com"):
    host = urlsplit(frame.url).hostname or ""
    return host == domain or host.endswith("." + domain)


def token_present(page, name="cf-turnstile-response"):
    return page.locator(f'[name="{name}"]').evaluate_all(
        "els => els.some(el => typeof el.value === 'string' && el.value.length > 10)"
    )


class TurnstileSolver:
    @staticmethod
    def get_browser_args():
        """返回规避 Cloudflare 机器人检测的 Chromium 启动参数。"""
        return [
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            "--no-sandbox",
        ]

    @staticmethod
    def patch_context(context):
        """抹除 navigator.webdriver 标识。"""
        context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")

    def solve(self, page):
        """检测并尝试通过页面的 Cloudflare Turnstile。"""
        if token_present(page, "cf-turnstile-response"):
            return "widget_passed"

        # 检查是否处于 Cloudflare 挑战页面
        is_cf_page = (
            any(provider_frame(f, "challenges.cloudflare.com") for f in page.frames)
            or visible(page, "#challenge-running, #challenge-stage, form#challenge-form") is not None
        )
        if not is_cf_page:
            return "not_found"

        for frame in page.frames:
            if provider_frame(frame, "challenges.cloudflare.com"):
                cb = visible(frame, "input[type=checkbox], .ctp-checkbox-label, #challenge-stage, .ctp-checkbox-container")
                if cb is not None:
                    _log("[Turnstile] 检测到 Cloudflare 勾选框，模拟真实点击...")
                    try:
                        cb.click()
                        page.wait_for_timeout(1500)
                    except Exception as exc:
                        _log(f"[Turnstile] 点击异常: {exc}")

        if token_present(page, "cf-turnstile-response"):
            _log("[Turnstile] 成功获取 cf-turnstile-response Token！")
            return "widget_passed"

        return "loading"
