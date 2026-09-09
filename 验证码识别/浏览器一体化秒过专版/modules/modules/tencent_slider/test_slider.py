"""
腾讯滑块与通用滑块 独立单元测试
"""
import unittest
from playwright.sync_api import sync_playwright
from .solver import TencentSliderSolver


class TestSlider(unittest.TestCase):
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

    def test_slider_drag_and_pass(self):
        self.page.set_content('''
            <div class="tencent-captcha-dy__image-area" style="width:330px;height:190px;background:gray"></div>
            <div class="tencent-captcha-dy__slider-block" style="width:60px;height:45px;background:blue"></div>
            <script>
                let start;
                const b = document.querySelector('.tencent-captcha-dy__slider-block');
                b.onmousedown = e => start = e.clientX;
                document.onmouseup = e => {
                    if (Math.abs(e.clientX - start - 130) < 5) {
                        b.classList.add('tencent-captcha-dy__slider-block--success');
                    }
                };
            </script>
        ''')
        solver = TencentSliderSolver()
        # Mock gap distance to exactly 130px
        solver.find_gap_opencv = lambda img, w: 130.0
        self.assertEqual(solver.solve(self.page), "widget_passed")


if __name__ == "__main__":
    unittest.main()
