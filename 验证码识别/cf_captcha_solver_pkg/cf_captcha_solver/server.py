#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HTTP API 服务
=============
将 cf_captcha_solver 包装为 RESTful HTTP 服务，
使任何编程语言（Node.js / Go / Java / PHP / C# / Shell 等）
都能通过 HTTP 调用验证码识别和 Cloudflare 绕过功能。

启动:
    # 开发模式
    python -m cf_captcha_solver.server

    # 生产模式（多 worker）
    uvicorn cf_captcha_solver.server:app --host 0.0.0.0 --port 8000 --workers 4

    # 命令行入口
    cf-captcha-server --port 8000

API 端点:
    GET  /                          健康检查 + API 信息
    GET  /docs                      Swagger UI 自动文档
    POST /api/captcha/solve         识别验证码（图片/HTML）
    POST /api/captcha/detect        检测验证码类型
    POST /api/cloudflare/bypass     绕过 Cloudflare 验证
    GET  /api/health                健康检查
"""

import os
import sys
import base64
import logging
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# 日志
# ---------------------------------------------------------------------------
logger = logging.getLogger("cf_captcha_solver.server")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(
        "[%(asctime)s] [SERVER] %(levelname)s: %(message)s",
        datefmt="%H:%M:%S"
    ))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

# ---------------------------------------------------------------------------
# 导入核心模块
# ---------------------------------------------------------------------------
from .captcha import (
    CaptchaSolver,
    CaptchaDetector,
    CaptchaType,
    CaptchaResult,
)
from .cloudflare import (
    CloudflareBypasser,
    BypassResult,
)
from . import __version__

# ---------------------------------------------------------------------------
# FastAPI 应用
# ---------------------------------------------------------------------------
app = FastAPI(
    title="cf-captcha-solver API",
    description=(
        "Cloudflare 验证绕过 + 验证码自动识别 HTTP API\n\n"
        "任何编程语言都可通过 HTTP 调用以下功能：\n"
        "- 验证码识别（文字/算术/点选/滑块/reCAPTCHA/hCaptcha/Turnstile）\n"
        "- Cloudflare 5秒盾 / JS Challenge 绕过\n\n"
        "合规提醒：仅供技术研究学习，请遵守目标网站服务条款。"
    ),
    version=__version__,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS - 允许跨域调用
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===========================================================================
# 请求 / 响应模型
# ===========================================================================

class CaptchaSolveRequest(BaseModel):
    """验证码识别请求（JSON 模式）"""
    image_base64: Optional[str] = Field(
        None, description="验证码图片的 Base64 编码字符串"
    )
    html: Optional[str] = Field(
        None, description="页面 HTML（用于检测 reCAPTCHA/hCaptcha/Turnstile）"
    )
    page_url: str = Field("", description="页面 URL（第三方验证码需要）")
    captcha_type: Optional[str] = Field(
        None, description="手动指定类型: text/math/click_object/click_order/slide/recaptcha_v2/recaptcha_v3/hcaptcha/turnstile/funcaptcha"
    )
    use_gpu: bool = Field(False, description="是否使用 GPU 加速")
    charset: str = Field("", description="文字验证码字符集限制")
    target_text: str = Field("", description="顺序点选目标文字")
    bg_image_base64: Optional[str] = Field(
        None, description="滑块验证码背景图 Base64"
    )
    slider_image_base64: Optional[str] = Field(
        None, description="滑块验证码滑块图 Base64"
    )
    platform: str = Field("2captcha", description="第三方打码平台: 2captcha/capsolver/yescaptcha")
    api_key: str = Field("", description="打码平台 API Key")


class CaptchaDetectRequest(BaseModel):
    """验证码类型检测请求"""
    html: Optional[str] = Field(None, description="页面 HTML")
    image_base64: Optional[str] = Field(None, description="图片 Base64")


class CloudflareBypassRequest(BaseModel):
    """Cloudflare 绕过请求"""
    url: str = Field(..., description="目标 URL")
    proxy: Optional[str] = Field(None, description="代理地址，如 socks5://127.0.0.1:7890")
    strategies: Optional[List[str]] = Field(
        None,
        description="策略顺序: curl_cffi/cloudscraper/flaresolverr/drissionpage/playwright",
    )
    headless: bool = Field(True, description="浏览器是否无头模式")
    timeout: int = Field(30, description="超时时间（秒）")
    captcha_platform: str = Field("", description="验证码打码平台")
    captcha_api_key: str = Field("", description="打码平台 API Key")
    flaresolverr_url: str = Field(
        "http://localhost:8191/v1", description="FlareSolverr 服务地址"
    )
    use_cache: bool = Field(False, description="是否启用 Cookie 缓存")
    cache_ttl: int = Field(1200, description="缓存有效期（秒）")


class ApiResponse(BaseModel):
    """统一响应格式"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ===========================================================================
# 辅助函数
# ===========================================================================

