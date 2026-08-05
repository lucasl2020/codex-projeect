#!/bin/bash
# ============================================================
# curl 调用示例 - 任何能用 HTTP 的环境都适用
# ============================================================
# 前提: 先启动 API 服务
#   cf-captcha-server --port 8000
#   或: python -m cf_captcha_solver.server
# ============================================================

BASE_URL="http://localhost:8000"

echo "=========================================="
echo "1. 健康检查"
echo "=========================================="
curl -s "$BASE_URL/api/health" | python -m json.tool

echo ""
echo "=========================================="
echo "2. 检测验证码类型 (从 HTML)"
echo "=========================================="
curl -s -X POST "$BASE_URL/api/captcha/detect" \
  -H "Content-Type: application/json" \
  -d '{"html": "<div class=\"cf-turnstile\" data-sitekey=\"xxx\"></div>"}' \
  | python -m json.tool

echo ""
echo "=========================================="
echo "3. 识别文字验证码 (上传图片文件)"
echo "=========================================="
# 上传本地验证码图片
curl -s -X POST "$BASE_URL/api/captcha/solve" \
  -F "image=@captcha.png" \
  -F "captcha_type=text" \
  | python -m json.tool

echo ""
echo "=========================================="
echo "4. 识别验证码 (Base64 JSON 模式)"
echo "=========================================="
# 将图片转为 base64 后以 JSON 发送
IMAGE_B64=$(base64 -w0 captcha.png 2>/dev/null || base64 -i captcha.png)
curl -s -X POST "$BASE_URL/api/captcha/solve/json" \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\": \"$IMAGE_B64\", \"captcha_type\": \"text\"}" \
  | python -m json.tool

echo ""
echo "=========================================="
echo "5. 绕过 Cloudflare"
echo "=========================================="
curl -s -X POST "$BASE_URL/api/cloudflare/bypass" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "headless": true,
    "timeout": 30
  }' \
  | python -m json.tool

echo ""
echo "=========================================="
echo "6. 绕过 CF + 代理 + 打码平台"
echo "=========================================="
curl -s -X POST "$BASE_URL/api/cloudflare/bypass" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://protected-site.com",
    "proxy": "socks5://127.0.0.1:7890",
    "strategies": ["curl_cffi", "drissionpage"],
    "captcha_platform": "capsolver",
    "captcha_api_key": "YOUR_API_KEY"
  }' \
  | python -m json.tool
