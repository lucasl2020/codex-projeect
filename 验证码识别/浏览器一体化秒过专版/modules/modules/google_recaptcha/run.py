"""
Google reCAPTCHA 独立运行入口
用法：
  python run.py <URL> [--headless] [--submit <CSS选择器>] [--wait 300]
"""
import argparse
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

from .solver import RecaptchaSolver, token_present, visible, _log


def run(url, model="qwen3-vl:4b", submit=None, headless=False, wait_sec=180, storage_state=None):
    solver = RecaptchaSolver(model=model)
    _log(f"[reCAPTCHA] 启动浏览器访问: {url}")

    with sync_playwright() as pw:
        launch = {
            "channel": "chrome",
            "headless": headless,
            "args": [
                "--disable-blink-features=AutomationControlled",
                "--disable-infobars",
            ],
        }
        options = {"locale": "zh-CN", "viewport": {"width": 1280, "height": 900}}
        if storage_state and Path(storage_state).exists():
            options["storage_state"] = str(storage_state)

        browser = pw.chromium.launch(**launch)
        context = browser.new_context(**options)
        context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")
        page = context.new_page()

        try:
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            deadline = time.monotonic() + wait_sec
            while time.monotonic() < deadline:
                if token_present(page, "g-recaptcha-response"):
                    _log("[reCAPTCHA] 成功检测到 g-recaptcha-response Token！")
                    if submit:
                        btn = visible(page, submit)
                        if btn:
                            _log(f"[reCAPTCHA] 点击提交按钮: {submit}")
                            btn.click()
                    return True

                state = solver.solve(page)
                _log(f"[reCAPTCHA] 单轮操作状态: {state}")
                if state == "widget_passed":
                    _log("[reCAPTCHA] 验证码已被成功攻破/跳过！")
                    if submit:
                        btn = visible(page, submit)
                        if btn:
                            _log(f"[reCAPTCHA] 点击提交按钮: {submit}")
                            btn.click()
                    return True
                page.wait_for_timeout(1000)
            _log("[reCAPTCHA] 超时未完成验证")
            return False
        finally:
            page.wait_for_timeout(2000)
            browser.close()


def main():
    parser = argparse.ArgumentParser(description="Google reCAPTCHA 独立识别求解工具")
    parser.add_argument("url", help="包含 reCAPTCHA 的目标网页地址")
    parser.add_argument("--model", default="qwen3-vl:4b", help="本地视觉模型名称")
    parser.add_argument("--submit", help="完成验证后要点击的站点提交按钮选择器")
    parser.add_argument("--headless", action="store_true", help="无头模式运行")
    parser.add_argument("--wait", type=int, default=180, help="最大等待秒数")
    parser.add_argument("--storage-state", type=Path, help="复用登录态会话文件")
    args = parser.parse_args()

    success = run(
        url=args.url,
        model=args.model,
        submit=args.submit,
        headless=args.headless,
        wait_sec=args.wait,
        storage_state=args.storage_state,
    )
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
