#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
验证码自动识别 —— 使用示例
==========================

演示如何使用 captcha_solver 模块识别各种类型的验证码。
涵盖：文字验证码、算术验证码、点选验证码、滑块验证码、
      reCAPTCHA、hCaptcha、Cloudflare Turnstile、FunCaptcha。

依赖安装：
  pip install ddddocr Pillow requests
"""

import os
import base64
import requests
from captcha_solver import (
    CaptchaSolver,
    CaptchaType,
    CaptchaDetector,
    TextCaptchaSolver,
    MathCaptchaSolver,
    ClickCaptchaSolver,
    SlideCaptchaSolver,
    ThirdPartyCaptchaSolver,
    solve_text_captcha,
    solve_math_captcha,
    solve_slide_captcha,
    solve_click_captcha,
    solve_turnstile,
)


# =========================================================================
# 示例 1: 文字/数字验证码识别（ddddocr OCR）
# =========================================================================
def example_text_captcha():
    """
    识别最简单的文字/数字验证码。

    ddddocr 基于深度学习模型，支持：
      - 纯数字、纯字母、混合验证码
      - 带干扰线、干扰点的验证码
      - 中文验证码
    """
    print("\n=== 示例 1: 文字验证码 ===")

    # 方式一：快捷函数
    # result = solve_text_captcha("captcha.png")

    # 方式二：完整 API（支持更多配置）
    solver = CaptchaSolver()

    # 模拟一个验证码图片（实际使用时替换为真实图片路径）
    # 从 URL 下载验证码图片
    try:
        resp = requests.get("https://example.com/captcha.jpg", timeout=10)
        image_bytes = resp.content
    except Exception:
        print("（请替换为真实的验证码图片 URL）")
        # 演示用：创建一个空白图片占位
        image_bytes = b""

    if image_bytes:
        result = solver.solve_image(image_bytes)
        if result.success:
            print(f"识别结果: {result.answer}")
        else:
            print(f"识别失败: {result.error}")


# =========================================================================
# 示例 2: 算术验证码识别（OCR + 计算）
# =========================================================================
def example_math_captcha():
    """
    识别算术验证码，如 "3 + 5 = ?"、"12 × 4 = ?"

    流程：
      1. ddddocr OCR 识别图片中的表达式
      2. 解析运算符（× → *, ÷ → /）
      3. 计算并返回结果
    """
    print("\n=== 示例 2: 算术验证码 ===")

    solver = CaptchaSolver()

    # 实际使用时替换为真实图片
    # result = solve_math_captcha("math_captcha.png")
    # print(f"计算结果: {result}")

    # 完整 API
    # with open("math_captcha.png", "rb") as f:
    #     image_bytes = f.read()
    # result = solver.solve_image(image_bytes, captcha_type=CaptchaType.MATH)
    # if result.success:
    #     print(f"表达式: {result.details.get('expression')}")
    #     print(f"结果: {result.answer}")

    print("（请提供真实的算术验证码图片测试）")


# =========================================================================
# 示例 3: 点选验证码识别（目标检测 + 坐标）
# =========================================================================
def example_click_captcha():
    """
    识别点选验证码。

    支持两种模式：
      1. 目标点选: "点击图中所有的红绿灯"
         → ddddocr 目标检测，返回每个目标的中心坐标
      2. 顺序点选: "请依次点击 '星空大海' 四个字"
         → 检测 + OCR 识别每个文字 + 按目标顺序排列
    """
    print("\n=== 示例 3: 点选验证码 ===")

    solver = CaptchaSolver()

    # --- 目标点选 ---
    # with open("click_captcha.png", "rb") as f:
    #     image_bytes = f.read()
    # result = solver.solve_image(image_bytes, captcha_type=CaptchaType.CLICK_OBJECT)
    # if result.success:
    #     print(f"点击坐标: {result.answer}")
    #     # result.answer = [(x1, y1), (x2, y2), ...]

    # --- 顺序点选 ---
    # with open("order_captcha.png", "rb") as f:
    #     image_bytes = f.read()
    # result = solver.solve_image(
    #     image_bytes,
    #     captcha_type=CaptchaType.CLICK_ORDER,
    #     target_text="星空大海"  # 需要按顺序点击的文字
    # )
    # if result.success:
    #     print(f"按顺序点击坐标: {result.answer}")

    print("（请提供真实的点选验证码图片测试）")


# =========================================================================
# 示例 4: 滑块验证码识别（缺口检测 + 轨迹模拟）
# =========================================================================
def example_slide_captcha():
    """
    识别滑块验证码缺口位置，并生成人类滑动轨迹。

    两种算法：
      1. slide_match (边缘匹配): 有滑块小图 + 背景大图
      2. slide_comparison (图像差异): 有缺口前图 + 缺口后图

    返回缺口 X 坐标 + 模拟人类滑动轨迹（先快后慢 + 微调）
    """
    print("\n=== 示例 4: 滑块验证码 ===")

    # 方式一：快捷函数
    # distance = solve_slide_captcha("bg.png", "slider.png")
    # print(f"缺口距离: {distance}")

    # 方式二：完整 API（含轨迹）
    solver = CaptchaSolver()
    # with open("bg.png", "rb") as f:
    #     bg = f.read()
    # with open("slider.png", "rb") as f:
    #     slider = f.read()
    # result = solver.solve_image(
    #     bg, captcha_type=CaptchaType.SLIDE,
    #     slider_image=slider, bg_image=bg
    # )
    # if result.success:
    #     print(f"缺口 X 坐标: {result.answer}")
    #     print(f"滑动轨迹: {result.details.get('track')}")

    print("（请提供真实的滑块验证码图片测试）")


# =========================================================================
# 示例 5: 从页面 HTML 自动检测验证码类型
# =========================================================================
def example_detect_from_html():
    """
    自动检测页面中的验证码类型。

    支持检测：
      - reCAPTCHA v2/v3
      - hCaptcha
      - Cloudflare Turnstile
      - FunCaptcha (Arkose Labs)
      - 算术验证码、点选验证码、滑块验证码（基于文本特征）
    """
    print("\n=== 示例 5: HTML 验证码检测 ===")

    # 模拟一个包含 reCAPTCHA 的页面
    html = """
    <html>
    <body>
        <form>
            <div class="g-recaptcha" data-sitekey="6Le-wvkSVVABBPB...</div>
            <script src="https://www.google.com/recaptcha/api.js"></script>
        </form>
    </body>
    </html>
    """

    ct = CaptchaDetector.detect_from_html(html)
    print(f"检测到验证码类型: {ct.value}")

    # 模拟 Turnstile
    html_turnstile = '<div class="cf-turnstile" data-sitekey="0x4AAAAA..."></div>'
    ct2 = CaptchaDetector.detect_from_html(html_turnstile)
    print(f"Turnstile 检测: {ct2.value}")

    # 模拟算术验证码
    html_math = '<img src="captcha.jpg"/> <span>3 + 5 = ?</span>'
    ct3 = CaptchaDetector.detect_from_html(html_math)
    print(f"算术验证码检测: {ct3.value}")

    # 模拟点选验证码
    html_click = '<img src="click.jpg"/> <span>请依次点击图中的文字</span>'
    ct4 = CaptchaDetector.detect_from_html(html_click)
    print(f"点选验证码检测: {ct4.value}")


# =========================================================================
# 示例 6: 解决 reCAPTCHA v2（第三方打码平台）
# =========================================================================
def example_recaptcha_v2():
    """
    通过第三方打码平台解决 reCAPTCHA v2。

    支持平台：2captcha / capsolver / yescaptcha
    需要注册获取 API Key。

    返回 g-recaptcha-response token，用于表单提交。
    """
    print("\n=== 示例 6: reCAPTCHA v2 ===")

    API_KEY = "YOUR_2CAPTCHA_API_KEY"
    SITE_KEY = "6Le-wvkSVVABBPB..."  # 目标网站的 data-sitekey
    PAGE_URL = "https://example.com/login"

    solver = CaptchaSolver(
        third_party_platform="2captcha",
        third_party_api_key=API_KEY,
    )

    # result = solver.third_party.solve_recaptcha_v2(SITE_KEY, PAGE_URL)
    # if result.success:
    #     token = result.answer
    #     print(f"reCAPTCHA token: {token[:50]}...")
    #     # 将 token 提交到表单的 g-recaptcha-response 字段
    # else:
    #     print(f"失败: {result.error}")

    print("（需要配置真实的 API Key 和 site_key）")


# =========================================================================
# 示例 7: 解决 Cloudflare Turnstile
# =========================================================================
def example_turnstile():
    """
    通过第三方打码平台解决 Cloudflare Turnstile 验证码。

    Turnstile 是 Cloudflare 的无感验证码，替代传统的 5 秒盾。
    当 CF 5 秒盾策略无法绕过时，可使用此方法获取 token。
    """
    print("\n=== 示例 7: Cloudflare Turnstile ===")

    API_KEY = "YOUR_CAPSOLVER_API_KEY"
    SITE_KEY = "0x4AAAAAAA..."  # Turnstile data-sitekey
    PAGE_URL = "https://cf-protected-site.com"

    # 方式一：快捷函数
    # token = solve_turnstile(SITE_KEY, PAGE_URL,
    #                         platform="capsolver", api_key=API_KEY)

    # 方式二：通过 cf_bypass 集成
    # from cf_bypass import CloudflareBypasser
    # bypasser = CloudflareBypasser(
    #     captcha_platform="capsolver",
    #     captcha_api_key=API_KEY,
    # )
    # token = bypasser.solve_turnstile(SITE_KEY, PAGE_URL)

    print("（需要配置真实的 API Key 和 site_key）")


# =========================================================================
# 示例 8: 在 DrissionPage 中自动处理验证码
# =========================================================================
def example_with_drissionpage():
    """
    在浏览器自动化中自动检测并处理验证码。

    场景：用 DrissionPage 打开页面后，检测是否有验证码，
    如果有则自动识别并操作。
    """
    print("\n=== 示例 8: DrissionPage + 验证码 ===")

    code = '''
    from DrissionPage import ChromiumPage
    from captcha_solver import CaptchaSolver, CaptchaType

    page = ChromiumPage()
    solver = CaptchaSolver()

    page.get("https://example.com/login")

    # --- 文字验证码场景 ---
    # 找到验证码图片元素
    captcha_img = page.ele("tag:img@@class=captcha")
    if captcha_img:
        # 获取图片二进制
        img_src = captcha_img.attr("src")
        img_bytes = page.get(img_src).content

        # 识别
        result = solver.solve_image(img_bytes, captcha_type=CaptchaType.TEXT)
        if result.success:
            # 填入输入框
            page.ele("tag:input@@name=captcha").input(result.answer)
            page.ele("tag:button@@type=submit").click()

    # --- 滑块验证码场景 ---
    slider_bg = page.ele("tag:img@@class=slider-bg")
    slider_btn = page.ele("tag:div@@class=slider-btn")
    if slider_bg and slider_btn:
        bg_src = slider_bg.attr("src")
        bg_bytes = page.get(bg_src).content

        # 获取滑块小图
        slider_src = page.ele("tag:img@@class=slider-piece").attr("src")
        slider_bytes = page.get(slider_src).content

        result = solver.solve_image(
            bg_bytes, captcha_type=CaptchaType.SLIDE,
            slider_image=slider_bytes
        )
        if result.success:
            # 按轨迹模拟滑动
            track = result.details["track"]
            slider_btn.drag(track[0]["x"], track[0]["y"])
            for point in track[1:]:
                slider_btn.drag(point["x"], point["y"], duration=point["time_ms"])

    # --- 点选验证码场景 ---
    click_img = page.ele("tag:img@@class=click-captcha")
    if click_img:
        img_src = click_img.attr("src")
        img_bytes = page.get(img_src).content

        result = solver.solve_image(img_bytes, captcha_type=CaptchaType.CLICK_OBJECT)
        if result.success:
            for x, y in result.answer:
                page.actions.move_to(click_img).click_at(x, y)
    '''
    print(code)


# =========================================================================
# 示例 9: 从 URL 下载并识别验证码
# =========================================================================
def example_from_url():
    """
    从验证码图片 URL 下载并识别。
    """
    print("\n=== 示例 9: 从 URL 识别 ===")

    captcha_url = "https://example.com/captcha/generate"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                       "AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://example.com/login",
    }

    try:
        resp = requests.get(captcha_url, headers=headers, timeout=10)
        image_bytes = resp.content

        solver = CaptchaSolver()

        # 自动检测类型
        result = solver.solve_image(image_bytes)
        print(f"验证码类型: {result.captcha_type.value}")
        print(f"识别结果: {result.answer}")

    except Exception as e:
        print(f"（请替换为真实的验证码 URL）错误: {e}")


# =========================================================================
# 示例 10: 同时处理 CF 盾 + 验证码（完整流程）
# =========================================================================
def example_full_workflow():
    """
    完整流程：先过 Cloudflare 5 秒盾，再处理页面上的验证码。
    """
    print("\n=== 示例 10: CF 盾 + 验证码完整流程 ===")

    code = '''
    from cf_bypass import CloudflareBypasser
    from captcha_solver import CaptchaSolver, CaptchaType
    import requests

    # 1. 先过 CF 5 秒盾
    bypasser = CloudflareBypasser(
        captcha_platform="capsolver",
        captcha_api_key="YOUR_KEY",
    )
    cf_result = bypasser.bypass("https://target-site.com/login")

    if not cf_result.success:
        print("CF 盾绕过失败")
        exit()

    # 2. 用过盾后的 Cookie 访问登录页
    session = requests.Session()
    session.cookies.update(cf_result.cookies)
    session.headers.update({"User-Agent": cf_result.user_agent})

    resp = session.get("https://target-site.com/login")
    html = resp.text

    # 3. 检测页面是否有验证码
    solver = CaptchaSolver()
    captcha_type = solver.detector.detect_from_html(html)

    if captcha_type != CaptchaType.UNKNOWN:
        print(f"检测到验证码: {captcha_type.value}")

        if captcha_type == CaptchaType.TURNSTILE:
            # CF Turnstile → 第三方打码
            site_key = solver._extract_sitekey(html, captcha_type)
            ts_result = bypasser.solve_turnstile(site_key, "https://target-site.com/login")
            # 将 token 加入表单提交

        elif captcha_type == CaptchaType.TEXT:
            # 文字验证码 → ddddocr
            # 下载验证码图片
            img_resp = session.get("https://target-site.com/captcha.jpg")
            text_result = solver.solve_image(img_resp.content)
            # 将识别结果填入表单

    # 4. 提交登录表单
    # ...
    '''
    print(code)


# =========================================================================
# 主函数
# =========================================================================
if __name__ == "__main__":
    print("=" * 60)
    print("验证码自动识别模块 - 使用示例")
    print("=" * 60)

    examples = [
        ("1", "文字验证码 (ddddocr OCR)", example_text_captcha),
        ("2", "算术验证码 (OCR + 计算)", example_math_captcha),
        ("3", "点选验证码 (目标检测)", example_click_captcha),
        ("4", "滑块验证码 (缺口检测)", example_slide_captcha),
        ("5", "HTML 验证码检测", example_detect_from_html),
        ("6", "reCAPTCHA v2 (第三方)", example_recaptcha_v2),
        ("7", "Cloudflare Turnstile", example_turnstile),
        ("8", "DrissionPage + 验证码", example_with_drissionpage),
        ("9", "从 URL 识别", example_from_url),
        ("10", "完整流程 (CF盾 + 验证码)", example_full_workflow),
    ]

    print("\n可用示例:")
    for num, desc, _ in examples:
        print(f"  {num}. {desc}")

    choice = input("\n选择示例 (1-10, 或 a 运行全部): ").strip()

    if choice.lower() == "a":
        for _, _, func in examples:
            func()
    else:
        for num, _, func in examples:
            if choice == num:
                func()
                break
        else:
            print("无效选择")