def _decode_base64(b64_str: Optional[str]) -> Optional[bytes]:
    """解码 Base64 字符串为 bytes"""
    if not b64_str:
        return None
    # 移除可能存在的 data URI 前缀
    if "," in b64_str and b64_str.startswith("data:"):
        b64_str = b64_str.split(",", 1)[1]
    return base64.b64decode(b64_str)


def _captcha_result_to_dict(result: CaptchaResult) -> Dict[str, Any]:
    """将 CaptchaResult 转为可序列化字典"""
    answer = result.answer
    # 点选验证码的 answer 是 List[Tuple[int, int]]，需转为 list
    if isinstance(answer, list):
        answer = [list(item) if isinstance(item, tuple) else item for item in answer]

    return {
        "success": result.success,
        "captcha_type": result.captcha_type.value if result.captcha_type else "unknown",
        "answer": answer,
        "details": result.details,
        "error": result.error,
    }


def _bypass_result_to_dict(result: BypassResult) -> Dict[str, Any]:
    """将 BypassResult 转为可序列化字典"""
    return {
        "success": result.success,
        "strategy": result.strategy,
        "cookies": result.cookies,
        "user_agent": result.user_agent,
        "html": result.html,
        "error": result.error,
    }


# ===========================================================================
# API 端点
# ===========================================================================

@app.get("/", tags=["系统"])
async def root():
    """健康检查 + API 信息"""
    return {
        "service": "cf-captcha-solver",
        "version": __version__,
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "captcha_solve": "POST /api/captcha/solve",
            "captcha_detect": "POST /api/captcha/detect",
            "cloudflare_bypass": "POST /api/cloudflare/bypass",
            "health": "GET /api/health",
        },
    }


@app.get("/api/health", tags=["系统"])
async def health():
    """健康检查"""
    return {"status": "ok", "version": __version__}


# ---- 验证码识别 ----

@app.post("/api/captcha/solve", tags=["验证码"], response_model=ApiResponse,
          summary="识别验证码")
async def solve_captcha(
    image: Optional[UploadFile] = File(None, description="验证码图片文件"),
    bg_image: Optional[UploadFile] = File(None, description="滑块背景图"),
    slider_image: Optional[UploadFile] = File(None, description="滑块小图"),
    html: Optional[str] = Form(None, description="页面 HTML"),
    page_url: str = Form("", description="页面 URL"),
    captcha_type: Optional[str] = Form(None, description="手动指定类型"),
    use_gpu: bool = Form(False),
    charset: str = Form(""),
    target_text: str = Form(""),
    platform: str = Form("2captcha"),
    api_key: str = Form(""),
):
    """
    识别验证码 —— 支持文件上传和 HTML 两种方式。

    **方式一：上传图片文件（multipart/form-data）**

        curl -F "image=@captcha.png" http://localhost:8000/api/captcha/solve

    **方式二：从 HTML 检测第三方验证码**

        curl -H "Content-Type: application/json" \\
             -d '{"html":"<div class=cf-turnstile>", "page_url":"https://x.com", "api_key":"xxx"}' \\
             http://localhost:8000/api/captcha/solve
    """
    try:
        # 收集图片数据
        image_bytes = None
        if image:
            image_bytes = await image.read()

        bg_bytes = None
        if bg_image:
            bg_bytes = await bg_image.read()

        slider_bytes = None
        if slider_image:
            slider_bytes = await slider_image.read()

        # HTML 模式
        if html and not image_bytes:
            solver = CaptchaSolver(
                third_party_platform=platform,
                third_party_api_key=api_key,
            )
            ct = None
            if captcha_type:
                try:
                    ct = CaptchaType(captcha_type)
                except ValueError:
                    pass
            result = solver.solve_from_html(html, page_url, ct)
            return ApiResponse(
                success=result.success,
                data=_captcha_result_to_dict(result),
                error=result.error if not result.success else None,
            )

        # 图片模式
        if not image_bytes and not html:
            raise HTTPException(status_code=400, detail="请提供 image 文件或 html 参数")

        solver = CaptchaSolver(
            use_gpu=use_gpu,
            third_party_platform=platform,
            third_party_api_key=api_key,
        )

        ct = None
        if captcha_type:
            try:
                ct = CaptchaType(captcha_type)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"无效的验证码类型: {captcha_type}",
                )

        # 滑块验证码
        if bg_bytes and slider_bytes:
            result = solver.solve_image(
                image_bytes, captcha_type=CaptchaType.SLIDE,
            )
            # 滑块用专用方法
            slide_solver = solver.slide
            result = slide_solver.solve(bg_bytes, slider_bytes)
        else:
            extra = {}
            if charset:
                extra["charset"] = charset
            if target_text:
                extra["target_text"] = target_text
            result = solver.solve_image(image_bytes, ct, **extra)

        return ApiResponse(
            success=result.success,
            data=_captcha_result_to_dict(result),
            error=result.error if not result.success else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"验证码识别异常: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/captcha/solve/json", tags=["验证码"], response_model=ApiResponse,
          summary="识别验证码（纯 JSON 模式）")
