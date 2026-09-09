"""
算术验证码 独立单元测试
"""
import io
import unittest
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright
from .solver import MathCaptchaSolver


class TestMath(unittest.TestCase):
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

    def test_math_solve_and_input(self):
        self.page.set_content('''
            <div id="captcha" style="width:100px;height:40px;background:white"></div>
            <input id="ans" type="text" />
        ''')
        solver = MathCaptchaSolver()
        # Mock solve_image directly to return 42
        solver.solve_image = lambda img: 42

        state = solver.solve(self.page, "#captcha", "#ans")
        self.assertEqual(state, "answer_entered")
        val = self.page.locator("#ans").input_value()
        self.assertEqual(val, "42")

    def test_math_expression_deduction(self):
        solver = MathCaptchaSolver()
        # Mock ddddocr classification returning "15+3=?"
        class DummyOCR:
            def classification(self, b):
                return "15+3="
        import ddddocr
        orig = ddddocr.DdddOcr
        ddddocr.DdddOcr = lambda *a, **k: DummyOCR()
        try:
            res = solver.solve_image(b"fake")
            self.assertEqual(res, 18)
        finally:
            ddddocr.DdddOcr = orig


if __name__ == "__main__":
    unittest.main()
