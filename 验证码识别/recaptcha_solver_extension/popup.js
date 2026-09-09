// popup.js — 弹窗逻辑

const $ = (id) => document.getElementById(id);

function setStatus(text, cls) {
  const el = $("status");
  el.textContent = text;
  el.className = cls || "";
}

// 初始加载配置
(async function init() {
  const data = await chrome.storage.local.get({ serverUrl: "http://127.0.0.1:8765", autoSolve: false });
  $("serverUrl").value = data.serverUrl;
  $("autoSolve").checked = !!data.autoSolve;
})();

$("serverUrl").addEventListener("change", async (e) => {
  await chrome.storage.local.set({ serverUrl: e.target.value.trim() });
  setStatus("服务地址已保存", "ok");
});

$("autoSolve").addEventListener("change", async (e) => {
  await chrome.storage.local.set({ autoSolve: e.target.checked });
  setStatus(e.target.checked ? "自动模式已开启（检测到挑战即自动求解）" : "自动模式已关闭", "ok");
});

$("pingBtn").addEventListener("click", async () => {
  setStatus("探测中...");
  const resp = await chrome.runtime.sendMessage({ type: "VLM_PING" }).catch(() => null);
  if (resp && resp.ok) {
    setStatus(`服务可达: ${resp.server} (模型 ${(resp.detail && resp.detail.model) || "?"})`, "ok");
  } else {
    setStatus(`服务不可达: ${resp ? resp.server + " — " + resp.error : "无响应"}。请先启动 python -m recaptcha_vlm.server`, "err");
  }
});

$("solveBtn").addEventListener("click", async () => {
  setStatus("正在求解...");
  const btn = $("solveBtn");
  btn.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      setStatus("未找到活动标签页", "err");
      return;
    }
    // 广播到该 tab 的全部 frame，只有包含挑战的 bframe content script 会真正处理
    const resp = await chrome.tabs.sendMessage(tab.id, { type: "RECAPTCHA_VLM_SOLVE_NOW" }).catch(() => null);
    if (!resp) {
      setStatus("挑战框未打开或该页面无响应。请先勾选「我不是机器人」弹出图片题后重试。", "err");
    } else if (resp.solved) {
      setStatus(`已自动点击 ${resp.tiles.length} 格并提交验证。若再次弹出新题请再点一次（或开启自动模式）。`, "ok");
    } else if (resp.reason === "no_challenge") {
      setStatus("当前页面未检测到图片挑战（可能已在普通窗口/Edge 直接通过）。", "ok");
    } else {
      setStatus(`求解失败: ${resp.reason} ${resp.detail || ""}`, "err");
    }
  } catch (e) {
    setStatus("异常: " + e.message, "err");
  } finally {
    btn.disabled = false;
  }
});
