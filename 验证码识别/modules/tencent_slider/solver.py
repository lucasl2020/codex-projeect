"""
腾讯滑块与通用滑块拼图 独立求解器模块
- 采用 OpenCV 差分/连通域算法快速精准计算缺口位移
- 集成本地视觉模型 Qwen-VL 语义识别作为算法兜底
- 三次贝塞尔曲线加减速模拟人工拖拽轨迹
- 纯本地运算，无需调用任何第三方服务
"""
import base64
import json
import random
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urlsplit


def _log(msg):
    try:
        enc = getattr(sys.stdout, "encoding", "utf-8") or "utf-8"
        print(str(msg).encode(enc, errors="replace").decode(enc))
    except Exception:
        pass


def visible(root, selector):
    for element in root.locator(selector).all():
        if element.is_visible():
            return element
    return None


def drag(page, start, end):
    """带拟人微抖动的三次贝塞尔平滑拖拽。"""
    page.mouse.move(*start)
    page.wait_for_timeout(100)
    page.mouse.down()
    page.wait_for_timeout(120)
    try:
        steps = 35
        for step in range(1, steps):
            t = step / float(steps - 1)
            # 贝塞尔平滑缓动
            ease = t * t * (3 - 2 * t)
            cur_x = start[0] + (end[0] - start[0]) * ease
            # 添加微小的 Y 轴自然抖动
            cur_y = start[1] + (end[1] - start[1]) * ease + random.uniform(-1.0, 1.0)
            page.mouse.move(cur_x, cur_y)
            page.wait_for_timeout(12)
        page.wait_for_timeout(150)
    finally:
        page.mouse.up()
        page.wait_for_timeout(100)


class TencentSliderSolver:
    TENCENT_WRAPPER = ".tencent-captcha-dy__slider-type-wrap"

    def __init__(self, model="qwen3-vl:4b", base_url="http://127.0.0.1:11434"):
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout = 120

    def find_gap_opencv(self, image_bytes, bounds_width):
        """基于 OpenCV 局部对比度与连通域快速查找滑块缺口 X 坐标。"""
        try:
            import cv2
            import numpy as np
            img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
            if img is None:
                return None
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            H, W = gray.shape[:2]
            k = 101 if W > 500 else 51
            med = cv2.medianBlur(gray, k)
            diff = cv2.subtract(med, gray)
            _, mask = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
            n, labels, stats, cents = cv2.connectedComponentsWithStats(mask, 8)
            best = None
            for i in range(1, n):
                x, y, w, h, area = stats[i]
                if area < 800 or not (0.5 < w / h < 2.0):
                    continue
                if best is None or area > best[0]:
                    best = (area, x, y, w, h)
            if best is not None:
                _, bx, by, bw, bh = best
                cx = bx + bw / 2
                return cx * bounds_width / W
        except Exception as exc:
            _log(f"[Slider] OpenCV 缺口匹配失败 ({exc})，将回退至视觉模型")
        return None

    def find_gap_vlm(self, image_bytes, bounds_width):
        """本地视觉模型视觉兜底查找拼图缺口位置。"""
        schema = {
            "type": "object",
            "properties": {
                "kind": {"type": "string", "enum": ["drag"]},
                "points": {"type": "array", "items": {"type": "array", "items": {"type": "number"}, "minItems": 2, "maxItems": 2}},
            },
            "required": ["kind", "points"],
            "additionalProperties": False,
        }
        payload = {
            "model": self.model,
            "stream": False,
            "messages": [{
                "role": "user",
                "content": "拖动拼图块到匹配缺口。返回起点滑块中心和终点缺口中心归一化坐标 [[start_x, start_y], [dest_x, dest_y]] (0-1000)。",
                "images": [base64.b64encode(image_bytes).decode("ascii")],
            }],
            "format": schema,
            "options": {"temperature": 0.1},
        }
        req = urllib.request.Request(
            f"{self.base_url}/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        parsed = json.loads(data.get("message", {}).get("content", "").strip())
        points = parsed.get("points", [])
        if len(points) == 2:
            return (points[1][0] - points[0][0]) * bounds_width / 1000
        return None

    def solve(self, page, target_frame=None):
        """执行滑块识别与自动拖拽。"""
        frame = target_frame
        if frame is None:
            frame = next((f for f in page.frames if visible(f, self.TENCENT_WRAPPER) is not None), None)
            if frame is None:
                frame = page

        if visible(frame, ".tencent-captcha-dy__slider-block--success") is not None:
            return "widget_passed"

        region = visible(frame, ".tencent-captcha-dy__image-area, #slideBg, .slide-bg")
        button = visible(frame, ".tencent-captcha-dy__slider-block, #slideBlock, .slide-btn")
        if region is None or button is None:
            return "not_found"

        picture = region.screenshot(animations="disabled")
        bounds, handle = region.bounding_box(), button.bounding_box()

        # 1. 优先 OpenCV 毫秒级匹配
        dx = self.find_gap_opencv(picture, bounds["width"])

        # 2. 视觉大模型兜底
        if dx is None:
            _log("[Slider] 尝试本地视觉模型推理缺口...")
            dx = self.find_gap_vlm(picture, bounds["width"])

        if dx is None or not (0 < dx < bounds["width"] - handle["width"]):
            _log(f"[Slider] 计算位移超出有效范围: {dx}")
            return "unsupported"

        _log(f"[Slider] 计算得到滑动距离 dx = {dx:.1f}px，开始平滑拖拽...")
        start = (handle["x"] + handle["width"] / 2, handle["y"] + handle["height"] / 2)
        drag(page, start, (start[0] + dx, start[1]))
        page.wait_for_timeout(1200)

        passed = visible(frame, ".tencent-captcha-dy__slider-block--success") is not None
        return "widget_passed" if passed else "attempted"
