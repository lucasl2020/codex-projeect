import base64
import hashlib
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad

import trae_checkin


def encrypt_fixture(value: dict, seed: bytes = bytes(range(32))) -> str:
    payload = json.dumps(value).encode("utf-8")
    plain = hashlib.sha512(payload).digest() + payload
    derived = hashlib.sha512(hashlib.sha512(seed).digest() + trae_checkin.KEY_SECRET).digest()
    encrypted = AES.new(derived[:16], AES.MODE_CBC, derived[16:32]).encrypt(
        pad(plain, AES.block_size)
    )
    return base64.b64encode(trae_checkin.ENCRYPTION_HEADER + seed + encrypted).decode()


def usage_result(limit: float, used: float) -> dict:
    return {
        "code": 0,
        "user_entitlement_pack_list": [
            {
                "entitlement_base_info": {"quota": {"credits_limit": limit}},
                "usage": {"credits_amount": used},
            }
        ],
    }


class TraeCheckinTests(unittest.TestCase):
    def test_decrypt_auth_blob(self):
        expected = {"token": "secret-token", "account": {"scope": "marscode"}}
        self.assertEqual(trae_checkin.decrypt_auth_blob(encrypt_fixture(expected)), expected)

    def test_load_trae_session(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "storage.json"
            path.write_text(
                json.dumps(
                    {
                        trae_checkin.AUTH_KEY: encrypt_fixture({"token": "secret-token"}),
                        f"{trae_checkin.DEVICE_KEY_PREFIX}123456": "encrypted-device-key",
                    }
                ),
                encoding="utf-8",
            )
            self.assertEqual(trae_checkin.load_trae_session(path), ("secret-token", "123456"))

    def test_load_workbuddy_session(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "workbuddy-desktop.info"
            path.write_text(
                json.dumps(
                    {
                        "account": {"uid": "uid-1", "nickname": "demo"},
                        "auth": {
                            "accessToken": "wb-token",
                            "domain": "www.codebuddy.cn",
                        },
                    }
                ),
                encoding="utf-8",
            )
            self.assertEqual(
                trae_checkin.load_workbuddy_session(path),
                ("wb-token", "uid-1", "www.codebuddy.cn"),
            )

    def test_calculate_total_credits(self):
        result = {
            "user_entitlement_pack_list": [
                {
                    "entitlement_base_info": {"quota": {"credits_limit": 4000}},
                    "usage": {"credits_amount": 420.368},
                },
                {
                    "entitlement_base_info": {"quota": {"credits_limit": 700}},
                    "usage": {"credits_amount": 0},
                },
            ]
        }
        self.assertEqual(trae_checkin.calculate_total_credits(result), 4280)

    def test_already_checked_displays_before_and_after(self):
        calls = []

        def post(action):
            calls.append(action)
            if action == "status":
                return {"code": 0, "enable": True, "checked_in": True, "credits": 200}
            return usage_result(4700, 420.368)

        output = StringIO()
        with redirect_stdout(output):
            self.assertEqual(trae_checkin.perform_checkin(post), "already_checked")

        text = output.getvalue()
        self.assertEqual(calls, ["status", "usage"])
        self.assertIn("签到前状态：今日已签到", text)
        self.assertIn("签到前总积分：4,280", text)
        self.assertIn("签到额度：200 积分", text)
        self.assertIn("签到后状态：今日已签到", text)
        self.assertIn("签到后总积分：4,280", text)

    def test_claim_and_verify_displays_changed_total(self):
        responses = iter(
            [
                {"code": 0, "enable": True, "checked_in": False, "credits": 200},
                usage_result(4500, 420.368),
                {"code": 0, "message": "success"},
                {"code": 0, "enable": True, "checked_in": True, "credits": 200},
                usage_result(4700, 420.368),
            ]
        )
        calls = []

        def post(action):
            calls.append(action)
            return next(responses)

        output = StringIO()
        with redirect_stdout(output):
            self.assertEqual(trae_checkin.perform_checkin(post), "claimed")

        text = output.getvalue()
        self.assertEqual(calls, ["status", "usage", "claim", "status", "usage"])
        self.assertIn("签到前状态：今日未签到", text)
        self.assertIn("签到前总积分：4,080", text)
        self.assertIn("签到额度：200 积分", text)
        self.assertIn("签到成功。", text)
        self.assertIn("签到后状态：今日已签到", text)
        self.assertIn("签到后总积分：4,280", text)

    def test_workbuddy_already_checked(self):
        calls = []

        def post(action):
            calls.append(action)
            return {
                "code": 0,
                "data": {
                    "active": True,
                    "today_checked_in": True,
                    "streak_days": 2,
                    "today_credit": 100,
                    "total_credits": 200,
                    "activity_name": "本期：项目",
                    "theme_name": "Buddy加油站",
                },
            }

        output = StringIO()
        with redirect_stdout(output):
            self.assertEqual(trae_checkin.perform_workbuddy_checkin(post), "already_checked")

        text = output.getvalue()
        self.assertEqual(calls, ["status"])
        self.assertIn("WorkBuddy 每日签到", text)
        self.assertIn("签到前状态：今日已签到", text)
        self.assertIn("已领天数：2", text)
        self.assertIn("累计领取：200 分", text)
        self.assertIn("签到额度：100 积分", text)
        self.assertIn("签到后状态：今日已签到", text)

    def test_workbuddy_claim_success(self):
        responses = iter(
            [
                {
                    "code": 0,
                    "data": {
                        "active": True,
                        "today_checked_in": False,
                        "streak_days": 1,
                        "today_credit": 100,
                        "total_credits": 100,
                        "activity_name": "本期：项目",
                    },
                },
                {
                    "code": 0,
                    "data": {
                        "credit": 100,
                        "streak_days": 2,
                        "is_streak_day": False,
                    },
                },
                {
                    "code": 0,
                    "data": {
                        "active": True,
                        "today_checked_in": True,
                        "streak_days": 2,
                        "today_credit": 100,
                        "total_credits": 200,
                        "activity_name": "本期：项目",
                    },
                },
            ]
        )
        calls = []

        def post(action):
            calls.append(action)
            return next(responses)

        output = StringIO()
        with redirect_stdout(output):
            self.assertEqual(trae_checkin.perform_workbuddy_checkin(post), "claimed")

        text = output.getvalue()
        self.assertEqual(calls, ["status", "claim", "status"])
        self.assertIn("签到前状态：今日未签到", text)
        self.assertIn("累计领取：100 分", text)
        self.assertIn("签到成功。", text)
        self.assertIn("签到后状态：今日已签到", text)
        self.assertIn("累计领取：200 分", text)


if __name__ == "__main__":
    unittest.main()