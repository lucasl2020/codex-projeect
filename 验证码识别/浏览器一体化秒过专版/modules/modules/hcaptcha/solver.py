"""
hCaptcha 独立求解器模块
- 支持 3D WebGL 画布拖拽/补全、多目标点击、九宫格选图
- 具备平滑贝塞尔曲线拟人拖动与自然松开时延
- 智能防误触“跳过”按钮，自动推进连续多轮挑战
- 纯本地运行，不依赖云端打码平台
"""
import base64
import hashlib
import io
import json
import math
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urlsplit
from PIL import Image, ImageDraw


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


def provider_frame(frame, domain="hcaptcha.com"):
    host = urlsplit(frame.url).hostname or ""
    return host == domain or host.endswith("." + domain)


def token_present(page, name="h-captcha-response"):
    return page.locator(f'[name="{name}"]').evaluate_all(
        "els => els.some(el => typeof el.value === 'string' && el.value.length > 10)"
    )


def drag(page, start, end):
    """生成平滑三次贝塞尔加减速鼠标拖动轨迹。"""
    page.mouse.move(*start)
    page.wait_for_timeout(100)
    page.mouse.down()
    page.wait_for_timeout(120)
    try:
        steps = 35
        for step in range(1, steps):
            t = step / float(steps - 1)
            t = t * t * (3 - 2 * t)
            page.mouse.move(
                start[0] + (end[0] - start[0]) * t,
                start[1] + (end[1] - start[1]) * t,
            )
            page.wait_for_timeout(15)
        page.wait_for_timeout(150)
    finally:
        page.mouse.up()
        page.wait_for_timeout(100)


def apply_action(page, region, kind, points):
    bounds = region.bounding_box()
    coords = [
        (bounds["x"] + x * bounds["width"] / 1000, bounds["y"] + y * bounds["height"] / 1000)
        for x, y in points
    ]
    if kind == "drag":
        drag(page, *coords)
    else:
        for x, y in coords:
            page.mouse.click(x, y)
            page.wait_for_timeout(200)


