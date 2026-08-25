#!/usr/bin/env python3
"""复用本机登录态完成 TRAE Work CN 与 WorkBuddy 每日积分签到。"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import logging
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Callable

try:
    from Crypto.Cipher import AES
    from Crypto.Util.Padding import unpad
except ImportError as exc:
    raise SystemExit("缺少依赖，请先执行：python -m pip install pycryptodome") from exc


TRAE_API_BASE = "https://api.trae.cn/trae/api/v2/ug/checkin_credits"
TRAE_USAGE_API = "https://api.trae.cn/trae/api/v2/pay/ide_user_ent_usage"
WORKBUDDY_API_BASE = "https://copilot.tencent.com"
WORKBUDDY_STATUS_PATH = "/v2/billing/meter/checkin-activity-status"
WORKBUDDY_CLAIM_PATH = "/v2/billing/meter/daily-checkin"
AUTH_KEY = "iCubeAuthInfo://icube.cloudide"
DEVICE_KEY_PREFIX = "iCubeAuthInfo://icube-dc:"
ENCRYPTION_HEADER = bytes((116, 99, 5, 16, 0, 0))
KEY_SECRET = bytes.fromhex(
    "4dd4c2e6b83162090e52b3c7a6733ba41cb2462b829ab58a196b39db57177524"
    "f49baf7f08e8d68d26a72e37c1a95a2f1f05a51892aef2949732b62a38aadd58"
)


def decrypt_auth_blob(encoded: str) -> dict:
    raw = base64.b64decode(encoded, validate=True)
    if len(raw) <= 38 or raw[:6] != ENCRYPTION_HEADER:
        raise ValueError("TRAE 登录数据格式无法识别，客户端可能已更新")

    seed = raw[6:38]
    derived = hashlib.sha512(hashlib.sha512(seed).digest() + KEY_SECRET).digest()
    decrypted = AES.new(derived[:16], AES.MODE_CBC, derived[16:32]).decrypt(raw[38:])
    plain = unpad(decrypted, AES.block_size)
    digest, payload = plain[:64], plain[64:]
    if len(plain) < 64 or hashlib.sha512(payload).digest() != digest:
        raise ValueError("TRAE 登录数据校验失败")
    return json.loads(payload.decode("utf-8"))


def default_trae_storage_path() -> Path:
    appdata = os.environ.get("APPDATA")
    if not appdata:
        raise RuntimeError("未找到 APPDATA 环境变量")
    return Path(appdata) / "TRAE SOLO CN" / "User" / "globalStorage" / "storage.json"


def default_workbuddy_auth_path() -> Path:
    local = os.environ.get("LOCALAPPDATA")
    if not local:
        raise RuntimeError("未找到 LOCALAPPDATA 环境变量")
    return (
        Path(local)
        / "CodeBuddyExtension"
        / "Data"
        / "Public"
        / "auth"
        / "workbuddy-desktop.info"
    )


def load_trae_session(storage_path: Path) -> tuple[str, str]:
    if not storage_path.is_file():
        raise FileNotFoundError(f"未找到 TRAE 登录状态文件：{storage_path}")

    storage = json.loads(storage_path.read_text(encoding="utf-8"))
    encoded = storage.get(AUTH_KEY)
    if not encoded:
        raise RuntimeError("未找到 TRAE 登录信息，请先在客户端登录")

    auth = decrypt_auth_blob(encoded)
    token = auth.get("token")
    if not isinstance(token, str) or not token:
        raise RuntimeError("TRAE 登录令牌不存在，请重新登录客户端")

    device_ids = [
        key.removeprefix(DEVICE_KEY_PREFIX)
        for key in storage
        if key.startswith(DEVICE_KEY_PREFIX)
    ]
    device_id = next((value for value in device_ids if value and value != "0"), None)
    if not device_id:
        raise RuntimeError("未找到 TRAE 设备 ID，请先启动一次客户端")
    return token, device_id


def load_workbuddy_session(auth_path: Path) -> tuple[str, str, str | None]:
    if not auth_path.is_file():
        raise FileNotFoundError(
            f"未找到 WorkBuddy 登录状态文件：{auth_path}；请先启动并登录 WorkBuddy"
        )

    payload = json.loads(auth_path.read_text(encoding="utf-8"))
    account = payload.get("account") or {}
    auth = payload.get("auth") or {}
    token = auth.get("accessToken")
    uid = account.get("uid")
    domain = auth.get("domain")
    if not isinstance(token, str) or not token:
        raise RuntimeError("WorkBuddy 登录令牌不存在，请重新登录客户端")
    if not isinstance(uid, str) or not uid:
        raise RuntimeError("WorkBuddy 用户 ID 不存在，请重新登录客户端")
    if domain is not None and not isinstance(domain, str):
        domain = None
    return token, uid, domain


def http_json(
    url: str,
    *,
    headers: dict[str, str],
    payload: dict | None = None,
    timeout: int = 20,
    allow_business_error: bool = False,
) -> dict:
    body = json.dumps(payload if payload is not None else {}).encode("utf-8")
    request = urllib.request.Request(url, data=body, method="POST", headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            result = json.loads(raw)
        except json.JSONDecodeError as parse_exc:
            raise RuntimeError(f"接口返回 HTTP {exc.code}：{raw[:300]}") from parse_exc
        if allow_business_error and isinstance(result, dict):
            return result
        raise RuntimeError(
            f"接口返回 HTTP {exc.code}：{result.get('msg') or result.get('message') or raw[:300]}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"无法连接接口：{exc.reason}") from exc

    result = json.loads(raw)
    if not isinstance(result, dict):
        raise RuntimeError("接口返回了无法识别的数据")
    return result


def create_trae_post(token: str, device_id: str, timeout: int) -> Callable[[str], dict]:
    def post(action: str) -> dict:
        if action == "usage":
            url = TRAE_USAGE_API
            payload = {"require_usage": True, "req_source": 2}
        else:
            url = f"{TRAE_API_BASE}/{action}"
            payload = {}

        result = http_json(
            url,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Cloud-IDE-JWT {token}",
                "x-device-id": device_id,
                "User-Agent": "TRAE-Work-CN-auto-checkin/1.0",
            },
            payload=payload,
            timeout=timeout,
        )
        if result.get("code") not in (None, 0):
            raise RuntimeError(f"TRAE 接口失败：{result.get('message', result.get('code'))}")
        return result

    return post


def create_workbuddy_post(
    token: str, uid: str, domain: str | None, timeout: int
) -> Callable[[str], dict]:
    def post(action: str) -> dict:
        if action == "status":
            path = WORKBUDDY_STATUS_PATH
            allow_business_error = False
        elif action == "claim":
            path = WORKBUDDY_CLAIM_PATH
            allow_business_error = True
        else:
            raise ValueError(f"未知 WorkBuddy 动作：{action}")

        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "X-User-Id": uid,
            "User-Agent": "WorkBuddy-auto-checkin/1.0",
            "X-IDE-Type": "WorkBuddy",
            "X-IDE-Name": "WorkBuddy",
            "X-Product": "WorkBuddy",
        }
        if domain:
            headers["X-Domain"] = domain

        return http_json(
            f"{WORKBUDDY_API_BASE}{path}",
            headers=headers,
            payload={},
            timeout=timeout,
            allow_business_error=allow_business_error,
        )

    return post


def calculate_total_credits(result: dict) -> int:
    packs = result.get("user_entitlement_pack_list")
    if packs is None and isinstance(result.get("data"), dict):
        packs = result["data"].get("user_entitlement_pack_list")
    if not isinstance(packs, list):
        raise RuntimeError("总积分接口未返回积分包数据")

    remaining = 0.0
    for pack in packs:
        quota = pack.get("entitlement_base_info", {}).get("quota", {})
        usage = pack.get("usage") or {}
        remaining += float(quota.get("credits_limit", 0)) - float(
            usage.get("credits_amount", 0)
        )
    return round(remaining)


def checkin_text(checked_in: bool) -> str:
    return "今日已签到" if checked_in else "今日未签到"


def unwrap_workbuddy_data(result: dict) -> dict:
    if result.get("code") not in (None, 0):
        raise RuntimeError(f"WorkBuddy 接口失败：{result.get('msg') or result.get('code')}")
    data = result.get("data")
    if not isinstance(data, dict):
        raise RuntimeError("WorkBuddy 接口未返回签到数据")
    return data


def workbuddy_summary(data: dict) -> tuple[str, Any, Any, Any]:
    checked_in = bool(data.get("today_checked_in"))
    days = data.get("streak_days", data.get("week_checkin_days", "未知"))
    total = data.get("total_credits", "未知")
    credit = data.get("today_credit", data.get("daily_credit", "未知"))
    return checkin_text(checked_in), days, total, credit


def perform_checkin(post: Callable[[str], dict], status_only: bool = False) -> str:
    before_status = post("status")
    before_total = calculate_total_credits(post("usage"))
    credits = before_status.get("credits", "未知")

    print("=" * 48)
    print("TRAE Work CN 每日积分签到")
    print("=" * 48)
    print(f"签到前状态：{checkin_text(bool(before_status.get('checked_in')))}")
    print(f"签到前总积分：{before_total:,}")
    print(f"签到额度：{credits} 积分")
    print()

    after_status = before_status
    after_total = before_total
    if not before_status.get("enable"):
        print("当前账号未开放每日签到。")
        result = "disabled"
    elif before_status.get("checked_in"):
        print("本日无需重复签到。")
        result = "already_checked"
    elif status_only:
        print("当前为只查询模式，未执行签到。")
        result = "not_checked"
    else:
        print("正在领取签到积分……")
        post("claim")
        after_status = post("status")
        if not after_status.get("checked_in"):
            raise RuntimeError("领取接口已返回成功，但再次查询仍显示未签到")
        after_total = calculate_total_credits(post("usage"))
        print("签到成功。")
        result = "claimed"

    print()
    print(f"签到后状态：{checkin_text(bool(after_status.get('checked_in')))}")
    print(f"签到后总积分：{after_total:,}")
    print("=" * 48)
    return result


def perform_workbuddy_checkin(
    post: Callable[[str], dict], status_only: bool = False
) -> str:
    before = unwrap_workbuddy_data(post("status"))
    before_text, before_days, before_total, before_credit = workbuddy_summary(before)

    print()
    print("=" * 48)
    print("WorkBuddy 每日签到")
    print("=" * 48)
    print(f"活动：{before.get('activity_name') or before.get('theme_name') or '未知'}")
    print(f"签到前状态：{before_text}")
    print(f"已领天数：{before_days}")
    print(f"累计领取：{before_total} 分")
    print(f"签到额度：{before_credit} 积分")
    print()

    after = before
    if not before.get("active"):
        print("当前 WorkBuddy 签到活动未开启。")
        result = "disabled"
    elif before.get("today_checked_in"):
        print("本日无需重复签到。")
        result = "already_checked"
    elif status_only:
        print("当前为只查询模式，未执行签到。")
        result = "not_checked"
    else:
        print("正在领取签到积分……")
        claim = post("claim")
        code = claim.get("code")
        if code in (None, 0):
            data = claim.get("data")
            if isinstance(data, dict):
                after = {**before, **data, "today_checked_in": True}
                if "credit" in data and "today_credit" not in after:
                    after["today_credit"] = data["credit"]
            after = unwrap_workbuddy_data(post("status"))
            if not after.get("today_checked_in"):
                raise RuntimeError("WorkBuddy 领取后再次查询仍显示未签到")
            print("签到成功。")
            result = "claimed"
        elif code == 10001:
            print(claim.get("msg") or "今日已签到。")
            after = unwrap_workbuddy_data(post("status"))
            result = "already_checked"
        else:
            raise RuntimeError(f"WorkBuddy 领取失败：{claim.get('msg') or code}")

    after_text, after_days, after_total, after_credit = workbuddy_summary(after)
    print()
    print(f"签到后状态：{after_text}")
    print(f"已领天数：{after_days}")
    print(f"累计领取：{after_total} 分")
    print(f"签到额度：{after_credit} 积分")
    print("=" * 48)
    return result


def configure_logging(log_file: Path) -> None:
    log_file.parent.mkdir(parents=True, exist_ok=True)
    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    stream = logging.StreamHandler(sys.stdout)
    stream.setFormatter(formatter)
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setFormatter(formatter)
    root.addHandler(stream)
    root.addHandler(file_handler)


def main() -> int:
    parser = argparse.ArgumentParser(description="TRAE + WorkBuddy 每日积分自动签到")
    parser.add_argument("--status-only", action="store_true", help="只查询状态，不领取积分")
    parser.add_argument("--storage", type=Path, default=default_trae_storage_path())
    parser.add_argument(
        "--workbuddy-auth",
        type=Path,
        default=default_workbuddy_auth_path(),
    )
    parser.add_argument(
        "--log-file",
        type=Path,
        default=Path(__file__).with_name("trae_checkin.log"),
    )
    parser.add_argument("--timeout", type=int, default=20)
    parser.add_argument("--skip-trae", action="store_true", help="跳过 TRAE 签到")
    parser.add_argument("--skip-workbuddy", action="store_true", help="跳过 WorkBuddy 签到")
    args = parser.parse_args()

    configure_logging(args.log_file)
    errors: list[str] = []

    if not args.skip_trae:
        try:
            token, device_id = load_trae_session(args.storage)
            perform_checkin(
                create_trae_post(token, device_id, args.timeout), args.status_only
            )
        except Exception as exc:
            logging.error("TRAE 签到失败：%s", exc)
            errors.append(f"TRAE: {exc}")

    if not args.skip_workbuddy:
        try:
            token, uid, domain = load_workbuddy_session(args.workbuddy_auth)
            perform_workbuddy_checkin(
                create_workbuddy_post(token, uid, domain, args.timeout),
                args.status_only,
            )
        except Exception as exc:
            logging.error("WorkBuddy 签到失败：%s", exc)
            errors.append(f"WorkBuddy: {exc}")

    if errors:
        logging.error("签到未全部成功：%s", " | ".join(errors))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())