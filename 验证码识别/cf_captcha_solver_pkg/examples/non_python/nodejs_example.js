/**
 * Node.js 调用示例
 * ================
 * 任何 Node.js 项目都可通过 HTTP 调用 cf-captcha-solver 服务
 *
 * 运行: node nodejs_example.js
 * 前提: 先启动 API 服务 → cf-captcha-server --port 8000
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8000';

// ---- 通用 HTTP 请求封装 ----
async function postJSON(endpoint, body) {
    const resp = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return resp.json();
}

async function postFile(endpoint, formData) {
    const resp = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
    });
    return resp.json();
}

// ---- 1. 健康检查 ----
async function healthCheck() {
    const resp = await fetch(`${BASE_URL}/api/health`);
    const data = await resp.json();
    console.log('[健康检查]', data);
}

// ---- 2. 检测验证码类型 ----
async function detectCaptcha() {
    const result = await postJSON('/api/captcha/detect', {
        html: '<div class="cf-turnstile" data-sitekey="0x4AAA"></div>',
    });
    console.log('[验证码检测]', result.data.captcha_type);
}

// ---- 3. 识别文字验证码（上传文件） ----
async function solveCaptchaFromFile(imagePath) {
    const formData = new FormData();
    formData.append('image', new Blob([fs.readFileSync(imagePath)]), 'captcha.png');
    formData.append('captcha_type', 'text');

    const result = await postFile('/api/captcha/solve', formData);
    console.log('[文件识别]', result.success ? result.data.answer : result.error);
}

// ---- 4. 识别验证码（Base64 JSON） ----
async function solveCaptchaFromBase64(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');

    const result = await postJSON('/api/captcha/solve/json', {
        image_base64: imageBase64,
        captcha_type: 'text',
    });
    console.log('[Base64识别]', result.success ? result.data.answer : result.error);
}

// ---- 5. 识别滑块验证码 ----
async function solveSlide(bgPath, sliderPath) {
    const bgBase64 = fs.readFileSync(bgPath).toString('base64');
    const sliderBase64 = fs.readFileSync(sliderPath).toString('base64');

    const result = await postJSON('/api/captcha/solve/json', {
        bg_image_base64: bgBase64,
        slider_image_base64: sliderBase64,
    });
    console.log('[滑块识别]', result.success ? `距离: ${result.data.answer}` : result.error);
}

// ---- 6. 绕过 Cloudflare ----
async function bypassCloudflare(url) {
    const result = await postJSON('/api/cloudflare/bypass', {
        url: url,
        headless: true,
        timeout: 30,
    });
    if (result.success) {
        console.log('[CF绕过成功] 策略:', result.data.strategy);
        console.log('  Cookies:', Object.keys(result.data.cookies));
        console.log('  UA:', result.data.user_agent);

        // 用拿到的 cookies 继续请求
        // const axios = require('axios');
        // const resp = await axios.get(url, {
        //     headers: { 'User-Agent': result.data.user_agent },
        //     cookie: result.data.cookies,
        // });
    } else {
        console.log('[CF绕过失败]', result.error);
    }
}

// ---- 主流程 ----
async function main() {
    console.log('='.repeat(50));
    console.log('cf-captcha-solver Node.js 调用示例');
    console.log('='.repeat(50));

    await healthCheck();
    await detectCaptcha();

    // 如果有图片文件则测试识别
    const captchaPath = path.join(__dirname, 'captcha.png');
    if (fs.existsSync(captchaPath)) {
        await solveCaptchaFromFile(captchaPath);
        await solveCaptchaFromBase64(captchaPath);
    } else {
        console.log('\n[跳过] 未找到 captcha.png，请放置图片后测试识别');
    }

    // CF 绕过（按需测试）
    // await bypassCloudflare('https://example.com');
}

main().catch(console.error);
