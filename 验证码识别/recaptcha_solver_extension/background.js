// background.js — Service Worker
// 职责：
//   1. 抓取 reCAPTCHA 挑战 tile 图片（跨域图片在此 fetch，扩展上下文不受 CORS/混合内容限制）
//   2. 将题目 + tile 图 base64 转发给本地 recaptcha_vlm HTTP 服务
// content script 不直接连本地 http 服务（https 页面会被混合内容拦截），统一走这里中转。

const DEFAULT_SERVER = "http://127.0.0.1:8765";

// ---------------------------------------------------------------------------
// 配置读写（popup 共用）
// ---------------------------------------------------------------------------

async function getServerUrl() {
  const data = await chrome.storage.local.get({ serverUrl: DEFAULT_SERVER });
  return (data.serverUrl || DEFAULT_SERVER).trim().replace(/\/+$/, "");
}

// ---------------------------------------------------------------------------
// 网络工具
// ---------------------------------------------------------------------------

async function urlToBase64(url) {
  const resp = await fetch(url, { credentials: "omit", referrer: "" });
  if (!resp.ok) throw new Error(`图片拉取失败 HTTP ${resp.status}: ${url.slice(0, 120)}`);
  const buf = new Uint8Array(await resp.arrayBuffer());
  let bin = "";
  const CHUNK = 0x8000; // 分段 btoa，避免长字符串栈溢出
  for (let i = 0; i < buf.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, buf.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

async function solveOnServer(prompt, imageUrls, mode) {
  const server = await getServerUrl();
  const tilesB64 = [];
  for (const url of imageUrls) {
    tilesB64.push(await urlToBase64(url));
  }
  const body = { prompt, tiles: tilesB64, mode: mode || "grid" };
  const resp = await fetch(`${server}/recaptcha/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`本地服务 HTTP ${resp.status}`);
  return resp.json();
}

// ---------------------------------------------------------------------------
// 消息路由
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "VLM_FETCH_SOLVE") {
    (async () => {
      try {
        const result = await solveOnServer(msg.prompt, msg.imageUrls, msg.mode);
        if (result && result.success) {
          sendResponse({ ok: true, tiles: result.tiles || [] });
        } else {
          sendResponse({ ok: false, error: (result && result.error) || "本地服务返回失败" });
        }
      } catch (e) {
        sendResponse({ ok: false, error: String(e && e.message ? e.message : e) });
      }
    })();
    return true; // 异步响应
  }
  // 探活：popup 打开时显示服务可达性
  if (msg && msg.type === "VLM_PING") {
    (async () => {
      try {
        const server = await getServerUrl();
        const resp = await fetch(`${server}/recaptcha/health`, { method: "GET" });
        const data = await resp.json();
        sendResponse({ ok: resp.ok, server, detail: data });
      } catch (e) {
        sendResponse({ ok: false, server: await getServerUrl(), error: String(e) });
      }
    })();
    return true;
  }
  return false;
});
