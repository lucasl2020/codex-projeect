/**
 * cf-solver.js — cf-captcha-solver HTTP API 的 Node.js 客户端
 * ============================================================
 * 封装本地 cf-captcha-server（FastAPI）的 HTTP 调用，供签到脚本等
 * 任意 Node.js 项目使用。服务启动方式：
 *
 *   cd cf_captcha_solver_pkg && python -m cf_captcha_solver.server --port 8000
 *
 * 环境变量：
 *   CF_SOLVER_URL  服务地址，默认 http://localhost:8000
 */
'use strict';

const BASE_URL = (process.env.CF_SOLVER_URL || 'http://localhost:8000').replace(/\/+$/, '');

/** 通用 HTTP 请求，返回 ApiResponse（{ success, data, error }）或 null */
async function request(path, { method = 'POST', json, timeoutMs = 45000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(BASE_URL + path, {
      method,
      headers: json ? { 'Content-Type': 'application/json' } : undefined,
      body: json ? JSON.stringify(json) : undefined,
      signal: controller.signal,
    });
    return await resp.json().catch(() => null);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 健康检查；服务在线返回 true */
async function health(timeoutMs = 2000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(`${BASE_URL}/api/health`, { signal: controller.signal });
    const data = await resp.json().catch(() => null);
    return !!(data && data.status === 'ok');
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 绕过 Cloudflare，返回 { success, strategy, cookies, user_agent, error }
 * 与 daily-rewards 的 parseCfBypassJson 结构兼容。
 */
async function bypass(url, { headless = true, timeout = 45, proxy, strategies, useCache = false, cacheTtl = 1200 } = {}) {
  const resp = await request('/api/cloudflare/bypass', {
    json: { url, headless, timeout, proxy, strategies, use_cache: useCache, cache_ttl: cacheTtl },
    timeoutMs: (timeout + 15) * 1000,
  });
  if (!resp) return { success: false, error: 'cf-solver 服务不可达' };
  const data = resp.data || {};
  return {
    success: resp.success === true,
    strategy: data.strategy || 'api',
    cookies: data.cookies && typeof data.cookies === 'object' ? data.cookies : {},
    user_agent: data.user_agent || '',
    error: resp.error || '',
  };
}

/**
 * 识别验证码（Base64 图 / 滑块背景+滑块图 / HTML）。
 * captcha_type: text / math / click_object / click_order / slide / rotate /
 *               recaptcha_v2 / recaptcha_v3 / hcaptcha / turnstile / funcaptcha / geetest / geetest_v4
 */
async function solveCaptcha({ imageBase64, captchaType, charset = '', targetText = '', bgImageBase64, sliderImageBase64, html, pageUrl = '', platform = '', apiKey = '' } = {}) {
  const resp = await request('/api/captcha/solve/json', {
    json: {
      image_base64: imageBase64,
      captcha_type: captchaType,
      charset,
      target_text: targetText,
      bg_image_base64: bgImageBase64,
      slider_image_base64: sliderImageBase64,
      html,
      page_url: pageUrl,
      platform,
      api_key: apiKey,
    },
  });
  if (!resp) return { success: false, error: 'cf-solver 服务不可达' };
  return { success: resp.success === true, ...(resp.data || {}), error: resp.error || '' };
}

/** 旋转验证码（调整方向），返回需要顺时针旋转的角度 */
async function solveRotate(imageBase64, { quantize = false } = {}) {
  return solveCaptcha({ imageBase64, captchaType: 'rotate', targetText: String(quantize) });
}

/** 从 HTML 检测验证码类型 */
async function detect(html) {
  const resp = await request('/api/captcha/detect', { json: { html } });
  if (!resp) return { success: false, error: 'cf-solver 服务不可达' };
  return { success: resp.success === true, captcha_type: resp.data?.captcha_type, error: resp.error || '' };
}

module.exports = { BASE_URL, request, health, bypass, solveCaptcha, solveRotate, detect };
