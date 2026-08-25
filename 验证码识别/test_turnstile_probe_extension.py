from __future__ import annotations

import json
import unittest
from pathlib import Path
from unittest.mock import patch

from run_turnstile_probe import extension_allows_url, probe_if_challenged


ROOT = Path(__file__).parent
EXTENSION_DIR = ROOT / "turnstile_probe_extension"


class TurnstileProbeExtensionTests(unittest.TestCase):
    def test_manifest_is_manifest_v3_and_scoped_to_demo_hosts(self):
        manifest = json.loads((EXTENSION_DIR / "manifest.json").read_text(encoding="utf-8"))

        self.assertEqual(manifest["manifest_version"], 3)
        self.assertEqual(manifest["content_scripts"][0]["js"], ["content.js"])
        matches = manifest["content_scripts"][0]["matches"]
        self.assertIn("https://seleniumbase.io/*", matches)
        self.assertNotIn("https://stake.com/*", matches)
        self.assertNotIn("https://zhile.io/*", matches)

    def test_content_script_only_reports_state(self):
        source = (EXTENSION_DIR / "content.js").read_text(encoding="utf-8")

        self.assertIn("tokenPresent", source)
        self.assertIn("data-turnstile-probe", source)
        self.assertNotIn(".click(", source)
        self.assertNotIn("fetch(", source)
        self.assertNotIn("chrome.scripting", source)

    def test_probe_prefers_installed_chrome_channel(self):
        source = (ROOT / "run_turnstile_probe.py").read_text(encoding="utf-8")

        self.assertIn("find_chromium_executable", source)
        self.assertIn('launch_kwargs.pop("executable_path", None)', source)

    def test_extension_is_called_only_when_challenge_is_detected(self):
        with (
            patch("run_turnstile_probe.CloudflareBypasser") as bypasser_class,
            patch("run_turnstile_probe.run_probe") as run_probe,
        ):
            bypasser_class.return_value._probe_cloudflare.return_value = (False, "")
            result = probe_if_challenged(
                "https://seleniumbase.io/apps/turnstile"
            )
            self.assertFalse(result["extensionCalled"])
            run_probe.assert_not_called()

            bypasser_class.return_value._probe_cloudflare.return_value = (True, "")
            run_probe.return_value = {"tokenCaptured": False}
            result = probe_if_challenged(
                "https://seleniumbase.io/apps/turnstile"
            )
            self.assertTrue(result["extensionCalled"])
            run_probe.assert_called_once()

    def test_production_hosts_are_not_allowed(self):
        self.assertTrue(
            extension_allows_url("https://nopecha.com/captcha/turnstile")
        )
        self.assertFalse(extension_allows_url("https://stake.com/"))

        with patch("run_turnstile_probe.CloudflareBypasser") as bypasser_class:
            bypasser_class.return_value._probe_cloudflare.return_value = (True, "")
            result = probe_if_challenged("https://stake.com/")

        self.assertFalse(result["extensionCalled"])
        self.assertEqual(result["extensionSkipped"], "host_not_allowed")


if __name__ == "__main__":
    unittest.main()
