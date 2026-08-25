import importlib.util
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name('drission-attendance-json.py')
SPEC = importlib.util.spec_from_file_location('drission_attendance_json', MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class FakeButton:
    def __init__(self):
        self.calls = []
        self.text = '\u8bd5\u8bd5\u624b\u6c14'
        self.tag = 'button'

    def __bool__(self):
        return True

    def click(self, **kwargs):
        self.calls.append(kwargs)
        return True


class FakePage:
    def __init__(self, button):
        self.button = button
        self.locators = []

    def ele(self, locator, index=1, timeout=None):
        self.locators.append((locator, index, timeout))
        if locator == "xpath://button[normalize-space(.)='\u8bd5\u8bd5\u624b\u6c14']":
            return self.button
        return None


class FakeOptions:
    def __init__(self):
        self.calls = []

    def set_browser_path(self, value):
        self.calls.append(('browser', value))
        return self

    def headless(self, value):
        self.calls.append(('headless', value))
        return self

    def set_argument(self, value):
        self.calls.append(('argument', value))
        return self

    def set_user_data_path(self, value):
        self.calls.append(('profile', value))
        return self


class DrissionAttendanceTests(unittest.TestCase):
    def test_reads_homepage_total_and_ignores_attendance_reward(self):
        self.assertEqual(MODULE.extract_quota('\u9e21\u817f 559'), 559)
        self.assertIsNone(MODULE.extract_quota('\u4eca\u65e5\u7b7e\u5230\u83b7\u5f97\u9e21\u817f8\u4e2a\uff0c\u5f53\u524d\u6392\u540d\u7b2c532'))

    def test_today_reward_text_is_already_completed(self):
        self.assertTrue(MODULE.already_done('\u4eca\u65e5\u7b7e\u5230\u83b7\u5f97\u9e21\u817f8\u4e2a'))

    def test_configures_main_persistent_profile(self):
        options = FakeOptions()

        configured = MODULE.configure_chromium_options(options, 'chrome.exe', 'D:/profiles/main')

        self.assertIs(configured, options)
        self.assertIn(('profile', 'D:/profiles/main'), options.calls)

    def test_reports_blank_failed_navigation_as_network_error(self):
        error = MODULE.page_load_error(False, '\u65b0\u6807\u7b7e\u9875', '')

        self.assertIn('\u9875\u9762\u52a0\u8f7d\u5931\u8d25', error)
        self.assertIn('\u4e0d\u662f\u9a8c\u8bc1\u7801\u95ee\u9898', error)

    def test_recognizes_nodeseek_misspelled_network_error_page(self):
        error = MODULE.page_load_error(True, 'NodeSeek Network Error', 'Oops! Nework Error')

        self.assertIn('\u9875\u9762\u52a0\u8f7d\u5931\u8d25', error)

    def test_reports_empty_new_tab_as_network_error_even_without_false_result(self):
        error = MODULE.page_load_error(None, '\u65b0\u6807\u7b7e\u9875', '')

        self.assertIn('\u9875\u9762\u52a0\u8f7d\u5931\u8d25', error)

    def test_does_not_treat_normal_page_as_network_error(self):
        self.assertIsNone(MODULE.page_load_error(True, 'NodeSeek', '\u8bd5\u8bd5\u624b\u6c14'))

    def test_prefers_exact_random_button_instead_of_parent_div(self):
        button = FakeButton()
        page = FakePage(button)

        selected = MODULE.find_attendance_button(page)

        self.assertIs(selected, button)
        self.assertEqual(
            page.locators,
            [("xpath://button[normalize-space(.)='\u8bd5\u8bd5\u624b\u6c14']", 1, 0)],
        )

    def test_uses_one_native_element_click(self):
        button = FakeButton()

        self.assertTrue(MODULE.click_attendance_button(button))
        self.assertEqual(button.calls, [{'by_js': False, 'timeout': 5}])


if __name__ == '__main__':
    unittest.main()
