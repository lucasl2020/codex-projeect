#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速上手示例
=============
演示如何作为外部依赖调用 cf_captcha_solver 库。
"""

# ============================================================
# 安装方式
# ============================================================
# pip install cf-captcha-solver[all]         # 全部功能
# pip install cf-captcha-solver[captcha]     # 仅验证码识别
# pip install cf-captcha-solver[cf-lite]     # 仅 CF 轻量绕过
# pip install cf-captcha-solver[cf-browser]  # CF + DrissionPage


# ============================================================
# 示例 1: 一行代码识别验证码（统一 API）
# ============================================================
def example_solve():
    """使用统一 solve() 函数，自动检测类型"""
    from cf_captcha_solver import solve

    # 从图片路径识别（自动检测类型）
    result = solve(image_path="captcha.png")
    if result.success:
        print(f"类型: {result.captcha_type.value}")
        print(f"结果: {result.answer}")

    # 从二进制数据识别
    # with open("captcha.png", "rb") as f:
    #     result = solve(image_bytes=f.read())


# ============================================================
# 示例 2: 一行代码绕过 Cloudflare（统一 API）
# ============================================================
def example_bypass():
    """使用统一 bypass() 函数"""
    from cf_captcha_solver import bypass

    result = bypass("https://example.com")
    if result.success:
        print(f"策略: {result.strategy}")
        print(f"Cookies: {list(result.cookies.keys())}")

        # 用拿到的 cookie 继续请求
        import requests
        resp = requests.get(
            "https://example.com/api/data",
            cookies=result.cookies,
            headers={"User-Agent": result.user_agent},
        )
        print(resp.text[:200])


# ============================================================
# 示例 3: 文字验证码
# ============================================================
def example_text():
    from cf_captcha_solver import CaptchaSolver, CaptchaType

    solver = CaptchaSolver()
    with open("text_captcha.png", "rb") as f:
        result = solver.solve_image(f.read(), captcha_type=CaptchaType.TEXT)

    if result.success:
        print(f"识别: {result.answer}")


# ============================================================
# 示例 4: 算术验证码
# ============================================================
def example_math():
    from cf_captcha_solver import solve, CaptchaType

    result = solve(image_path="math_captcha.png", captcha_type=CaptchaType.MATH)
    # 或: from cf_captcha_solver import solve_math_captcha
    # result = solve_math_captcha("math_captcha.png")

    if result.success:
        print(f"表达式: {result.details.get('expression')}")
        print(f"结果: {result.answer}")


# ============================================================
# 示例 5: 滑块验证码（含滑动轨迹）
# ============================================================
def example_slide():
    from cf_captcha_solver import solve

    with open("bg.png", "rb") as f:
        bg = f.read()
    with open("slider.png", "rb") as f:
        slider = f.read()

    result = solve(image_bytes=bg, bg_image=bg, slider_image=slider)
    if result.success:
        print(f"缺口距离: {result.answer}")
        print(f"滑动轨迹: {result.details.get('track')}")


# ============================================================
# 示例 6: 点选验证码
# ============================================================
def example_click():
    from cf_captcha_solver import solve

    # 目标点选
    result = solve(image_path="click.png")
    if result.success:
        print(f"点击坐标: {result.answer}")

    # 顺序点选
    result = solve(image_path="order_click.png", target_text="星空大海")
    if result.success:
        print(f"按顺序点击: {result.answer}")


# ============================================================
# 示例 7: 从 HTML 检测验证码类型
# ============================================================
def example_detect_html():
    from cf_captcha_solver import CaptchaDetector, solve

    html = '<div class="cf-turnstile" data-sitekey="0x4AAA..."></div>'
    ct = CaptchaDetector.detect_from_html(html)
    print(f"检测到: {ct.value}")

    # 如果是 Turnstile，直接解决
    result = solve(
        html=html,
        page_url="https://example.com",
        platform="capsolver",
        api_key="YOUR_KEY",
    )
    if result.success:
        print(f"Token: {result.answer}")


# ============================================================
# 示例 8: 完整流程（CF 绕过 + 验证码识别）
# ============================================================
def example_full_workflow():
    """先过 CF 盾，再处理页面验证码"""
    from cf_captcha_solver import bypass, solve
    import requests

    # 1. 过 CF 盾
    cf_result = bypass(
        "https://target-site.com/login",
        captcha_platform="capsolver",
        captcha_api_key="YOUR_KEY",
    )
    if not cf_result.success:
        print("CF 绕过失败")
        return

    # 2. 用过盾后的 Cookie 访问
    session = requests.Session()
    session.cookies.update(cf_result.cookies)
    session.headers.update({"User-Agent": cf_result.user_agent})

    resp = session.get("https://target-site.com/login")
    html = resp.text

    # 3. 检测页面是否有验证码
    result = solve(html=html, page_url="https://target-site.com/login",
                   platform="capsolver", api_key="YOUR_KEY")

    if result.success:
        print(f"验证码已解决: {result.answer}")


# ============================================================
# 示例 9: 使用 CloudflareBypasser 高级配置
# ============================================================
def example_advanced_cf():
    from cf_captcha_solver import CloudflareBypasser

    bypasser = CloudflareBypasser(
        proxy="socks5://127.0.0.1:7890",
        headless=False,          # 调试时显示浏览器
        timeout=40,
        captcha_platform="capsolver",
        captcha_api_key="YOUR_KEY",
    )

    # 只用 DrissionPage 策略
    result = bypasser.bypass(
        "https://example.com",
        strategies=["drissionpage"],
    )

    if result.success:
        # 单独解决 Turnstile
        token = bypasser.solve_turnstile("0x4AAA...", "https://example.com")
        if token:
            print(f"Turnstile token: {token}")


# ============================================================
# 示例 10: 带 Cookie 缓存（生产环境推荐）
# ============================================================
def example_cached():
    from cf_captcha_solver import bypass

    # 第一次：启动浏览器绕过，缓存 Cookie
    result = bypass("https://example.com", use_cache=True)
    print(f"第一次策略: {result.strategy}")  # drissionpage

    # 第二次（20分钟内）：直接使用缓存
    result = bypass("https://example.com", use_cache=True)
    print(f"第二次策略: {result.strategy}")  # cache


# ============================================================
# 示例 10: 带 Cookie 缓存（生产环境推荐）
# ============================================================
def example_cached():
    from cf_captcha_solver import bypass

    # 第一次：启动浏览器绕过，缓存 Cookie
    result = bypass("https://example.com", use_cache=True)
    print(f"第一次策略: {result.strategy}")  # drissionpage

    # 第二次（20分钟内）：直接使用缓存
    result = bypass("https://example.com", use_cache=True)
    print(f"第二次策略: {result.strategy}")  # cache


# ============================================================
# 示例 11: hCaptcha 九宫格本地识别 (ONNX 模型)
# ============================================================
def example_hcaptcha_grid():
    """hCaptcha 九宫格图片本地分类（免费，无需 API）"""
    from cf_captcha_solver import HCaptchaGridSolver

    solver = HCaptchaGridSolver(use_gpu=False)

    # 假设已从 hCaptcha 挑战中提取了 9 张图片
    images = []
    for i in range(9):
        with open(f"hcaptcha_tile_{i}.png", "rb") as f:
            images.append(f.read())

    result = solver.classify_images(
        prompt="请点击每张包含火车的图片",
        images=images,
    )
    if result.success:
        print(f"匹配结果: {result.answer}")  # [True, False, True, ...]
        print(f"匹配数量: {result.details['matched']}")


# ============================================================
# 示例 12: hCaptcha 浏览器自动化
# ============================================================
def example_hcaptcha_browser():
    """启动浏览器自动解决 hCaptcha 挑战"""
    from cf_captcha_solver import HCaptchaBrowserSolver

    solver = HCaptchaBrowserSolver(
        use_gpu=False,
        headless=True,
    )

    result = solver.solve(
        page_url="https://example.com/page_with_hcaptcha",
        max_retries=3,
    )
    if result.success:
        print(f"hCaptcha token: {result.answer[:50]}...")
        print(f"尝试次数: {result.details['attempts']}")


# ============================================================
# 示例 13: GeeTest 极验验证码
# ============================================================
def example_geetest():
    """GeeTest 滑块/点选/API 三种模式"""
    from cf_captcha_solver import GeeTestSolver, GeeTestV4Solver

    solver = GeeTestSolver()

    # 方式 1: 本地滑块识别
    with open("geetest_bg.png", "rb") as f:
        bg = f.read()
    with open("geetest_slider.png", "rb") as f:
        slider = f.read()
    result = solver.solve_slide(bg_image=bg, slider_image=slider)
    if result.success:
        print(f"滑块缺口: {result.answer}")

    # 方式 2: 本地语序点选
    with open("geetest_click.png", "rb") as f:
        bg = f.read()
    result = solver.solve_click(bg_image=bg, target_text="星空 大海 草原")
    if result.success:
        print(f"点击坐标: {result.answer}")

    # 方式 3: API 模式 (V3)
    result = solver.solve_via_api(
        gt="0192a3b4c5d6e7f8a9b0c1d2e3f4a5b6",
        challenge="abc123",
        page_url="https://example.com",
        api_key="YOUR_KEY",
        platform="capsolver",
    )
    if result.success:
        print(f"GeeTest V3: {result.answer}")

    # 方式 4: API 模式 (V4)
    v4 = GeeTestV4Solver()
    result = v4.solve_via_api(
        captcha_id="e392e1d7fd421dc63325744d5a2b9c73",
        page_url="https://example.com",
        api_key="YOUR_KEY",
        platform="capsolver",
    )
    if result.success:
        print(f"GeeTest V4: {result.answer}")


# ============================================================
# 示例 14: FunCaptcha (Arkose Labs)
# ============================================================
def example_funcaptcha():
    """FunCaptcha 验证码求解"""
    from cf_captcha_solver import FunCaptchaSolver

    solver = FunCaptchaSolver()

    # 从 HTML 提取 public key
    html = '<script src="https://client-api.arkoselabs.com/fc/api/?pkey=A2A14B1D-1AF3-4DE0-A6F3-E5B1C5C8E5E9"></script>'
    pk = FunCaptchaSolver.extract_public_key(html)
    print(f"提取到 public key: {pk}")

    # 通过 API 解决
    result = solver.solve_via_api(
        public_key=pk,
        page_url="https://example.com",
        api_key="YOUR_KEY",
        platform="capsolver",
    )
    if result.success:
        print(f"FunCaptcha token: {result.answer[:50]}...")


# ============================================================
# 示例 15: 图片差异滑块（前图+后图模式）
# ============================================================
def example_slide_comparison():
    """通过图片差异检测滑块缺口"""
    from cf_captcha_solver import SlideComparisonSolver

    solver = SlideComparisonSolver()

    with open("full_bg.png", "rb") as f:
        full = f.read()
    with open("gap_bg.png", "rb") as f:
        gap = f.read()

    result = solver.solve(full_image=full, gap_image=gap)
    if result.success:
        print(f"缺口位置: x={result.answer}")
        print(f"目标区域: {result.details['target']}")
        print(f"滑动轨迹: {len(result.details['track'])} 步")


# ============================================================
# 示例 16: reCAPTCHA 图片分类
# ============================================================
def example_recaptcha_image():
    """reCAPTCHA v2 网格图片本地分类"""
    from cf_captcha_solver import ReCaptchaImageSolver

    solver = ReCaptchaImageSolver(backend="hcaptcha_challenger")

    tiles = []
    for i in range(9):
        with open(f"recaptcha_tile_{i}.png", "rb") as f:
            tiles.append(f.read())

    result = solver.classify_tiles(
        prompt="Select all images with traffic lights",
        tiles=tiles,
    )
    if result.success:
        print(f"分类结果: {result.answer}")
        print(f"翻译提示: {result.details['translated']}")


if __name__ == "__main__":
    import sys
    print("=" * 60)
    print("cf_captcha_solver 快速上手示例")
    print("=" * 60)
    print("\n选择示例 (1-16): ")
    print("  1. 一行代码识别验证码")
    print("  2. 一行代码绕过 CF")
    print("  3. 文字验证码")
    print("  4. 算术验证码")
    print("  5. 滑块验证码")
    print("  6. 点选验证码")
    print("  7. HTML 检测")
    print("  8. 完整流程")
    print("  9. 高级配置")
    print(" 10. Cookie 缓存")
    print(" 11. hCaptcha 九宫格本地识别")
    print(" 12. hCaptcha 浏览器自动化")
    print(" 13. GeeTest 极验验证码")
    print(" 14. FunCaptcha (Arkose Labs)")
    print(" 15. 图片差异滑块")
    print(" 16. reCAPTCHA 图片分类")

    examples = {
        "1": example_solve, "2": example_bypass, "3": example_text,
        "4": example_math, "5": example_slide, "6": example_click,
        "7": example_detect_html, "8": example_full_workflow,
        "9": example_advanced_cf, "10": example_cached,
        "11": example_hcaptcha_grid, "12": example_hcaptcha_browser,
        "13": example_geetest, "14": example_funcaptcha,
        "15": example_slide_comparison, "16": example_recaptcha_image,
    }
    choice = input("\n> ").strip()
    if choice in examples:
        examples[choice]()
    else:
        print("无效选择")
