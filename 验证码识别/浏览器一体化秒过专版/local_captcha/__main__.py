import argparse
import importlib
import json
from pathlib import Path
import sys
from datetime import datetime
from urllib.parse import urlsplit

from .vision import LocalVision

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "cf_captcha_solver_pkg"))


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="本地免费验证码识别；不会调用云端打码服务")
    parser.add_argument("url", nargs="?")
    parser.add_argument("--doctor", action="store_true", help="检查依赖和本机视觉模型")
    parser.add_argument("--model", default="qwen3-vl:4b")
    parser.add_argument("--wait", type=int, default=180, help="等待登录/挑战和结果的秒数")
    parser.add_argument("--attempts", type=int, default=6)
    parser.add_argument("--region", help="通用验证码图片区域的 CSS 选择器")
    parser.add_argument("--kind", choices=["visual", "math"], default="visual")
    parser.add_argument("--prompt", default="按照图片题意完成验证码")
    parser.add_argument("--answer-input", help="算术答案输入框选择器")
    parser.add_argument("--submit", help="验证码完成后要点击的站点按钮选择器")
    parser.add_argument("--success-selector", help="验证成功后才显示的站点元素选择器")
    parser.add_argument("--headless", action="store_true")
    parser.add_argument("--channel", choices=["chrome", "msedge", "chromium"], default="chrome")
    parser.add_argument("--pause", action="store_true", help="识别前等待你登录并打开验证码")
    parser.add_argument("--storage-state", type=Path, help="从本地浏览器会话文件复用登录状态")
    args = parser.parse_args()
    if args.wait < 1 or not 1 <= args.attempts <= 10:
        parser.error("wait 必须大于 0；attempts 必须为 1 到 10")
    if args.submit and not args.success_selector:
        parser.error("自动提交站点按钮时必须提供 --success-selector，用于确认真实结果")
    if args.kind == "math" and (not args.region or not args.answer_input):
        parser.error("算术模式需要 --region 和 --answer-input")
    if args.pause and args.headless:
        parser.error("--pause 需要可见浏览器")
    vision = LocalVision(args.model)
    if args.doctor:
        checks = {}
        for name in ("playwright.sync_api", "PIL.Image", "ddddocr"):
            try:
                importlib.import_module(name)
                checks[name] = "可用"
            except Exception as exc:
                checks[name] = "不可用: " + type(exc).__name__
        try:
            vision.timeout = 5
            vision.check()
            checks["本地视觉模型"] = "可用"
        except Exception as exc:
            checks["本地视觉模型"] = str(exc)
        print(json.dumps(checks, ensure_ascii=False, indent=2))
        return 0 if all(v == "可用" for v in checks.values()) else 2
    if not args.url or urlsplit(args.url).scheme not in ("http", "https"):
        parser.error("请提供 http/https 网址，或使用 --doctor")
    output = ROOT / "output" / "local-captcha" / datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    output.mkdir(parents=True)
    report = {"status": "error", "type": "unknown", "attempts": 0}
    try:
        from playwright.sync_api import sync_playwright
        from .browser import run_page
        with sync_playwright() as pw:
            launch = {
                "channel": None if args.channel == "chromium" else args.channel,
                "headless": args.headless,
                "args": [
                    "--disable-blink-features=AutomationControlled",
                    "--disable-infobars",
                ],
            }
            options = {"locale": "zh-CN", "viewport": {"width": 1280, "height": 900}}
            browser = None
            storage_path = args.storage_state
            if not storage_path and (ROOT / "output" / "local-session.json").exists():
                storage_path = ROOT / "output" / "local-session.json"

            if storage_path and Path(storage_path).exists():
                browser = pw.chromium.launch(**launch)
                context = browser.new_context(storage_state=str(storage_path), **options)
            else:
                context = pw.chromium.launch_persistent_context(
                    str(ROOT / "output" / "local-captcha-profile"), **launch, **options,
                )
            context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")
            try:
                context.set_default_timeout(10000)
                page = context.pages[0] if context.pages else context.new_page()
                page.goto(args.url, wait_until="domcontentloaded", timeout=45000)
                if args.pause:
                    input("请在浏览器中登录并打开验证码，然后在这里按回车开始自动识别：")
                report = run_page(page, args, vision)
            finally:
                context.close()
                if browser is not None:
                    browser.close()
    except Exception as exc:
        report["error"] = type(exc).__name__
        report["message"] = (
            str(exc) if isinstance(exc, (RuntimeError, ValueError)) else
            "运行环境或浏览器操作失败，详细原因见终端；可先执行 --doctor。"
        )
        print("运行失败：", exc)
    report["local_only"] = True
    (output / "result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print("结果报告：", output / "result.json")
    return 0 if report["status"] in ("widget_passed", "site_confirmed") else 2


if __name__ == "__main__":
    sys.exit(main())
