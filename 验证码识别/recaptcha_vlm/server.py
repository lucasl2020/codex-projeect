#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HTTP API 服务（供 Chrome 扩展 / 脚本调用）
==========================================
将 reCAPTCHA VLM 求解包装为 REST 端点，本地监听。
纯标准库实现（http.server），无需 fastapi/uvicorn 等额外依赖。

启动:
    python -m recaptcha_vlm.server --port 8765

端点:
    GET  /recaptcha/health           健康检查
    POST /recaptcha/solve            求解图片挑战

请求体 (POST /recaptcha/solve):
    {
      "prompt": "Select all images with taxis",   # 题目原文
      "tiles": ["<base64 png>", ...],              # 按 DOM 顺序的 tile 图 (最多 9 张)
      "mode": "grid"                               # 可选: grid / tile
    }

响应:
    { "success": true, "tiles": [0, 4, 7], "details": {...}, "error": "" }
"""

import argparse
import base64
import json
import logging
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import List, Optional
from urllib.parse import urlparse

from .solver import (
    RecaptchaVlmSolver,
    _extract_target,
    _parse_tiles_response,
)

logger = logging.getLogger("recaptcha_vlm.server")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(
        "[%(asctime)s] [VLM] %(levelname)s: %(message)s", datefmt="%H:%M:%S"
    ))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

_solver = RecaptchaVlmSolver()


class RecaptchaHandler(BaseHTTPRequestHandler):
    """极简 JSON HTTP 处理器"""

    # ---- 基础 ----

    def log_message(self, fmt, *args):  # 走标准 logging，避免刷屏到 stderr
        logger.info("%s - %s", self.address_string(), fmt % args)

    def _send_json(self, obj: dict, status: int = 200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except ValueError:
            return {}

    # ---- 路由 ----

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/recaptcha/health":
            self._send_json({"status": "ok", "model": _solver.provider.config.model})
        else:
            self._send_json({"error": "not found"}, status=404)

    def do_POST(self):
        path = urlparse(self.path).path
        if path != "/recaptcha/solve":
            self._send_json({"error": "not found"}, status=404)
            return
        req = self._read_json_body()
        self._send_json(handle_solve(req))

    # ---- CORS 预检（浏览器调试用）----

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


# ===========================================================================
# 求解逻辑（导出以便测试复用）
# ===========================================================================

def handle_solve(req: dict) -> dict:
    """处理一次 /recaptcha/solve 请求，返回响应 dict。"""
    prompt = str(req.get("prompt", "")).strip()
    if not prompt:
        return {"success": False, "tiles": [], "details": {}, "error": "prompt 不能为空"}

    tiles_b64 = req.get("tiles") or []
    grid_b64 = req.get("grid_image") or ""
    if not tiles_b64 and not grid_b64:
        return {"success": False, "tiles": [], "details": {}, "error": "tiles 或 grid_image 至少提供一个"}

    mode = str(req.get("mode", ""))
    try:
        if grid_b64:
            grid_img = base64.b64decode(grid_b64)
            return _solve_single_image(prompt, grid_img, mode)
        tiles = []
        for item in tiles_b64:
            try:
                tiles.append(base64.b64decode(item))
            except Exception as e:
                logger.warning("跳过无法解码的 tile: %s", e)
        result = _solver.solve(prompt, tiles, mode=mode)
        return dict(result)
    except Exception as e:
        logger.exception("solve 异常")
        return {"success": False, "tiles": [], "details": {}, "error": f"服务端异常: {e}"}


def _solve_single_image(prompt: str, grid_img: bytes, mode: str) -> dict:
    """整图输入：让 VLM 按 3x3 阅读顺序（无角标）给出格子编号。"""
    target = _extract_target(prompt)
    text = (
        "You are solving a Google reCAPTCHA image challenge. "
        "The image is a 3x3 grid of 9 tiles in reading order (left to right, top to bottom). "
        f"Select every tile that shows: {target}. "
        "Reply with ONLY a JSON array of 1-based tile numbers, e.g. [2,5,8]. If none, reply [] ."
    )
    raw = _solver.provider.chat(text, images=[grid_img])
    tiles_1based = _parse_tiles_response(raw, max_idx=9)
    return {
        "success": True,
        "tiles": [i - 1 for i in tiles_1based],
        "details": {"raw": raw, "mode": "grid_image"},
        "error": "",
    }


def main():
    parser = argparse.ArgumentParser(description="reCAPTCHA VLM 求解 HTTP 服务 (纯标准库)")
    parser.add_argument("--host", default="127.0.0.1", help="监听地址，默认仅本机")
    parser.add_argument("--port", type=int, default=8765, help="监听端口")
    args = parser.parse_args()

    httpd = ThreadingHTTPServer((args.host, args.port), RecaptchaHandler)
    print(f"reCAPTCHA VLM 服务已启动: http://{args.host}:{args.port}/recaptcha/health")
    print(f"API 文档见 README: POST /recaptcha/solve")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止")
        httpd.server_close()


if __name__ == "__main__":
    main()
