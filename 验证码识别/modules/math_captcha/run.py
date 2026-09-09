"""
算术计算验证码 独立运行入口
用法：
  python run.py <URL> --region "#captcha-img" --input "#captcha-input" [--submit "#btn-submit"]
"""
import argparse
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

from .solver import MathCaptchaSolver, visible, _log


def run(url, region, input_sel, submit=None, model="qwen3-vl:4b", headless=False, wait_sec=180, storage_state=None):
    solver = MathCaptchaSolver(model=model)
    _log(f"[Math] 启动浏览器访问: {url}")

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
        elif (Path(__file__).resolve().parents[2] / "output" / "local-session.json").exists():
            options["storage_state"] = str(Path(__file__).resolve().parents[2] / "output" / "local-session.json")

        browser = pw.chromium.launch(**launch)
        context = browser.new_context(**options)
        context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")
        page = context.new_page()

        try:
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            deadline = time.monotonic() + wait_sec
            while time.monotonic() < deadline:
                state = solver.solve(page, region, input_sel)
                _log(f"[Math] 状态: {state}")
                if state == "answer_entered":
                    _log("[Math] 答案已成功输入！")
                    if submit:
                        btn = visible(page, submit)
                        if btn:
                            _log(f"[Math] 点击提交按钮: {submit}")
                            btn.click()
                    return True
                page.wait_for_timeout(1000)
            _log("[Math] 超时未完成算术验证码输入")
            return False
        finally:
            page.wait_for_timeout(2000)
            browser.close()


def main():
    parser = argparse.ArgumentParser(description="算术验证码 独立识别与填写工具")
    parser.add_argument("url", help="包含算术验证码的目标网页地址")
    parser.add_argument("--region", required=True, help="验证码图片的 CSS 选择器")
    parser.add_argument("--input", required=True, help="答案输入框的 CSS 选择器")
    parser.add_argument("--submit", help="完成验证后要点击的站点提交按钮选择器")
    parser.add_argument("--model", default="qwen3-vl:4b", help="本地视觉模型名称")
    parser.add_argument("--headless", action="store_true", help="无头模式运行")
    parser.add_argument("--wait", type=int, default=180, help="最大等待秒数")
    parser.add_argument("--storage-state", type=Path, help="复用登录态会话文件")
    args = parser.parse_args()

    success = run(
        url=args.url,
        region=args.region,
        input_sel=args.input,
        submit=args.submit,
        model=args.model,
        headless=args.headless,
        wait_sec=args.wait,
        storage_state=args.storage_state,
    )
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
