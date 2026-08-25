#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""JSON wrapper around local cf_bypass + captcha_solver for daily-rewards-v2."""
from __future__ import annotations

import argparse
import json
import os
import sys
import traceback
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

HELPER_DIR = Path(os.environ.get("CF_HELPER_DIR", r"D:\codex-projeect\验证码识别"))
sys.path.insert(0, str(HELPER_DIR))


def find_chrome() -> str | None:
    candidates = [
        os.environ.get("CHROME_PATH"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    ]
    for item in candidates:
        if item and Path(item).exists():
            return item
    return None


def dependency_report() -> dict:
    report = {}
    for name in [
        "requests",
        "curl_cffi",
        "cloudscraper",
        "DrissionPage",
        "playwright",
        "ddddocr",
        "PIL",
        "captcha_solver",
        "cf_bypass",
    ]:
        try:
            if name in {"captcha_solver", "cf_bypass"}:
                __import__(name)
            else:
                __import__(name if name != "PIL" else "PIL")
            report[name] = "ok"
        except Exception as exc:  # noqa: BLE001
            report[name] = f"missing: {exc.__class__.__name__}"
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("url", nargs="?", default="")
    parser.add_argument("--timeout", type=int, default=45)
    parser.add_argument("--no-headless", action="store_true")
    parser.add_argument("--strategy", default=None)
    parser.add_argument("--json", action="store_true", default=True)
    parser.add_argument("--diagnose", action="store_true")
    parser.add_argument("--captcha-image", default=None, help="optional local captcha image for OCR smoke test")
    args = parser.parse_args()

    if args.diagnose or not args.url:
        payload = {
            "success": True if args.diagnose else False,
            "mode": "diagnose",
            "dependencies": dependency_report(),
            "chrome_path": find_chrome(),
            "helper_dir": str(HELPER_DIR),
            "error": "" if args.diagnose else "url required",
        }
        if args.captcha_image:
            try:
                from captcha_solver import CaptchaSolver

                solver = CaptchaSolver()
                raw = Path(args.captcha_image).read_bytes()
                result = solver.solve_image(raw)
                payload["captcha_smoke"] = {
                    "success": bool(result.success),
                    "answer": getattr(result, "answer", None),
                    "captcha_type": str(getattr(result, "captcha_type", "")),
                    "error": getattr(result, "error", "") or "",
                }
            except Exception as exc:  # noqa: BLE001
                payload["captcha_smoke"] = {
                    "success": False,
                    "error": f"{exc.__class__.__name__}: {exc}",
                }
        print(json.dumps(payload, ensure_ascii=False))
        return 0 if args.diagnose else 1

    try:
        from cf_bypass import CloudflareBypasser
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({
            "success": False,
            "strategy": "",
            "user_agent": "",
            "cookies": {},
            "error": f"import cf_bypass failed: {exc}",
            "dependencies": dependency_report(),
        }, ensure_ascii=False))
        return 1

    strategies = [args.strategy] if args.strategy else [
        "drissionpage",
        "playwright",
        "curl_cffi",
        "cloudscraper",
        "flaresolverr",
    ]

    bypasser = CloudflareBypasser(
        browser_path=find_chrome(),
        headless=not args.no_headless,
        timeout=args.timeout,
        captcha_platform=os.environ.get("CAPTCHA_PLATFORM", ""),
        captcha_api_key=os.environ.get("CAPTCHA_API_KEY", ""),
    )

    try:
        result = bypasser.bypass(args.url, strategies=strategies)
        payload = {
            "success": bool(getattr(result, "success", False)),
            "strategy": getattr(result, "strategy", "") or "",
            "user_agent": getattr(result, "user_agent", "") or "",
            "cookies": getattr(result, "cookies", {}) or {},
            "error": getattr(result, "error", "") or "",
            "dependencies": dependency_report(),
        }
    except Exception as exc:  # noqa: BLE001
        payload = {
            "success": False,
            "strategy": "",
            "user_agent": "",
            "cookies": {},
            "error": f"{exc.__class__.__name__}: {exc}",
            "trace": traceback.format_exc(limit=5),
            "dependencies": dependency_report(),
        }

    print(json.dumps(payload, ensure_ascii=False))
    return 0 if payload.get("success") else 1


if __name__ == "__main__":
    raise SystemExit(main())
