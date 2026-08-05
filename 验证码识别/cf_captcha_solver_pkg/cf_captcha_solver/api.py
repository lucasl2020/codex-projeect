#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
统一 API 入口
==============
提供最简化的调用接口，一行代码搞定验证码识别和 CF 绕过。
"""

from typing import Optional, Dict, Any, Union, List, Tuple
from .captcha import (
    CaptchaSolver,
    CaptchaType,
    CaptchaResult,
)
from .cloudflare import (
    CloudflareBypasser,
    BypassResult,
    CachedCloudflareBypasser,
)


def solve(
    image_bytes: Optional[bytes] = None,
    *,
    image_path: Optional[str] = None,
    html: Optional[str] = None,
    page_url: str = "",
    captcha_type: Optional[CaptchaType] = None,
    # 验证码配置
    use_gpu: bool = False,
    charset: str = "",
    target_text: str = "",
    bg_image: Optional[bytes] = None,
    slider_image: Optional[bytes] = None,
    # 第三方平台配置
    platform: str = "2captcha",
    api_key: str = "",
    **kwargs,
) -> CaptchaResult:
    """
    一站式验证码识别入口。

    自动检测验证码类型并识别，支持图片和 HTML 两种输入方式。

    参数:
        image_bytes:   验证码图片二进制数据
        image_path:    验证码图片路径（与 image_bytes 二选一）
        html:          页面 HTML（用于检测 reCAPTCHA/hCaptcha/Turnstile 等）
        page_url:      页面 URL（第三方验证码需要）
        captcha_type:  手动指定验证码类型（不指定则自动检测）
        use_gpu:       是否使用 GPU 加速 ddddocr
        charset:       文字验证码字符集限制
        target_text:   顺序点选验证码的目标文字
        bg_image:      滑块验证码背景图
        slider_image:  滑块验证码滑块图
        platform:      第三方打码平台
        api_key:       打码平台 API Key

    返回:
        CaptchaResult

    示例:
        # 识别图片验证码
        from cf_captcha_solver import solve
        result = solve(image_path="captcha.png")
        print(result.answer)

        # 从 HTML 检测并解决
        result = solve(html=page_html, page_url="https://example.com",
                       platform="capsolver", api_key="xxx")
    """
    # 从路径加载图片
    if image_path and not image_bytes:
        with open(image_path, "rb") as f:
            image_bytes = f.read()

    solver = CaptchaSolver(
        use_gpu=use_gpu,
        third_party_platform=platform,
        third_party_api_key=api_key,
    )

    # 从 HTML 检测
    if html:
        return solver.solve_from_html(html, page_url, captcha_type, **kwargs)

    # 从图片识别
    if image_bytes:
        extra = {}
        if charset:
            extra["charset"] = charset
        if target_text:
            extra["target_text"] = target_text
        if bg_image:
            extra["bg_image"] = bg_image
        if slider_image:
            extra["slider_image"] = slider_image
        extra.update(kwargs)
        return solver.solve_image(image_bytes, captcha_type, **extra)

    return CaptchaResult(
        success=False,
        error="请提供 image_bytes/image_path 或 html 参数",
    )


def bypass(
    url: str,
    *,
    proxy: Optional[str] = None,
    strategies: Optional[list] = None,
    headless: bool = True,
    timeout: int = 30,
    # 验证码配置
    captcha_platform: str = "",
    captcha_api_key: str = "",
    # FlareSolverr
    flaresolverr_url: str = "http://localhost:8191/v1",
    use_cache: bool = False,
    cache_ttl: int = 1200,
) -> BypassResult:
    """
    一站式 Cloudflare 绕过入口。

    自动检测 CF 防护并依次尝试多种策略绕过。
    成功后返回 cookies + user_agent，可直接用于后续请求。

    参数:
        url:               目标 URL
        proxy:             代理地址
        strategies:        自定义策略顺序
        headless:          浏览器是否无头模式
        timeout:           超时时间（秒）
        captcha_platform:  验证码打码平台
        captcha_api_key:   打码平台 API Key
        flaresolverr_url:  FlareSolverr 服务地址
        use_cache:         是否启用 Cookie 缓存
        cache_ttl:         缓存有效期（秒）

    返回:
        BypassResult

    示例:
        from cf_captcha_solver import bypass

        result = bypass("https://example.com")
        if result.success:
            import requests
            resp = requests.get("https://example.com/api",
                                cookies=result.cookies,
                                headers={"User-Agent": result.user_agent})
    """
    if use_cache:
        bypasser = CachedCloudflareBypasser(
            proxy=proxy,
            flaresolverr_url=flaresolverr_url,
            headless=headless,
            timeout=timeout,
            captcha_platform=captcha_platform,
            captcha_api_key=captcha_api_key,
            cache_ttl=cache_ttl,
        )
    else:
        bypasser = CloudflareBypasser(
            proxy=proxy,
            flaresolverr_url=flaresolverr_url,
            headless=headless,
            timeout=timeout,
            captcha_platform=captcha_platform,
            captcha_api_key=captcha_api_key,
        )

    return bypasser.bypass(url, strategies=strategies)
