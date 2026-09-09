"""
Cloudflare Turnstile 独立单元测试
"""
import unittest
from playwright.sync_api import sync_playwright
from .solver import TurnstileSolver


class TestTurnstile(unittest.TestCase):
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

    def test_turnstile_checkbox_and_token(self):
        self.page.route("https://challenges.cloudflare.com/**", lambda route: route.fulfill(
            content_type="text/html",
            body='''<div class="ctp-checkbox-label" style="width:30px;height:30px" onclick="parent.postMessage('passed','*')"></div>''',
        ))
        self.page.set_content('''
            <textarea name="cf-turnstile-response"></textarea>
            <script>window.onmessage=e=>{if(e.data==='passed')document.querySelector('textarea').value='turnstile-token-passed';};</script>
            <iframe src="https://challenges.cloudflare.com/cdn-cgi/challenge-platform/test"></iframe>
        ''')
        self.page.frames[1].locator(".ctp-checkbox-label").wait_for()
        solver = TurnstileSolver()
        self.assertEqual(solver.solve(self.page), "widget_passed")


if __name__ == "__main__":
    unittest.main()
