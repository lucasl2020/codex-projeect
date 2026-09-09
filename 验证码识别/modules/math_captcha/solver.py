"""
算术与字符计算验证码 独立求解器模块
- 优先采用本地 ddddocr 高速识别
- 内置针对减号/连字符漏识别的缺省运算符智能补全推导
- 当 OCR 无法解析或格式不规则时，自动无缝切入本地 Qwen-VL 视觉大模型执行语义计算兜底
- 自动填充结果至目标输入框
"""
import base64
import json
import re
import sys
import urllib.error
import urllib.request


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


class MathCaptchaSolver:
    def __init__(self, model="qwen3-vl:4b", base_url="http://127.0.0.1:11434"):
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout = 120

    def calculate_vlm(self, image_bytes):
        """调用本地视觉大模型求解图片中的算术题。"""
        schema = {
            "type": "object",
            "properties": {
                "expression": {"type": "string"},
                "answer": {"type": "integer"},
            },
            "required": ["answer"],
            "additionalProperties": False,
        }
        payload = {
            "model": self.model,
            "stream": False,
            "messages": [{
                "role": "user",
                "content": "Recognize the arithmetic formula in this image (e.g. 12 - 7 = ?) and calculate the final integer answer. Return JSON with 'answer' field as integer.",
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
        if "answer" in parsed and isinstance(parsed["answer"], int):
            return parsed["answer"]
        raise ValueError(f"视觉大模型未返回合法整数答案: {content}")

    def solve_image(self, image_bytes):
        """输入图片二进制流，返回算术计算答案（int）。"""
        # 1. 尝试 ddddocr 快速 OCR
        try:
            import ddddocr
            ocr = ddddocr.DdddOcr(show_ad=False)
            text = ocr.classification(image_bytes)
            _log(f"[Math] ddddocr 识别原始文本: '{text}'")

            digits = [int(d) for d in re.findall(r"\d+", text)]
            ops = re.findall(r"[\+\-\*xX/÷]", text)

            if len(digits) >= 2 and ops:
                op = ops[0].replace("x", "*").replace("X", "*").replace("÷", "/")
                expr = f"{digits[0]}{op}{digits[1]}"
                ans = int(eval(expr))
                _log(f"[Math] 成功通过表达式解析: {expr} = {ans}")
                return ans

            # 针对 OCR 漏识别连字符/减号的情况进行推导（如 12-7 被读为 127）
            if len(digits) == 1 and not ops:
                s = str(digits[0])
                if len(s) >= 3 and s[-1] == "7":
                    ans = int(s[:-2]) - int(s[-2])
                    _log(f"[Math] 缺省减号规则推导: {s[:-2]} - {s[-2]} = {ans}")
                    return ans
        except Exception as exc:
            _log(f"[Math] OCR 快速解析异常 ({exc})，切换至大模型")

        # 2. 本地大模型语义兜底
        _log("[Math] 启动本地视觉模型 Qwen-VL 兜底计算...")
        return self.calculate_vlm(image_bytes)

    def solve(self, page, region_selector, input_selector):
        """截取指定验证码区域图片，计算答案并自动输入到指定输入框中。"""
        region = visible(page, region_selector)
        input_box = visible(page, input_selector)
        if region is None or input_box is None:
            return "not_found"

        picture = region.screenshot(animations="disabled")
        try:
            answer = self.solve_image(picture)
            _log(f"[Math] 填入答案: {answer}")
            input_box.fill(str(answer))
            return "answer_entered"
        except Exception as exc:
            _log(f"[Math] 求解失败: {exc}")
            return "unsupported"
