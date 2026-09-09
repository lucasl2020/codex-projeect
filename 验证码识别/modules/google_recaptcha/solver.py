"""
Google reCAPTCHA v2 / v3 独立求解器模块
- 支持检测并模拟点击复选框，尝试 No-CAPTCHA 直接通过（自动跳过）
- 支持九宫格/十六宫格图片语义切片识别，调用本地视觉大模型（Qwen-VL）作答
- 纯本地运行，不依赖云端打码平台
"""
import base64
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


def provider_frame(frame, domain):
    host = urlsplit(frame.url).hostname or ""
    return host == domain or host.endswith("." + domain)


def token_present(page, name="g-recaptcha-response"):
    return page.locator(f'[name="{name}"]').evaluate_all(
        "els => els.some(el => typeof el.value === 'string' && el.value.length > 10)"
    )


class RecaptchaSolver:
    def __init__(self, model="qwen3-vl:4b", base_url="http://127.0.0.1:11434"):
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout = 120

    def ask_grid(self, prompt, images):
        """将 N 张切片合并为网格并标注编号 1..N，由本地模型返回应点击的序号列表 (0-based)。"""
        if not images:
            return []
        cols = 3 if len(images) <= 9 else 4
        rows = math.ceil(len(images) / cols)
        tile_w, tile_h = 160, 160
        canvas = Image.new("RGB", (cols * tile_w, rows * (tile_h + 26)), "white")
        draw = ImageDraw.Draw(canvas)

        for i, data in enumerate(images):
            tile = Image.open(io.BytesIO(data)).convert("RGB")
            tile.thumbnail((tile_w - 4, tile_h - 4))
            c, r = i % cols, i // cols
            x, y = c * tile_w, r * (tile_h + 26)
            canvas.paste(tile, (x + 2, y + 24))
            draw.text((x + 6, y + 4), str(i + 1), fill="black")

        out = io.BytesIO()
        canvas.save(out, format="PNG")

        schema = {
            "type": "object",
            "properties": {
                "selected": {"type": "array", "items": {"type": "integer"}}
            },
            "required": ["selected"],
            "additionalProperties": False,
        }
        payload = {
            "model": self.model,
            "stream": False,
            "messages": [{
                "role": "user",
                "content": (
                    f"Solve the Google reCAPTCHA image selection challenge: '{prompt}'. "
                    f"The labels above the images are their 1-based indices (1 to {len(images)}). "
                    "Return the JSON object with the 'selected' field containing indices of all matching images. "
                    "If none match, return []."
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
        content = data.get("message", {}).get("content", "").strip()
        parsed = json.loads(content)
        selected = parsed.get("selected", [])
        return [idx - 1 for idx in selected if isinstance(idx, int) and 1 <= idx <= len(images)]

    def solve(self, page):
        """执行一次完整的 reCAPTCHA 探测与求解流程。"""
        if token_present(page, "g-recaptcha-response"):
            return "widget_passed"

        frames = [
            f for f in page.frames
            if (provider_frame(f, "google.com") or provider_frame(f, "recaptcha.net"))
            and "/recaptcha/" in f.url
        ]
        if not frames:
            return "not_found"

        # 1. 优先检查并处理图片选择挑战弹窗 (bframe)
        for frame in frames:
            desc = visible(frame, ".rc-imageselect-desc, .rc-imageselect-desc-no-canonical, .rc-imageselect-instructions, #rc-imageselect")
            tiles = [t for t in frame.locator("td.rc-imageselect-tile, .rc-image-tile-target, .task-image").all() if t.is_visible()]
            if desc is not None and tiles:
                prompt_text = desc.inner_text().strip().replace("\n", " ")
                _log(f"[reCAPTCHA] 检测到图片选择挑战: {prompt_text} (共 {len(tiles)} 格)")
                images = [t.screenshot(animations="disabled") for t in tiles]
                try:
                    selected = self.ask_grid(prompt_text, images)
                except Exception as exc:
                    _log(f"[reCAPTCHA] 模型分析异常 ({exc})，等待重试")
                    return "attempted"
                _log(f"[reCAPTCHA] 模型选择点击格子序号: {selected}")
                for i in selected:
                    if i < len(tiles):
                        tiles[i].click()
                        page.wait_for_timeout(200)
                verify_btn = visible(frame, "#recaptcha-verify-button, .button-submit")
                if verify_btn is not None:
                    verify_btn.click()
                    page.wait_for_timeout(1500)
                passed = token_present(page, "g-recaptcha-response")
                return "widget_passed" if passed else "attempted"

        # 2. 检查或模拟点击复选框 (anchor frame)
        for frame in frames:
            checkbox = visible(frame, "#recaptcha-anchor, .recaptcha-checkbox")
            if checkbox is not None:
                if checkbox.get_attribute("aria-checked") == "true" or visible(frame, ".recaptcha-checkbox-checked") is not None:
                    return "widget_passed"
                _log("[reCAPTCHA] 检测到谷歌复选框，模拟点击以尝试自动跳过...")
                try:
                    checkbox.click()
                except Exception:
                    pass
                page.wait_for_timeout(1500)
                if token_present(page, "g-recaptcha-response") or checkbox.get_attribute("aria-checked") == "true":
                    _log("[reCAPTCHA] 谷歌复选框直接通过 (No-CAPTCHA)！")
                    return "widget_passed"
                return "opened"

        return "loading"
