from __future__ import annotations

import argparse
import json
import os
import shutil
import tempfile
import time
from pathlib import Path
from urllib.parse import urlparse

from cf_bypass import CloudflareBypasser


EXTENSION_DIR = Path(__file__).with_name("turnstile_probe_extension")


def extension_allows_url(url: str) -> bool:
    manifest = json.loads((EXTENSION_DIR / "manifest.json").read_text(encoding="utf-8"))
    allowed_hosts = {
        urlparse(pattern).hostname
        for script in manifest.get("content_scripts", [])
        for pattern in script.get("matches", [])
    }
    return urlparse(url).hostname in allowed_hosts


def find_chromium_executable() -> Path | None:
    local_app_data = os.environ.get("LOCALAPPDATA", "")
    if not local_app_data:
        return None
    candidates = sorted(
        (Path(local_app_data) / "ms-playwright").glob("chromium-*/chrome-win64/chrome.exe")
    )
    return candidates[-1] if candidates else None


def read_probe_state(page):
    raw_state = page.locator("html").get_attribute("data-turnstile-probe") or ""
    if not raw_state:
        return {}
    try:
        return json.loads(raw_state)
    except json.JSONDecodeError:
        return {}


def run_probe(url: str, wait_seconds: int = 20, headed: bool = True) -> dict:
    from playwright.sync_api import sync_playwright

    with tempfile.TemporaryDirectory(prefix="turnstile-probe-") as profile_dir:
        extension_dir = Path(profile_dir) / "extension"
        shutil.copytree(EXTENSION_DIR, extension_dir)
        with sync_playwright() as playwright:
            launch_kwargs = {
                "user_data_dir": profile_dir,
                "headless": not headed,
                "args": [
                    f"--disable-extensions-except={extension_dir}",
                    f"--load-extension={extension_dir}",
                ],
            }
            chromium_executable = find_chromium_executable()
            if chromium_executable is not None:
                launch_kwargs["executable_path"] = str(chromium_executable)
            else:
                launch_kwargs["channel"] = "chrome"
            try:
                context = playwright.chromium.launch_persistent_context(**launch_kwargs)
            except Exception:
                launch_kwargs.pop("channel", None)
                launch_kwargs.pop("executable_path", None)
                context = playwright.chromium.launch_persistent_context(**launch_kwargs)
            page = context.pages[0] if context.pages else context.new_page()
            try:
                navigation_error = ""
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=60000)
                except Exception as exc:
                    navigation_error = f"{type(exc).__name__}: {exc}"
                deadline = time.monotonic() + wait_seconds
                state = {}
                while time.monotonic() < deadline:
                    state = read_probe_state(page)
                    if state.get("tokenPresent"):
                        break
                    time.sleep(0.5)
                return {
                    "url": page.url,
                    "title": page.title(),
                    "probe": state,
                    "tokenCaptured": bool(state.get("tokenPresent")),
                    "navigationError": navigation_error,
                }
            finally:
                context.close()


def probe_if_challenged(url: str, wait_seconds: int = 20, headed: bool = True) -> dict:
    bypasser = CloudflareBypasser(timeout=min(max(wait_seconds, 1), 30), max_retries=1)
    challenge_detected, _ = bypasser._probe_cloudflare(url)
    result = {
        "url": url,
        "challengeDetected": challenge_detected,
        "extensionAllowed": extension_allows_url(url),
        "extensionCalled": False,
    }
    if not challenge_detected:
        return result
    if not result["extensionAllowed"]:
        result["extensionSkipped"] = "host_not_allowed"
        return result

    result["extensionCalled"] = True
    result["extensionResult"] = run_probe(
        url,
        wait_seconds=wait_seconds,
        headed=headed,
    )
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Observe Turnstile state on an authorized demo page")
    parser.add_argument("url")
    parser.add_argument("--wait", type=int, default=20)
    parser.add_argument("--headless", action="store_true", help="run without a visible browser")
    args = parser.parse_args()
    result = probe_if_challenged(
        args.url,
        wait_seconds=args.wait,
        headed=not args.headless,
    )
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
