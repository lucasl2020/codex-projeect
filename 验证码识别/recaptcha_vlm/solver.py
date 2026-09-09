#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
reCAPTCHA v2 图片挑战 VLM 求解器
================================
面向 Google reCAPTCHA "Select all images with X" 这类 3x3 网格语义题。

求解方式（两种模式）:
  grid: 把 9 张 tile 拼成一张 3x3 大图（每格左上角画编号角标 1-9），
        一次请求让 VLM 直接输出应点击的格子编号。快，1 次请求。
  tile: 逐张 tile 询问 "图中是否包含 X"，模型回答 yes/no 后聚合。
        慢，9 次请求，但每格判断独立，语义歧义更少。

结果统一转换为 0-based 的格子索引（与 DOM / 数组下标一致），
调用方（扩展）据此点击对应 tile。

典型题目文本会被翻译成规范指令，示例:
  输入题目 "Select all images with taxis"
  → 输出 tiles=[0, 4, 7] 表示第 1/5/8 格包含出租车，需要点击。
"""

import json
import logging
import re
from io import BytesIO
from typing import List, Optional, Tuple

from PIL import Image, ImageDraw

from .provider import VLMConfig, VLMProvider

logger = logging.getLogger("recaptcha_vlm.solver")

DEFAULT_GRID = 3  # 3x3 = 9 格


def load_solve_config(config_path: Optional[str] = None) -> dict:
    """读取 solve 段配置（mode / max_retries）。与 provider 共用同一份 config.json"""
    import os

    path = config_path or os.environ.get("RECAPTCHA_VLM_CONFIG")
    if not path:
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

    defaults = {"mode": "grid", "max_retries": 2}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return {**defaults, **(json.load(f).get("solve", {}))}
    except (OSError, ValueError):
        return defaults


class RecaptchaVlmSolver:
    """3x3 网格语义题求解器"""

    def __init__(self, config: Optional[VLMConfig] = None):
        self.provider = VLMProvider(config)
        self.solve_cfg = load_solve_config()

    # ------------------------------------------------------------------
    # 公共接口
    # ------------------------------------------------------------------
    def solve(
        self,
        prompt: str,
        tiles: List[bytes],
        mode: str = "",
    ) -> dict:
        """
        求解一张图片挑战。

        :param prompt: 原始题目文本，如 "Select all images with taxis"
        :param tiles:  9 张 tile 图片字节，按 DOM 顺序（从左到右、从上到下）
        :param mode:   "grid" / "tile"，空则用 config 默认
        :return: {"success": bool, "tiles": List[int] (0-based, 需点击的格子),
                  "details": {...}, "error": str}
        """
        mode = mode or self.solve_cfg.get("mode", "grid")
        max_retries = int(self.solve_cfg.get("max_retries", 2))

        if not self.provider.config.ready:
            return {
                "success": False,
                "tiles": [],
                "details": {},
                "error": "config.json 的 api.api_key 为空，请先到 open.bigmodel.cn 创建 API Key 并填入",
            }

        if not tiles:
            return {"success": False, "tiles": [], "details": {}, "error": "tiles 为空"}

        # 规范化到最多 9 张（多余丢弃、不足用空格标记以便调用方判断）
        tiles = tiles[: DEFAULT_GRID * DEFAULT_GRID]

        target = _extract_target(prompt)
        logger.info("提取题目目标: %r | 模式: %s | tiles: %d", target, mode, len(tiles))

        for attempt in range(max_retries + 1):
            try:
                if mode == "tile":
                    result = self._solve_tile_mode(target, tiles)
                else:
                    result = self._solve_grid_mode(target, tiles)
                if result["success"] or attempt >= max_retries:
                    return result
                logger.warning("第 %d 次求解失败，重试...", attempt + 1)
            except Exception as e:
                logger.warning("第 %d 次求解异常: %s", attempt + 1, e)
                if attempt >= max_retries:
                    return {
                        "success": False,
                        "tiles": [],
                        "details": {},
                        "error": f"求解异常: {e}",
                    }
        # 理论上不可达，防御
        return {"success": False, "tiles": [], "details": {}, "error": "未知求解失败"}

    # ------------------------------------------------------------------
    # grid 模式: 拼大图一次求解
    # ------------------------------------------------------------------
    def _solve_grid_mode(self, target: str, tiles: List[bytes]) -> dict:
        grid_img = _compose_grid(tiles, cols=DEFAULT_GRID, with_labels=True)
        text = (
            "You are solving a Google reCAPTCHA image challenge. "
            "The image is a 3x3 grid of 9 tiles, numbered 1 to 9 in reading order "
            "(top-left is 1, bottom-right is 9); the number is drawn as a small corner label "
            "in each tile. "
            f"Select every tile that shows: {target}. "
            "Reply with ONLY a JSON array of the tile numbers, e.g. [2,5,8]. "
            "If none of the tiles match, reply with [] ."
        )
        raw = self.provider.chat(text, images=[grid_img])
        tiles_1based = _parse_tiles_response(raw, max_idx=DEFAULT_GRID * DEFAULT_GRID)
        tiles_0based = [i - 1 for i in tiles_1based]
        return {
            "success": True,
            "tiles": tiles_0based,
            "details": {"raw": raw, "mode": "grid", "target": target},
            "error": "",
        }

    # ------------------------------------------------------------------
    # tile 模式: 逐张询问聚合
    # ------------------------------------------------------------------
    def _solve_tile_mode(self, target: str, tiles: List[bytes]) -> dict:
        hits: List[int] = []
        for idx, tile_bytes in enumerate(tiles):
            text = (
                "Does the object in this image belong to the category: "
                f"\"{target}\"? Reply with only YES or NO."
            )
            try:
                raw = self.provider.chat(text, images=[tile_bytes]).strip().upper()
                if "YES" in raw[:10]:
                    hits.append(idx)
            except Exception as e:
                logger.warning("tile %d 求解失败: %s", idx, e)
        return {
            "success": True,
            "tiles": hits,
            "details": {"mode": "tile", "target": target},
            "error": "",
        }


# ===========================================================================
# 辅助函数
# ===========================================================================

_TARGET_KEYWORDS = [
    "taxis", "taxi", "buses", "bus", "cars", "car", "trucks", "truck",
    "crosswalks", "crosswalk", "traffic lights", "traffic light",
    "fire hydrants", "fire hydrant", "hydrants", "hydrant", "bicycles",
    "bicycle", "motorcycles", "motorcycle", "boats", "boat", "trains",
    "train", "airplanes", "airplane", "chimneys", "chimney",
    "stairs", "staircases", "staircase", "vehicles", "buses",
]


def _extract_target(prompt: str) -> str:
    """
    从英文题目文本提取目标名词短语。

    策略: 去掉 "Select all images with / with / that contain" 等前缀，
    去掉句末标点。目标一般为题目里最后一个有意义的短语，
    例如 "Select all images with taxis" → "taxis"。
    识别失败时回退为去除指令前缀后的整体文本。
    """
    text = (prompt or "").strip().rstrip(".!?")
    for prefix in ("select all images with", "select all squares with", "select all images of"):
        if text.lower().startswith(prefix):
            text = text[len(prefix):].strip()
            break
    # 回退: 去掉常见引导词
    for lead in ("with", "of"):
        if text.lower().startswith(lead):
            text = text[len(lead):].strip()
            break
    if not text:
        return prompt or ""
    return text


def _compose_grid(
    tiles: List[bytes],
    cols: int = DEFAULT_GRID,
    tile_size: int = 256,
    with_labels: bool = True,
) -> bytes:
    """
    把多张 tile 拼成 cols x cols 网格大图，可选在每格左上角绘制编号角标。

    不足 cols*cols 张时用白底补足（调用方已保证最多 9 张）。
    """
    total = cols * cols
    padded = list(tiles)
    while len(padded) < total:
        padded.append(_blank_tile(tile_size))

    cell = tile_size
    canvas = Image.new("RGB", (cols * cell, cols * cell), "white")

    for i, tile_bytes in enumerate(padded[:total]):
        row, col = divmod(i, cols)
        try:
            img = Image.open(BytesIO(tile_bytes)).convert("RGB")
            img = img.resize((cell, cell), Image.LANCZOS)
        except Exception:
            img = _blank_tile(cell)

        if with_labels:
            # 编号角标直接画在 tile 上（不透明深色底 + 白字，尺寸小不影响内容）
            d = ImageDraw.Draw(img)
            d.rectangle([0, 0, 27, 25], fill=(20, 20, 20))
            d.text((9, 4), str(i + 1), fill="white")

        canvas.paste(img, (col * cell, row * cell))

    buf = BytesIO()
    canvas.save(buf, format="PNG")
    return buf.getvalue()


def _blank_tile(size: int) -> bytes:
    img = Image.new("RGB", (size, size), "white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _parse_tiles_response(raw: str, max_idx: int = 9) -> List[int]:
    """
    从模型回复中解析 1-based 格子编号列表。

    兼容多种输出形态:
      "[2, 5, 8]"      → [2,5,8]
      "[]" / "None"    → []
      "[1,2,2,3]"      → 去重 [1,2,3]
      "答案是 [4]"     → 提取 [] 子串
    越界编号剔除。
    """
    if not raw:
        return []
    m = re.search(r"\[([^\]]*)\]", raw)
    if not m:
        return []
    inner = m.group(1).strip()
    if not inner:
        return []
    nums = []
    for token in re.split(r"[,\s]+", inner):
        token = token.strip()
        if not token.isdigit():
            continue
        n = int(token)
        if 1 <= n <= max_idx and n not in nums:
            nums.append(n)
    return nums
