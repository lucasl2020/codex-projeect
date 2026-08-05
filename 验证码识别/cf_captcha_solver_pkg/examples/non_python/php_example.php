<?php
/**
 * PHP 调用示例
 * ============
 * 任何 PHP 项目都可通过 HTTP 调用 cf-captcha-solver 服务
 *
 * 运行: php php_example.php
 * 前提: 先启动 API 服务 → cf-captcha-server --port 8000
 */

$BASE_URL = 'http://localhost:8000';

// ---- 1. 健康检查 ----
function healthCheck($baseUrl) {
    $resp = file_get_contents($baseUrl . '/api/health');
    echo "[健康检查] $resp\n";
}

// ---- 2. 检测验证码类型 ----
function detectCaptcha($baseUrl) {
    $payload = json_encode([
        'html' => '<div class="cf-turnstile" data-sitekey="xxx"></div>',
    ]);

    $ch = curl_init($baseUrl . '/api/captcha/detect');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($resp, true);
    echo "[验证码检测] type=" . $data['data']['captcha_type'] . "\n";
}

// ---- 3. 识别文字验证码（上传文件） ----
function solveFromFile($baseUrl, $imagePath) {
    $ch = curl_init($baseUrl . '/api/captcha/solve');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => [
            'image' => new CURLFile($imagePath),
            'captcha_type' => 'text',
        ],
        CURLOPT_RETURNTRANSFER => true,
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($resp, true);
    if ($data['success']) {
        echo "[文件识别] answer=" . $data['data']['answer'] . "\n";
    } else {
        echo "[文件识别] 失败: " . $data['error'] . "\n";
    }
}

// ---- 4. 识别验证码（Base64 JSON） ----
function solveFromBase64($baseUrl, $imagePath) {
    $imageBase64 = base64_encode(file_get_contents($imagePath));
    $payload = json_encode([
        'image_base64' => $imageBase64,
        'captcha_type' => 'text',
    ]);

    $ch = curl_init($baseUrl . '/api/captcha/solve/json');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($resp, true);
    if ($data['success']) {
        echo "[Base64识别] answer=" . $data['data']['answer'] . "\n";
    } else {
        echo "[Base64识别] 失败: " . $data['error'] . "\n";
    }
}

// ---- 5. 绕过 Cloudflare ----
function bypassCloudflare($baseUrl, $url) {
    $payload = json_encode([
        'url' => $url,
        'headless' => true,
        'timeout' => 30,
    ]);

    $ch = curl_init($baseUrl . '/api/cloudflare/bypass');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($resp, true);
    if ($data['success']) {
        echo "[CF绕过成功] 策略=" . $data['data']['strategy'] . "\n";
        echo "  Cookies: " . implode(', ', array_keys($data['data']['cookies'])) . "\n";
        // 用 cookies + UA 继续请求:
        // $ua = $data['data']['user_agent'];
        // $cookies = http_build_query($data['data']['cookies'], '', '; ');
    } else {
        echo "[CF绕过失败] " . $data['error'] . "\n";
    }
}

// ---- 主流程 ----
echo str_repeat('=', 50) . "\n";
echo "cf-captcha-solver PHP 调用示例\n";
echo str_repeat('=', 50) . "\n";

healthCheck($BASE_URL);
detectCaptcha($BASE_URL);

if (file_exists('captcha.png')) {
    solveFromFile($BASE_URL, 'captcha.png');
    solveFromBase64($BASE_URL, 'captcha.png');
} else {
    echo "\n[跳过] 未找到 captcha.png\n";
}

// bypassCloudflare($BASE_URL, 'https://example.com');
