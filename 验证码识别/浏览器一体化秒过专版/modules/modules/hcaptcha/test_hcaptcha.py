"""
hCaptcha 独立单元测试
"""
import unittest
from playwright.sync_api import sync_playwright
from .solver import HcaptchaSolver


class TestHcaptcha(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(channel="chrome", headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.page = self.browser.new_page()

    def tearDown(self):
        self.page.close()

    def test_grid_submits_in_frame(self):
        self.page.route("https://local-test.hcaptcha.com/**", lambda route: route.fulfill(
            content_type="text/html",
            body='''<div class="prompt-text">选择红色</div>
            <div class="task-image" style="width:80px;height:80px;background:red" onclick="window.chosen=true"></div>
            <button class="button-submit" onclick="if(window.chosen)parent.postMessage('passed','*')">提交</button>''',
        ))
        self.page.set_content('''<textarea name="h-captcha-response"></textarea>
            <script>window.onmessage=e=>{if(e.data==='passed')document.querySelector('textarea').value='a-test-token-long-enough';};</script>
            <iframe src="https://local-test.hcaptcha.com/test"></iframe>''')
        self.page.frames[1].locator(".task-image").wait_for()
        solver = HcaptchaSolver()
        solver.ask_grid = lambda prompt, images: [0]
        self.assertEqual(solver.solve(self.page), "widget_passed")

    def test_canvas_click_coordinates(self):
        self.page.route("https://local-test.hcaptcha.com/**", lambda route: route.fulfill(
            content_type="text/html",
            body='''<div class="prompt-text">点击中间</div>
            <div class="challenge-view"><canvas width="200" height="100"
            onclick="window.chosen=event.offsetX>95 && event.offsetX<105 && event.offsetY>45 && event.offsetY<55"></canvas></div>
            <button class="button-submit" onclick="if(window.chosen)parent.postMessage('passed','*')">验证</button>''',
        ))
        self.page.set_content('''<textarea name="h-captcha-response"></textarea>
            <script>window.onmessage=e=>{if(e.data==='passed')document.querySelector('textarea').value='a-test-token-long-enough';};</script>
            <iframe style="margin-left:100px" src="https://local-test.hcaptcha.com/test"></iframe>''')
        self.page.frames[1].locator("canvas").wait_for()
        solver = HcaptchaSolver()
        solver.ask_action = lambda prompt, img: ("click", [[500, 500]])
        self.assertEqual(solver.solve(self.page), "widget_passed")


if __name__ == "__main__":
    unittest.main()
