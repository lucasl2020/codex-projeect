"""
Cloudflare Turnstile 独立运行入口
用法：
  python run.py https://www.hvoy.ai/ --wait 180
"""
import argparse
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

from .solver import TurnstileSolver, token_present, visible, _log


def run(url, headless=False, wait_sec=180, storage_state=None):
    solver = TurnstileSolver()
    _log(f"[Turnstile] 启动浏览器访问: {url}")

    with sync_playwright() as pw:
        launch = {
            "channel": "chrome",
            "headless": headless,
            "args": solver.get_browser_args(),
        }
        options = {"locale": "zh-CN", "viewport": {"width": 1280, "height": 900}}
        if storage_state and Path(storage_state).exists():
            options["storage_state"] = str(storage_state)
        elif (Path(__file__).resolve().parents[2] / "output" / "local-session.json").exists():
            options["storage_state"] = str(Path(__file__).resolve().parents[2] / "output" / "local-session.json")

        browser = pw.chromium.launch(**launch)
        context = browser.new_context(**options)
        solver.patch_context(context)
        page = context.new_page()

        try:
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            deadline = time.monotonic() + wait_sec
            while time.monotonic() < deadline:
                if token_present(page, "cf-turnstile-response"):
                    _log("[Turnstile] 成功检测到 cf-turnstile-response Token！")
                    return True

                state = solver.solve(page)
                _log(f"[Turnstile] 当前状态: {state}")
                if state == "widget_passed":
                    _log("[Turnstile] 挑战已攻破/自动通过！")
                    return True
                page.wait_for_timeout(1000)
            _log("[Turnstile] 超时未完成验证")
            return False
        finally:
            page.wait_for_timeout(2000)
            browser.close()


def main():
    parser = argparse.ArgumentParser(description="Cloudflare Turnstile 独立穿透求解工具")
    parser.add_argument("url", default="https://www.hvoy.ai/", nargs="?", help="目标网页地址")
    parser.add_argument("--headless", action="store_true", help="无头模式运行")
    parser.add_argument("--wait", type=int, default=180, help="最大等待秒数")
    parser.add_argument("--storage-state", type=Path, help="复用登录态会话文件")
    args = parser.parse_args()

    success = run(
        url=args.url,
        headless=args.headless,
        wait_sec=args.wait,
        storage_state=args.storage_state,
    )
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
