#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
旋转验证码求解器回归测试。

生成含明显水平/垂直结构的测试图，按不同角度旋转后，
验证 RotateCaptchaSolver 能否正确估算转正角度。
"""
import sys
import os
from io import BytesIO

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "cf_captcha_solver_pkg"))

from PIL import Image, ImageDraw
from cf_captcha_solver import RotateCaptchaSolver


def make_image(angle=0):
    """生成白底 + 水平/垂直网格线的测试图，并按角度旋转（PIL 逆时针为正）"""
    img = Image.new("L", (200, 200), 255)
    d = ImageDraw.Draw(img)
    for y in (60, 100, 140):
        d.line([(40, y), (160, y)], fill=0, width=5)
    for x in (60, 100, 140):
        d.line([(x, 40), (160, 40)], fill=0, width=5)
        d.line([(x, 40), (x, 160)], fill=0, width=5)
    if angle:
        img = img.rotate(angle, fillcolor=255)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def main():
    solver = RotateCaptchaSolver()
    cases = [(0, 0), (30, 30), (90, 90), (-30, -30), (15, 15)]
    failed = 0
    for angle, expected in cases:
        data = make_image(angle)
        r = solver.solve(data)
        got = r.answer
        # 转正角度模 180 等价（转 180° 与不转同向），用最小圆角差判断
        diff = abs(got - expected) % 180
        ok = r.success and min(diff, 180 - diff) <= 5
        if not ok:
            failed += 1
        print(
            f"旋转 {angle:>4}° 期望 {expected:>4}° -> "
            f"success={r.success} answer={got} main_angle={r.details.get('main_angle')} "
            f"{'OK' if ok else 'FAIL'}"
        )
    print("=" * 50)
    print("通过" if failed == 0 else f"{failed} 个用例失败")


if __name__ == "__main__":
    main()
