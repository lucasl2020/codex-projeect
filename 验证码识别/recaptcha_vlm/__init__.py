#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
recaptcha_vlm: 用视觉大模型(VLM)自动求解 Google reCAPTCHA 3x3 图片语义题。

模块构成:
    config.json    - API 配置（base_url / api_key / model），api_key 需要自行填入
    provider.py    - OpenAI 兼容 VLM HTTP 客户端（默认智谱 glm-4.6v-flash）
    solver.py      - RecaptchaVlmSolver: 题目+tiles → 需点击的格子索引
    server.py      - 本地 FastAPI 服务，供 Chrome 扩展 / 脚本调用

依赖: requests / Pillow / fastapi / uvicorn（项目 requirements 已覆盖 requests+Pillow）
"""

from .provider import VLMConfig, VLMProvider
from .solver import RecaptchaVlmSolver

__all__ = ["VLMConfig", "VLMProvider", "RecaptchaVlmSolver"]
__version__ = "0.1.0"
