#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VLM Provider 适配层
====================
统一的 OpenAI 兼容 /v1/chat/completions 调用封装。

当前默认对接智谱开放平台 (open.bigmodel.cn) 的 glm-4.6v-flash（免费视觉模型），
但 base_url/model/api_key 全部可配置，换任何 OpenAI 兼容平台（Agnes/硅基流动等）
只需改 config.json，无需改代码。

协议参考: https://open.bigmodel.cn/dev/api
"""

import base64
import json
import logging
import os
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional

import requests

logger = logging.getLogger("recaptcha_vlm.provider")


@dataclass
class VLMConfig:
    """VLM 平台配置，字段与 config.json 的 api 段一一对应"""

    base_url: str = "https://open.bigmodel.cn/api/paas/v4"
    api_key: str = ""
    model: str = "glm-4.6v-flash"
    timeout: int = 60
    max_tokens: int = 200
    extra: Dict[str, str] = field(default_factory=dict)

    @property
    def ready(self) -> bool:
        """api_key 未配置时返回 False，便于上层给出清晰报错"""
        return bool(self.api_key and self.api_key.strip())

    @classmethod
    def load(cls, config_path: Optional[str] = None) -> "VLMConfig":
        """
        从 JSON 文件加载配置。

        查找顺序:
          1. 显式传入的 config_path
          2. 环境变量 RECAPTCHA_VLM_CONFIG
          3. 本模块同目录 config.json
        """
        path = config_path or os.environ.get("RECAPTCHA_VLM_CONFIG")
        if not path:
            path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

        if not os.path.isfile(path):
            logger.warning("配置文件不存在: %s，使用默认配置", path)
            return cls()

        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            api = data.get("api", {})
            return cls(
                base_url=api.get("base_url", cls.base_url),
                api_key=api.get("api_key", ""),
                model=api.get("model", cls.model),
                timeout=int(api.get("timeout", 60)),
                max_tokens=int(api.get("max_tokens", 200)),
            )
        except (OSError, ValueError) as e:
            logger.warning("配置文件解析失败: %s，使用默认配置 (%s)", path, e)
            return cls()


class VLMProvider:
    """OpenAI 兼容视觉模型 HTTP 客户端"""

    def __init__(self, config: Optional[VLMConfig] = None):
        self.config = config or VLMConfig.load()
        self._session = requests.Session()

    def chat(
        self,
        text: str,
        images: Optional[List[bytes]] = None,
        system: str = "",
        temperature: float = 0.1,
    ) -> str:
        """
        发送文本 + 图片，返回模型回复文本。

        :param text:   用户问题（如验证码题目+指令）
        :param images: 图片字节列表（可传多张，按顺序作为 image_url 内容）
        :param system: 可选系统提示词
        :return: 模型回复的纯文本
        """
        if not self.config.ready:
            raise RuntimeError(
                "config.json 的 api.api_key 为空。请先到 open.bigmodel.cn 创建 API Key 并填入。"
            )

        content: List[Dict] = [{"type": "text", "text": text}]
        for img_bytes in images or []:
            b64 = base64.b64encode(img_bytes).decode("ascii")
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{b64}"},
            })

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": content})

        payload = {
            "model": self.config.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": self.config.max_tokens,
        }

        url = self.config.base_url.rstrip("/") + "/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
        }

        logger.info("VLM 请求: model=%s images=%d", self.config.model, len(images or []))
        t0 = time.time()

        resp = self._session.post(
            url, headers=headers, data=json.dumps(payload), timeout=self.config.timeout
        )
        elapsed = time.time() - t0

        if resp.status_code != 200:
            raise RuntimeError(
                f"VLM API 错误 HTTP {resp.status_code}: {resp.text[:300]}"
            )

        data = resp.json()
        try:
            answer = data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, TypeError) as e:
            raise RuntimeError(f"VLM 响应格式异常: {e} | 原始: {str(data)[:300]}")

        logger.info("VLM 响应耗时 %.1fs", elapsed)
        return answer
