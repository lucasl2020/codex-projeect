"""
Google reCAPTCHA 独立单元测试
"""
import unittest
from types import SimpleNamespace
from playwright.sync_api import sync_playwright
from .solver import RecaptchaSolver


class TestGoogleRecaptcha(unittest.TestCase):
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

    def test_checkbox_immediate_pass(self):
        self.page.route("https://www.google.com/recaptcha/api2/anchor**", lambda route: route.fulfill(
            content_type="text/html",
            body='''<div id="recaptcha-anchor" style="width:30px;height:30px" onclick="parent.postMessage('passed','*')"></div>''',
        ))
        self.page.set_content('''
            <textarea name="g-recaptcha-response"></textarea>
            <script>window.onmessage=e=>{if(e.data==='passed')document.querySelector('textarea').value='recaptcha-token-ok';};</script>
            <iframe src="https://www.google.com/recaptcha/api2/anchor?k=test"></iframe>
        ''')
        self.page.frames[1].locator("#recaptcha-anchor").wait_for()
        solver = RecaptchaSolver()
        self.assertEqual(solver.solve(self.page), "widget_passed")

    def test_grid_submits_in_frame(self):
        self.page.route("https://www.google.com/recaptcha/api2/bframe**", lambda route: route.fulfill(
            content_type="text/html",
            body='''<div class="rc-imageselect-desc">Select all cars</div>
            <table><tr><td class="rc-imageselect-tile" style="width:50px;height:50px;background:red" onclick="window.chosen=true"></td></tr></table>
            <button id="recaptcha-verify-button" onclick="if(window.chosen)parent.postMessage('passed','*')">Verify</button>''',
        ))
        self.page.set_content('''
            <textarea name="g-recaptcha-response"></textarea>
            <script>window.onmessage=e=>{if(e.data==='passed')document.querySelector('textarea').value='recaptcha-grid-token-ok';};</script>
            <iframe src="https://www.google.com/recaptcha/api2/bframe?k=test"></iframe>
        ''')
        self.page.frames[1].locator(".rc-imageselect-tile").wait_for()
        solver = RecaptchaSolver()
        solver.ask_grid = lambda prompt, images: [0]
        self.assertEqual(solver.solve(self.page), "widget_passed")


if __name__ == "__main__":
    unittest.main()
