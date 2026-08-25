from __future__ import annotations

import io
import sys
import types
import unittest
from unittest.mock import patch

from PIL import Image

from captcha_solver import CaptchaDetector, CaptchaSolver, CaptchaType, TextCaptchaSolver


def tiny_text_image() -> bytes:
    image = Image.new("RGB", (80, 30), "white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


class FakeOcr:
    instances = []

    def __init__(self, **kwargs):
        self.current_range = None
        self.range_calls = []
        self.classification_calls = []
        self._charset = list("0123456789ABCabc")
        type(self).instances.append(self)

    def get_charset(self):
        return self._charset.copy()

    def set_ranges(self, value):
        self.current_range = value
        self.range_calls.append(value)

    def classification(self, image, **kwargs):
        self.classification_calls.append((self.current_range, kwargs))
        return "A1"


class RangeSensitiveFakeOcr(FakeOcr):
    def classification(self, image, **kwargs):
        self.classification_calls.append((self.current_range, kwargs))
        if isinstance(self.current_range, list):
            return "A7b2"
        return "A72"


class CaptchaRegressionTests(unittest.TestCase):
    def test_public_solver_auto_detects_and_routes_small_text_image(self):
        FakeOcr.instances.clear()
        fake_module = types.SimpleNamespace(DdddOcr=FakeOcr)
        with patch.dict(sys.modules, {"ddddocr": fake_module}):
            result = CaptchaSolver().solve_image(tiny_text_image())

        self.assertTrue(result.success)
        self.assertEqual(result.captcha_type, CaptchaType.TEXT)

    def test_small_text_image_is_not_misclassified_as_slide(self):
        self.assertEqual(
            CaptchaDetector.detect_from_image(tiny_text_image()),
            CaptchaType.TEXT,
        )

    def test_charset_restriction_uses_better_unrestricted_candidate(self):
        RangeSensitiveFakeOcr.instances.clear()
        fake_module = types.SimpleNamespace(DdddOcr=RangeSensitiveFakeOcr)
        with patch.dict(sys.modules, {"ddddocr": fake_module}):
            result = TextCaptchaSolver().solve(
                tiny_text_image(),
                charset="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            )
        self.assertTrue(result.success)
        self.assertEqual(result.answer, "A7B2")

    def test_text_solver_does_not_leak_custom_charset_and_fixes_png(self):
        FakeOcr.instances.clear()
        fake_module = types.SimpleNamespace(DdddOcr=FakeOcr)
        with patch.dict(sys.modules, {"ddddocr": fake_module}):
            solver = TextCaptchaSolver()
            self.assertTrue(solver.solve(tiny_text_image(), charset="0123456789").success)
            self.assertTrue(solver.solve(tiny_text_image()).success)

        ocr = FakeOcr.instances[0]
        self.assertEqual(len(ocr.classification_calls), 3)
        self.assertEqual(ocr.classification_calls[0][0], "0123456789")
        self.assertEqual(ocr.classification_calls[1][0], ocr.get_charset())
        self.assertEqual(ocr.classification_calls[2][0], ocr.get_charset())
        self.assertTrue(all(call[1]["png_fix"] for call in ocr.classification_calls))


class PackagedCaptchaRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        sys.path.insert(0, "cf_captcha_solver_pkg")
        from cf_captcha_solver.captcha import CaptchaDetector as PackagedDetector
        from cf_captcha_solver.captcha import CaptchaSolver as PackagedSolver
        from cf_captcha_solver.captcha import CaptchaType as PackagedType
        from cf_captcha_solver.captcha import TextCaptchaSolver as PackagedTextSolver

        cls.Detector = PackagedDetector
        cls.Solver = PackagedSolver
        cls.Type = PackagedType
        cls.TextSolver = PackagedTextSolver

    def test_public_solver_auto_detects_and_routes_small_text_image(self):
        FakeOcr.instances.clear()
        fake_module = types.SimpleNamespace(DdddOcr=FakeOcr)
        with patch.dict(sys.modules, {"ddddocr": fake_module}):
            result = self.Solver().solve_image(tiny_text_image())

        self.assertTrue(result.success)
        self.assertEqual(result.captcha_type, self.Type.TEXT)

    def test_charset_restriction_uses_better_unrestricted_candidate(self):
        RangeSensitiveFakeOcr.instances.clear()
        fake_module = types.SimpleNamespace(DdddOcr=RangeSensitiveFakeOcr)
        with patch.dict(sys.modules, {"ddddocr": fake_module}):
            result = self.TextSolver().solve(
                tiny_text_image(),
                charset="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            )
        self.assertTrue(result.success)
        self.assertEqual(result.answer, "A7B2")

    def test_small_text_image_is_not_misclassified_as_slide(self):
        self.assertEqual(
            self.Detector.detect_from_image(tiny_text_image()),
            self.Type.TEXT,
        )

    def test_text_solver_does_not_leak_custom_charset_and_fixes_png(self):
        FakeOcr.instances.clear()
        fake_module = types.SimpleNamespace(DdddOcr=FakeOcr)
        with patch.dict(sys.modules, {"ddddocr": fake_module}):
            solver = self.TextSolver()
            self.assertTrue(solver.solve(tiny_text_image(), charset="0123456789").success)
            self.assertTrue(solver.solve(tiny_text_image()).success)

        ocr = FakeOcr.instances[0]
        self.assertEqual(len(ocr.classification_calls), 3)
        self.assertEqual(ocr.classification_calls[0][0], "0123456789")
        self.assertEqual(ocr.classification_calls[1][0], ocr.get_charset())
        self.assertEqual(ocr.classification_calls[2][0], ocr.get_charset())
        self.assertTrue(all(call[1]["png_fix"] for call in ocr.classification_calls))


if __name__ == "__main__":
    unittest.main()
