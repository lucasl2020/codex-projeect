#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本地验证码类型复测（贴近真实场景）。

滑块改用 slide_comparison（前图+后图差异，与真实滑块一致）；
算术复查运算符；点选改文字点选。
"""
import sys
import os
import random
from io import BytesIO

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "cf_captcha_solver_pkg"))

from PIL import Image, ImageDraw, ImageFont
from cf_captcha_solver import MathCaptchaSolver, SlideComparisonSolver, ClickCaptchaSolver

FONT = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 34)


def make_math_image(expr):
    img = Image.new("RGB", (180, 60), "white")
    d = ImageDraw.Draw(img)
    d.text((8, 8), expr, font=FONT, fill="black")
    buf = BytesIO(); img.save(buf, format="PNG"); return buf.getvalue()


def make_slide_pair(gap_x=150, size=(300, 160)):
    """生成前图（完整）和后图（缺口），返回 (full_bytes, gap_bytes, gap_x)"""
    random.seed(7)
    full = Image.new("RGB", size, (220, 220, 220))
    d = ImageDraw.Draw(full)
    # 复杂纹理：色块 + 斜纹 + 少量噪点
    for i in range(0, size[0], 40):
        d.rectangle((i, 0, i + 20, size[1]), fill=(180 + (i // 40) % 3 * 20,) * 3)
    for i in range(0, size[1], 8):
        d.line([(0, i), (size[0], i)], fill=(200, 200, 200))
    for _ in range(80):
        d.point((random.randint(0, size[0] - 1), random.randint(0, size[1] - 1)), fill=(0, 0, 0))
    gap_h = 44
    gap_y = (size[1] - gap_h) // 2
    gap = full.copy()
    d2 = ImageDraw.Draw(gap)
    d2.rectangle((gap_x, gap_y, gap_x + gap_h, gap_y + gap_h), fill=(255, 255, 255))
    buf_f = BytesIO(); full.save(buf_f, format="PNG")
    buf_g = BytesIO(); gap.save(buf_g, format="PNG")
    return buf_f.getvalue(), buf_g.getvalue(), gap_x


def make_click_text_image():
    img = Image.new("RGB", (320, 120), "white")
    d = ImageDraw.Draw(img)
    d.text((30, 35), "星空", font=FONT, fill="black")
    d.text((140, 35), "大海", font=FONT, fill="black")
    d.text((250, 35), "草原", font=FONT, fill="black")
    buf = BytesIO(); img.save(buf, format="PNG"); return buf.getvalue()


def main():
    print("=== 算术（加/减/乘）===")
    for expr, expected in (("7+5=?", 12), ("12-7=?", 5), ("3*4=?", 12)):
        r = MathCaptchaSolver().solve(make_math_image(expr))
        ok = r.success and r.answer == expected
        print(f"  {expr} -> success={r.success} answer={r.answer} 期望={expected} {'OK' if ok else 'FAIL'}")

    print("=== 滑块（前图+后图差异）===")
    full, gap, gap_x = make_slide_pair(gap_x=150)
    r = SlideComparisonSolver().solve(full, gap)
    ok = r.success and abs(r.answer - gap_x) <= 10
    print(f"  缺口 x={gap_x} -> success={r.success} answer={r.answer} {'OK' if ok else 'FAIL'}")

    print("=== 文字点选（检测文字位置）===")
    r = ClickCaptchaSolver().solve_object_click(make_click_text_image(), None)
    print(f"  success={r.success} 检测到 {len(r.answer or [])} 个目标, 坐标={r.answer}")


if __name__ == "__main__":
    main()
