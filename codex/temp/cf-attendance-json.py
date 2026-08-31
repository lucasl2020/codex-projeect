#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""curl_cffi 自动签到助手：绕过 Cloudflare + 直接调签到接口（不开浏览器、无需人工）。

用法: cf-attendance-json.py <board_url> --origin <origin> --cookies '<json>' [--timeout 60]
--cookies 为 Playwright context.cookies() 导出的 JSON 数组。
输出 JSON: {ok, already, message, before_quota, after_quota, error}
"""
from __future__ import annotations
import argparse
import json
import os
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0")


def payload(**kw):
    base = {"ok": False, "already": False, "message": "", "before_quota": None, "after_quota": None, "error": ""}
    base.update(kw)
    return base


def fetch_balance(requests, origin, cookies, headers, proxies, timeout):
    """GET /api/account/credit/page-1 返回当前鸡腿余额（最新流水的 balance）。"""
    try:
        r = requests.get(origin + "/api/account/credit/page-1", headers=headers,
                         cookies=cookies, impersonate="chrome", timeout=timeout, proxies=proxies)
        data = (json.loads(r.text or "{}") or {}).get("data") or []
        if not data:
            return None
        first = data[0]
        n = first[1] if isinstance(first, (list, tuple)) and len(first) >= 2 \
            else (first.get("balance") if isinstance(first, dict) else None)
        if n is None:
            return None
        f = float(n)
        return int(f) if f.is_integer() else f
    except Exception:
        return None


def is_already(text):
    return bool(re.search(r"已完成签到|请勿重复操作|今日已|今天已.*签到|完成签到|already|claimed", str(text or ""), re.I))


def is_success(text):
    return bool(re.search(r"签到成功|获得.*鸡腿|鸡腿.*成功|签到收益|成功.*鸡腿", str(text or ""), re.I))


def _port_open(host, port, timeout=0.6):
    import socket
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False


def resolve_proxy():
    p = (os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
         or os.environ.get("HTTP_PROXY") or os.environ.get("http_proxy")
         or os.environ.get("ALL_PROXY") or os.environ.get("all_proxy"))
    if p:
        return {"http": p, "https": p}
    # 无环境变量时回退到本机常用代理端口（Clash/V2Ray 等）。部分站点（如 nodeseek）
    # 直连超时，只有走代理才能访问其余额接口；deepflood 直连可用，仍按原逻辑直接请求。
    for port in ("7897", "7890", "10809", "1080"):
        if _port_open("127.0.0.1", int(port)):
            proxy = "http://127.0.0.1:" + port
            return {"http": proxy, "https": proxy}
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--origin", required=True)
    ap.add_argument("--cookies", default="[]")
    ap.add_argument("--timeout", type=int, default=60)
    args = ap.parse_args()

    try:
        from curl_cffi import requests
    except Exception as e:
        print(json.dumps(payload(error=f"curl_cffi 不可用，请先 pip install curl_cffi: {e}"), ensure_ascii=False))
        return 1

    proxies = resolve_proxy()
    origin = args.origin.rstrip("/")

    try:
        cks = json.loads(args.cookies)
    except Exception:
        cks = []
    cookies = {c["name"]: c["value"] for c in cks if c.get("name") and c.get("value") is not None}

    headers = {
        "User-Agent": UA,
        "Accept": "application/json, text/plain, */*",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": origin,
        "Referer": args.url,
    }

    # 1) 先 GET 预热 + 检测 CF 挑战 / 登录态
    before = None
    try:
        r = requests.get(args.url, headers={"User-Agent": UA, "Accept": "text/html,application/json,*/*", "Referer": origin},
                         cookies=cookies, impersonate="chrome", timeout=args.timeout, proxies=proxies)
        body = r.text or ""
        if "正在进行安全验证" in body or "Just a moment" in body or "verify you are human" in body.lower():
            print(json.dumps(payload(error="Cloudflare 验证未通过（curl_cffi 指纹被识别）"), ensure_ascii=False))
            return 1
        if "注册" in body and "登录" in body and "鸡腿" not in body and "试试手气" not in body:
            print(json.dumps(payload(error="登录状态已失效；请运行「重新登录全部网站.cmd」重新登录"), ensure_ascii=False))
            return 1
        before = fetch_balance(requests, origin, cookies, headers, proxies, args.timeout)
    except Exception as e:
        print(json.dumps(payload(error=f"GET 失败: {type(e).__name__}: {str(e)[:200]}"), ensure_ascii=False))
        return 1

    # 2) POST 签到接口
    api = origin + "/api/attendance?random=true"
    post_headers = dict(headers)
    post_headers["Content-Type"] = "application/json"
    try:
        rr = requests.post(api, headers=post_headers, json={"random": True}, cookies=cookies,
                           impersonate="chrome", timeout=args.timeout, proxies=proxies)
        txt = rr.text or ""
        try:
            d = json.loads(txt)
        except Exception:
            d = None
        msg = (d or {}).get("message") or (d or {}).get("msg") or ""
        if is_already(msg):
            print(json.dumps(payload(ok=True, already=True, message=msg or "今日已签到", before_quota=before, after_quota=before), ensure_ascii=False))
            return 0
        if (d or {}).get("success") is True or is_success(msg):
            after = fetch_balance(requests, origin, cookies, headers, proxies, args.timeout)
            print(json.dumps(payload(ok=True, message=msg or "签到成功", before_quota=before, after_quota=after), ensure_ascii=False))
            return 0
        print(json.dumps(payload(error=f"接口未确认成功: {txt[:200]}", before_quota=before), ensure_ascii=False))
        return 1
    except Exception as e:
        print(json.dumps(payload(error=f"POST 失败: {type(e).__name__}: {str(e)[:200]}", before_quota=before), ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