async def solve_captcha_json(req: CaptchaSolveRequest):
    """
    纯 JSON 模式的验证码识别 —— 适合不方便上传文件的场景。

    图片用 Base64 编码传入。

    示例:
        {
            "image_base64": "iVBORw0KGgo...",
            "captcha_type": "text"
        }
    """
    try:
        image_bytes = _decode_base64(req.image_base64)
        bg_bytes = _decode_base64(req.bg_image_base64)
        slider_bytes = _decode_base64(req.slider_image_base64)

        # HTML 模式
        if req.html and not image_bytes:
            solver = CaptchaSolver(
                third_party_platform=req.platform,
                third_party_api_key=req.api_key,
            )
            ct = None
            if req.captcha_type:
                try:
                    ct = CaptchaType(req.captcha_type)
                except ValueError:
                    pass
            result = solver.solve_from_html(req.html, req.page_url, ct)
            return ApiResponse(
                success=result.success,
                data=_captcha_result_to_dict(result),
                error=result.error if not result.success else None,
            )

        if not image_bytes and not req.html:
            raise HTTPException(status_code=400, detail="请提供 image_base64 或 html 参数")

        solver = CaptchaSolver(
            use_gpu=req.use_gpu,
            third_party_platform=req.platform,
            third_party_api_key=req.api_key,
        )

        ct = None
        if req.captcha_type:
            try:
                ct = CaptchaType(req.captcha_type)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"无效的验证码类型: {req.captcha_type}",
                )

        # 滑块
        if bg_bytes and slider_bytes:
            result = solver.slide.solve(bg_bytes, slider_bytes)
        else:
            extra = {}
            if req.charset:
                extra["charset"] = req.charset
            if req.target_text:
                extra["target_text"] = req.target_text
            result = solver.solve_image(image_bytes, ct, **extra)

        return ApiResponse(
            success=result.success,
            data=_captcha_result_to_dict(result),
            error=result.error if not result.success else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"验证码识别异常: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/captcha/detect", tags=["验证码"], response_model=ApiResponse,
          summary="检测验证码类型")
async def detect_captcha(req: CaptchaDetectRequest):
    """
    从 HTML 或图片检测验证码类型。

    返回 captcha_type 字段:
    text / math / click_object / click_order / slide /
    recaptcha_v2 / recaptcha_v3 / hcaptcha / turnstile / funcaptcha / unknown
    """
    try:
        if req.html:
            ct = CaptchaDetector.detect_from_html(req.html)
            return ApiResponse(
                success=True,
                data={"captcha_type": ct.value},
            )

        if req.image_base64:
            image_bytes = _decode_base64(req.image_base64)
            ct = CaptchaDetector.detect_from_image(image_bytes)
            return ApiResponse(
                success=True,
                data={"captcha_type": ct.value},
            )

        raise HTTPException(status_code=400, detail="请提供 html 或 image_base64 参数")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---- Cloudflare 绕过 ----

@app.post("/api/cloudflare/bypass", tags=["Cloudflare"], response_model=ApiResponse,
          summary="绕过 Cloudflare 验证")
async def bypass_cloudflare(req: CloudflareBypassRequest):
    """
    自动检测并绕过 Cloudflare 的 5 秒盾 / JS Challenge / Turnstile。

    成功后返回 cookies + user_agent + html，
    可直接用于后续的 HTTP 请求。
    """
    try:
        from .api import bypass as do_bypass

        result = do_bypass(
            req.url,
            proxy=req.proxy,
            strategies=req.strategies,
            headless=req.headless,
            timeout=req.timeout,
            captcha_platform=req.captcha_platform,
            captcha_api_key=req.captcha_api_key,
            flaresolverr_url=req.flaresolverr_url,
            use_cache=req.use_cache,
            cache_ttl=req.cache_ttl,
        )

        return ApiResponse(
            success=result.success,
            data=_bypass_result_to_dict(result),
            error=result.error if not result.success else None,
        )

    except Exception as e:
        logger.error(f"CF 绕过异常: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================================================
# 命令行入口
# ===========================================================================

def server_main():
    """cf-captcha-server 命令行入口"""
    import argparse

    parser = argparse.ArgumentParser(
        prog="cf-captcha-server",
        description="cf-captcha-solver HTTP API 服务",
    )
    parser.add_argument("--host", default="0.0.0.0", help="监听地址 (默认 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="监听端口 (默认 8000)")
    parser.add_argument("--workers", type=int, default=1, help="Worker 进程数")
    parser.add_argument("--reload", action="store_true", help="开发模式热重载")
    args = parser.parse_args()

    import uvicorn
    print(f"\n{'='*60}")
    print(f"  cf-captcha-solver HTTP API 服务 v{__version__}")
    print(f"  监听: http://{args.host}:{args.port}")
    print(f"  文档: http://{args.host}:{args.port}/docs")
    print(f"  Workers: {args.workers}")
    print(f"{'='*60}\n")

    uvicorn.run(
        "cf_captcha_solver.server:app",
        host=args.host,
        port=args.port,
        workers=args.workers,
        reload=args.reload,
    )


if __name__ == "__main__":
    server_main()
