#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GeeTest 浏览器内自动化求解器纯逻辑回归测试。

覆盖不依赖真实浏览器的部分：缺口距离缩放换算、轨迹重缩放、
拟人轨迹总位移。DOM 定位与拖动执行需真实 GeeTest v4 站点联调。
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "cf_captcha_solver_pkg"))

from cf_captcha_solver import GeeTestBrowserSolver, SlideCaptchaSolver


def test_scale_distance():
    s = GeeTestBrowserSolver.scale_distance
    assert s(150, 300, 260) == 130.0, s(150, 300, 260)
    assert s(100, 0, 260) == 100, "canvas_width=0 应原样返回"
    assert s(100, 300, 0) == 100, "track_width=0 应原样返回"
    assert s(0, 300, 260) == 0, "距离 0 应返回 0"
    print("scale_distance OK")


def test_rescale_track():
    track = [
        {"x": 10, "y": 0, "time_ms": 20},
        {"x": 20, "y": 0, "time_ms": 20},
    ]
    scaled = GeeTestBrowserSolver._rescale_track(track, 30, 60)
    total = sum(s["x"] for s in scaled)
    assert abs(total - 60) < 1e-6, f"缩放后总位移 {total} 应 ≈ 60"
    # time_ms 应保留
    assert all(s["time_ms"] == 20 for s in scaled)
    print("_rescale_track OK", scaled)


def test_generate_track():
    sl = SlideCaptchaSolver()
    track = sl._generate_track(100)
    total = sum(s["x"] for s in track)
    assert abs(total - 100) < 5, f"轨迹总位移 {total} 应 ≈ 100"
    print(f"_generate_track total ≈ 100（实际 {total:.2f}，{len(track)} 步）")


def main():
    test_scale_distance()
    test_rescale_track()
    test_generate_track()
    print("=" * 50)
    print("全部通过")


if __name__ == "__main__":
    main()
