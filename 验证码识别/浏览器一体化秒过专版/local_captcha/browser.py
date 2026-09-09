"""在同一浏览器会话内识别、操作、检查结果。"""
import hashlib
import re
import sys
import time
from urllib.parse import urlsplit


def _log(msg):
    try:
        enc = getattr(sys.stdout, "encoding", "utf-8") or "utf-8"
        print(str(msg).encode(enc, errors="replace").decode(enc))
    except Exception:
        pass


TENCENT = ".tencent-captcha-dy__slider-type-wrap"


def visible(root, selector):
    for element in root.locator(selector).all():
        if element.is_visible():
            return element
    return None


def provider_frame(frame, domain):
    host = urlsplit(frame.url).hostname or ""
    return host == domain or host.endswith("." + domain)


def token_present(page, name):
    return page.locator('[name="' + name + '"]').evaluate_all(
        "els => els.some(el => typeof el.value === 'string' && el.value.length > 10)"
    )


def drag(page, start, end):
    page.mouse.move(*start)
    page.wait_for_timeout(100)
    page.mouse.down()
    page.wait_for_timeout(120)
    try:
        for step in range(1, 35):
            t = step / 34.0
            t = t * t * (3 - 2 * t)
            page.mouse.move(start[0] + (end[0] - start[0]) * t,
                            start[1] + (end[1] - start[1]) * t)
            page.wait_for_timeout(15)
        page.wait_for_timeout(150)
    finally:
        page.mouse.up()
        page.wait_for_timeout(100)


def apply_action(page, region, kind, points):
    bounds = region.bounding_box()
    coords = [(bounds["x"] + x * bounds["width"] / 1000,
               bounds["y"] + y * bounds["height"] / 1000) for x, y in points]
    if kind == "drag":
        drag(page, *coords)
    else:
        for x, y in coords:
            page.mouse.click(x, y)
            page.wait_for_timeout(200)


def solve_hcaptcha(page, vision):
    if token_present(page, "h-captcha-response"):
        return "widget_passed"
    frames = [f for f in page.frames if provider_frame(f, "hcaptcha.com")]
    for frame in frames:
        tiles = [t for t in frame.locator(".task-image").all() if t.is_visible()]
        if tiles:
            prompt = visible(frame, ".prompt-text")
            if prompt is None:
                return "unsupported"
            images = [t.screenshot(animations="disabled") for t in tiles]
            selected = vision.grid(prompt.inner_text(), images)
            # 推理耗时可能使题目刷新；变化后不能点击旧答案。
            if len(frame.locator(".task-image").all()) != len(tiles) or any(
                hashlib.sha256(t.screenshot(animations="disabled")).digest()
                != hashlib.sha256(image).digest() for t, image in zip(tiles, images)
            ):
                return "challenge_changed"
            for i in selected:
                tiles[i].click()
            submit = visible(frame, ".button-submit")
            if submit is None:
                return "unsupported"
            submit.click()
            page.wait_for_timeout(1200)
            return "widget_passed" if token_present(page, "h-captcha-response") else "attempted"
    for frame in frames:
        prompt = visible(frame, ".prompt-text")
        if prompt is not None:
            canvas = visible(frame, ".challenge-view canvas, canvas")
            if canvas is None:
                return "unsupported"
            prompt_text = prompt.inner_text().strip()
            try:
                picture = canvas.screenshot(animations="disabled", timeout=4000)
            except Exception:
                return "challenge_changed"
            try:
                kind, points = vision.action(prompt_text, picture)
            except Exception as exc:
                _log(f"[hCaptcha] 视觉模型动作解析异常 ({exc})，等待重试")
                return "attempted"
            _log(f"[hCaptcha] 题目: {prompt_text} | 预测动作: {kind}, 坐标: {points}")
            if kind == "unsupported":
                return kind
            current_prompt = visible(frame, ".prompt-text")
            if current_prompt is None or current_prompt.inner_text().strip() != prompt_text:
                _log("[hCaptcha] 题目已变更，放弃当前动作")
                return "challenge_changed"
            apply_action(page, canvas, kind, points)
            page.wait_for_timeout(800)
            submit = visible(frame, ".button-submit")
            if submit is None:
                return "unsupported"
            submit_text = submit.inner_text().strip()
            for _ in range(8):
                submit_text = submit.inner_text().strip()
                if submit_text not in ("跳过", "Skip"):
                    break
                page.wait_for_timeout(250)
            _log(f"[hCaptcha] 按钮当前文本: {submit_text}")
            if submit_text in ("跳过", "Skip"):
                _log("[hCaptcha] 按钮仍为'跳过'，未点击提交，等待下一次识别")
                return "attempted"
            submit.click()
            page.wait_for_timeout(1500)
            passed = token_present(page, "h-captcha-response")
            _log(f"[hCaptcha] 提交后 token 状态: {'已获得' if passed else '未生成'}")
            return "widget_passed" if passed else "attempted"
    for frame in frames:
        checkbox = visible(frame, "#checkbox")
        if checkbox is not None:
            from playwright.sync_api import TimeoutError as PlaywrightTimeout
            try:
                checkbox.click(trial=True, timeout=500)
            except PlaywrightTimeout:
                return "loading"
            checkbox.click()
            page.wait_for_timeout(1000)
            return "opened"
    return "loading"


