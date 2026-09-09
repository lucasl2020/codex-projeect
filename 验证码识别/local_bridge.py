"""
本地扩展专属 HTTP 桥接服务 (Local Captcha Bridge)
- 监听 127.0.0.1:8765
- 接收来自 Chrome 扩展的前端求解请求
- 调用 modules/ 下的离线视觉大模型求解器并返回坐标与结果
- 纯 Python 标准库编写，无第三方 Web 框架依赖
"""
import base64
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

from modules.google_recaptcha.solver import RecaptchaSolver
from modules.hcaptcha.solver import HcaptchaSolver

recaptcha_solver = RecaptchaSolver(model="qwen3-vl:4b")
hcaptcha_solver = HcaptchaSolver(model="qwen3-vl:4b")


class BridgeHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        url_path = urlsplit(self.path).path
        if url_path in ("/health", "/"):
            status = {"status": "ok", "model": "qwen3-vl:4b", "version": "1.0.0"}
            try:
                import urllib.request
                with urllib.request.urlopen("http://127.0.0.1:11434/api/version", timeout=2) as resp:
                    status["ollama"] = "online"
            except Exception:
                status["ollama"] = "offline"

            body = json.dumps(status, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        url_path = urlsplit(self.path).path
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        try:
            req_data = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception as exc:
            self._send_error(400, f"JSON解析错误: {exc}")
            return

        try:
            if url_path == "/solve_recaptcha":
                prompt = req_data.get("prompt", "")
                images_b64 = req_data.get("images", [])
                images_bytes = [base64.b64decode(b.split(",")[-1]) for b in images_b64]
                selected = recaptcha_solver.ask_grid(prompt, images_bytes)
                self._send_json({"status": "success", "selected": selected})

            elif url_path == "/solve_hcaptcha":
                prompt = req_data.get("prompt", "")
                image_b64 = req_data.get("image", "")
                img_bytes = base64.b64decode(image_b64.split(",")[-1])
                kind, points = hcaptcha_solver.ask_action(prompt, img_bytes)
                self._send_json({"status": "success", "kind": kind, "points": points})

            elif url_path == "/solve_hcaptcha_grid":
                prompt = req_data.get("prompt", "")
                images_b64 = req_data.get("images", [])
                images_bytes = [base64.b64decode(b.split(",")[-1]) for b in images_b64]
                selected = hcaptcha_solver.ask_grid(prompt, images_bytes)
                self._send_json({"status": "success", "selected": selected})

            else:
                self._send_error(404, "未知接口")

        except Exception as exc:
            print(f"[Bridge] 求解发生异常: {exc}", file=sys.stderr)
            self._send_error(500, str(exc))

    def _send_json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, code, message):
        body = json.dumps({"status": "error", "message": message}, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        # 简化日志输出，避免终端刷屏
        sys.stdout.write(f"[Bridge] {self.address_string()} - {format % args}\n")
        sys.stdout.flush()


def run_server(host="127.0.0.1", port=8765):
    server = ThreadingHTTPServer((host, port), BridgeHandler)
    print(f"=====================================================")
    print(f"  本地验证码扩展桥接服务已启动: http://{host}:{port}")
    print(f"  对接离线大模型: qwen3-vl:4b (http://127.0.0.1:11434)")
    print(f"=====================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务正在关闭...")
        server.server_close()


if __name__ == "__main__":
    run_server()
