document.addEventListener("DOMContentLoaded", () => {
  const statusBadge = document.getElementById("statusBadge");
  const statusText = document.getElementById("statusText");
  const toggleEnabled = document.getElementById("toggleEnabled");
  const toggleRecaptcha = document.getElementById("toggleRecaptcha");
  const toggleHcaptcha = document.getElementById("toggleHcaptcha");
  const toggleCf = document.getElementById("toggleCf");

  // 1. 读取保存的设置与统计
  const bypassCountEl = document.getElementById("bypassCount");
  chrome.storage.local.get(["enabled", "auto_cf", "auto_recaptcha", "auto_hcaptcha", "bypass_count"], (res) => {
    toggleEnabled.checked = res.enabled !== false;
    toggleRecaptcha.checked = res.auto_recaptcha !== false;
    toggleHcaptcha.checked = res.auto_hcaptcha !== false;
    toggleCf.checked = res.auto_cf !== false;
    if (bypassCountEl) {
      bypassCountEl.textContent = res.bypass_count || 0;
    }
  });

  // 2. 绑定开关变动监听
  toggleEnabled.addEventListener("change", () => {
    chrome.storage.local.set({ enabled: toggleEnabled.checked });
  });
  toggleRecaptcha.addEventListener("change", () => {
    chrome.storage.local.set({ auto_recaptcha: toggleRecaptcha.checked });
  });
  toggleHcaptcha.addEventListener("change", () => {
    chrome.storage.local.set({ auto_hcaptcha: toggleHcaptcha.checked });
  });
  toggleCf.addEventListener("change", () => {
    chrome.storage.local.set({ auto_cf: toggleCf.checked });
  });

  // 3. 检查后台桥接器与模型健康状态
  chrome.runtime.sendMessage({ action: "check_health" }, (resp) => {
    if (resp && resp.success && resp.data && resp.data.ollama === "online") {
      statusBadge.className = "status-badge online";
      statusText.textContent = "模型在线";
    } else {
      statusBadge.className = "status-badge";
      statusText.textContent = "模型未启动";
      statusText.title = "请运行 '启动本地模型.ps1' 或 '一键安装与启动.bat'";
    }
  });
});
