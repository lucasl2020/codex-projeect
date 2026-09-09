// Chrome 扩展后台 Service Worker (Manifest V3)
const BRIDGE_URL = "http://127.0.0.1:8765";

// 初始化默认配置
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["enabled", "auto_cf", "auto_recaptcha", "auto_hcaptcha", "bypass_count"], (res) => {
    chrome.storage.local.set({
      enabled: res.enabled !== undefined ? res.enabled : true,
      auto_cf: res.auto_cf !== undefined ? res.auto_cf : true,
      auto_recaptcha: res.auto_recaptcha !== undefined ? res.auto_recaptcha : true,
      auto_hcaptcha: res.auto_hcaptcha !== undefined ? res.auto_hcaptcha : true,
      bypass_count: res.bypass_count !== undefined ? res.bypass_count : 0,
    });
  });
});

// 处理来自 content.js 与 popup.js 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, payload } = request;

  // 1. 状态指示与通过计数
  if (action === "captcha_solving") {
    chrome.action.setBadgeText({ text: "•••", tabId: sender?.tab?.id });
    chrome.action.setBadgeBackgroundColor({ color: "#3b82f6", tabId: sender?.tab?.id });
    sendResponse({ success: true });
    return true;
  }

  if (action === "captcha_passed") {
    const tabId = sender?.tab?.id;
    chrome.action.setBadgeText({ text: "✓", tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#22c55e", tabId });

    // 累加通过计数
    chrome.storage.local.get(["bypass_count"], (res) => {
      const count = (res.bypass_count || 0) + 1;
      chrome.storage.local.set({ bypass_count: count });
    });

    // 3 秒后自动恢复无角标状态
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "", tabId });
    }, 3000);

    sendResponse({ success: true });
    return true;
  }

  // 2. 健康检查
  if (action === "check_health") {
    fetch(`${BRIDGE_URL}/health`)
      .then((res) => res.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // 3. 求解请求转发
  if (action === "solve_recaptcha") {
    fetch(`${BRIDGE_URL}/solve_recaptcha`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (action === "solve_hcaptcha") {
    fetch(`${BRIDGE_URL}/solve_hcaptcha`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (action === "solve_hcaptcha_grid") {
    fetch(`${BRIDGE_URL}/solve_hcaptcha_grid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

