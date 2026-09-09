#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
recaptcha_vlm 回归测试 / 自测脚本
=================================

用法:
    # 1) 无 API key 时的离线自测（用假响应验证拼接/解析/管道）
    python test_recaptcha_vlm.py --mock

    # 2) 有 API key 后的真实识别测试（config.json 填入 key 后执行）
    python test_recaptcha_vlm.py --real --target red
    #    会生成一张 3x3 测试网格（第 3/5 格为红色块），真实调用 VLM，
    #    期望 tiles 包含 [2, 4]（0-based）

    # 3) 用任意本地图片测试（整图按 3x3 语义）
    python test_recaptcha_vlm.py --image D:/xx/challenge.png --prompt "Select all images with taxis"
"""

import argparse
import io
import os
import sys
import unittest
from typing import List

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ===========================================================================
# 测试数据生成
# ===========================================================================

def _solid_tile(color: str, size: int = 128) -> bytes:
    img = Image.new("RGB", (size, size), color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def make_grid_tiles(target_color: str = "red", size: int = 128) -> List[bytes]:
    """生成 9 张 tile，其中第 3 张(索引2)和第 5 张(索引4)为目标色块，其余灰色。"""
    tiles = []
    for i in range(9):
        if i in (2, 4):
            tiles.append(_solid_tile(target_color, size))
        else:
            tiles.append(_solid_tile("gray", size))
    return tiles


# ===========================================================================
# 单元测试（纯离线，不依赖 API key）
# ===========================================================================

class TestGridTools(unittest.TestCase):
    """测试拼接与解析等纯逻辑"""

    def test_extract_target(self):
        from recaptcha_vlm.solver import _extract_target
        self.assertEqual(_extract_target("Select all images with taxis"), "taxis")
        self.assertEqual(_extract_target("Select all squares with traffic lights"), "traffic lights")
        self.assertEqual(_extract_target("Select all images of buses."), "buses")
        self.assertEqual(_extract_target("foo bar"), "foo bar")

    def test_parse_tiles_response(self):
        from recaptcha_vlm.solver import _parse_tiles_response
        self.assertEqual(_parse_tiles_response("[2, 5, 8]"), [2, 5, 8])
        self.assertEqual(_parse_tiles_response("[]"), [])
        self.assertEqual(_parse_tiles_response("None"), [])
        self.assertEqual(_parse_tiles_response("答案是 [4]"), [4])
        self.assertEqual(_parse_tiles_response("[1,1,2,3]"), [1, 2, 3])   # 去重
        self.assertEqual(_parse_tiles_response("[0,9,10]"), [9])          # 越界剔除
        self.assertEqual(_parse_tiles_response("no tiles match"), [])

    def test_compose_grid_shape(self):
        from recaptcha_vlm.solver import _compose_grid
        tiles = make_grid_tiles()
        png = _compose_grid(tiles)
        img = Image.open(io.BytesIO(png))
        self.assertEqual(img.size, (256 * 3, 256 * 3))

    def test_compose_grid_padding(self):
        """不足 9 张自动补白，不应抛异常"""
        from recaptcha_vlm.solver import _compose_grid
        png = _compose_grid(make_grid_tiles()[:5])
        self.assertIsInstance(png, bytes)
        self.assertTrue(len(png) > 0)


class TestSolverMock(unittest.TestCase):
    """注入假 provider，验证 solver 主流程（不调真实 API）"""

    def test_grid_mode_ok(self):
        from recaptcha_vlm.solver import RecaptchaVlmSolver
        solver = RecaptchaVlmSolver.__new__(RecaptchaVlmSolver)
        solver.provider = _FakeProvider("[3, 5]")
        solver.solve_cfg = {"mode": "grid", "max_retries": 1}

        result = solver.solve("Select all images with taxis", make_grid_tiles())
        self.assertTrue(result["success"])
        self.assertEqual(result["tiles"], [2, 4])   # 1-based [3,5] -> 0-based [2,4]

    def test_tile_mode_ok(self):
        from recaptcha_vlm.solver import RecaptchaVlmSolver
        solver = RecaptchaVlmSolver.__new__(RecaptchaVlmSolver)
        solver.provider = _TileFakeProvider(hits={2, 4})
        solver.solve_cfg = {"mode": "tile", "max_retries": 1}

        result = solver.solve("Select all images with taxis", make_grid_tiles(), mode="tile")
        self.assertTrue(result["success"])
        self.assertEqual(sorted(result["tiles"]), [2, 4])

    def test_empty_tiles(self):
        from recaptcha_vlm.solver import RecaptchaVlmSolver
        solver = RecaptchaVlmSolver.__new__(RecaptchaVlmSolver)
        solver.provider = _FakeProvider("[]")
        solver.solve_cfg = {"mode": "grid", "max_retries": 1}
        result = solver.solve("Select all images with taxis", [])
        self.assertFalse(result["success"])


class _FakeProvider:
    """固定文本响应的假 provider"""

    def __init__(self, reply: str):
        self.reply = reply
        self.config = type("C", (), {"model": "fake", "ready": True})()
        self.calls = 0

    def chat(self, text, images=None, system="", temperature=0.1):
        self.calls += 1
        return self.reply


class _TileFakeProvider(_FakeProvider):
    """tile 模式下按索引回 YES/NO 的假 provider"""

    def __init__(self, hits: set):
        super().__init__("")
        self.hits = hits
        self.calls = 0

    def chat(self, text, images=None, system="", temperature=0.1):
        self.calls += 1
        return "YES" if self.calls - 1 in self.hits else "NO"


# ===========================================================================
# 真实 API 冒烟（需 config.json 已填 api_key）
# ===========================================================================

def real_smoke(target: str = "red"):
    from recaptcha_vlm.solver import RecaptchaVlmSolver
    solver = RecaptchaVlmSolver()
    if not solver.provider.config.ready:
        print("[REAL] 未配置 api_key，跳过真实调用。请先编辑 config.json 填入 key。")
        return 1

    tiles = make_grid_tiles("red")
    print(f"[REAL] 发送测试网格（期望命中 0-based 索引 [2, 4]）...")
    result = solver.solve(f"Select all images with red", tiles, mode="grid")
    print(f"[REAL] success={result['success']} tiles={result['tiles']} "
          f"expected=[2, 4] raw={result['details'].get('raw', '')[:120]}")
    if result["success"] and set(result["tiles"]) == {2, 4}:
        print("[REAL] PASS: VLM 识别正确")
        return 0
    print("[REAL] FAIL: 识别结果与期望不符（免费模型语义误差属正常，可换付费档 glm-4.6v 再试）")
    return 2


def image_smoke(image_path: str, prompt: str):
    from recaptcha_vlm.solver import RecaptchaVlmSolver
    solver = RecaptchaVlmSolver()
    if not solver.provider.config.ready:
        print("[IMG] 未配置 api_key，跳过真实调用。")
        return 1
    with open(image_path, "rb") as f:
        data = f.read()
    # 整图走单图通道：需要提供 tiles；这里用整图直接询问需要 grid_image 语义，
    # 简化：直接把整图作为"单 tile 大图"发给 solver 的 grid_image 流程不可达（solver 只收 tiles），
    # 因此走 server._solve_single_image 等价逻辑。
    # 整图直接走 server._solve_single_image 等价逻辑
    from recaptcha_vlm import server as srv
    result = srv._solve_single_image(prompt, data, "")
    print(f"[IMG] prompt={prompt!r}")
    print(f"[IMG] success={result['success']} tiles={result['tiles']} raw={result['details'].get('raw', '')[:200]}")
    return 0 if result["success"] else 2


# ===========================================================================

def main():
    parser = argparse.ArgumentParser(description="recaptcha_vlm 测试")
    parser.add_argument("--mock", action="store_true", help="离线单测（无需 key）")
    parser.add_argument("--real", action="store_true", help="真实 API 冒烟（需 config 填 key）")
    parser.add_argument("--target", default="red", help="--real 测试的目标色")
    parser.add_argument("--image", default="", help="本地图片路径（整图 3x3 语义）")
    parser.add_argument("--prompt", default="Select all images with taxis", help="与 --image 搭配的题目")
    args = parser.parse_args()

    if args.mock:
        suite = unittest.TestLoader().loadTestsFromModule(sys.modules[__name__])
        runner = unittest.TextTestRunner(verbosity=2)
        return 0 if runner.run(suite).wasSuccessful() else 1

    if args.real:
        return real_smoke(args.target)

    if args.image:
        return image_smoke(args.image, args.prompt)

    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