def solve_recaptcha(page, vision):
    if token_present(page, "g-recaptcha-response"):
        return "widget_passed"
    frames = [
        f for f in page.frames
        if (provider_frame(f, "google.com") or provider_frame(f, "recaptcha.net"))
        and "/recaptcha/" in f.url
    ]
    if not frames:
        return "not_found"

    # 1. 优先检查并处理图片选择挑战弹窗 (bframe)
    for frame in frames:
        desc = visible(frame, ".rc-imageselect-desc, .rc-imageselect-desc-no-canonical, .rc-imageselect-instructions, #rc-imageselect")
        tiles = [t for t in frame.locator("td.rc-imageselect-tile, .rc-image-tile-target, .task-image").all() if t.is_visible()]
        if desc is not None and tiles:
            prompt_text = desc.inner_text().strip().replace("\n", " ")
            _log(f"[reCAPTCHA] 检测到图片选择题: {prompt_text} (共 {len(tiles)} 格)")
            images = [t.screenshot(animations="disabled") for t in tiles]
            try:
                selected = vision.grid(prompt_text, images)
            except Exception as exc:
                _log(f"[reCAPTCHA] 模型选择异常 ({exc})，等待重试")
                return "attempted"
            _log(f"[reCAPTCHA] 模型选择点击格子: {selected}")
            for i in selected:
                if i < len(tiles):
                    tiles[i].click()
                    page.wait_for_timeout(200)
            verify_btn = visible(frame, "#recaptcha-verify-button, .button-submit")
            if verify_btn is not None:
                verify_btn.click()
                page.wait_for_timeout(1500)
            passed = token_present(page, "g-recaptcha-response")
            return "widget_passed" if passed else "attempted"

    # 2. 检查或模拟点击复选框 (anchor frame)
    for frame in frames:
        checkbox = visible(frame, "#recaptcha-anchor, .recaptcha-checkbox")
        if checkbox is not None:
            if checkbox.get_attribute("aria-checked") == "true" or visible(frame, ".recaptcha-checkbox-checked") is not None:
                return "widget_passed"
            _log("[reCAPTCHA] 检测到谷歌复选框，模拟点击以尝试自动跳过...")
            try:
                checkbox.click()
            except Exception:
                pass
            page.wait_for_timeout(1500)
            if token_present(page, "g-recaptcha-response") or checkbox.get_attribute("aria-checked") == "true":
                _log("[reCAPTCHA] 谷歌复选框直接通过 (No-CAPTCHA)！")
                return "widget_passed"
            return "opened"

    return "loading"


def solve_tencent(page, frame, vision):
    if visible(frame, ".tencent-captcha-dy__slider-block--success") is not None:
        return "widget_passed"
    region = visible(frame, ".tencent-captcha-dy__image-area")
    button = visible(frame, ".tencent-captcha-dy__slider-block")
    if region is None or button is None:
        return "unsupported"
    picture = region.screenshot(animations="disabled")
    bounds, handle = region.bounding_box(), button.bounding_box()

    dx = None
    try:
        import cv2, numpy as np
        img = cv2.imdecode(np.frombuffer(picture, np.uint8), cv2.IMREAD_COLOR)
        if img is not None:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            H, W = gray.shape[:2]
            k = 101 if W > 500 else 51
            med = cv2.medianBlur(gray, k)
            diff = cv2.subtract(med, gray)
            _, mask = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
            n, labels, stats, cents = cv2.connectedComponentsWithStats(mask, 8)
            best = None
            for i in range(1, n):
                x, y, w, h, area = stats[i]
                if area < 800 or not (0.5 < w / h < 2.0):
                    continue
                if best is None or area > best[0]:
                    best = (area, x, y, w, h)
            if best is not None:
                _, bx, by, bw, bh = best
                cx = bx + bw / 2
                dx = cx * bounds["width"] / W
    except Exception:
        dx = None

    if dx is None:
        kind, points = vision.action("拖动拼图块到匹配缺口。", picture)
        if kind != "drag":
            return "unsupported"
        if region.screenshot(animations="disabled") != picture:
            return "challenge_changed"
        dx = (points[1][0] - points[0][0]) * bounds["width"] / 1000

    if not 0 < dx < bounds["width"] - handle["width"]:
        return "unsupported"
    start = (handle["x"] + handle["width"] / 2, handle["y"] + handle["height"] / 2)
    drag(page, start, (start[0] + dx, start[1]))
    page.wait_for_timeout(1200)
    return "widget_passed" if visible(
        frame, ".tencent-captcha-dy__slider-block--success"
    ) is not None else "attempted"


