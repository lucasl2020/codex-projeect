import json
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from .vision import LocalVision, validate_action, validate_indices


class ValidationTests(unittest.TestCase):
    def test_grid_indices(self):
        self.assertEqual(validate_indices([1, 9], 9), [0, 8])
        for value in ([0], [10], [True], [1, 1], [1.0], "1", None):
            with self.subTest(value=value), self.assertRaises(ValueError):
                validate_indices(value, 9)

    def test_coordinates(self):
        self.assertEqual(validate_action({"kind": "drag", "points": [[10, 20], [90, 20]]})[0], "drag")
        for points in ([[0, 1]], [[1001, 1]], [[float("nan"), 2]], [[True, 2]], [[]]):
            with self.subTest(points=points), self.assertRaises(ValueError):
                validate_action({"kind": "click", "points": points})
        with self.assertRaises(ValueError):
            validate_action({"kind": "drag", "points": [[1, 2]]})

    def test_cloud_names_rejected(self):
        for name in ("qwen3-vl:235b-cloud", "https://example.org/model", ""):
            with self.subTest(name=name), self.assertRaises(ValueError):
                LocalVision(name)

    def test_remote_model_alias_rejected(self):
        vision = LocalVision()
        with patch.object(vision, "request", return_value={"remote_host": "https://ollama.com", "capabilities": ["vision"]}):
            with self.assertRaises(ValueError):
                vision.check()

    def test_nonvision_model_rejected(self):
        vision = LocalVision()
        with patch.object(vision, "request", return_value={"capabilities": ["completion"]}):
            with self.assertRaises(ValueError):
                vision.check()

    def test_ollama_structured_thinking_compatibility(self):
        vision = LocalVision()
        vision.checked = True
        with patch.object(vision, "request", return_value={"done_reason": "stop", "message": {
            "content": "", "thinking": '{"kind":"click","points":[[200,300]]}'}}):
            self.assertEqual(vision.action("测试", b"image"), ("click", [[200, 300]]))
        with patch.object(vision, "request", return_value={"done_reason": "stop", "message": {
            "content": "", "thinking": '分析文字 {"kind":"click","points":[[200,300]]}'}}):
            with self.assertRaises(ValueError):
                vision.action("测试", b"image")


