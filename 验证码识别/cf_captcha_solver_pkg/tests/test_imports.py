#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""基础导入测试"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def test_import_package():
    """测试包能正常导入"""
    import cf_captcha_solver
    assert hasattr(cf_captcha_solver, "__version__")
    assert cf_captcha_solver.__version__ == "1.0.0"


def test_import_captcha_classes():
    """测试验证码相关类能导入"""
    from cf_captcha_solver import (
        CaptchaType,
        CaptchaResult,
        CaptchaDetector,
        CaptchaSolver,
        TextCaptchaSolver,
        MathCaptchaSolver,
        ClickCaptchaSolver,
        SlideCaptchaSolver,
        ThirdPartyCaptchaSolver,
    )
    assert CaptchaType.TEXT.value == "text"
    assert CaptchaType.MATH.value == "math"
    assert CaptchaType.SLIDE.value == "slide"


def test_import_cf_classes():
    """测试 CF 相关类能导入"""
    from cf_captcha_solver import (
        BypassResult,
        CloudflareBypasser,
        CachedCloudflareBypasser,
        CookieCache,
    )
    assert BypassResult
    assert CloudflareBypasser
    assert CachedCloudflareBypasser
    assert CookieCache


def test_import_api():
    """测试统一 API 能导入"""
    from cf_captcha_solver import solve, bypass
    assert callable(solve)
    assert callable(bypass)


def test_import_shortcut_functions():
    """测试快捷函数能导入"""
    from cf_captcha_solver import (
        solve_text_captcha,
        solve_math_captcha,
        solve_slide_captcha,
        solve_click_captcha,
        solve_turnstile,
    )
    assert callable(solve_text_captcha)
    assert callable(solve_math_captcha)
    assert callable(solve_slide_captcha)
    assert callable(solve_click_captcha)
    assert callable(solve_turnstile)


def test_captcha_type_enum():
    """测试验证码类型枚举"""
    from cf_captcha_solver import CaptchaType
    types = [t.value for t in CaptchaType]
    assert "text" in types
    assert "math" in types
    assert "slide" in types
    assert "click_object" in types
    assert "click_order" in types
    assert "recaptcha_v2" in types
    assert "turnstile" in types


def test_captcha_detector_html():
    """测试 HTML 验证码检测"""
    from cf_captcha_solver import CaptchaDetector, CaptchaType

    # reCAPTCHA
    html = '<div class="g-recaptcha" data-sitekey="xxx"></div>'
    assert CaptchaDetector.detect_from_html(html) == CaptchaType.RECAPTCHA_V2

    # Turnstile
    html = '<div class="cf-turnstile" data-sitekey="xxx"></div>'
    assert CaptchaDetector.detect_from_html(html) == CaptchaType.TURNSTILE

    # 算术
    html = '<span>3 + 5 = ?</span>'
    assert CaptchaDetector.detect_from_html(html) == CaptchaType.MATH


def test_bypass_result_dataclass():
    """测试 BypassResult 数据类"""
    from cf_captcha_solver import BypassResult
    r = BypassResult(success=True, strategy="test")
    assert r.success is True
    assert r.strategy == "test"
    assert r.cookies == {}


def test_captcha_result_dataclass():
    """测试 CaptchaResult 数据类"""
    from cf_captcha_solver import CaptchaResult, CaptchaType
    r = CaptchaResult(success=True, answer="abc", captcha_type=CaptchaType.TEXT)
    assert r.success is True
    assert r.answer == "abc"
    assert r.captcha_type == CaptchaType.TEXT


if __name__ == "__main__":
    # 不使用 pytest 直接运行
    tests = [
        test_import_package,
        test_import_captcha_classes,
        test_import_cf_classes,
        test_import_api,
        test_import_shortcut_functions,
        test_captcha_type_enum,
        test_captcha_detector_html,
        test_bypass_result_dataclass,
        test_captcha_result_dataclass,
    ]
    passed = 0
    for test in tests:
        try:
            test()
            print(f"  PASS  {test.__name__}")
            passed += 1
        except Exception as e:
            print(f"  FAIL  {test.__name__}: {e}")
    print(f"\n{passed}/{len(tests)} tests passed")
    sys.exit(0 if passed == len(tests) else 1)