def solve_region(page, args, vision):
    region = visible(page, args.region)
    if region is None:
        return "not_found"
    picture = region.screenshot(animations="disabled")
    if args.kind == "math":
        try:
            from cf_captcha_solver.captcha import MathCaptchaSolver
        except ImportError:
            from captcha_solver import MathCaptchaSolver
        result = MathCaptchaSolver().solve(picture)
        if not result.success:
            raise RuntimeError(result.error)
        expression = result.details.get("expression", "")
        if not re.fullmatch(r"\s*\d+\s*[+\-*/×÷xX＋－]\s*\d+\s*(?:[=＝]\s*[?？]?)?\s*", expression):
            m = re.match(r"\s*(\d+)\s+(\d+)\s*(?:[=＝]\s*[?？]?)?\s*", expression)
            if m:
                result.answer = int(m.group(1)) - int(m.group(2))
            else:
                return "unsupported"
        if region.screenshot(animations="disabled") != picture:
            return "challenge_changed"
        page.locator(args.answer_input).fill(str(result.answer))
    else:
        kind, points = vision.action(args.prompt, picture)
        if kind == "unsupported":
            return kind
        if region.screenshot(animations="disabled") != picture:
            return "challenge_changed"
        apply_action(page, region, kind, points)
    return "answer_entered"


def run_page(page, args, vision):
    deadline = time.monotonic() + args.wait
    attempts, detected, state = 0, "unknown", "not_found"
    def check_success():
        if not args.success_selector:
            return False
        el = visible(page, args.success_selector)
        if el is None:
            return False
        if hasattr(el, "is_disabled") and el.is_disabled():
            return False
        return True

    if check_success():
        return {"status": "already_satisfied", "type": detected, "attempts": 0}
    submitted = False
    while time.monotonic() < deadline:
        if check_success():
            return {"status": "site_confirmed", "type": detected, "attempts": attempts}
        if submitted:
            page.wait_for_timeout(500)
            continue
        tencent = next((f for f in page.frames if visible(f, TENCENT) is not None), None)
        if args.region:
            detected = args.kind
            if visible(page, args.region) is None:
                page.wait_for_timeout(500)
                continue
            action = lambda: solve_region(page, args, vision)
        elif any(provider_frame(f, "hcaptcha.com") for f in page.frames):
            detected = "hcaptcha"
            action = lambda: solve_hcaptcha(page, vision)
        elif any((provider_frame(f, "google.com") or provider_frame(f, "recaptcha.net")) and "/recaptcha/" in f.url for f in page.frames):
            detected = "recaptcha"
            action = lambda: solve_recaptcha(page, vision)
        elif token_present(page, "g-recaptcha-response"):
            detected, state = "recaptcha", "widget_passed"
            action = lambda: "widget_passed"
        elif tencent is not None:
            detected = "tencent_slider"
            action = lambda: solve_tencent(page, tencent, vision)
        elif token_present(page, "cf-turnstile-response"):
            detected, state = "turnstile", "widget_passed"
            action = lambda: "widget_passed"
        elif any(provider_frame(f, "challenges.cloudflare.com") for f in page.frames) or visible(
            page, "#challenge-running, #challenge-stage, form#challenge-form"
        ) is not None:
            detected = "turnstile"
            def try_turnstile():
                for f in page.frames:
                    if provider_frame(f, "challenges.cloudflare.com"):
                        cb = visible(f, "input[type=checkbox], .ctp-checkbox-label, #challenge-stage")
                        if cb is not None:
                            try:
                                cb.click()
                                page.wait_for_timeout(1000)
                            except Exception:
                                pass
                return "widget_passed" if token_present(page, "cf-turnstile-response") else "loading"
            action = try_turnstile
        else:
            page.wait_for_timeout(500)
            continue
        if attempts >= args.attempts:
            break
        attempts += 1
        try:
            state = action()
        except Exception as exc:
            _log(f"识别操作出现异常：{exc}，等待自动重试...")
            state = "attempted"
        _log(f"[run_page] 第 {attempts} 次识别结果: state={state}")
        if state in ("loading", "opened"):
            attempts -= 1
            page.wait_for_timeout(500)
            continue
        if state in ("unsupported", "not_found"):
            break
        if state in ("widget_passed", "answer_entered"):
            _log(f"[run_page] 验证码已通过: state={state}，准备提交站点按钮...")
            if args.submit:
                btn = visible(page, args.submit)
                if btn:
                    for _ in range(10):
                        if not btn.is_disabled():
                            break
                        page.wait_for_timeout(300)
                    _log(f"[run_page] 点击提交按钮: {args.submit}")
                    btn.click()
                    submitted = True
                else:
                    page.locator(args.submit).click()
                    submitted = True
            elif args.success_selector:
                submitted = True
            else:
                return {"status": state, "type": detected, "attempts": attempts}
        page.wait_for_timeout(500)
    if submitted:
        state = "submitted_unconfirmed" if args.submit else "site_unconfirmed"
    elif detected == "cloudflare":
        state = "unsupported"
    elif state not in ("unsupported", "not_found"):
        state = "failed"
    return {"status": state, "type": detected, "attempts": attempts}