class HcaptchaSolver:
    def __init__(self, model="qwen3-vl:4b", base_url="http://127.0.0.1:11434"):
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout = 120

    def ask_action(self, prompt, image_bytes):
        """调用本地模型预测画布操作 (drag 或 click) 及坐标。"""
        schema = {
            "type": "object",
            "properties": {
                "kind": {"type": "string", "enum": ["click", "drag"]},
                "points": {
                    "type": "array",
                    "items": {"type": "array", "items": {"type": "number"}, "minItems": 2, "maxItems": 2},
                },
            },
            "required": ["kind", "points"],
            "additionalProperties": False,
        }
        task_instruction = (
            "Solve this hCaptcha visual challenge carefully.\n"
            "Return normalized coordinates from 0 to 1000 relative to THIS image [x, y].\n"
            "- If the task mentions placing, dragging, moving, or completing gaps "
            "(e.g. 放置, 移动, 拖动, 补全, 缺口, drag, place, move), kind MUST be 'drag'. "
            "For drag, return exactly two points [[start_x, start_y], [destination_x, destination_y]]: "
            "where start is the center of the movable piece to drag, and destination is the matching target slot.\n"
            "- If the task asks to click or select targets (e.g. 点击, 找出, 选择), "
            "kind is 'click', points MUST be a non-empty list of target centers [[x1, y1], [x2, y2], ...]. Always return >=1 point.\n"
            "- Do not include submit, skip, or refresh buttons.\n"
            f"Task: {prompt}"
        )
        payload = {
            "model": self.model,
            "stream": False,
            "messages": [{
                "role": "user",
                "content": task_instruction,
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
        content = data.get("message", {}).get("content", "").strip()
        parsed = json.loads(content)
        kind, points = parsed.get("kind"), parsed.get("points")
        if (kind == "drag" and len(points) == 2) or (kind == "click" and len(points) >= 1):
            return kind, points
        raise ValueError(f"模型返回的动作格式不符合要求: {parsed}")

    def ask_grid(self, prompt, images):
        """九宫格选图。"""
        canvas = Image.new("RGB", (480, math.ceil(len(images) / 3) * 180), "white")
        draw = ImageDraw.Draw(canvas)
        for i, data in enumerate(images):
            tile = Image.open(io.BytesIO(data)).convert("RGB")
            tile.thumbnail((156, 152))
            x, y = (i % 3) * 160, (i // 3) * 180
            canvas.paste(tile, (x, y + 24))
            draw.text((x + 5, y + 4), str(i + 1), fill="black")
        out = io.BytesIO()
        canvas.save(out, format="PNG")
        schema = {
            "type": "object",
            "properties": {"selected": {"type": "array", "items": {"type": "integer"}}},
            "required": ["selected"],
            "additionalProperties": False,
        }
        payload = {
            "model": self.model,
            "stream": False,
            "messages": [{
                "role": "user",
                "content": (
                    f"Solve image selection puzzle: '{prompt}'. "
                    f"Labels above tiles are 1-based indices (1 to {len(images)}). "
                    "Return selected indices, or [] if none match."
                ),
                "images": [base64.b64encode(out.getvalue()).decode("ascii")],
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
        return [i - 1 for i in parsed.get("selected", []) if 1 <= i <= len(images)]

    def solve(self, page):
        """执行单步探测或动作求解。"""
        if token_present(page, "h-captcha-response"):
            return "widget_passed"

        frames = [f for f in page.frames if provider_frame(f, "hcaptcha.com")]
        if not frames:
            return "not_found"

        # 1. 传统九宫格选图题
        for frame in frames:
            tiles = [t for t in frame.locator(".task-image").all() if t.is_visible()]
            if tiles:
                prompt = visible(frame, ".prompt-text")
                if prompt is None:
                    return "unsupported"
                prompt_text = prompt.inner_text().strip()
                images = [t.screenshot(animations="disabled") for t in tiles]
                try:
                    selected = self.ask_grid(prompt_text, images)
                except Exception as exc:
                    _log(f"[hCaptcha] 九宫格模型分析异常 ({exc})，等待重试")
                    return "attempted"
                for i in selected:
                    if i < len(tiles):
                        tiles[i].click()
                submit = visible(frame, ".button-submit")
                if submit:
                    submit.click()
                    page.wait_for_timeout(1200)
                return "widget_passed" if token_present(page, "h-captcha-response") else "attempted"

        # 2. 画布类题目（3D 拖拽拼图 / 局部遮挡文字点击 / 动态交互）
        for frame in frames:
            prompt = visible(frame, ".prompt-text")
            if prompt is not None:
                canvas = visible(frame, ".challenge-view canvas, canvas")
                if canvas is None:
                    return "loading"
                prompt_text = prompt.inner_text().strip()
                try:
                    picture = canvas.screenshot(animations="disabled", timeout=4000)
                except Exception:
                    return "challenge_changed"
                try:
                    kind, points = self.ask_action(prompt_text, picture)
                except Exception as exc:
                    _log(f"[hCaptcha] 视觉模型动作解析异常 ({exc})，等待重试")
                    return "attempted"

                _log(f"[hCaptcha] 题目: {prompt_text} | 预测动作: {kind}, 坐标: {points}")
                current_prompt = visible(frame, ".prompt-text")
                if current_prompt is None or current_prompt.inner_text().strip() != prompt_text:
                    _log("[hCaptcha] 题目已刷新，放弃本轮提交")
                    return "challenge_changed"

                apply_action(page, canvas, kind, points)
                page.wait_for_timeout(800)

                submit = visible(frame, ".button-submit")
                if submit is None:
                    return "loading"
                submit_text = submit.inner_text().strip()
                for _ in range(8):
                    submit_text = submit.inner_text().strip()
                    if submit_text not in ("跳过", "Skip"):
                        break
                    page.wait_for_timeout(250)
                _log(f"[hCaptcha] 按钮当前文本: {submit_text}")
                if submit_text in ("跳过", "Skip"):
                    _log("[hCaptcha] 按钮仍为'跳过'，未点击提交，等待下一次识别")
                    return "attempted"

                submit.click()
                page.wait_for_timeout(1500)
                passed = token_present(page, "h-captcha-response")
                _log(f"[hCaptcha] 提交后 token 状态: {'已获得' if passed else '未生成'}")
                return "widget_passed" if passed else "attempted"

        # 3. 点击复选框启动挑战
        for frame in frames:
            checkbox = visible(frame, "#checkbox")
            if checkbox is not None:
                checkbox.click()
                page.wait_for_timeout(1000)
                return "opened"

        return "loading"
