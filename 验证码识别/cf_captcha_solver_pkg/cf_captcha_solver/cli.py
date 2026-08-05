#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
命令行入口
===========
提供两个命令行工具：
  cf-bypass      —— Cloudflare 绕过
  captcha-solver —— 验证码识别
"""

import sys
import argparse


def cf_bypass_main():
    """cf-bypass 命令行入口"""
    parser = argparse.ArgumentParser(
        prog="cf-bypass",
        description="Cloudflare 验证绕过工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  cf-bypass https://example.com
  cf-bypass https://example.com --proxy socks5://127.0.0.1:7890
  cf-bypass https://example.com --no-headless --strategy drissionpage
  cf-bypass https://example.com --output result.html

合规提醒：仅供技术研究学习，请遵守目标网站服务条款和相关法律法规。
        """,
    )
    parser.add_argument("url", help="目标 URL")
    parser.add_argument("--proxy", default=None, help="代理地址")
    parser.add_argument("--no-headless", action="store_true", help="浏览器可见模式")
    parser.add_argument("--strategy", default=None,
                        help="策略: curl_cffi/cloudscraper/flaresolverr/drissionpage/playwright")
    parser.add_argument("--output", "-o", default=None, help="保存 HTML 到文件")
    parser.add_argument("--timeout", type=int, default=30, help="超时时间（秒）")
    parser.add_argument("--captcha-platform", default="", help="验证码打码平台")
    parser.add_argument("--captcha-api-key", default="", help="打码平台 API Key")
    parser.add_argument("--use-cache", action="store_true", help="启用 Cookie 缓存")
    parser.add_argument("--verbose", "-v", action="store_true", help="详细日志")

    args = parser.parse_args()

    if args.verbose:
        import logging
        logging.getLogger("cf_bypass").setLevel(logging.DEBUG)

    from . import bypass

    strategies = [args.strategy] if args.strategy else None
    result = bypass(
        args.url,
        proxy=args.proxy,
        strategies=strategies,
        headless=not args.no_headless,
        timeout=args.timeout,
        captcha_platform=args.captcha_platform,
        captcha_api_key=args.captcha_api_key,
        use_cache=args.use_cache,
    )

    if result.success:
        print(f"\n{'='*60}")
        print(f"绕过成功! 策略: {result.strategy}")
        print(f"{'='*60}")
        print(f"User-Agent: {result.user_agent}")
        print(f"Cookies:")
        for k, v in result.cookies.items():
            print(f"  {k} = {v[:20]}..." if len(v) > 20 else f"  {k} = {v}")
        print(f"HTML 长度: {len(result.html)} 字符")

        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(result.html)
            print(f"\nHTML 已保存到: {args.output}")
        return 0
    else:
        print(f"\n绕过失败: {result.error}")
        return 1


def captcha_solver_main():
    """captcha-solver 命令行入口"""
    parser = argparse.ArgumentParser(
        prog="captcha-solver",
        description="验证码自动识别工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  captcha-solver text --image captcha.png
  captcha-solver math --image math_captcha.png
  captcha-solver slide --bg bg.png --slider slider.png
  captcha-solver click --image click.png --text "星空大海"
  captcha-solver detect --html page.html
  captcha-solver turnstile --site-key 0x4AAA --url https://example.com \\
    --platform 2captcha --api-key YOUR_KEY

合规提醒：仅供技术研究学习，请遵守目标网站服务条款和相关法律法规。
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="验证码类型")

    p_text = subparsers.add_parser("text", help="文字验证码")
    p_text.add_argument("--image", required=True, help="图片路径")
    p_text.add_argument("--charset", default="", help="字符集限制")

    p_math = subparsers.add_parser("math", help="算术验证码")
    p_math.add_argument("--image", required=True, help="图片路径")

    p_slide = subparsers.add_parser("slide", help="滑块验证码")
    p_slide.add_argument("--bg", required=True, help="背景图路径")
    p_slide.add_argument("--slider", required=True, help="滑块图路径")

    p_click = subparsers.add_parser("click", help="点选验证码")
    p_click.add_argument("--image", required=True, help="图片路径")
    p_click.add_argument("--text", default="", help="顺序点选目标文字")

    p_detect = subparsers.add_parser("detect", help="检测验证码类型")
    p_detect.add_argument("--html", required=True, help="HTML 文件路径")

    p_ts = subparsers.add_parser("turnstile", help="Cloudflare Turnstile")
    p_ts.add_argument("--site-key", required=True, help="Turnstile sitekey")
    p_ts.add_argument("--url", required=True, help="页面 URL")
    p_ts.add_argument("--platform", default="2captcha", help="打码平台")
    p_ts.add_argument("--api-key", default="", help="API Key")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    from . import (
        solve_text_captcha, solve_math_captcha,
        solve_slide_captcha, solve_click_captcha,
        solve_turnstile, CaptchaSolver,
    )

    if args.command == "text":
        result = solve_text_captcha(args.image, args.charset)
        print(f"识别结果: {result}")

    elif args.command == "math":
        result = solve_math_captcha(args.image)
        print(f"计算结果: {result}")

    elif args.command == "slide":
        result = solve_slide_captcha(args.bg, args.slider)
        print(f"缺口距离: {result}")

    elif args.command == "click":
        result = solve_click_captcha(args.image, args.text)
        print(f"点击坐标: {result}")

    elif args.command == "detect":
        with open(args.html, "r", encoding="utf-8") as f:
            html = f.read()
        solver = CaptchaSolver()
        ct = solver.detector.detect_from_html(html)
        print(f"检测到验证码类型: {ct.value}")

    elif args.command == "turnstile":
        result = solve_turnstile(args.site_key, args.url, args.platform, args.api_key)
        if result:
            print(f"Turnstile token: {result[:50]}...")
        else:
            print("解决失败")

    return 0
