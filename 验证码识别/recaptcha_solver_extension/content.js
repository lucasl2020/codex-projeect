// content.js — 注入 reCAPTCHA 挑战 iframe（bframe，all_frames）
// 职责：
//   1. 从挑战 DOM 提取题目文本 + 3x3 tile 图片 URL（按阅读顺序）
//   2. 收到底层消息后：把题目+URL 交给 background 转本地服务，拿到 0-based 格子索引
//   3. 模拟点击目标格子 → 点 Verify 按钮
// 支持：手动（popup 点「立即求解」）与自动模式（storage.autoSolve 开启后轮询监测）

const CHALLENGE_ROOT_SELECTOR = "#rc-imageselect";
const TILE_SELECTOR = "#rc-imageselect table td";
const TILE_IMG_SELECTOR = "#rc-imageselect table td img";
const PROMPT_SELECTORS = [
  "#rc-imageselect .rc-imageselect-desc-no-canonical-text",
  "#rc-imageselect .rc-imageselect-desc-no-canonical",
  "#rc-imageselect .rc-imageselect-desc",
  ".rc-imageselect-desc-text",
];
const VERIFY_SELECTORS = [
  "#recaptcha-verify-button",
  "button.rc-button-default",
  "button[id*=verify]",
];

const MAX_AUTO_ROUNDS = 5;

// ---------------------------------------------------------------------------
// 提取
// ---------------------------------------------------------------------------

function hasChallenge() {
  return !!document.querySelector(CHALLENGE_ROOT_SELECTOR);
}

function extractPrompt() {
  for (const sel of PROMPT_SELECTORS) {
    const el = document.querySelector(sel);
    const text = el && el.textContent ? el.textContent.replace(/\s+/g, " ").trim() : "";
    if (text) return text;
  }
  return "";
}

function extractTiles() {
  // 返回按 DOM 顺序排列的 tile 项数组: [{ td, url }]
  const items = [];
  const tds = Array.from(document.querySelectorAll(TILE_SELECTOR));
  for (const td of tds) {
    const img = td.querySelector("img");
    let url = "";
    if (img && img.src && img.src.startsWith("http")) {
      url = img.src;
    } else {
      // 部分题用 background-image 渲染
      const bg = (td.style && td.style.backgroundImage) || "";
      const m = bg.match(/url\(['"]?(.+?)['"]?\)/);
      if (m) url = m[1];
    }
    if (url) items.push({ td, url });
  }
  return items;
}

// ---------------------------------------------------------------------------
// 点击执行
// ---------------------------------------------------------------------------

function clickVerify() {
  for (const sel of VERIFY_SELECTORS) {
    const btn = document.querySelector(sel);
    if (btn && !btn.disabled) {
      btn.click();
      return true;
    }
  }
  return false;
}

async function clickTiles(indexes) {
  const items = extractTiles();
  for (const idx of indexes) {
    const item = items[idx];
    if (!item) continue;
    item.td.click(); // 触发 td（含 label/img）的点击事件
  }
}

// 执行一轮完整求解；返回 {solved, tiles, detail}
async function solveOnce() {
  if (!hasChallenge()) return { solved: false, reason: "no_challenge" };

  const prompt = extractPrompt();
  const items = extractTiles();
  if (!prompt) return { solved: false, reason: "no_prompt" };
  if (items.length === 0) return { solved: false, reason: "no_tiles" };
  if (items.length !== 9) return { solved: false, reason: `tile_count_${items.length}` };

  const resp = await chrome.runtime.sendMessage({
    type: "VLM_FETCH_SOLVE",
    prompt,
    imageUrls: items.map((i) => i.url),
    mode: "grid",
  });
  if (!resp || !resp.ok) {
    return { solved: false, reason: "service_error", detail: resp && resp.error };
  }

  const tiles = resp.tiles || [];
  await clickTiles(tiles);
  await new Promise((r) => setTimeout(r, 400)); // 等待 reCAPTCHA 记录点击
  clickVerify();
  return { solved: true, tiles, detail: prompt };
}

// ---------------------------------------------------------------------------
// 消息入口（popup「立即求解」/ 自动模式内部调用）
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // 仅当本 frame 确实包含挑战容器才响应；其余 frame 静默，
  // 避免嵌套 recaptcha iframe（如 anchor）抢先响应导致误报「无挑战」
  if (msg && msg.type === "RECAPTCHA_VLM_SOLVE_NOW" && hasChallenge()) {
    solveOnce()
      .then((r) => sendResponse(r))
      .catch((e) => sendResponse({ solved: false, reason: "exception", detail: String(e) }));
    return true;
  }
  return false;
});

// ---------------------------------------------------------------------------
// 自动模式：轮询检测挑战出现，自动求解（最多 MAX_AUTO_ROUNDS 轮）
// 只在当前 frame 确实属于 bframe 挑战上下文时才有意义（无挑战时零成本空转）
// ---------------------------------------------------------------------------

let autoTimer = null;
let autoSolving = false;

function startAuto() {
  if (autoTimer) return;
  autoTimer = setInterval(async () => {
    if (!hasChallenge() || autoSolving) return;
    autoSolving = true;
    try {
      for (let round = 0; round < MAX_AUTO_ROUNDS; round++) {
        const r = await solveOnce();
        if (!r.solved) break;
        // 等 verify 结果；若下一轮挑战又出现则继续
        await new Promise((res) => setTimeout(res, 2500));
        if (!hasChallenge()) break;
      }
    } finally {
      autoSolving = false;
    }
  }, 1200);
}

function stopAuto() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
  autoSolving = false;
}

async function syncAutoState() {
  const { autoSolve } = await chrome.storage.local.get({ autoSolve: false });
  if (autoSolve) startAuto();
  else stopAuto();
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.autoSolve) syncAutoState();
});
syncAutoState();
