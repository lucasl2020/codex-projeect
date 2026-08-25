#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Use one DrissionPage browser session for CF verification and one attendance click."""
from __future__ import annotations

import argparse
import json
import os
import re
import time
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def find_chrome() -> str | None:
    candidates = [
        os.environ.get("CHROME_PATH"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    ]
    return next((item for item in candidates if item and Path(item).exists()), None)


def configure_chromium_options(options, chrome: str, user_data_dir: str | None = None):
    options.set_browser_path(chrome)
    options.headless(False)
    options.set_argument("--disable-blink-features=AutomationControlled")
    options.set_argument("--disable-infobars")
    options.set_argument("--no-sandbox")
    options.set_argument("--disable-dev-shm-usage")
    if user_data_dir:
        options.set_user_data_path(user_data_dir)
    return options


def cloudflare_origin_error_code(title: str, body: str) -> str | None:
    visible = f"{title or ''}\n{body or ''}"
    match = re.search(r"\b(520|521|522|523|524|525|526|530)\b", visible)
    if not match:
        return None
    if re.search(
        r"connection timed out|web server is down|host error|origin.*(?:error|unreachable|timed out)|"
        r"bad gateway|gateway time-?out|源站.*(?:错误|超时|不可达)",
        visible,
        re.I,
    ):
        return match.group(1)
    return None


def is_challenge(title: str, body: str) -> bool:
    visible = f"{title or ''}\n{body or ''}"
    return bool(re.search(
        r"just a moment|checking your browser|cf-browser-verification|ray id|"
        r"正在进行安全验证|正在进行安全检查|请稍候|验证您是真人|verify you are human",
        visible,
        re.I,
    ))


def page_load_error(navigation_ok: bool | None, title: str, body: str) -> str | None:
    visible = f"{title or ''}\n{body or ''}"
    if re.search(
        r"(?:network|nework) error|err_(?:connection|name|network|proxy|timed)_|"
        r"\u65e0\u6cd5\u8bbf\u95ee\u6b64\u7f51\u7ad9|\u7f51\u7edc\u9519\u8bef|\u8fde\u63a5\u8d85\u65f6|\u4ee3\u7406\u670d\u52a1\u5668\u51fa\u73b0\u95ee\u9898",
        visible,
        re.I,
    ):
        return "\u9875\u9762\u52a0\u8f7d\u5931\u8d25\uff1a\u672c\u673a\u65e0\u6cd5\u8bbf\u95ee\u76ee\u6807\u7f51\u7ad9\uff1b\u8bf7\u68c0\u67e5\u7f51\u7edc\u3001\u4ee3\u7406\u6216 DNS\u3002\u8fd9\u4e0d\u662f\u9a8c\u8bc1\u7801\u95ee\u9898\u3002"
    if not str(body or "").strip() and (
        navigation_ok is False
        or re.fullmatch(r"\s*(?:\u65b0\u6807\u7b7e\u9875|new tab)?\s*", str(title or ""), re.I)
    ):
        return "\u9875\u9762\u52a0\u8f7d\u5931\u8d25\uff1a\u672c\u673a\u65e0\u6cd5\u8bbf\u95ee\u76ee\u6807\u7f51\u7ad9\uff1b\u8bf7\u68c0\u67e5\u7f51\u7edc\u3001\u4ee3\u7406\u6216 DNS\u3002\u8fd9\u4e0d\u662f\u9a8c\u8bc1\u7801\u95ee\u9898\u3002"
    return None

def extract_quota(value: str) -> float | int | None:
    text = re.sub(r"\s+", " ", str(value or "").replace(",", ""))
    match = re.search(
        r"(?:^|\s)\u9e21\u817f\s*[:\uff1a]?\s*(-?\d+(?:\.\d+)?)(?=\s|$)",
        text,
        re.I,
    )
    if not match:
        return None
    number = float(match.group(1))
    return int(number) if number.is_integer() else number


def read_quota_from_url(page, url: str | None) -> float | int | None:
    if not url:
        return None
    previous_url = str(getattr(page, "url", "") or "")
    try:
        page.get(url)
        deadline = time.time() + 10
        while time.time() < deadline:
            body = page.run_js("return document.body ? document.body.innerText : '';", timeout=10) or ""
            quota = extract_quota(body)
            if quota is not None:
                return quota
            time.sleep(1)
    except Exception:  # noqa: BLE001
        return None
    finally:
        if previous_url and previous_url != url:
            try:
                page.get(previous_url)
                time.sleep(2)
            except Exception:  # noqa: BLE001
                pass
    return None


def already_done(text: str) -> bool:
    return bool(re.search(
        r"\u4eca\u65e5\u7b7e\u5230\u83b7\u5f97|已(?:经)?领取|已(?:经)?签到|今日已|今天已.*签到|完成签到|already|claimed",
        text or "",
        re.I,
    ))


def success_text(text: str) -> bool:
    return bool(re.search(r"领取成功|签到成功|已领取|已签到|今日已|今天已.*签到|完成签到|获得.*鸡腿|鸡腿.*成功|already|claimed", text or "", re.I))



def find_attendance_button(page):
    """Return an actual clickable attendance control, never a text container."""
    locators = (
        "xpath://button[normalize-space(.)='\u8bd5\u8bd5\u624b\u6c14']",
        "xpath://button[contains(normalize-space(.), '\u968f\u673a') and contains(normalize-space(.), '\u9e21\u817f')]",
        "xpath://button[contains(normalize-space(.), '\u9e21\u817f') and (contains(normalize-space(.), 'x') or contains(normalize-space(.), 'X'))]",
        "xpath://a[normalize-space(.)='\u8bd5\u8bd5\u624b\u6c14']",
        "xpath://*[(@role='button' or @onclick) and normalize-space(.)='\u8bd5\u8bd5\u624b\u6c14']",
    )
    for locator in locators:
        element = page.ele(locator, timeout=0)
        if element:
            return element
    return None


def click_attendance_button(button) -> bool:
    """Click once through DrissionPage's native element click path."""
    return button.click(by_js=False, timeout=5) is not False


def payload(**kwargs) -> dict:
    base = {
        "ok": False,
        "already": False,
        "dry_run": False,
        "message": "",
        "before_quota": None,
        "after_quota": None,
        "error": "",
    }
    base.update(kwargs)
    return base


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("--timeout", type=int, default=120)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--quota-url")
    parser.add_argument("--user-data-dir")
    args = parser.parse_args()

    chrome = find_chrome()
    if not chrome:
        print(json.dumps(payload(error="Chrome not found"), ensure_ascii=False))
        return 1

    page = None
    try:
        from DrissionPage import ChromiumOptions, ChromiumPage

        options = configure_chromium_options(ChromiumOptions(), chrome, args.user_data_dir)
        page = ChromiumPage(options)
        navigation_ok = page.get(args.url)

        deadline = time.time() + max(10, args.timeout)
        title = ""
        body = ""
        while time.time() < deadline:
            title = page.title or ""
            body = page.run_js("return document.body ? document.body.innerText : '';", timeout=10) or ""
            load_error = page_load_error(navigation_ok, title, body)
            if load_error:
                print(json.dumps(payload(error=load_error), ensure_ascii=False))
                return 1
            origin_error = cloudflare_origin_error_code(title, body)
            if origin_error:
                reason = "源站连接超时" if origin_error == "522" else "源站错误"
                print(json.dumps(payload(error=f"站点暂时不可用：Cloudflare {origin_error}（{reason}），这不是验证码问题。"), ensure_ascii=False))
                return 1
            if not is_challenge(title, body):
                break
            time.sleep(2)
        else:
            print(json.dumps(payload(error="Cloudflare 安全验证未完成；请在打开的 Chrome 窗口中完成验证"), ensure_ascii=False))
            return 1

        time.sleep(2)
        ready_deadline = time.time() + 10
        while time.time() < ready_deadline:
            body = page.run_js("return document.body ? document.body.innerText : '';", timeout=10) or ""
            if already_done(body) or re.search(r"试试手气|随机抽个鸡腿|立即签到|开始签到|鸡腿", body, re.I):
                break
            time.sleep(1)

        title = page.title or title
        load_error = page_load_error(navigation_ok, title, body)
        if load_error:
            print(json.dumps(payload(error=load_error), ensure_ascii=False))
            return 1

        current_url = str(getattr(page, "url", "") or "")
        if "/login" in current_url or "connect.linux.do" in current_url:
            print(json.dumps(payload(error="登录状态已失效；请先在 DrissionPage Chrome 中登录"), ensure_ascii=False))
            return 1

        before = read_quota_from_url(page, args.quota_url) if args.quota_url else extract_quota(body)
        if already_done(body):
            print(json.dumps(payload(ok=True, already=True, message="今日已签到", before_quota=before, after_quota=before), ensure_ascii=False))
            return 0

        button = find_attendance_button(page)
        if not button:
            print(json.dumps(payload(error="\u9875\u9762\u5df2\u52a0\u8f7d\uff0c\u4f46\u672a\u627e\u5230\u53ef\u7528\u7684\u968f\u673a\u7b7e\u5230\u6309\u94ae\uff1b\u767b\u5f55\u72b6\u6001\u53ef\u80fd\u5df2\u5931\u6548\u6216\u9875\u9762\u7ed3\u6784\u5df2\u53d8\u5316", before_quota=before), ensure_ascii=False))
            return 1

        button_text = str(getattr(button, "text", "") or "").strip()
        if args.dry_run:
            label = f"\u201c{button_text}\u201d" if button_text else ""
            print(json.dumps(payload(ok=True, dry_run=True, message=f"\u5df2\u627e\u5230\u7b7e\u5230\u6309\u94ae{label}\uff08\u672a\u70b9\u51fb\uff09", before_quota=before), ensure_ascii=False))
            return 0

        if not click_attendance_button(button):
            label = f"\u201c{button_text}\u201d" if button_text else ""
            print(json.dumps(payload(error=f"\u5df2\u5b9a\u4f4d\u7b7e\u5230\u6309\u94ae{label}\uff0c\u4f46\u6d4f\u89c8\u5668\u539f\u751f\u70b9\u51fb\u672a\u6210\u529f", before_quota=before), ensure_ascii=False))
            return 1

        confirmed = False
        after_body = ""
        after = None
        confirm_deadline = time.time() + 10
        while time.time() < confirm_deadline:
            after_body = page.run_js("return document.body ? document.body.innerText : '';", timeout=10) or ""
            confirmed = success_text(after_body)
            if confirmed:
                break
            time.sleep(1)

        after = read_quota_from_url(page, args.quota_url) if args.quota_url else extract_quota(after_body)
        if before is not None and after is not None and after != before:
            confirmed = True

        if not confirmed:
            page.get(args.url)
            reload_deadline = time.time() + 8
            while time.time() < reload_deadline:
                after_body = page.run_js("return document.body ? document.body.innerText : '';", timeout=10) or ""
                confirmed = success_text(after_body)
                if confirmed:
                    break
                time.sleep(1)

            after = read_quota_from_url(page, args.quota_url) if args.quota_url else extract_quota(after_body)
            if before is not None and after is not None and after != before:
                confirmed = True

        if not confirmed:
            label = f"\u201c{button_text}\u201d" if button_text else ""
            pending = "\uff0c\u5237\u65b0\u540e\u4ecd\u663e\u793a\u201c\u4eca\u65e5\u8fd8\u672a\u7b7e\u5230\u201d" if re.search(r"\u4eca\u65e5\u8fd8\u672a\u7b7e\u5230", after_body) else ""
            print(json.dumps(payload(error=f"\u5df2\u539f\u751f\u70b9\u51fb\u7b7e\u5230\u6309\u94ae{label}\uff0c\u4f46\u9875\u9762\u672a\u786e\u8ba4\u7b7e\u5230\u6210\u529f{pending}", before_quota=before, after_quota=after), ensure_ascii=False))
            return 1

        print(json.dumps(payload(ok=True, already=already_done(after_body), message="\u9875\u9762\u539f\u751f\u70b9\u51fb\u7b7e\u5230\u6210\u529f", before_quota=before, after_quota=after), ensure_ascii=False))
        return 0
    except Exception as exc:  # noqa: BLE001
        print(json.dumps(payload(error=f"{exc.__class__.__name__}: {exc}"), ensure_ascii=False))
        return 1
    finally:
        if page is not None:
            try:
                page.quit()
            except Exception:
                pass


if __name__ == "__main__":
    raise SystemExit(main())
