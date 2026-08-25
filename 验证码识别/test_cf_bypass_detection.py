from __future__ import annotations

import sys
import types
import unittest
from unittest.mock import patch

from cf_bypass import CloudflareBypasser


class FakeResponse:
    def __init__(self, status_code=200, text="<html>normal</html>", headers=None):
        self.status_code = status_code
        self.text = text
        self.headers = headers or {}
        self.cookies = {}
        self.request = types.SimpleNamespace(headers={"User-Agent": "test-agent"})


def fake_curl_cffi(response):
    requests = types.SimpleNamespace(get=lambda *args, **kwargs: response)
    return types.SimpleNamespace(requests=requests)


class CloudflareDetectionTests(unittest.TestCase):
    def test_probe_detects_official_cf_mitigated_header(self):
        response = FakeResponse(headers={"cf-mitigated": "challenge"})
        with patch.dict(sys.modules, {"curl_cffi": fake_curl_cffi(response)}):
            detected, _ = CloudflareBypasser()._probe_cloudflare("https://example.test")

        self.assertTrue(detected)

    def test_probe_does_not_treat_http_error_as_direct_success(self):
        response = FakeResponse(status_code=403)
        with patch.dict(sys.modules, {"curl_cffi": fake_curl_cffi(response)}):
            detected, _ = CloudflareBypasser()._probe_cloudflare("https://example.test")

        self.assertTrue(detected)

    def test_turnstile_widget_is_not_treated_as_unverified_success(self):
        html = (
            '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>'
            '<div class="cf-turnstile" data-sitekey="test"></div>'
        )

        self.assertTrue(CloudflareBypasser()._is_cf_challenge_html(html))

    def test_curl_cffi_does_not_report_header_challenge_as_success(self):
        response = FakeResponse(headers={"CF-Mitigated": "challenge"})
        with patch.dict(sys.modules, {"curl_cffi": fake_curl_cffi(response)}):
            result = CloudflareBypasser(max_retries=1)._try_curl_cffi(
                "https://example.test"
            )

        self.assertFalse(result.success)

    def test_browser_turnstile_without_token_is_incomplete(self):
        html = (
            '<div class="cf-turnstile" data-sitekey="test"></div>'
            '<input type="hidden" name="cf-turnstile-response" value="">'
        )

        self.assertFalse(
            CloudflareBypasser()._is_browser_challenge_complete(html)
        )

    def test_browser_turnstile_with_token_is_complete(self):
        html = (
            '<div class="cf-turnstile" data-sitekey="test"></div>'
            '<input type="hidden" name="cf-turnstile-response" value="token">'
        )

        self.assertTrue(
            CloudflareBypasser()._is_browser_challenge_complete(html)
        )

    def test_disappeared_turnstile_without_proof_is_incomplete(self):
        self.assertFalse(
            CloudflareBypasser()._is_browser_challenge_complete(
                "<html><title>different page</title></html>",
                turnstile_required=True,
            )
        )

    def test_turnstile_with_cf_clearance_is_complete(self):
        self.assertTrue(
            CloudflareBypasser()._is_browser_challenge_complete(
                "<html><title>target page</title></html>",
                turnstile_required=True,
                has_cf_clearance=True,
            )
        )

    def test_cf_clearance_does_not_override_remaining_challenge(self):
        html = '<div class="cf-turnstile" data-sitekey="test"></div>'
        self.assertFalse(
            CloudflareBypasser()._is_browser_challenge_complete(
                html,
                turnstile_required=True,
                has_cf_clearance=True,
            )
        )

    def test_curl_impersonations_only_use_supported_profiles(self):
        selected = CloudflareBypasser._filter_curl_impersonations(
            {"chrome145", "chrome136"}
        )

        self.assertEqual(selected, ["chrome145", "chrome136"])
        self.assertNotIn("firefox120", selected)


class PackagedCloudflareDetectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        sys.path.insert(0, "cf_captcha_solver_pkg")
        from cf_captcha_solver.cloudflare import CloudflareBypasser as PackagedBypasser

        cls.Bypasser = PackagedBypasser

    def test_packaged_copy_detects_header_and_turnstile(self):
        bypasser = self.Bypasser()
        response = FakeResponse(headers={"cf-mitigated": "challenge"})
        with patch.dict(sys.modules, {"curl_cffi": fake_curl_cffi(response)}):
            detected, _ = bypasser._probe_cloudflare("https://example.test")

        self.assertTrue(detected)
        self.assertTrue(
            bypasser._is_cf_challenge_html('<div class="cf-turnstile"></div>')
        )
        self.assertFalse(
            bypasser._is_browser_challenge_complete(
                "<html>different page</html>",
                turnstile_required=True,
            )
        )
        self.assertFalse(
            bypasser._is_browser_challenge_complete(
                '<div class="cf-turnstile"></div>',
                turnstile_required=True,
                has_cf_clearance=True,
            )
        )


if __name__ == "__main__":
    unittest.main()
