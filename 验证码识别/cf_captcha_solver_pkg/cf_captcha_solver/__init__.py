#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
cf_captcha_solver
=================
Cloudflare 验证绕过 + 验证码自动识别一体化 Python 库。

安装:
    pip install cf-captcha-solver[all]

快速使用:
    from cf_captcha_solver import CaptchaSolver, CloudflareBypasser

    # 1. 识别验证码
    solver = CaptchaSolver()
    result = solver.solve_image(image_bytes)
    print(result.answer)

    # 2. 绕过 Cloudflare
    bypasser = CloudflareBypasser()
    cf_result = bypasser.bypass("https://example.com")
    print(cf_result.cookies)
"""

__version__ = "1.0.0"
__author__ = "cf-captcha-solver"
__license__ = "MIT"

# ---- 验证码模块 ----
from .captcha import (
    CaptchaType,
    CaptchaResult,
    CaptchaDetector,
    CaptchaSolver,
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

# ---- 高级求解器模块 ----
from .advanced_solvers import (
    HCaptchaGridSolver,
    HCaptchaGridAPISolver,
    HCaptchaBrowserSolver,
    GeeTestSolver,
    GeeTestV4Solver,
    AWSWAFCaptchaSolver,
    FunCaptchaSolver,
    ImageClassifier,
    ReCaptchaImageSolver,
    SlideComparisonSolver,
    RotateCaptchaSolver,
    GeeTestBrowserSolver,
)

# ---- Cloudflare 模块 ----
from .cloudflare import (
    BypassResult,
    CloudflareBypasser,
    CachedCloudflareBypasser,
    CookieCache,
)

# ---- 统一入口 ----
from .api import solve, bypass

__all__ = [
    # 版本
    "__version__",

    # 验证码
    "CaptchaType",
    "CaptchaResult",
    "CaptchaDetector",
    "CaptchaSolver",
    "TextCaptchaSolver",
    "MathCaptchaSolver",
    "ClickCaptchaSolver",
    "SlideCaptchaSolver",
    "ThirdPartyCaptchaSolver",
    "solve_text_captcha",
    "solve_math_captcha",
    "solve_slide_captcha",
    "solve_click_captcha",
    "solve_turnstile",

    # 高级求解器
    "HCaptchaGridSolver",
    "HCaptchaGridAPISolver",
    "HCaptchaBrowserSolver",
    "GeeTestSolver",
    "GeeTestV4Solver",
    "AWSWAFCaptchaSolver",
    "FunCaptchaSolver",
    "ImageClassifier",
    "ReCaptchaImageSolver",
    "SlideComparisonSolver",
    "RotateCaptchaSolver",
    "GeeTestBrowserSolver",

    # Cloudflare
    "BypassResult",
    "CloudflareBypasser",
    "CachedCloudflareBypasser",
    "CookieCache",

    # 统一入口
    "solve",
    "bypass",
]