class BrowserTests(unittest.TestCase):
    """真实浏览器验证操作和结果判断；视觉答案用固定桩，不测识别率。"""
    @classmethod
    def setUpClass(cls):
        from playwright.sync_api import sync_playwright
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(headless=True, channel="chrome")

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.page = self.browser.new_page()
        self.page.set_default_timeout(1500)
        self.args = SimpleNamespace(wait=3, attempts=2, success_selector=None,
                                    region=None, kind="visual", prompt="点击圆点",
                                    submit=None, answer_input=None)

    def tearDown(self):
        self.page.close()

    def test_no_challenge_is_not_success(self):
        from .browser import run_page
        self.args.wait = 1
        self.page.set_content("<h1>普通页面</h1>")
        self.assertEqual(run_page(self.page, self.args, None)["status"], "not_found")

    def test_existing_success_is_distinct(self):
        from .browser import run_page
        self.page.set_content('<div id="ok">成功</div>')
        self.args.success_selector = "#ok"
        self.assertEqual(run_page(self.page, self.args, None)["status"], "already_satisfied")

    def test_click_and_site_submission(self):
        from .browser import run_page
        self.page.set_content('''<div id="puzzle" style="width:200px;height:100px;background:red"
            onclick="window.solved=true"></div><button id="submit"
            onclick="if(window.solved)document.querySelector('#ok').hidden=false">提交</button>
            <div id="ok" hidden>网站已确认</div>''')
        self.args.region, self.args.submit, self.args.success_selector = "#puzzle", "#submit", "#ok"
        vision = SimpleNamespace(action=lambda *a: ("click", [[500, 500]]))
        self.assertEqual(run_page(self.page, self.args, vision)["status"], "site_confirmed")

    def test_rejected_submission_is_not_success(self):
        from .browser import run_page
        self.page.set_content('<div id="puzzle" style="width:200px;height:100px;background:red"></div><button id="submit">提交</button>')
        self.args.region, self.args.submit, self.args.success_selector = "#puzzle", "#submit", "#ok"
        vision = SimpleNamespace(action=lambda *a: ("click", [[500, 500]]))
        self.assertEqual(run_page(self.page, self.args, vision)["status"], "submitted_unconfirmed")

    def test_refresh_discards_answer(self):
        from .browser import solve_region
        self.page.set_content('<div id="puzzle" style="width:200px;height:100px;background:red" onclick="window.clicked=true"></div>')
        self.args.region = "#puzzle"
        def answer(*args):
            self.page.locator("#puzzle").evaluate("e=>e.style.background='blue'")
            return "click", [[500, 500]]
        self.assertEqual(solve_region(self.page, self.args, SimpleNamespace(action=answer)), "challenge_changed")
        self.assertIsNone(self.page.evaluate("window.clicked"))

    def test_tencent_drag_and_pass(self):
        from .browser import solve_tencent
        self.page.set_content('''<div class="tencent-captcha-dy__image-area"
            style="width:330px;height:190px;background:gray"></div>
            <div class="tencent-captcha-dy__slider-block"
            style="width:60px;height:45px;background:blue"></div>
            <script>let start; const b=document.querySelector('.tencent-captcha-dy__slider-block');
            b.onmousedown=e=>start=e.clientX;
            document.onmouseup=e=>{if(Math.abs(e.clientX-start-132)<2)
                b.classList.add('tencent-captcha-dy__slider-block--success');};</script>''')
        vision = SimpleNamespace(action=lambda *a: ("drag", [[100, 500], [500, 500]]))
        self.assertEqual(solve_tencent(self.page, self.page, vision), "widget_passed")

    def test_hcaptcha_grid_submits_in_frame(self):
        from .browser import solve_hcaptcha
        self.page.route("https://local-test.hcaptcha.com/**", lambda route: route.fulfill(
            content_type="text/html", body='''<div class="prompt-text">选择红色</div>
            <div class="task-image" style="width:80px;height:80px;background:red" onclick="window.chosen=true"></div>
            <button class="button-submit" onclick="if(window.chosen)parent.postMessage('passed','*')">提交</button>'''))
        self.page.set_content('''<textarea name="h-captcha-response"></textarea>
            <script>window.onmessage=e=>{if(e.data==='passed')document.querySelector('textarea').value='a-test-token-long-enough';};</script>
            <iframe src="https://local-test.hcaptcha.com/test"></iframe>''')
        self.page.frames[1].locator(".task-image").wait_for()
        vision = SimpleNamespace(grid=lambda *a: [0])
        self.assertEqual(solve_hcaptcha(self.page, vision), "widget_passed")

    def test_hcaptcha_canvas_click_coordinates(self):
        from .browser import solve_hcaptcha
        self.page.route("https://local-test.hcaptcha.com/**", lambda route: route.fulfill(
            content_type="text/html", body='''<div class="prompt-text">点击中间</div>
            <div class="challenge-view"><canvas width="200" height="100"
            onclick="window.chosen=event.offsetX>95 && event.offsetX<105 && event.offsetY>45 && event.offsetY<55"></canvas></div>
            <button class="button-submit" onclick="if(window.chosen)parent.postMessage('passed','*')">提交</button>'''))
        self.page.set_content('''<textarea name="h-captcha-response"></textarea>
            <script>window.onmessage=e=>{if(e.data==='passed')document.querySelector('textarea').value='a-test-token-long-enough';};</script>
            <iframe style="margin-left:100px" src="https://local-test.hcaptcha.com/test"></iframe>''')
        self.page.frames[1].locator("canvas").wait_for()
        vision = SimpleNamespace(action=lambda *a: ("click", [[500, 500]]))
        self.assertEqual(solve_hcaptcha(self.page, vision), "widget_passed")

    def test_recaptcha_checkbox_immediate_pass(self):
        from .browser import solve_recaptcha
        self.page.route("https://www.google.com/recaptcha/api2/anchor**", lambda route: route.fulfill(
            content_type="text/html", body='''<div id="recaptcha-anchor" style="width:30px;height:30px" onclick="parent.postMessage('passed','*')"></div>'''))
        self.page.set_content('''<textarea name="g-recaptcha-response"></textarea>
            <script>window.onmessage=e=>{if(e.data==='passed')document.querySelector('textarea').value='recaptcha-test-token-valid';};</script>
            <iframe src="https://www.google.com/recaptcha/api2/anchor?k=test"></iframe>''')
        self.page.frames[1].locator("#recaptcha-anchor").wait_for()
        self.assertEqual(solve_recaptcha(self.page, None), "widget_passed")

    def test_recaptcha_grid_submits_in_frame(self):
        from .browser import solve_recaptcha
        self.page.route("https://www.google.com/recaptcha/api2/bframe**", lambda route: route.fulfill(
            content_type="text/html", body='''<div class="rc-imageselect-desc">Select all cars</div>
            <table><tr><td class="rc-imageselect-tile" style="width:60px;height:60px;background:green" onclick="window.chosen=true"></td></tr></table>
            <button id="recaptcha-verify-button" onclick="if(window.chosen)parent.postMessage('passed','*')">Verify</button>'''))
        self.page.set_content('''<textarea name="g-recaptcha-response"></textarea>
            <script>window.onmessage=e=>{if(e.data==='passed')document.querySelector('textarea').value='recaptcha-grid-token-valid';};</script>
            <iframe src="https://www.google.com/recaptcha/api2/bframe?k=test"></iframe>''')
        self.page.frames[1].locator(".rc-imageselect-tile").wait_for()
        vision = SimpleNamespace(grid=lambda *a: [0])
        self.assertEqual(solve_recaptcha(self.page, vision), "widget_passed")


if __name__ == "__main__":
    unittest.main()

