const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright-core');

const ROOT = __dirname;
const PROFILE_DIR = process.env.PROFILE_DIR || path.join(ROOT, 'browser-profile');
const STATE_FILE = process.env.STATE_FILE || path.join(ROOT, 'state.json');
const DAILY_AT = process.env.DAILY_AT || '09:00';
const HEADLESS = process.env.HEADLESS === '1';
const HOUR = 60 * 60 * 1000;
const ALL_API_HUB_EXTENSION_ID = 'lapnciffpekdengooeolaienkeoilfeo';
const ALL_API_HUB_OPTIONS_URL = `chrome-extension://${ALL_API_HUB_EXTENSION_ID}/options.html?runNow=true#autoCheckin`;
const URLS = {
  anyrouter: 'https://anyrouter.top/console/personal',
  ikuuu: 'https://ikuuu.win/user',
  chy: 'https://dy.chybenzun.top/',
  nodeseek: 'https://www.nodeseek.com/board',
  deepflood: 'https://www.deepflood.com/board',
  nodebuf: 'https://nodebuf.com/user/points',
  hvoy: 'https://www.hvoyai.com/',
  hybgzs: 'https://cdk.hybgzs.com/dashboard',
};
let nextAnyRouterRetryAt = 0;

// 任务配置（task-config.json 存 { "defaults": ["ikuuu", ...] }）。
const TASK_ORDER = [
  { task: 'allapihub', label: 'All API Hub' },
  { task: 'anyrouter', label: 'anyrouter' },
  { task: 'ikuuu', label: 'iKuuu' },
  { task: 'chy', label: 'CHY' },
  { task: 'nodeseek', label: 'NodeSeek' },
  { task: 'deepflood', label: 'DeepFlood' },
  { task: 'nodebuf', label: 'NodeBuf' },
  { task: 'hvoy', label: '禾维AI' },
  { task: 'hybgzs', label: '黑白福利站' },
];
const TASK_CONFIG_FILE = process.env.TASK_CONFIG_FILE || path.join(ROOT, 'task-config.json');

function taskNames() { return TASK_ORDER.map(item => item.task); }
function readTaskConfig() {
  try {
    const data = JSON.parse(fs.readFileSync(TASK_CONFIG_FILE, 'utf8'));
    return Array.isArray(data && data.defaults) ? data.defaults : [];
  } catch { return []; }
}
function writeTaskConfig(defaults) {
  fs.writeFileSync(TASK_CONFIG_FILE, JSON.stringify({ defaults }, null, 2), 'utf8');
}
function parseTaskTokens(input) {
  const tokens = String(input || '').split(/[,，\s]+/).map(token => token.trim()).filter(Boolean);
  const names = taskNames();
  const indexToName = new Map(TASK_ORDER.map((item, index) => [String(index + 1), item.task]));
  const result = [];
  for (const token of tokens) {
    const name = names.includes(token) ? token : indexToName.get(token);
    if (name && !result.includes(name)) result.push(name);
  }
  return result;
}
function defaultEnabledTasks() {
  const saved = readTaskConfig().filter(name => taskNames().includes(name));
  return saved.length ? saved : taskNames().slice();
}
function listTasks() {
  const defaults = defaultEnabledTasks();
  console.log('可执行任务列表：');
  TASK_ORDER.forEach((item, index) => {
    const marker = defaults.includes(item.task) ? ' [默认开启]' : '';
    console.log(`${index + 1}. ${item.label} (${item.task})${marker}`);
  });
  console.log('\n示例：--tasks 1,2,3  或  --tasks ikuuu,nodebuf');
}
function setDefaultTasks(input) {
  const tasks = parseTaskTokens(input);
  if (tasks.length === 0) {
    console.log('未识别到有效任务，已忽略。可用任务：' + taskNames().join(', '));
    return;
  }
  writeTaskConfig(tasks);
  console.log('已保存默认任务：' + TASK_ORDER.map(item => `${item.task}:${tasks.includes(item.task) ? '开' : '关'}`).join('；'));
}
function clearDefaultTasks() {
  writeTaskConfig(taskNames().slice());
  console.log('已恢复全部任务为默认。');
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ].filter(Boolean);
  const chromePath = candidates.find(candidate => fs.existsSync(candidate));
  if (!chromePath) throw new Error('Google Chrome not found; set CHROME_PATH.');
  return chromePath;
}

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
function log(task, message) {
  console.log(`[${new Date().toLocaleString()}] [${task}] ${message}`);
}
function parseJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}
function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return { tasks: {} }; }
}
function markDone(task, quota) {
  const state = readState();
  state.tasks ||= {};
  state.tasks[task] = today();
  if (quota) {
    state.quotas ||= {};
    state.quotas[task] = quota;
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}
function lastQuota(task) {
  return readState().quotas?.[task] || '';
}
function skippedMessage(task) {
  const quota = lastQuota(task);
  return quota ? '今日已完成，跳过；' + quota : '今日已完成，跳过';
}
function isDone(task) {
  return readState().tasks?.[task] === today();
}
function isLoginUrl(url) {
  return /\/(?:login|signin)(?:$|[/?#])|\/auth\/(?:login|signin)(?:$|[/?#])/i.test(url);
}
function isCloudflareChallengeText(value) {
  const text = String(value || '');
  return /just a moment|checking your browser|cf-browser-verification|challenge-platform|cdn-cgi\/challenge-platform|cf_chl_|__cf_chl|ray id|\u6b63\u5728\u8fdb\u884c\u5b89\u5168\u9a8c\u8bc1|\u8bf7\u7a0d\u5019|turnstile/i.test(text);
}
function parseCfBypassJson(text) {
  const data = parseJson(String(text || '').trim());
  if (!data || typeof data !== 'object') return { success: false, error: 'invalid bypass json' };
  return {
    success: data.success === true,
    strategy: data.strategy || '',
    user_agent: data.user_agent || data.userAgent || '',
    cookies: data.cookies && typeof data.cookies === 'object' ? data.cookies : {},
    error: data.error || '',
  };
}
function defaultCfBypassHelperPath() {
  return process.env.CF_BYPASS_HELPER
    || path.join(ROOT, 'cf-bypass-json.py');
}
async function runLocalCfBypass(url, {
  helperPath = defaultCfBypassHelperPath(),
  pythonPath = process.env.PYTHON_PATH || 'python',
  headless = HEADLESS,
  timeoutMs = 45000,
  spawnImpl = spawn,
  fsApi = fs,
} = {}) {
  // 优先走本地 HTTP API 服务（cf-captcha-server），失败回退 spawn Python helper
  let cfSolver = null;
  try { cfSolver = require('./cf-solver'); } catch { cfSolver = null; }
  if (cfSolver && await cfSolver.health(2000)) {
    const api = await cfSolver.bypass(url, {
      headless,
      timeout: Math.max(10, Math.floor(timeoutMs / 1000)),
    });
    if (api && api.success) return api;
  }
  if (!helperPath || !fsApi.existsSync(helperPath)) {
    return { success: false, error: 'local cf_bypass helper not found' };
  }
  const args = [helperPath, url, '--timeout', String(Math.max(10, Math.floor(timeoutMs / 1000))), '--json'];
  if (!headless) args.push('--no-headless');
  const child = spawnImpl(pythonPath, args, { windowsHide: true });
  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', chunk => { stdout += String(chunk); });
  child.stderr?.on('data', chunk => { stderr += String(chunk); });
  const cod = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('cf_bypass timeout'));
    }, timeoutMs + 5000);
    child.once('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('close', code => {
      clearTimeout(timer);
      resolve(code);
    });
  }).catch(error => ({ error }));
  if (cod && cod.error) return { success: false, error: cod.error.message || String(cod.error) };
  // Prefer last JSON object in stdout
  const match = String(stdout).match(/\{[\s\S]*\}\s*$/);
  const parsed = parseCfBypassJson(match ? match[0] : stdout);
  if (!parsed.success) {
    parsed.error = parsed.error || stderr.trim() || ('cf_bypass exit ' + cod);
  }
  return parsed;
}
async function applyCfBypassCookies(context, targetUrl, bypass) {
  if (!bypass?.success || !bypass.cookies || typeof context?.addCookies !== 'function') return false;
  const host = new URL(targetUrl).hostname;
  const domain = '.' + host;
  const cfNames = /^(cf_clearance|__cf_bm|cf_chl_[a-z0-9_]*|__cf_chl_[a-z0-9_]*)$/i;
  const cookies = Object.entries(bypass.cookies)
    .filter(([name, value]) => cfNames.test(name) && value != null && String(value).length)
    .map(([name, value]) => ({ name, value: String(value), domain, path: '/' }));
  if (!cookies.length) return false;
  if (typeof context.clearCookies === 'function') {
    for (const { name } of cookies) {
      await context.clearCookies({ domain: host, name });
      await context.clearCookies({ domain, name });
    }
  }
  await context.addCookies(cookies);
  return true;
}
async function findChyClaimButton(page) {
  return page.locator('a[href="/claim"], a[href$="/claim"], button[data-action="claim"], [data-claim]').first();
}
async function isChyLoggedOutPage(page) {
  const body = await page.locator('body').innerText().catch(() => '');
  if (/登录即可获取|使用 LinuxDO 登录|请先登录/.test(body)) return true;
  const loginLink = await page.locator('a[href="/login"], a[href$="/login"]').first().count().catch(() => 0);
  return loginLink > 0;
}
// CDP 可读取封闭 Shadow DOM；仅在 Cloudflare 验证 frame 内定位真实复选框。
async function clickClosedTurnstile(page) {
  if (typeof page.frames !== 'function') return false;
  for (const frame of page.frames()) {
    let url;
    try { url = new URL(frame.url()); } catch { continue; }
    if (url.hostname !== 'challenges.cloudflare.com') continue;
    let session;
    try {
      session = await page.context().newCDPSession(frame).catch(() => page.context().newCDPSession(page));
      const { root } = await session.send('DOM.getDocument', { depth: -1, pierce: true });
      const children = node => [...(node.children || []), ...(node.shadowRoots || []), ...(node.contentDocument ? [node.contentDocument] : [])];
      const findDocument = node => {
        if (node.documentURL === frame.url()) return node;
        for (const child of children(node)) { const found = findDocument(child); if (found) return found; }
        return null;
      };
      const doc = findDocument(root);
      if (!doc) continue;
      const findCheckbox = node => {
        const attrs = node.attributes || [];
        const attr = name => { const i = attrs.indexOf(name); return i >= 0 ? attrs[i + 1] : ''; };
        if ((node.nodeName === 'INPUT' && attr('type') === 'checkbox') || attr('role') === 'checkbox') return node;
        for (const child of children(node)) { const found = findCheckbox(child); if (found) return found; }
        return null;
      };
      const checkbox = findCheckbox(doc);
      if (!checkbox) continue;
      const { object } = await session.send('DOM.resolveNode', { nodeId: checkbox.nodeId });
      try {
        const { result } = await session.send('Runtime.callFunctionOn', {
          objectId: object.objectId, returnByValue: true,
          functionDeclaration: `function () {
            if (this.checked || this.disabled || this.getAttribute('aria-checked') === 'true') return null;
            let el = this;
            for (let i = 0; el && i < 3; i++, el = el.parentElement) {
              const r = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              if (r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none')
                return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
            }
            return null;
          }`,
        });
        if (!result.value) continue;
        const element = await frame.frameElement();
        const box = await element.boundingBox();
        await element.dispose();
        if (!box || box.width <= 0 || box.height <= 0) continue;
        await page.mouse.click(box.x + result.value.x, box.y + result.value.y);
        return true;
      } finally {
        await session.send('Runtime.releaseObject', { objectId: object.objectId }).catch(() => {});
      }
    } catch {
      // frame 导航或重新挂载时留给下一轮重试。
    } finally {
      if (session) await session.detach().catch(() => {});
    }
  }
  return false;
}
async function tryClickTurnstile(page) {
  if (typeof page.frames !== 'function') return false;
  for (const frame of page.frames()) {
    try {
      if (new URL(frame.url()).hostname !== 'challenges.cloudflare.com') continue;
      const box = frame.locator('input[type="checkbox"], [role="checkbox"]').first();
      if (await box.isVisible() && !(await box.isChecked())) {
        await box.click({ timeout: 2000 });
        return true;
      }
    } catch {}
  }
  return clickClosedTurnstile(page);
}

// 覆盖页面空闲、冷却等待和接口等待期间，避免只在签到按钮流程处理 CF。
const hybgzsCfWatchers = new WeakMap();
function watchHybgzsCf(page) {
  let stopped = false;
  let timer;
  let active = Promise.resolve();
  const poll = () => {
    active = (async () => {
      if (await tryClickTurnstile(page)) log('hybgzs', 'CF：已自动点击验证组件，等待网站放行。');
    })().catch(error => log('hybgzs', 'CF 检查失败：' + error.message)).finally(() => {
      if (!stopped) timer = setTimeout(poll, 2000);
    });
  };
  hybgzsCfWatchers.set(page, true);
  poll();
  return async () => {
    stopped = true;
    clearTimeout(timer);
    await active;
    hybgzsCfWatchers.delete(page);
  };
}

async function ensureCloudflareCleared(page, {
  url,
  context,
  task = 'page',
  bypassCloudflare,
  headless = HEADLESS,
  waitMs = 12000,
  skipBypass = false,
} = {}) {
  const readChallenge = async () => {
    const title = await page.title?.().catch?.(() => '') || '';
    const body = await page.locator('body').innerText().catch(() => '');
    // 不再匹配整页 HTML：SPA 常驻的 cdn-cgi/challenge-platform precursor 脚本会永久命中挑战关键字，
    // 导致“已通过验证”后仍被误判为挑战中。改用标题/正文文本 + 可见 Turnstile iframe 判断。
    const hasTurnstile = await page
      .locator('iframe[src*="challenges.cloudflare.com"]')
      .first().count().catch(() => 0) > 0;
    return {
      title,
      body,
      challenged: isCloudflareChallengeText(title) || isCloudflareChallengeText(body) || hasTurnstile,
    };
  };
  let state = await readChallenge();
  if (!state.challenged) return state;

  // First give the current real Chrome page a chance to auto-pass.
  const waitBudget = Number.isFinite(waitMs) ? Math.max(0, waitMs) : 12000;
  if (waitBudget > 0) {
    const deadline = Date.now() + waitBudget;
    log(task, 'detected Cloudflare challenge; waiting current page to clear');
    while (Date.now() < deadline) {
      await page.waitForTimeout?.(1500);
      state = await readChallenge();
      if (!state.challenged) {
        log(task, 'Cloudflare cleared by current browser session');
        return state;
      }
    }
  } else {
    log(task, 'detected Cloudflare challenge; skip in-page wait');
  }

  if (await tryClickTurnstile(page)) {
    log(task, 'Turnstile checkbox clicked; waiting for verification');
    const turnstileDeadline = Date.now() + 20000;
    while (Date.now() < turnstileDeadline) {
      await page.waitForTimeout?.(1500);
      state = await readChallenge();
      if (!state.challenged) {
        log(task, 'Cloudflare cleared by Turnstile auto-click');
        return state;
      }
    }
    log(task, 'Turnstile auto-click did not clear challenge');
  }

  if (skipBypass) {
    log(task, 'skip generic bypass (Turnstile not auto-cleared); return for caller to handle');
    return state;
  }

  log(task, 'Cloudflare still present; trying local bypass/captcha helper');
  const bypass = bypassCloudflare
    ? await bypassCloudflare(url)
    : await runLocalCfBypass(url, { headless: false });
  if (!bypass?.success) {
    throw new Error('Cloudflare 安全验证未通过' + (bypass?.error ? '：' + bypass.error : '') +
      '；请先在浏览器中完成一次人工验证后重试');
  }
  await applyCfBypassCookies(context, url, bypass);
  if (typeof page.goto === 'function') {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  } else if (typeof page.reload === 'function') {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  }
  await page.waitForTimeout?.(3000);
  state = await readChallenge();
  if (state.challenged) {
    throw new Error('Cloudflare \u7ed5\u8fc7\u540e\u4ecd\u5904\u4e8e\u5b89\u5168\u9a8c\u8bc1\u9875\uff1b\u7b56\u7565=' + (bypass.strategy || 'unknown'));
  }
  log(task, 'Cloudflare cleared via ' + (bypass.strategy || 'helper'));
  return state;
}
function messageOf(data) {
  if (!data || typeof data !== 'object') return '';
  return String(data.message ?? data.msg ?? data.error ?? data.data?.message ?? '');
}
function anyRouterSuccess(data) {
  const message = messageOf(data);
  if (data?.success === true || data?.ret === 1) return true;
  if (/\u5df2\u7b7e\u5230|\u4eca\u65e5\u5df2|already.*(sign|check)/i.test(message)) return true;
  return /\u7b7e\u5230\u6210\u529f|sign.?in.*success/i.test(message);
}
function anyRouterAlreadyDone(data) {
  return /\u5df2\u7b7e\u5230|\u4eca\u65e5\u5df2|already.*(sign|check)/i.test(messageOf(data));
}
function ikuuuSuccess(data) {
  return data?.ret === 1 || /\u5df2(?:\u7ecf)?\u7b7e\u5230|\u7b7e\u5230\u8fc7|\u7b7e\u5230\u6210\u529f|already/i.test(messageOf(data));
}
function attendanceAlreadyDone(data, text = '') {
  const message = messageOf(data) || String(text).trim();
  return /\u5df2(?:\u7ecf)?\u9886\u53d6|\u5df2(?:\u7ecf)?\u7b7e\u5230|\u4eca\u65e5\u5df2|\u4eca\u5929\u5df2.*\u7b7e\u5230|\u5b8c\u6210\u7b7e\u5230|already|claimed|completed.*(?:sign|check)/i.test(message);
}
function attendanceSuccess(status, data, text = '') {
  const rawText = String(text).trim();
  const message = messageOf(data) || rawText;
  if (!data && /^</.test(rawText)) return false;
  if (status === 401 || status === 403) return false;
  if (/\u5931\u8d25|\u9519\u8bef|\u672a\u767b\u5f55|\u672a.*\u6210\u529f|\u65e0\u6cd5.*\u6210\u529f|unauthorized|forbidden/i.test(message)) return false;
  if (attendanceAlreadyDone(data, rawText)) return true;
  return status >= 200 && status < 300 && (
    data?.success === true || data?.code === 0 || data?.ret === 1 ||
    /\u5df2\u9886\u53d6|\u5df2\u7b7e\u5230|\u7b7e\u5230\u6210\u529f|\u7b7e\u5230\u5b8c\u6210|\u83b7\u5f97.*\u9e21\u817f|\u9e21\u817f|\u6210\u529f|already|claimed|success/i.test(message)
  );
}
function nodeBufCheckInSuccess(status, data) {
  return status >= 200 && status < 300 && (
    data?.summary?.checkedInToday === true ||
    data?.dashboard?.summary?.checkedInToday === true
  );
}
function extractQuota(value) {
  const wanted = new Set(['quota', 'balance', 'credit', 'credits']);
  const seen = new Set();
  function walk(node, depth) {
    if (!node || depth > 5 || typeof node !== 'object' || seen.has(node)) return undefined;
    seen.add(node);
    for (const [key, item] of Object.entries(node)) {
      if (wanted.has(key.toLowerCase())) {
        const number = Number(item);
        if (Number.isFinite(number)) return number;
      }
    }
    for (const item of Object.values(node)) {
      const result = walk(item, depth + 1);
      if (result !== undefined) return result;
    }
    return undefined;
  }
  return walk(value, 0);
}
function extractAttendanceQuota(value) {
  const wanted = ['quota', 'balance', 'credits', 'credit'];
  const seen = new Set();
  function numberOf(item) {
    if (typeof item === 'number') return Number.isFinite(item) ? item : undefined;
    if (typeof item !== 'string' || !item.trim()) return undefined;
    const number = Number(item.replace(/,/g, '').trim());
    return Number.isFinite(number) ? number : undefined;
  }
  function walk(node, depth) {
    if (!node || depth > 5 || typeof node !== 'object' || seen.has(node)) return undefined;
    seen.add(node);
    for (const wantedKey of wanted) {
      for (const [key, item] of Object.entries(node)) {
        if (key.toLowerCase() === wantedKey) {
          const number = numberOf(item);
          if (number !== undefined) return number;
        }
      }
    }
    for (const item of Object.values(node)) {
      const result = walk(item, depth + 1);
      if (result !== undefined) return result;
    }
    return undefined;
  }
  return walk(value, 0);
}
function extractAttendanceQuotaFromText(value) {
  const text = String(value || '').replace(/,/g, '').replace(/\s+/g, ' ');
  const labelled = /(?:\u5f53\u524d|\u6211\u7684|\u5269\u4f59|\u603b\u8ba1|\u4f59\u989d)?\s*(?:\u9e21\u817f|\u79ef\u5206|quota|balance|credits?|points?)\s*(?:\u4f59\u989d|\u6570|\u603b\u6570)?\s*[:\uff1a\s]+(-?\d+(?:\.\d+)?)/i.exec(text);
  if (labelled) return Number(labelled[1]);
  const reverse = /(-?\d+(?:\.\d+)?)\s*(?:\u4e2a)?\s*(?:\u9e21\u817f|\u79ef\u5206|quota|balance|credits?|points?)/gi;
  for (const match of text.matchAll(reverse)) {
    const prefix = text.slice(Math.max(0, match.index - 4), match.index);
    if (/\u53ea\u8981\s*$/.test(prefix)) continue;
    return Number(match[1]);
  }
  return undefined;
}
function formatAttendanceQuota(value) {
  return Number.isFinite(value) ? String(value) : '';
}
function attendanceQuotaSummary(before, after) {
  if (!Number.isFinite(before) && !Number.isFinite(after)) return '';
  if (Number.isFinite(before) && Number.isFinite(after) && before !== after) {
    return '\u7b7e\u5230\u524d\u989d\u5ea6\uff1a' + before +
      '\uff1b\u7b7e\u5230\u540e\u989d\u5ea6\uff1a' + after +
      '\uff1b\u989d\u5ea6\u53d8\u5316\uff1a' + (after - before);
  }
  const current = Number.isFinite(after) ? after : before;
  return '\u5f53\u524d\u989d\u5ea6\uff1a' + current;
}
function extractTrafficQuotaFromText(value) {
  const text = String(value || '').replace(/,/g, '').replace(/\s+/g, ' ');
  const match = /(?:\u5269\u4f59|\u53ef\u7528|\u603b)?\s*\u6d41\u91cf\s*[:\uff1a]?\s*(-?\d+(?:\.\d+)?)\s*(TB|GB|MB|KB|T|G|M|K)?/i.exec(text)
    || /(-?\d+(?:\.\d+)?)\s*(TB|GB|MB|KB|T|G|M|K)\s*(?:\u6d41\u91cf)?/i.exec(text);
  if (!match) return undefined;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return undefined;
  const unit = String(match[2] || 'MB').toUpperCase();
  if (unit === 'TB' || unit === 'T') return amount * 1024 * 1024;
  if (unit === 'GB' || unit === 'G') return amount * 1024;
  if (unit === 'KB' || unit === 'K') return amount / 1024;
  return amount;
}
function formatTrafficQuota(mb) {
  if (!Number.isFinite(mb)) return '';
  if (Math.abs(mb) >= 1024 * 1024) {
    const value = mb / (1024 * 1024);
    return (Number.isInteger(value) ? value : Number(value.toFixed(2))) + ' TB';
  }
  if (Math.abs(mb) >= 1024) {
    const value = mb / 1024;
    return (Number.isInteger(value) ? value : Number(value.toFixed(2))) + ' GB';
  }
  return (Number.isInteger(mb) ? mb : Number(mb.toFixed(2))) + ' MB';
}
function trafficQuotaSummary(before, after) {
  if (!Number.isFinite(before) && !Number.isFinite(after)) return '';
  if (Number.isFinite(before) && Number.isFinite(after)) {
    return '\u7b7e\u5230\u524d\u989d\u5ea6\uff1a' + formatTrafficQuota(before) +
      '\uff1b\u7b7e\u5230\u540e\u989d\u5ea6\uff1a' + formatTrafficQuota(after) +
      '\uff1b\u989d\u5ea6\u53d8\u5316\uff1a' + formatTrafficQuota(after - before);
  }
  const current = Number.isFinite(after) ? after : before;
  return '\u5f53\u524d\u989d\u5ea6\uff1a' + formatTrafficQuota(current);
}
function extractNodeBufAccountPoints(data) {
  const candidates = [
    data?.summary?.points,
    data?.dashboard?.summary?.points,
    data?.summary?.current,
    data?.dashboard?.summary?.current,
    data?.summary?.balance,
    data?.dashboard?.summary?.balance,
  ];
  for (const item of candidates) {
    if (item === undefined || item === null || item === '') continue;
    const number = typeof item === 'number' ? item : Number(String(item).replace(/,/g, '').trim());
    if (Number.isFinite(number)) return number;
  }
  return undefined;
}
async function readPageTrafficQuota(page) {
  const body = await page.locator('body').innerText().catch(() => '');
  return extractTrafficQuotaFromText(body);
}
async function waitForPageTrafficQuota(page, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  let stable = 0;
  while (Date.now() < deadline) {
    const quota = await readPageTrafficQuota(page).catch(() => undefined);
    if (quota !== undefined) {
      if (quota === last) {
        stable += 1;
        if (stable >= 2) return quota;
      } else {
        stable = 0;
      }
      last = quota;
    }
    await page.waitForTimeout?.(500);
  }
  return last;
}
// 从签到接口响应里直接抽取额度（MB），作为页面额度读取失败时的回退。
function extractApiQuota(data) {
  if (!data || typeof data !== 'object') return undefined;
  const msg = String(data.msg || data.message || '');
  const match = msg.match(/(\d+(?:\.\d+)?)\s*(TB|GB|MB|KB|T|G|M|K)/i);
  if (match) {
    const amount = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === 'TB' || unit === 'T') return amount * 1024 * 1024;
    if (unit === 'GB' || unit === 'G') return amount * 1024;
    if (unit === 'KB' || unit === 'K') return amount / 1024;
    return amount;
  }
  if (data.quota !== undefined) return Number(data.quota);
  if (data.data && typeof data.data === 'object') {
    if (data.data.quota !== undefined) return Number(data.data.quota);
    if (data.data.balance !== undefined) return Number(data.data.balance);
  }
  return undefined;
}
async function responseJson(response) {
  return response ? parseJson(await response.text().catch(() => '')) : null;
}
function isProfileInUseError(error) {
  const message = String(error?.message || error);
  return /ProcessSingleton|profile.*(?:already in use|in use by)|Opening in existing browser session|正在运行的浏览器会话/i.test(message)
    || (/launchPersistentContext/.test(message) && /Target page, context or browser has been closed/.test(message)
      && /process did exit: exitCode=0/.test(message));
}
async function launchContext(headless = HEADLESS, {
  launch = (...args) => chromium.launchPersistentContext(...args),
  wait = sleep,
  now = Date.now,
  waitMs = 120000,
} = {}) {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  const options = {
    executablePath: findChrome(),
    headless,
    viewport: null,
    acceptDownloads: false,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: ['--disable-blink-features=AutomationControlled'],
  };
  const deadline = now() + waitMs;
  let notified = false;
  while (true) {
    let context;
    try {
      context = await launch(PROFILE_DIR, options);
    } catch (error) {
      if (!isProfileInUseError(error)) throw error;
      if (!notified) {
        log('browser', `签到浏览器配置正在使用中：${PROFILE_DIR}`);
        log('browser', '请关闭之前的签到/重新登录浏览器窗口；正在运行的签到请等待它结束。程序最多等待 2 分钟并自动重试。');
        notified = true;
      }
      if (now() >= deadline) {
        const busy = new Error('浏览器配置仍被占用，本次未执行签到。关闭之前的签到/重新登录浏览器窗口后，再运行本脚本。登录数据已保留。');
        busy.code = 'BROWSER_PROFILE_BUSY';
        throw busy;
      }
      await wait(Math.min(3000, Math.max(0, deadline - now())));
      continue;
    }
    try {
      await applyStealth(context);
      if (notified) log('browser', '浏览器配置已释放，启动成功，继续执行签到。');
      return context;
    } catch (error) {
      await context.close().catch(() => {});
      throw error;
    }
  }
}

// 仅隐藏 webdriver 自动化标志。cdk.hybgzs.com 走 Cloudflare 托管挑战（"Just a moment"，无复选框），
// 只要浏览器环境干净即可自动通过；伪造 navigator.plugins/languages 反而会被 challenge-platform 判定为机器人，
// 导致挑战永久卡住——因此这里只做最保守的 webdriver 隐藏。
async function applyStealth(context) {
  await context.addInitScript(() => {
    try {
      Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => undefined, configurable: true });
    } catch {}
  });
}

async function anyRouterRequest(page, url, method = 'GET') {
  return page.evaluate(async ({ url, method }) => {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user')); } catch {}
    const headers = {};
    if (user?.id) headers['New-Api-User'] = String(user.id);
    const res = await fetch(url, {
      method, headers, credentials: 'include', signal: AbortSignal.timeout(15000),
    });
    return { status: res.status, text: await res.text() };
  }, { url, method });
}
async function runAnyRouter(context) {
  const page = await context.newPage();
  try {
    // 页面可能自动签到；监听完整登录过程，避免重复提交。
    let signInResponse = null;
    page.on('response', response => {
      const url = new URL(response.url());
      if (url.origin === new URL(URLS.anyrouter).origin && url.pathname === '/api/user/sign_in'
        && response.request().method() === 'POST') signInResponse = response;
    });
    await page.goto(URLS.anyrouter, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const deadline = Date.now() + (HEADLESS ? 15000 : 180000);
    let selfData = null;
    let prompted = false;
    let reason = '登录状态未就绪';
    do {
      const self = await anyRouterRequest(page, '/api/user/self').catch(() => null);
      selfData = parseJson(self?.text);
      if (self?.status === 200 && selfData?.success === true && selfData?.data?.id) break;
      signInResponse = null;
      await tryClickTurnstile(page);
      reason = messageOf(selfData) || (self ? `HTTP ${self.status}，未返回有效用户信息` : '页面跳转或请求超时');
      if (!prompted && !HEADLESS) {
        log('anyrouter', '程序会自动尝试 CF 验证；若登录已过期，请完成账号登录。最多等待 3 分钟；' + reason);
        await page.bringToFront();
        prompted = true;
      }
      if (Date.now() >= deadline) throw new Error('Any Router 登录未确认：' + reason + '；请运行「重新登录全部网站.cmd」。');
      await page.waitForTimeout(2000);
    } while (true);

    // 给页面自身的自动签到请求留出完成时间，再决定是否补发。
    await page.waitForTimeout(2500);
    let data = await responseJson(signInResponse);
    let status = signInResponse ? signInResponse.status() : 0;
    const staleLogin = status === 401 || /未登录|登录.*(?:失效|无效|过期)|用户.*(?:无效|不匹配)|unauthorized|invalid.*user/i.test(messageOf(data));
    if (!signInResponse || staleLogin) {
      const result = await anyRouterRequest(page, '/api/user/sign_in', 'POST');
      data = parseJson(result.text);
      status = result.status;
    }
    const ok = status >= 200 && status < 300 && (anyRouterSuccess(data) || anyRouterAlreadyDone(data));
    if (ok) {
      const latest = await anyRouterRequest(page, '/api/user/self').catch(() => null);
      const latestData = parseJson(latest?.text);
      if (latest?.status === 200 && latestData?.success === true) selfData = latestData;
    }
    const quotaRaw = extractQuota(selfData);
    const quota = Number.isFinite(quotaRaw) ? '额度：$' + (quotaRaw / 500000).toFixed(2) : '';
    const baseMessage = messageOf(data) || (ok ? '签到成功' : `签到接口 HTTP ${status}，未返回有效结果`);
    const message = baseMessage + (quota ? '；' + quota : '');
    log('anyrouter', message);
    return { ok, message, quota };
  } finally {
    await page.close();
  }
}
async function runIkuuu(context) {
  const page = await context.newPage();
  try {
    await page.goto(URLS.ikuuu, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (isLoginUrl(page.url())) throw new Error('Not logged in; run the setup command first.');
    const beforeQuota = await waitForPageTrafficQuota(page);
    const finish = async (message, directQuota) => {
      let afterQuota;
      if (typeof page.reload === 'function') {
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
      }
      afterQuota = await waitForPageTrafficQuota(page).catch(() => undefined);
      const apiQuota = directQuota !== undefined ? directQuota : extractApiQuota(data);
      let quota;
      if (beforeQuota !== undefined || afterQuota !== undefined) {
        quota = trafficQuotaSummary(beforeQuota, afterQuota);
      } else if (apiQuota !== undefined) {
        quota = '当前额度：' + formatTrafficQuota(apiQuota);
      }
      if (quota) log('ikuuu', quota);
      return { ok: true, message: message + (quota ? '\uff1b' + quota : ''), quota: quota || '' };
    };
    const result = await page.evaluate(async () => {
      const response = await fetch('/user/checkin', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      return { status: response.status, text: await response.text() };
    });
    const data = parseJson(result.text);
    if (!data && /^\s*(<(!doctype|html)|<\?xml)/i.test(result.text)) {
      throw new Error('ikuuu 登录已失效（checkin 返回登录页），请运行「重新登录全部网站.cmd」后重试。');
    }
    log('ikuuu', `POST /user/checkin HTTP ${result.status}${messageOf(data) ? `; ${messageOf(data)}` : ''}`);
    if (ikuuuSuccess(data)) return finish(messageOf(data) || '\u7b7e\u5230\u6210\u529f');

    if (result.status >= 400 || !data || data.ret === undefined) {
      const button = page.locator('button, a, [role="button"]').filter({ hasText: /\u7b7e\u5230/ }).first();
      if (await button.count()) {
        await button.click({ timeout: 15000 });
        await page.waitForTimeout(1500);
        const body = await page.locator('body').innerText().catch(() => '');
        if (/\u7b7e\u5230\u6210\u529f|\u5df2\u7b7e\u5230|already/i.test(body)) {
          return finish('\u9875\u9762\u7b7e\u5230\u6210\u529f');
        }
      }
    }
    return false;
  } finally {
    await page.close();
  }
}

async function tryNodeBufAutoLogin(page, { timeout = 15000, headless = HEADLESS } = {}) {
  if (!isLoginUrl(page.url())) return true;
  if (headless) {
    throw new Error('NodeBuf 登录状态已失效；HEADLESS=1 无法使用 Chrome 密码管理器自动填充，请改用有界面模式。');
  }

  const turnstile = page.locator(
    'iframe[src*="challenges.cloudflare.com"], input[name="cf-turnstile-response"], .cf-turnstile',
  ).first();
  if (await turnstile.count()) {
    throw new Error('NodeBuf 登录页需要 Turnstile 验证；请在有界面 Chrome 中人工完成后重试。');
  }

  try {
    await page.waitForFunction(() => {
      const email = document.querySelector('input[name="email"][autocomplete="email"]');
      const password = document.querySelector(
        'input[name="password"][autocomplete="current-password"]',
      );
      const submit = document.querySelector('form button[type="submit"]');
      return Boolean(email?.value && password?.value && submit && !submit.disabled);
    }, null, { timeout });
  } catch {
    if (await turnstile.count()) {
      throw new Error('NodeBuf 登录页需要 Turnstile 验证；请在有界面 Chrome 中人工完成后重试。');
    }
    throw new Error(
      'NodeBuf 登录页未检测到 Chrome 自动填充的账号密码；请确认 browser-profile 已保存 NodeBuf 密码，或运行“重新登录全部网站.cmd”。',
    );
  }

  if (await turnstile.count()) {
    throw new Error('NodeBuf 登录页需要 Turnstile 验证；请在有界面 Chrome 中人工完成后重试。');
  }

  await page.locator('form button[type="submit"]').first().click({ timeout });
  try {
    await page.waitForURL(url => !isLoginUrl(url.toString()), { timeout });
    return true;
  } catch {
    if (await page.locator('input[name="twoFactorCode"]').first().count()) {
      throw new Error('NodeBuf 登录需要人工完成二步验证；本次不会继续签到。');
    }
    if (await turnstile.count()) {
      throw new Error('NodeBuf 登录页需要 Turnstile 验证；请在有界面 Chrome 中人工完成后重试。');
    }
    throw new Error('NodeBuf 自动提交登录后仍未进入积分页；请人工检查登录状态。');
  }
}

async function runNodeBuf(context) {
  const page = await context.newPage();
  try {
    await page.goto(URLS.nodebuf, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (isLoginUrl(page.url())) await tryNodeBufAutoLogin(page);

    const dashboardResult = await page.evaluate(async () => {
      const response = await fetch('/api/account/points', {
        credentials: 'include',
        headers: { Accept: 'application/json, text/plain, */*' },
      });
      return { status: response.status, text: await response.text() };
    });
    const dashboard = parseJson(dashboardResult.text);
    if (dashboardResult.status === 401 || dashboardResult.status === 403) {
      throw new Error('NodeBuf \u672a\u767b\u5f55\uff1b\u8bf7\u5148\u8fd0\u884c\u201c\u91cd\u65b0\u767b\u5f55\u5168\u90e8\u7f51\u7ad9.cmd\u201d\u3002');
    }
    const beforeQuota = extractNodeBufAccountPoints(dashboard);
    if (nodeBufCheckInSuccess(dashboardResult.status, dashboard)) {
      log('nodebuf', 'GET /api/account/points\uff1a\u4eca\u65e5\u5df2\u7b7e\u5230');
      const quota = attendanceQuotaSummary(beforeQuota, beforeQuota);
      return { ok: true, message: '\u4eca\u65e5\u5df2\u7b7e\u5230' + (quota ? '\uff1b' + quota : ''), quota: quota || '' };
    }
    if (dashboardResult.status < 200 || dashboardResult.status >= 300 || !dashboard?.summary) {
      throw new Error(`NodeBuf \u79ef\u5206\u4fe1\u606f\u63a5\u53e3\u5f02\u5e38\uff08HTTP ${dashboardResult.status}\uff09\u3002`);
    }

    const checkInResult = await page.evaluate(async () => {
      const response = await fetch('/api/account/points/check-in', {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json, text/plain, */*' },
      });
      return { status: response.status, text: await response.text() };
    });
    const checkIn = parseJson(checkInResult.text);
    const reward = checkIn?.result;
    log('nodebuf', `POST /api/account/points/check-in HTTP ${checkInResult.status}` +
      (reward?.granted ? `\uff1b\u83b7\u5f97 ${reward.points} \u79ef\u5206\uff1b\u8fde\u7eed ${reward.streak} \u5929` : ''));
    if (!nodeBufCheckInSuccess(checkInResult.status, checkIn)) return false;

    let afterQuota = extractNodeBufAccountPoints(checkIn);
    if (!Number.isFinite(afterQuota)) {
      const refreshed = await page.evaluate(async () => {
        const response = await fetch('/api/account/points', {
          credentials: 'include',
          headers: { Accept: 'application/json, text/plain, */*' },
        });
        return { status: response.status, text: await response.text() };
      });
      afterQuota = extractNodeBufAccountPoints(parseJson(refreshed.text));
    }
    const quota = attendanceQuotaSummary(beforeQuota, afterQuota);
    if (quota) log('nodebuf', quota);
    return {
      ok: true,
      message: (reward?.granted
        ? `\u7b7e\u5230\u6210\u529f\uff1b\u83b7\u5f97 ${reward.points} \u79ef\u5206`
        : '\u7b7e\u5230\u6210\u529f') + (quota ? '\uff1b' + quota : ''),
      quota: quota || '',
    };
  } finally {
    await page.close();
  }
}

// --- hvoy.ai：每日签到（需过腾讯滑块验证，自动识别缺口并拟人拖动） ---
const HVOY_HOLE_HELPER = path.join(ROOT, '_hole_x.py');
const HVOY_BG_PATH = path.join(ROOT, '_hv_bg.jpg');
const HVOY_PIECE_PATH = path.join(ROOT, '_hv_piece.png');

// 调用 python cv2 脚本定位拼图缺口（返回自然坐标中心 + 自然宽度）
function hvDetectHole(bgPath, piecePath) {
  const { execFileSync } = require('node:child_process');
  try {
    const out = execFileSync(process.env.PYTHON_PATH || 'python', [HVOY_HOLE_HELPER, bgPath, piecePath], {
      encoding: 'utf8', windowsHide: true, timeout: 30000,
    });
    const line = String(out).split('\n').find(l => l.startsWith('{'));
    return line ? parseJson(line) : null;
  } catch {
    return null;
  }
}

// 拟人拖拽：缓动轨迹 + 随机微抖动 + 末端小幅回退修正
async function hvDragSlider(page, fromX, fromY, toX) {
  const D = toX - fromX;
  await page.mouse.move(fromX, fromY, { steps: 6 });
  await page.waitForTimeout(120 + Math.random() * 160);
  await page.mouse.down();
  await page.waitForTimeout(80 + Math.random() * 80);
  const N = 40;
  let lastX = fromX;
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const x = fromX + D * ease;
    const y = fromY + (Math.random() - 0.5) * 2.2;
    await page.mouse.move(x, y, { steps: 1 + Math.floor(Math.random() * 3) });
    await page.waitForTimeout(6 + Math.random() * 14);
    lastX = x;
  }
  await page.mouse.move(lastX - 2 - Math.random() * 2, fromY, { steps: 2 });
  await page.waitForTimeout(40 + Math.random() * 60);
  await page.mouse.move(toX, fromY, { steps: 2 });
  await page.waitForTimeout(120 + Math.random() * 120);
  await page.mouse.up();
}

// 解一次腾讯滑块，成功触发拖动返回 true
async function hvSolveCaptcha(page) {
  const block = page.locator('.tencent-captcha-dy__slider-block');
  await block.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (!(await block.count())) return false;

  const geo = await page.evaluate(() => {
    const q = s => document.querySelector(s);
    const bg = q('.tencent-captcha-dy__verify-bg-img');
    const fg = q('.tencent-captcha-dy__fg-item');
    const bl = q('.tencent-captcha-dy__slider-block');
    if (!bg || !fg || !bl) return null;
    const bgm = getComputedStyle(bg).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    const fgm = getComputedStyle(fg).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    const rect = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
    return {
      bgUrl: bgm ? bgm[1] : null,
      pieceUrl: fgm ? fgm[1] : null,
      bgRect: rect(bg), fgRect: rect(fg), blockRect: rect(bl),
      fgLeft: parseFloat(getComputedStyle(fg).left) || 0,
    };
  });
  if (!geo || !geo.bgUrl) return false;

  const bgResp = await page.request.get(geo.bgUrl).catch(() => null);
  if (!bgResp || !bgResp.ok()) return false;
  fs.writeFileSync(HVOY_BG_PATH, await bgResp.body());

  let hasPiece = false;
  if (geo.pieceUrl) {
    const pieceResp = await page.request.get(geo.pieceUrl).catch(() => null);
    if (pieceResp && pieceResp.ok()) {
      fs.writeFileSync(HVOY_PIECE_PATH, await pieceResp.body());
      hasPiece = true;
    }
  }

  const hole = hvDetectHole(HVOY_BG_PATH, hasPiece ? HVOY_PIECE_PATH : null);
  if (!hole || hole.error || !hole.cx || !hole.W) {
    log('hvoy', '缺口识别失败：' + JSON.stringify(hole));
    return false;
  }
  log('hvoy', `缺口定位 method=${hole.method} cx=${hole.cx} cy=${hole.cy} conf=${hole.conf ?? '-'}`);

  const scale = geo.bgRect.w / hole.W;
  const drag = hole.cx * scale - (geo.fgLeft + geo.fgRect.w / 2);
  if (drag <= 0 || drag > geo.bgRect.w) {
    log('hvoy', `拖拽距离越界：${drag.toFixed(1)}px`);
    return false;
  }
  log('hvoy', `拖拽 ${drag.toFixed(1)}px（scale=${scale.toFixed(4)}）`);

  const bx = geo.blockRect.x + geo.blockRect.w / 2;
  const by = geo.blockRect.y + geo.blockRect.h / 2;
  await hvDragSlider(page, bx, by, bx + drag);
  return true;
}

async function dismissHvoyNotice(page) {
  const notice = page.locator('[role="dialog"][aria-labelledby="region-restriction-notice-title"]');
  if (!(await notice.isVisible())) return false;
  await notice.getByRole('button', { name: '我知道了', exact: true }).click({ timeout: 3000 });
  await notice.waitFor({ state: 'hidden', timeout: 3000 });
  log('hvoy', '已关闭地区限制说明弹窗');
  return true;
}
async function clickHvoyButton(page, button) {
  await dismissHvoyNotice(page);
  try {
    await button.click({ timeout: 5000 });
  } catch (error) {
    // 弹窗可能在页面加载后延迟出现；仅在确实关闭它时重试。
    if (!(await dismissHvoyNotice(page))) throw error;
    await button.click({ timeout: 5000 });
  }
}
async function runHvoy(context) {
  const page = await context.newPage();
  try {
    await page.goto(URLS.hvoy, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await dismissHvoyNotice(page);
    const before = await page.evaluate(async () => {
      const session = await fetch('/__free-token/session', { credentials: 'include', signal: AbortSignal.timeout(10000) }).then(r => r.json()).catch(() => null);
      const st = await fetch('/__free-token/daily-check-in', { credentials: 'include', signal: AbortSignal.timeout(10000) }).then(r => r.json()).catch(() => null);
      return { session, st };
    });

    if (!before.session || before.session.authenticated !== true) {
      throw new Error('hvoy 未登录；请先运行「重新登录全部网站.cmd」。');
    }
    if (before.st && before.st.checkedIn === true) {
      const points = before.session.user?.pointsBalance;
      const quota = Number.isFinite(points) ? '积分：' + points : '';
      return { ok: true, message: '今日已签到' + (quota ? '；' + quota : ''), quota: quota || '' };
    }

    // 点击「每日签到」触发验证码；若弹出确认框再点确认
    const btn = page.locator('button').filter({ hasText: /每日签到/ }).first();
    await clickHvoyButton(page, btn);
    await page.waitForTimeout(1500);
    const confirm = page.locator('button').filter({ hasText: /确认签到|立即签到/ }).first();
    if (await confirm.isVisible()) await clickHvoyButton(page, confirm);

    // 解滑块（失败则刷新验证码后重试一次）
    let solved = false;
    for (let i = 0; i < 2 && !solved; i++) {
      solved = await hvSolveCaptcha(page);
      if (!solved) {
        const refresh = page.locator('[class*="refresh"]').first();
        if (await refresh.count()) await refresh.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(2500);
      }
    }

    // 等待签到结果（checkedIn 或积分增加）
    const beforePoints = before.session.user?.pointsBalance;
    const deadline = Date.now() + 12000;
    let points = null;
    let done = false;
    while (Date.now() < deadline) {
      const cur = await page.evaluate(async () => {
        const session = await fetch('/__free-token/session', { credentials: 'include' }).then(r => r.json()).catch(() => null);
        const st = await fetch('/__free-token/daily-check-in', { credentials: 'include' }).then(r => r.json()).catch(() => null);
        return { points: session?.user?.pointsBalance, checkedIn: st?.checkedIn === true };
      }).catch(() => null);
      if (cur && (cur.checkedIn || (Number.isFinite(cur.points) && Number.isFinite(beforePoints) && cur.points > beforePoints))) {
        points = cur.points;
        done = true;
        break;
      }
      await page.waitForTimeout(800);
    }

    if (!done) {
      throw new Error('hvoy 签到未确认（滑块可能未通过）。' + (solved ? '已尝试拖动。' : '滑块未出现。'));
    }
    const quota = '积分：' + points;
    return { ok: true, message: '签到成功；' + quota, quota };
  } finally {
    await page.close();
  }
}

// --- cdk.hybgzs.com：每日签到 + 大转盘，验证由当前浏览器会话完成 ---
async function hybgzsStats(page) {
  const res = await page.evaluate(async () => {
    const r = await fetch('/api/dashboard/stats', { credentials: 'include', signal: AbortSignal.timeout(15000) });
    return { status: r.status, text: await r.text() };
  });
  return { status: res.status, data: parseJson(res.text) };
}
function clickWaitPost(page, matcher, timeout = 45000) {
  return page.waitForResponse(
    res => res.request().method() === 'POST' && res.url().includes(matcher),
    { timeout },
  ).catch(() => null);
}
// 点击 CapDialog 里无文字的圆环按钮（onClick=em），触发 <cap-widget> 自动 PoW 验证。
// ef 会校验：webdriver/UA 无头、isTrusted、navigator.userActivation.isActive，且 nonce 就绪才继续。
// 用真实鼠标点击（CDP 可信事件）确保 isTrusted=true + userActivation 激活。
async function clickCapStart(page) {
  if (typeof page?.locator !== 'function' || !page?.mouse) return false;
  try {
    const ring = page.locator('button.flex-shrink-0.aspect-square').first();
    if (await ring.count().catch(() => 0) === 0) return false;
    await ring.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    if (!(await ring.isVisible().catch(() => false))) return false;

    // 若弹窗已经在计算验证、验证中或已成功提交，不再重复点击打断
    const dialogText = await page.locator('[role="dialog"]').first().innerText().catch(() => '');
    if (/正在计算|正在验证|验证成功|正在提交/i.test(dialogText)) {
      return false;
    }

    // 等待 nonce 准备就绪，按钮移除 disabled 状态
    for (let i = 0; i < 30; i++) {
      const disabled = await ring.isDisabled().catch(() => true);
      if (!disabled) break;
      await page.waitForTimeout?.(200);
    }
    const box = await ring.boundingBox().catch(() => null);
    if (!box || box.width <= 0 || box.height <= 0) return false;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout?.(50);
    await page.mouse.up();
    return true;
  } catch {
    return false;
  }
}

// 在当前会话自动操作验证组件（同时支持网站自带的绮问演算/CapDialog 与 Cloudflare Turnstile），以实际业务响应为完成依据。
async function hybgzsCapFlow(page, triggerBtn, finalMatcher, { timeoutMs = 90000 } = {}) {
  let finished = false;
  let resp = null;
  const finalPromise = clickWaitPost(page, finalMatcher, timeoutMs).then(value => {
    resp = value;
    finished = true;
    return value;
  });

  // 监听网站自身的 CapDialog challenge（获取验证 nonce）
  const capChallengePromise = clickWaitPost(page, '/api/cap/challenge', timeoutMs);

  // 点击触发按钮（签到或抽奖）——若失败则直接向外抛出（符合测试与错误定位要求）
  await triggerBtn.click({ timeout: 15000 });
  log('hybgzs', '已触发操作，等待验证组件放行或业务响应。');

  // 等待网站自身验证准备就绪，或直接由最终接口响应
  const initialWinner = await Promise.race([
    finalPromise.then(r => (r ? '__DIRECT_DONE__' : null)),
    capChallengePromise.then(r => (r ? '__CAP_CHALLENGE__' : null)),
    (page.waitForTimeout ? page.waitForTimeout(2000) : sleep(2000)).then(() => null),
  ]);

  if (finished && resp) {
    return { resp, capError: '' };
  }

  if (initialWinner === '__DIRECT_DONE__') {
    return { resp, capError: '' };
  }

  let capError = '';
  if (initialWinner === '__CAP_CHALLENGE__') {
    const capResp = await capChallengePromise;
    if (capResp) {
      const status = typeof capResp.status === 'function' ? capResp.status() : 200;
      let cd = null;
      if (typeof capResp.json === 'function') {
        try { cd = await capResp.json(); } catch {}
      }
      if (status !== 200 || (cd && cd.success !== true)) {
        capError = String(cd?.error || cd?.message || ('HTTP ' + status));
      }
    }
  }

  // 尝试点击网站自带的 CapDialog 圆环按钮
  if (capError) return { resp: null, capError };
  let capStarted = false;
  if (!capError) {
    if (page.waitForTimeout) await page.waitForTimeout(300);
    capStarted = await clickCapStart(page);
    if (capStarted) {
      log('hybgzs', '已自动点击绮问演算验证按钮，正在计算 PoW 并等待放行。');
    }
  }

  const deadline = Date.now() + timeoutMs;
  while (!finished && Date.now() < deadline) {
    // 1) 检查网站自身验证弹窗：未启动时启动；已启动时仅在出现失败/重试提示时再次点击
    let capClicked = false;
    if (!capStarted) {
      capClicked = await clickCapStart(page);
      if (capClicked) {
        capStarted = true;
        log('hybgzs', '已自动点击绮问演算验证按钮，正在计算 PoW 并等待放行。');
      }
    } else if (typeof page.locator === 'function') {
      const needsRetry = await page.locator('[role="dialog"]').first().innerText()
        .then(t => /失败|重试|重新验证/i.test(t))
        .catch(() => false);
      if (needsRetry) {
        capStarted = false;
      }
    }

    // 2) 检查 Cloudflare Turnstile 复选框
    const cfClicked = hybgzsCfWatchers.has(page) ? false : await tryClickTurnstile(page).catch(() => false);
    if (cfClicked) {
      log('hybgzs', '已自动点击 CF 复选框，等待验证结果。');
    }

    const waitStep = (capClicked || cfClicked || capStarted) ? 5000 : 2000;
    await Promise.race([
      finalPromise,
      page.waitForTimeout ? page.waitForTimeout(waitStep) : sleep(waitStep),
    ]);
  }

  return { resp, capError: resp ? '' : (capError || '验证自动处理超时，未收到业务响应') };
}
async function waitHybgzsReady(page, { waitMs = 90000 } = {}) {
  const deadline = Date.now() + waitMs;
  let prompted = false;
  do {
    if (isLoginUrl(page.url())) throw new Error('cdk.hybgzs.com 未登录；请运行「重新登录全部网站.cmd」。');
    const stats = await hybgzsStats(page).catch(() => ({ status: 0, data: null }));
    if (stats.status === 401) throw new Error('cdk.hybgzs.com 未登录；请运行「重新登录全部网站.cmd」。');
    if (stats.status === 200 && stats.data?.success === true && stats.data?.data
      && typeof stats.data.data === 'object' && !Array.isArray(stats.data.data)) return stats;
    const error = stats.data?.error?.message || messageOf(stats.data) || `HTTP ${stats.status}`;
    if (/未登录|登录.*(?:失效|过期)|unauthorized/i.test(error)) {
      throw new Error('cdk.hybgzs.com 未登录；请运行「重新登录全部网站.cmd」。');
    }
    if (stats.data && !/人机验证|安全验证|captcha|turnstile|cloudflare/i.test(error)) {
      throw new Error('黑白福利站统计接口未成功：' + error);
    }
    if (Date.now() >= deadline) throw new Error('CF 自动验证或统计接口等待超时。');
    if (!prompted) {
      log('hybgzs', '检测到验证，程序正在当前会话自动处理 CF。');
      prompted = true;
    }
    const clicked = hybgzsCfWatchers.has(page) ? false : await tryClickTurnstile(page);
    await page.waitForTimeout(clicked ? 8000 : 2000);
  } while (true);
}
async function doHybgzsCheckin(page) {
  await page.goto('https://cdk.hybgzs.com/gas-station/checkin', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const btn = page.locator('button').filter({ hasText: /立即签到|^签到$/ }).first();
  await btn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  if (typeof btn.isVisible === 'function' && !(await btn.isVisible())) return { result: 'fail', message: '未找到签到按钮' };
  const { resp, capError } = await hybgzsCapFlow(page, btn, '/api/checkin');
  if (capError) return { result: 'fail', message: '人机验证获取失败：' + capError };
  if (!resp) return { result: 'fail', message: '人机验证未自动通过（未发起签到请求）' };
  let data = null;
  try { data = await resp.json(); } catch {}
  const status = resp.status();
  if (status >= 200 && status < 300 && data?.success === true) {
    return { result: 'success', message: '签到成功' };
  }
  const err = String(data?.error || data?.message || '');
  if (/已签|签到过|今日已|已完成/.test(err)) return { result: 'done', message: '今日已签到' };
  return { result: 'fail', message: '签到失败：' + (err || ('HTTP ' + status)) };
}
async function doHybgzsWheel(page, spins) {
  await page.goto('https://cdk.hybgzs.com/entertainment/wheel', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const spin = page.locator('[data-testid="wheel-spin-button"]').first();
  await spin.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  if (typeof spin.isVisible === 'function' && !(await spin.isVisible())) return { result: 'fail', message: '未找到抽奖按钮' };

  let remaining = spins;
  const prizes = [];
  while (remaining > 0) {
    const { resp, capError } = await hybgzsCapFlow(page, spin, '/api/wheel');
    if (capError) return { result: 'fail', message: '人机验证获取失败：' + capError };
    if (!resp) return { result: 'fail', message: '抽奖未触发请求（第' + (prizes.length + 1) + '次）' };
    let data = null;
    try { data = await resp.json(); } catch {}
    const status = resp.status();
    const err = String(data?.error || data?.message || '');
    if (status >= 200 && status < 300 && data?.success === true) {
      const prize = data?.data?.prize;
      prizes.push(prize?.name || '奖励');
    } else if (/次数|用完|无.*次/.test(err)) {
      break;
    } else {
      return { result: 'fail', message: '抽奖失败：' + (err || ('HTTP ' + status)) };
    }
    const next = Number(data?.data?.remainingSpins);
    if (Number.isFinite(next) && next >= remaining) {
      return { result: 'fail', message: '转盘剩余次数未减少，停止重复抽奖（已抽 ' + prizes.length + ' 次）' };
    }
    remaining = Number.isFinite(next) ? next : remaining - 1;
    if (remaining > 0) {
      const readyAt = Date.now() + 10000;
      while (!(await spin.isEnabled())) {
        if (Date.now() >= readyAt) return { result: 'fail', message: '转盘动画结束后按钮仍不可用，结束本轮' };
        await page.waitForTimeout(300);
      }
    }
  }
  if (!prizes.length) return { result: 'done', message: '今日免费次数已用完' };
  return { result: 'success', message: '共抽' + prizes.length + '次：' + prizes.join('、') + (remaining > 0 ? '（剩余' + remaining + '次）' : '') };
}
// 通用同源 fetch（带登录态），用于无需「欧阳淇淇」验证的接口。
async function hybgzsApi(page, url, opts = {}) {
  const started = Date.now();
  const result = await page.evaluate(async (arg) => {
    const { u, o } = arg;
    try {
      const r = await fetch(u, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...o, signal: AbortSignal.timeout(15000) });
      let data = null; try { data = await r.json(); } catch {}
      return { status: r.status, data };
    } catch (e) { return { status: -1, data: null, error: String(e) }; }
  }, { u: url, o: opts });
  log('hybgzs', `${url}：HTTP ${result.status}，耗时 ${((Date.now() - started) / 1000).toFixed(1)} 秒`);
  if (result.status < 0 || !result.data) {
    throw new Error(`${url} 请求超时、网络异常或未返回 JSON（HTTP ${result.status}），停止本轮以免重复提交。`);
  }
  if (result.status === 401) throw new Error('黑白福利站登录失效，请重新登录。');
  return result;
}
// 开福袋（周年福袋）：活动结束/今日已开则跳过，否则免费开 1 次。
async function doHybgzsGiftbox(page) {
  const st = await hybgzsApi(page, '/api/giftbox/status');
  const d = st.data?.data || {};
  if (d.isActivityEnded) return { parts: ['福袋：活动已结束'] };
  const rem = Number(d.remainingAttempts ?? 0);
  if (rem <= 0) return { parts: ['福袋：今日已开'] };
  const r = await hybgzsApi(page, '/api/giftbox/open', { method: 'POST', body: JSON.stringify({ boxIndex: 0 }) });
  if (r.data?.success) {
    const w = r.data?.data || {};
    let label = '福袋：开启成功';
    if (w.rewardType === 'quota') label += '（额度 +$' + (Number(w.quotaAmount || 0) / 500000).toFixed(2) + '）';
    else if (w.rewardType === 'vip') label += '（VIP +' + (w.vipDays || 0) + '天）';
    else if (w.rewardType === 'card') label += '（卡牌' + (w.cardName ? ' ' + w.cardName : '') + '）';
    return { parts: [label] };
  }
  return { parts: ['福袋：' + String(r.data?.error || '开启失败')] };
}
// 抽卡：优先十连抽消耗今日免费次数（dailyFreeLimit），零头单抽；免费/付费由后端 freeRemaining 自动判断。
async function doHybgzsCards(page) {
  const st = await hybgzsApi(page, '/api/cards/draw/status');
  let free = Number(st.data?.limits?.freeRemaining ?? 0);
  if (free <= 0) return { parts: ['抽卡：今日免费次数已用完'] };
  let drawn = 0, legendary = 0, epic = 0, failures = 0;
  while (free > 0) {
    const drawType = free >= 10 ? 'ten' : 'single';
    const drawCount = drawType === 'ten' ? 10 : 1;
    const r = await hybgzsApi(page, '/api/cards/draw', {
      method: 'POST',
      body: JSON.stringify({ type: drawType }),
    });
    if (!r.data?.success) {
      const err = String(r.data?.error?.message || r.data?.error || '失败');
      if (/频繁|稍后|429|limit|rate/i.test(err) && failures < 3) {
        failures++;
        const waitMs = failures * 8000;
        log('hybgzs', `抽卡触发频控（${err}），等待 ${waitMs / 1000} 秒后重试第 ${failures} 次...`);
        await page.waitForTimeout?.(waitMs);
        continue;
      }
      return { parts: ['抽卡：' + err + '（已抽 ' + drawn + ' 次，剩余 ' + free + ' 次）'] };
    }
    failures = 0;
    drawn += drawCount;
    free -= drawCount;
    for (const c of (Array.isArray(r.data.cards) ? r.data.cards : [])) {
      const rar = c?.rarity;
      if (rar === 'legendary' || rar === '传说') legendary++;
      else if (rar === 'epic' || rar === '史诗') epic++;
    }
    if (free > 0) await page.waitForTimeout?.(2500);
  }
  return { parts: ['抽卡：免费抽 ' + drawn + ' 次' + (legendary ? '，传说 ' + legendary : '') + (epic ? '，史诗 ' + epic : '')] };
}
// 从「今日诗词」API 取一句诗用作漂流瓶小纸条；失败或过短时回退固定文案。
async function fetchJinriShiciNote() {
  const fallback = '这是一条自动漂流的问候，祝你好运连连。';
  try {
    const r = await fetch('https://v1.jinrishici.com/all.json', { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return fallback;
    const j = await r.json();
    const content = String(j?.content || '').trim();
    if (!content) return fallback;
    // 小纸条校验 ≥10「汉字等价」（中文=1，其它=0.5），不足则补作者出处兜底。
    const han = [...content].reduce((s, ch) => s + (ch.charCodeAt(0) > 127 ? 1 : 0.5), 0);
    const note = han >= 10 ? content : (content + '——' + (j.author || '') + (j.origin ? '《' + j.origin + '》' : ''));
    return note.slice(0, 200);
  } catch {
    return fallback;
  }
}
// 漂流瓶：捡几次就丢几个（1:1，不丢满），每瓶放 $10 额度、匿名、一句新诗；捡瓶每天 1 次，丢/捡均有冷却。
async function doHybgzsDriftBottle(page) {
  const settings = await hybgzsApi(page, '/api/drift-bottle/settings');
  const usage = settings.data?.data?.usage || {};
  const pickRemaining = Number(usage.pickRemaining ?? 0);
  const parts = [];

  if (pickRemaining <= 0) {
    parts.push('漂流瓶：今日已捡');
    return { ok: true, parts };
  }

  // 丢瓶：捡几次丢几个（解锁捡瓶资格），每瓶 $10、匿名、随机诗；遇冷却/限流等待重试。
  let threw = 0;
  let cooldownWaited = false;
  for (let i = 0; i < pickRemaining; i++) {
    const note = await fetchJinriShiciNote();
    const thr = await hybgzsApi(page, '/api/drift-bottle/throw', {
      method: 'POST',
      body: JSON.stringify({ isAnonymous: true, noteContent: note, amountUsd: 10, cardId: null, cardIsSP: false }),
    });
    if (!thr.data?.success) {
      const err = String(thr.data?.error || '失败');
      if (/频繁|稍后|冷却|限/.test(err) && !cooldownWaited) {
        cooldownWaited = true;
        log('hybgzs', '漂流瓶冷却：等待 60 秒后重试一次。');
        await page.waitForTimeout(60000); i--; continue;
      }
      parts.push('丢瓶：' + err);
      break;
    }
    threw++;
    await page.waitForTimeout?.(2000);
  }
  if (threw > 0) parts.push('丢瓶：成功 ' + threw + ' 次');

  // 捡瓶（每天 1 次；冷却是「等待 1 分钟」）
  let picked = false;
  for (let t = 0; t < 2 && !picked; t++) {
    const pk = await hybgzsApi(page, '/api/drift-bottle/pick', { method: 'POST', body: JSON.stringify({ scope: 'world' }) });
    if (pk.data?.success) { picked = true; parts.push('捡瓶：成功'); break; }
    if (pk.data?.code === 'PICK_COOLDOWN' && !cooldownWaited) {
      cooldownWaited = true;
      log('hybgzs', '捡瓶冷却：等待 60 秒后重试一次。');
      await page.waitForTimeout(60000); continue;
    }
    parts.push('捡瓶：' + String(pk.data?.error || '失败'));
    break;
  }
  if (!picked && !parts.some(p => p.startsWith('捡瓶'))) parts.push('捡瓶：冷却超时未成功');

  return { ok: picked, parts };
}
// 农场：照料（一键务农）→ 收成熟作物 → 解锁新地块 → 种植复种 → 偷菜（按体力和每日次数上限循环「随机访问陌生人 → 一键偷菜」）。
async function doHybgzsFarm(page) {
  const parts = [];

  // 1) 照料：清除口渴/杂草/虫害等负面状态，减少收菜减产
  const care = await hybgzsApi(page, '/api/farm/care/all', { method: 'POST', body: JSON.stringify({}) });
  if (care.data?.success && Number(care.data?.processed ?? 0) > 0) {
    parts.push('农场照料：处理 ' + care.data.processed + ' 处');
  }

  // 2) 收菜：一键收获所有成熟作物
  const crops = await hybgzsApi(page, '/api/farm/crops');
  const cropList = Array.isArray(crops.data?.data) ? crops.data.data : (Array.isArray(crops.data?.crops) ? crops.data.crops : []);
  const mature = cropList.filter(c => c.isMature && !c.isHarvested).length;
  if (mature > 0) {
    let h = await hybgzsApi(page, '/api/farm/harvest-all', { method: 'POST', body: JSON.stringify({ destroyIfFull: false }) });
    if (!h.data?.success && /仓库已满/.test(String(h.data?.error?.message || h.data?.error || ''))) {
      const up = await hybgzsApi(page, '/api/farm/warehouse/upgrade', { method: 'POST' }).catch(() => ({}));
      if (up.data?.success) {
        parts.push('农场仓库：自动扩容升级');
        h = await hybgzsApi(page, '/api/farm/harvest-all', { method: 'POST', body: JSON.stringify({ destroyIfFull: false }) });
      }
    }
    if (h.data?.success) {
      const d = h.data?.data || {};
      const total = d.harvestedBySeedId
        ? Object.values(d.harvestedBySeedId).reduce((s, n) => s + Number(n || 0), 0)
        : (d.harvestedCount ?? mature);
      let label = '农场收菜：收 ' + (d.harvestedCount ?? mature) + ' 块地（+ ' + total + ' 个作物）';
      if (d.experience?.levelUp) label += '，等级升至 ' + d.experience.newLevel;
      parts.push(label);
    } else {
      parts.push('农场收菜：' + String(h.data?.error?.message || h.data?.error || '收获失败'));
    }
  } else {
    parts.push('农场收菜：无成熟作物');
  }

  // 3) 解锁新地块：每次运行解锁 1 块（消耗余额，渐进解锁避免一次花太多）
  const pl = await hybgzsApi(page, '/api/farm/plots');
  const nu = pl.data?.data?.nextUnlock;
  if (nu?.canUnlock) {
    const un = await hybgzsApi(page, '/api/farm/plots/unlock', { method: 'POST', body: JSON.stringify({ plotIndex: nu.plotIndex }) });
    if (un.data?.success) {
      parts.push('农场解锁：第 ' + (Number(nu.plotIndex) + 1) + ' 块地已解锁');
    } else {
      parts.push('农场解锁：' + String(un.data?.error?.message || un.data?.error || '失败'));
    }
  }

  // 4) 种植：优先用库存种子免费复种（按单位时间收益从高到低）；库存不足再买收益最高的种子种满
  const cropsNow = await hybgzsApi(page, '/api/farm/crops');
  const rc = cropsNow.data || {};
  const plantedNow = (Array.isArray(rc.data) ? rc.data : (Array.isArray(rc.crops) ? rc.crops : [])).length;
  const maxSlots = Number(rc.maxSlots ?? rc.baseSlots ?? 0);
  let freeSlots = maxSlots - plantedNow;
  if (freeSlots > 0) {
    const seedsResp = await hybgzsApi(page, '/api/farm/seeds');
    const seedList = Array.isArray(seedsResp.data?.seeds) ? seedsResp.data.seeds : [];
    const rate = s => (Number(s.harvestQuantity || 0) * Number(s.harvestValue || 0)) / Math.max(1, Number(s.growthTime || 1));
    const sorted = seedList.filter(s => s.isEnabled !== false).sort((a, b) => rate(b) - rate(a));

    const inv = await hybgzsApi(page, '/api/farm/inventory');
    const items = Array.isArray(inv.data?.data) ? inv.data.data : (inv.data?.inventory || []);
    const stock = new Map(items.map(it => [String(it.seedId), Number(it.quantity || 0)]));

    const doPlant = async (s, qty) => {
      const p = await hybgzsApi(page, '/api/farm/plant-batch', { method: 'POST', body: JSON.stringify({ seedId: s.id, quantity: qty }) });
      if (!p.data?.success) {
        parts.push('农场种植：' + String(p.data?.error?.message || p.data?.error || '失败'));
        return false;
      }
      const n = Number(p.data?.data?.plantedCount ?? qty);
      freeSlots -= n;
      parts.push('农场种植：' + s.name + ' × ' + n);
      return true;
    };

    // 阶段一：有库存的种子免费复种（收益从高到低）
    for (const s of sorted) {
      if (freeSlots <= 0) break;
      const st = stock.get(String(s.id)) || 0;
      if (st <= 0) continue;
      if (!(await doPlant(s, Math.min(st, freeSlots)))) continue;
    }
    // 阶段二：库存种完仍缺，买收益最高的可用种子种满（多级回退，避免因等级不足留空）
    if (freeSlots > 0 && sorted.length > 0) {
      for (const s of sorted) {
        if (freeSlots <= 0) break;
        const ok = await doPlant(s, freeSlots);
        if (ok) break;
      }
    }
    if (freeSlots > 0) parts.push('农场种植：剩 ' + freeSlots + ' 块地空置');
  } else if (plantedNow > 0) {
    parts.push('农场种植：' + plantedNow + ' 块地生长中');
  }

  // 5) 偷菜：按剩余体力和每日次数上限循环
  const en = await hybgzsApi(page, '/api/farm/energy/status');
  const d = en.data?.data || {};
  const energy = Number(d.currentEnergy ?? 0);
  const cost = Number(d.energyCostPerSteal ?? 5);
  const dailyLeft = Number(d.dailyStealLimit ?? 15) - Number(d.dailyStealCount ?? 0);
  let budget = d.canSteal === false ? 0 : Math.min(Math.floor(energy / cost), dailyLeft);
  if (budget > 0) {
    let stolen = 0, stolenCrops = 0, failures = 0;
    const stealDeadline = Date.now() + 45000;
    for (let guard = 0; budget > 0 && guard < 25 && Date.now() < stealDeadline; guard++) {
      const tg = await hybgzsApi(page, '/api/farm/steal/stranger/target', { method: 'POST' });
      const sid = tg.data?.data?.stealSessionId;
      const strangerId = tg.data?.data?.stranger?.id;
      if (!tg.data?.success || !sid || !strangerId) {
        if (++failures >= 3) { parts.push('农场偷菜：连续 3 次获取目标失败，结束本轮'); break; }
        await page.waitForTimeout(2000); continue;
      }
      const au = await hybgzsApi(page, '/api/farm/steal/stranger/auto', {
        method: 'POST',
        body: JSON.stringify({ strangerId, stealSessionId: sid }),
      });
      if (!au.data?.success) {
        const err = String(au.data?.error?.message || au.data?.error || '');
        if (/体力|次数|energy|limit/i.test(err)) break;
        if (++failures >= 3) { parts.push('农场偷菜：连续 3 次失败，结束本轮'); break; }
        // 已被偷光 → 换目标重试；操作频繁(429) → 加长等待后重试
        await page.waitForTimeout?.(/频繁|稍后/.test(err) ? 6000 : 2500);
        continue;
      }
      failures = 0;
      stolen++;
      stolenCrops += (Array.isArray(au.data?.stolenCrops) ? au.data.stolenCrops : []).reduce((s, c) => s + Number(c.quantity || 0), 0);
      budget--;
      await page.waitForTimeout?.(2500);
    }
    parts.push('农场偷菜：完成 ' + stolen + ' 次' + (stolenCrops ? '（' + stolenCrops + ' 棵）' : ''));
  } else if (dailyLeft <= 0) {
    parts.push('农场偷菜：今日次数已用完');
  } else {
    parts.push('农场偷菜：体力不足（' + energy + '/' + cost + '，今日剩余 ' + dailyLeft + ' 次）');
  }

  return { parts };
}
async function withPageDeadline(page, action, timeoutMs) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`黑白福利站执行超过 ${timeoutMs / 1000} 秒，本轮未完成；已停止该页面，继续其他任务。`));
      // 真正关闭执行页面，防止超时后仍在后台提交操作。
      void page.close().catch(() => {});
    }, timeoutMs);
  });
  try { return await Promise.race([Promise.resolve().then(action), deadline]); }
  finally { clearTimeout(timer); }
}
async function runHybgzs(context) {
  const page = await context.newPage();
  return withPageDeadline(page, () => runHybgzsPage(page), 360000);
}
async function runHybgzsPage(page) {
  const stopCf = watchHybgzsCf(page);
  const started = Date.now();
  const step = async (label, action) => {
    const start = Date.now();
    log('hybgzs', label + '：开始');
    try { return await action(); } finally {
      log('hybgzs', `${label}：耗时 ${((Date.now() - start) / 1000).toFixed(1)} 秒`);
    }
  };
  try {
    await page.goto(URLS.hybgzs, { waitUntil: 'domcontentloaded', timeout: 60000 });
    let stats = await waitHybgzsReady(page);
    const s = stats.data?.data || {};
    const checkinDone = s.checkinStatus?.hasCheckedToday === true;
    const consecutive = s.checkinStatus?.consecutiveDays ?? 0;
    const remainingSpins = Number(s.wheelStatus?.remainingSpins ?? 0);

    const parts = [];
    let failed = false;

    if (checkinDone) {
      parts.push('签到：今日已签到（连续' + consecutive + '天）');
    } else {
      const r = await step('签到', () => doHybgzsCheckin(page));
      parts.push('签到：' + r.message);
      if (r.result === 'fail') failed = true;
    }

    if (remainingSpins <= 0) {
      parts.push('转盘：今日免费次数已用完');
    } else {
      const r = await step('转盘', () => doHybgzsWheel(page, remainingSpins));
      parts.push('转盘：' + r.message);
      if (r.result === 'fail') failed = true;
    }

    const giftbox = await step('福袋', () => doHybgzsGiftbox(page));
    parts.push(...giftbox.parts);

    const cards = await step('抽卡', () => doHybgzsCards(page));
    parts.push(...cards.parts);

    const farm = await step('农场', () => doHybgzsFarm(page));
    parts.push(...farm.parts);

    const driftBottle = await step('漂流瓶', () => doHybgzsDriftBottle(page));
    parts.push(...driftBottle.parts);
    if (!driftBottle.ok) failed = true;

    stats = await hybgzsStats(page);
    const balance = stats.data?.data?.walletBalance;
    // 钱包额度为大整数，500000 单位 = $1
    const quota = Number.isFinite(balance) ? '钱包余额：$' + (balance / 500000).toFixed(2) : '';

    return {
      ok: !failed,
      message: parts.join('\uff1b') + (quota ? '\uff1b' + quota : ''),
      quota: quota || '',
    };
  } finally {
    await stopCf();
    await page.close();
    log('hybgzs', `站点任务总耗时 ${((Date.now() - started) / 1000).toFixed(1)} 秒`);
  }
}

async function runChy(context) {
  const page = await context.newPage();
  const requests = [];
  const responses = [];
  const sameOrigin = url => url.startsWith('https://dy.chybenzun.top/') && !url.includes('/cdn-cgi/');
  page.on('request', request => {
    if (sameOrigin(request.url()) && ['document', 'xhr', 'fetch'].includes(request.resourceType())) {
      requests.push({ method: request.method(), url: request.url(), type: request.resourceType() });
    }
  });
  page.on('response', response => {
    if (sameOrigin(response.url()) && ['document', 'xhr', 'fetch'].includes(response.request().resourceType())) {
      responses.push({ method: response.request().method(), url: response.url(), status: response.status() });
    }
  });
  try {
    await page.goto(URLS.chy, { waitUntil: 'domcontentloaded', timeout: 60000 });
    requests.length = 0;
    responses.length = 0;
    if (isLoginUrl(page.url()) || page.url().includes('connect.linux.do')) {
      throw new Error('Not logged in; run the setup command first.');
    }
    await ensureCloudflareCleared(page, {
      url: URLS.chy,
      context,
      task: 'chy',
    });
    await page.waitForTimeout?.(1000);

    const beforeQuota = await readPageTrafficQuota(page);
    const finish = async (message) => {
      let afterQuota = await readPageTrafficQuota(page);
      if (!Number.isFinite(afterQuota) && typeof page.reload === 'function') {
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
        afterQuota = await readPageTrafficQuota(page);
      }
      const quota = trafficQuotaSummary(beforeQuota, afterQuota);
      if (quota) log('chy', quota);
      return { ok: true, message: message + (quota ? '\uff1b' + quota : ''), quota: quota || '' };
    };

    const claimText = /\u9886\u53d6\u4eca\u65e5\s*5\s*GB|\u9886\u53d6\u4eca\u65e5.*5\s*GB|\u9886\u53d6.*5\s*GB|\u4eca\u65e5\u9886\u53d6|\u9886\u53d6\u6d41\u91cf|Claim\s*5\s*GB/i;
    let claim = null;
    if (typeof page.getByText === 'function') {
      const byText = page.getByText(claimText).first();
      if (await byText.count()) claim = byText;
    }
    if (!claim) {
      claim = page.locator('button, a, [role="button"], [onclick], span, div')
        .filter({ hasText: claimText }).first();
    }
    if (!(await claim.count())) {
      const body = await page.locator('body').innerText().catch(() => '');
      if (/\u5df2\u9886\u53d6|\u4eca\u65e5\u5df2|\u660e\u65e5\u518d\u6765|already\s*claimed/i.test(body)) {
        return finish('\u4eca\u65e5\u5df2\u9886\u53d6');
      }
      if (isCloudflareChallengeText(body) || isCloudflareChallengeText(await page.title?.().catch?.(() => '') || '')) {
        throw new Error('CHY Cloudflare \u5b89\u5168\u9a8c\u8bc1\u672a\u901a\u8fc7\uff0c\u65e0\u6cd5\u5b9a\u4f4d\u9886\u53d6\u6309\u94ae\u3002');
      }
      throw new Error('Claim button not found; the session may be expired or the page changed.');
    }

    await claim.scrollIntoViewIfNeeded();
    await claim.click({ timeout: 15000 });
    await page.waitForTimeout(2500);
    if (isLoginUrl(page.url()) || page.url().includes('connect.linux.do')) {
      throw new Error('The click redirected to login; the session may be expired.');
    }
    const actionResponses = responses.filter(item => item.status >= 200 && item.status < 400);
    if (actionResponses.length) {
      log('chy', `click succeeded; observed: ${actionResponses.map(item => `${item.method} ${item.url} [${item.status}]`).join('; ')}`);
      return finish('\u70b9\u51fb\u9886\u53d6\u6210\u529f');
    }
    const body = await page.locator('body').innerText().catch(() => '');
    if (/\u9886\u53d6\u6210\u529f|\u5df2\u9886\u53d6|\u6d41\u91cf\u5df2\u5230\u8d26|\u4eca\u65e5\u5df2/.test(body)) {
      return finish('\u9875\u9762\u786e\u8ba4\u9886\u53d6\u6210\u529f');
    }
    log('chy', `clicked but no clear business response; observed: ${requests.map(item => `${item.method} ${item.url}`).join('; ') || 'none'}`);
    return false;
  } finally {
    await page.close();
  }
}

async function readAttendanceQuota(page) {
  const text = await page.evaluate(() => document.body.innerText, 'quota').catch(() => '');
  return extractAttendanceQuotaFromText(text);
}
function attendanceRequestPlans() {
  const accept = 'application/json, text/plain, */*';
  return [
    {
      url: '/api/attendance',
      headers: {
        Accept: accept,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: 'random=true',
    },
    {
      url: '/api/attendance?random=true',
      headers: {
        Accept: accept,
        'Content-Type': 'application/json;charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ content: [] }),
    },
  ];
}
async function findAttendanceButton(page) {
  const randomButton = page.locator('[data-rand="true"], [data-rand="1"]').first();
  if (await randomButton.count()) return randomButton;

  const attendanceText = /\u968f\u673a\u62bd\u4e2a\u9e21\u817f|\u8bd5\u8bd5\u624b\u6c14|\u968f\u673a.*\u9e21\u817f|\u7acb\u5373\u7b7e\u5230|\u5f00\u59cb\u7b7e\u5230|\u968f\u673a\u7b7e\u5230|\u7b7e\u5230\u9886\u53d6|\u9e21\u817f\s*x\s*\d+/i;
  if (typeof page.getByText === 'function') {
    const byText = page.getByText(attendanceText).first();
    if (await byText.count()) return byText;
  }

  const selectors = [
    '[data-action*="attendance" i], [data-action*="checkin" i], [class*="attendance" i], [class*="checkin" i], [class*="signin" i]',
    'button, a, [role="button"], [onclick], span, div',
    '.head-info div, .head-info span, .head-info button, .nsk-container div, .nsk-container span',
  ];
  for (const selector of selectors) {
    const button = page.locator(selector)
      .filter({ hasText: attendanceText, hasNotText: /\u767b\u5f55/ })
      .first();
    if (await button.count()) return button;
  }
  return null;
}
// --- DrissionPage 集成：用真实 Chrome + 持久 profile 绕过 Cloudflare ---
function parseDrissionAttendanceJson(text) {
  const data = parseJson(String(text || '').trim());
  if (!data || typeof data !== 'object') return { ok: false, error: 'invalid drission json' };
  return {
    ok: data.ok === true,
    already: data.already === true,
    dryRun: data.dry_run === true,
    message: data.message || '',
    beforeQuota: Number.isFinite(data.before_quota) ? data.before_quota : undefined,
    afterQuota: Number.isFinite(data.after_quota) ? data.after_quota : undefined,
    error: data.error || '',
  };
}
function defaultDrissionHelperPath() {
  return process.env.DRISSION_HELPER || path.join(ROOT, 'drission-attendance-json.py');
}
let _drissionPython = null;
function resolveDrissionPython() {
  if (_drissionPython) return _drissionPython;
  const { spawnSync } = require('node:child_process');
  const candidates = [
    process.env.PYTHON_PATH,
    'python',
    'D:////devloop-tools////python////python.exe',
    'C:////Python314////python.exe',
    'C:////Python313////python.exe',
  ].filter(Boolean);
  for (const cand of candidates) {
    try {
      const r = spawnSync(cand, ['-c', 'import DrissionPage'], { windowsHide: true, timeout: 8000 });
      if (r.status === 0) { _drissionPython = cand; return cand; }
    } catch {}
  }
  _drissionPython = process.env.PYTHON_PATH || 'python';
  return _drissionPython;
}

async function runLocalDrissionAttendance(site, {
  helperPath = defaultDrissionHelperPath(),
  pythonPath = process.env.PYTHON_PATH || 'python',
  timeoutMs = 180000,
  spawnImpl = spawn,
  fsApi = fs,
} = {}) {
  if (!helperPath || !fsApi.existsSync(helperPath)) {
    return { ok: false, error: 'drission helper not found: ' + helperPath };
  }
  const args = [helperPath, site.url, '--quota-url', site.origin, '--user-data-dir', site.profileDir];
  const child = spawnImpl(pythonPath, args, { windowsHide: false });
  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', chunk => { stdout += String(chunk); });
  child.stderr?.on('data', chunk => { stderr += String(chunk); });
  const code = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch {} resolve('timeout'); }, timeoutMs);
    child.on('close', c => { clearTimeout(timer); resolve(c); });
    child.on('error', err => { clearTimeout(timer); reject(err); });
  });
  const result = parseDrissionAttendanceJson(stdout);
  if (!result.ok && /No module named DrissionPage|ModuleNotFoundError/i.test(stderr) && pythonPath !== resolveDrissionPython()) {
    log('drission', `默认 python 缺 DrissionPage，回退到 ${resolveDrissionPython()}`);
    return runLocalDrissionAttendance(site, { helperPath, pythonPath: resolveDrissionPython(), timeoutMs, spawnImpl, fsApi });
  }
  if (!result.ok && stderr) log('drission', `helper stderr: ${stderr.slice(0, 300)}`);
  return result;
}
function cloudflareOriginErrorCode(title, body) {
  const visible = `${title || ''}\n${body || ''}`;
  const m = /\b(520|521|522|523|524|525|526|530)\b/.exec(visible);
  if (!m) return undefined;
  if (/connection timed out|web server is down|host error|origin.*(?:error|unreachable|timed out)|bad gateway|gateway time-?out|源站.*(?:错误|超时|不可达)/i.test(visible)) {
    return m[1];
  }
  return undefined;
}
function isCloudflareChallengePage(title, h1, body) {
  if (cloudflareOriginErrorCode(title, `${h1 || ''}\n${body || ''}`)) return false;
  const head = `${title || ''}\n${h1 || ''}`;
  if (/just a moment|checking your browser|cf-browser-verification|正在进行安全验证|请稍候|turnstile/i.test(head)) return true;
  if (/cf_chl_|__cf_chl|cf-browser-verification/i.test(body || '')) return true;
  return false;
}
function extractNodeBufProfilePointsFromText(text) {
  const m = String(text || '').match(/积分\s*(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : undefined;
}
function extractAnyRouterBalanceFromText(text) {
  const m = String(text || '').match(/\$(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : undefined;
}
async function runCfApiAttendance(context, site) {
  // 全自动路径：用 curl_cffi 绕过 Cloudflare，直接调签到接口，不开浏览器、无需人工。
  const helperPath = process.env.CF_ATTENDANCE_HELPER || path.join(ROOT, 'cf-attendance-json.py');
  if (!fs.existsSync(helperPath)) return { ok: false, message: 'cf-attendance helper not found' };
  const cookies = await context.cookies(site.origin).catch(() => []);
  const args = [helperPath, site.url, '--origin', site.origin, '--cookies', JSON.stringify(cookies), '--timeout', '60'];
  const child = spawn(resolveDrissionPython(), args, { windowsHide: false });
  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', c => { stdout += String(c); });
  child.stderr?.on('data', c => { stderr += String(c); });
  await new Promise(resolve => {
    const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch {} resolve(); }, 90000);
    child.on('close', () => { clearTimeout(timer); resolve(); });
    child.on('error', () => { clearTimeout(timer); resolve(); });
  });
  const r = parseJson(stdout.trim()) || { ok: false, error: 'invalid cf-attendance output' };
  log(site.task, `cf-attendance: ${r.ok ? 'ok' : 'fail'} ${r.message || r.error || (stderr ? stderr.slice(0,120) : '')}`);
  if (r.ok) {
    const quota = attendanceQuotaSummary(r.before_quota, r.after_quota);
    return { ok: true, message: (r.message || '接口签到成功') + (quota ? '；' + quota : ''), quota: quota || '' };
  }
  return { ok: false, message: r.error || r.message || 'cf-attendance 失败' };
}

async function runProfileExclusiveAttendance(context, sites, {
  profileDir = PROFILE_DIR,
  attemptImpl = attempt,
  runAttendanceImpl = (ctx, site) => runLuckyAttendance(ctx, site),
  launchContextImpl = launchContext,
} = {}) {
  await context.close();
  const results = [];
  for (const site of sites) {
    const result = await attemptImpl(null, site.task, async () =>
      runAttendanceImpl(null, { ...site, drissionFirst: true, drissionOnly: true, profileDir }));
    results.push(result);
  }
  const reopened = await launchContextImpl();
  return { context: reopened, results };
}

async function runLuckyAttendance(context, site) {
  const runDrission = site.runDrissionAttendance || (s => runLocalDrissionAttendance(s));
  const drissionSite = { url: site.url, origin: site.origin, profileDir: site.profileDir };
  if (site.drissionOnly) {
    const r = await runDrission(drissionSite);
    if (r.ok) {
      const quota = attendanceQuotaSummary(r.beforeQuota, r.afterQuota);
      return { ok: true, message: (r.message || '签到成功') + (quota ? '；' + quota : '') };
    }
    throw new Error(r.error || 'DrissionPage 签到失败');
  }
  if (site.drissionFirst) {
    const r = await runDrission(drissionSite);
    if (r.ok) {
      const quota = attendanceQuotaSummary(r.beforeQuota, r.afterQuota);
      return { ok: true, message: (r.message || '签到成功') + (quota ? '；' + quota : '') };
    }
    throw new Error(r.error || 'DrissionPage 签到失败');
  }
  const page = await context.newPage();
  const actionResponses = [];
  const sameOrigin = url => url.startsWith(site.origin) && !url.includes('/cdn-cgi/');
  page.on('response', response => {
    if (sameOrigin(response.url()) && response.request().method() !== 'GET') {
      actionResponses.push({
        method: response.request().method(),
        url: response.url(),
        status: response.status(),
        text: response.text().catch(() => ''),
      });
    }
  });
  try {
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    actionResponses.length = 0;
    if (isLoginUrl(page.url())) throw new Error('Not logged in; run the setup command first.');
    const cfTitle = await page.title?.().catch?.(() => '') || '';
    const cfBody = await page.locator('body').innerText().catch(() => '');
    const originCode = cloudflareOriginErrorCode(cfTitle, cfBody);
    if (originCode) {
      throw new Error(`Cloudflare ${originCode} 源站错误，这不是验证码问题。`);
    }
    if (isCloudflareChallengePage(cfTitle, '', cfBody)) {
      if (site.drissionFallback) {
        let r;
        try { r = await runDrission(drissionSite); } catch (e) { r = { ok: false, error: String(e) }; }
        if (r.ok) {
          const quota = attendanceQuotaSummary(r.beforeQuota, r.afterQuota);
          return { ok: true, message: (r.message || '签到成功') + (quota ? '；' + quota : '') };
        }
        throw new Error('DrissionPage 回退失败：' + (r.error || 'unknown'));
      }
      await ensureCloudflareCleared(page, {
        url: site.url,
        context,
        task: site.task,
        bypassCloudflare: site.bypassCloudflare,
        waitMs: site.waitMs,
      });
    }
    // SPA banner may render after challenge clearance
    await page.waitForTimeout?.(1500);
    for (let i = 0; i < 5; i++) {
      const readyButton = await findAttendanceButton(page);
      const body = await page.locator('body').innerText().catch(() => '');
      if (readyButton || /\u4eca\u65e5\u8fd8\u672a\u7b7e\u5230|\u4eca\u65e5\u5df2\u7b7e\u5230|\u8bd5\u8bd5\u624b\u6c14|\u9e21\u817f/.test(body)) break;
      await page.waitForTimeout?.(1000);
    }
    const beforeQuota = await readAttendanceQuota(page);
    const finish = async (message, afterQuota) => {
      let finalAfterQuota = afterQuota;
      if (!Number.isFinite(finalAfterQuota) && typeof page.reload === 'function') {
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
      }
      if (!Number.isFinite(finalAfterQuota)) finalAfterQuota = await readAttendanceQuota(page);
      const quota = attendanceQuotaSummary(beforeQuota, finalAfterQuota);
      if (quota) log(site.task, quota);
      return { ok: true, message: message + (quota ? '\uff1b' + quota : '') };
    };

    for (const request of attendanceRequestPlans()) {
      try {
        const result = await page.evaluate(async plan => {
          const response = await fetch(plan.url, {
            method: 'POST',
            credentials: 'include',
            headers: plan.headers,
            body: plan.body,
          });
          return { status: response.status, text: await response.text() };
        }, request);
        const data = parseJson(result.text);
        const message = messageOf(data) || result.text.trim().slice(0, 200);
        log(site.task, 'API POST ' + request.url + ' HTTP ' + result.status + (message ? '; ' + message : ''));
        if (attendanceSuccess(result.status, data, result.text)) {
          return finish(message || '\u63a5\u53e3\u7b7e\u5230\u6210\u529f', extractAttendanceQuota(data));
        }
        if (result.status === 403 || result.status === 503 || isCloudflareChallengeText(result.text)) {
          log(site.task, 'API blocked by Cloudflare; fallback to page button');
          break;
        }
      } catch (error) {
        log(site.task, 'API POST ' + request.url + ' \u8c03\u7528\u5931\u8d25\uff1a' + error.message);
      }
    }

    const bodyBeforeClick = await page.locator('body').innerText().catch(() => '');
    if (attendanceAlreadyDone(null, bodyBeforeClick)) return finish('\u4eca\u65e5\u5df2\u7b7e\u5230', beforeQuota);

    const luckyButton = await findAttendanceButton(page);
    if (!luckyButton) {
      const title = await page.title?.().catch?.(() => '') || '';
      const body = await page.locator('body').innerText().catch(() => '');
      if (isCloudflareChallengeText(title) || isCloudflareChallengeText(body)) {
        throw new Error('Cloudflare \u5b89\u5168\u9a8c\u8bc1\u672a\u901a\u8fc7\uff0c\u65e0\u6cd5\u5b9a\u4f4d\u968f\u673a\u7b7e\u5230\u6309\u94ae\u3002');
      }
      throw new Error('\u63a5\u53e3\u672a\u786e\u8ba4\u6210\u529f\uff0c\u4e14\u672a\u627e\u5230\u53ef\u7528\u7684\u968f\u673a\u7b7e\u5230\u6309\u94ae\u3002');
    }

    actionResponses.length = 0;
    await luckyButton.scrollIntoViewIfNeeded();
    await luckyButton.click({ timeout: 15000 });
    await page.waitForTimeout(2500);
    const captured = await Promise.all(actionResponses.map(async item => ({ ...item, text: await item.text })));
    if (captured.length) {
      log(site.task, '\u9875\u9762\u56de\u9000\u70b9\u51fb\u5b8c\u6210\uff0c\u6355\u83b7\u8bf7\u6c42\uff1a' + captured.map(item => item.method + ' ' + item.url + ' [' + item.status + ']').join('; '));
    }
    const responseConfirmed = captured.some(item => attendanceSuccess(item.status, parseJson(item.text), item.text));
    const responseQuota = captured
      .map(item => extractAttendanceQuota(parseJson(item.text)))
      .find(Number.isFinite);
    const bodyAfterClick = await page.locator('body').innerText().catch(() => '');
    if (responseConfirmed ||
        /\u9886\u53d6\u6210\u529f|\u7b7e\u5230\u6210\u529f|\u5df2\u9886\u53d6|\u5df2\u7b7e\u5230|\u4eca\u65e5\u5df2|\u4eca\u5929\u5df2.*\u7b7e\u5230|\u5b8c\u6210\u7b7e\u5230|\u83b7\u5f97.*\u9e21\u817f|\u9e21\u817f.*\u6210\u529f|already|claimed/i.test(bodyAfterClick)) {
      return finish('\u9875\u9762\u56de\u9000\u70b9\u51fb\u6210\u529f', responseQuota);
    }
    log(site.task, '\u70b9\u51fb\u540e\u4ecd\u672a\u786e\u8ba4\u6210\u529f\uff1b\u6355\u83b7\u8bf7\u6c42\uff1a' + (actionResponses.map(item => item.method + ' ' + item.url).join('; ') || 'none'));
    return { ok: false, message: '\u70b9\u51fb\u540e\u4ecd\u672a\u786e\u8ba4\u6210\u529f\uff1b\u6355\u83b7\u8bf7\u6c42\uff1a' + (actionResponses.map(item => item.method + ' ' + item.url).join('; ') || 'none') };
  } finally {
    await page.close();
  }
}
function normalChromeUserDataDir() {
  return process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data')
    : null;
}

function chromeProfileNames(userDataDir, fsApi = fs) {
  let lastUsed = '';
  try {
    lastUsed = parseJson(fsApi.readFileSync(path.join(userDataDir, 'Local State'), 'utf8'))?.profile?.last_used || '';
  } catch {}

  const names = [lastUsed, 'Default'];
  try {
    for (const entry of fsApi.readdirSync(userDataDir, { withFileTypes: true })) {
      if (entry.isDirectory() && /^Profile \d+$/.test(entry.name)) names.push(entry.name);
    }
  } catch {}
  return [...new Set(names.filter(name => name === 'Default' || /^Profile \d+$/.test(name)))];
}

function findAllApiHubChromeProfile(userDataDir = normalChromeUserDataDir(), fsApi = fs) {
  if (!userDataDir) return null;
  return chromeProfileNames(userDataDir, fsApi).find(profile => fsApi.existsSync(
    path.join(userDataDir, profile, 'Extensions', ALL_API_HUB_EXTENSION_ID),
  )) || null;
}

function waitForSpawn(child) {
  return new Promise((resolve, reject) => {
    child.once('spawn', resolve);
    child.once('error', reject);
  });
}

async function runOptionalAllApiHubQuickCheckin({
  trigger = true,
  userDataDir = normalChromeUserDataDir(),
  fsApi = fs,
  getChromePath = findChrome,
  launch = spawn,
} = {}) {
  const profile = findAllApiHubChromeProfile(userDataDir, fsApi);
  if (!profile) return { available: false, triggered: false };
  if (!trigger) return { available: true, triggered: false };

  const chrome = launch(getChromePath(), [
    `--profile-directory=${profile}`,
    ALL_API_HUB_OPTIONS_URL,
  ], { stdio: 'ignore', windowsHide: true });
  await waitForSpawn(chrome);
  return { available: true, triggered: true };
}

async function runOptionalAllApiHubTask() {
  const task = 'allapihub';
  const alreadyDone = isDone(task);
  try {
    const result = await runOptionalAllApiHubQuickCheckin({ trigger: !alreadyDone });
    if (!result.available) {
      log(task, '\u6b63\u5e38 Chrome Profile \u672a\u5b89\u88c5\u6269\u5c55\uff0c\u5df2\u8df3\u8fc7');
      return null;
    }
    if (alreadyDone) {
      log(task, 'already triggered today; skipped');
      return { task, ok: true, status: 'skipped', message: '\u4eca\u65e5\u5df2\u89e6\u53d1\uff0c\u8df3\u8fc7' };
    }
    markDone(task);
    log(task, '\u5df2\u5411\u6b63\u5e38 Chrome \u8bf7\u6c42\u5feb\u901f\u7b7e\u5230');
    return { task, ok: true, status: 'success', message: '\u5df2\u89e6\u53d1\u6269\u5c55\u5feb\u901f\u7b7e\u5230' };
  } catch (error) {
    log(task, `failed: ${error.message}`);
    return { task, ok: false, status: 'failed', message: error.message };
  }
}

async function attempt(context, task, fn, { alwaysRun = false } = {}) {
  const alreadyDone = isDone(task);
  if (alreadyDone && !alwaysRun) {
    log(task, 'already completed today; skipped');
    return { task, ok: true, status: 'skipped', message: skippedMessage(task) };
  }
  try {
    const outcome = await fn(context);
    const ok = outcome === true || outcome?.ok === true;
    if (!ok) throw new Error(outcome?.message || 'The site did not confirm success.');
    if (outcome?.quota) {
      markDone(task, outcome.quota);
    }
    if (alreadyDone) {
      log(task, 'completed today (re-run)');
      return {
        task,
        ok: true,
        status: 'success',
        message: outcome?.message || skippedMessage(task),
        quota: outcome?.quota || lastQuota(task) || '',
      };
    }
    markDone(task, outcome?.quota);
    log(task, 'completed today');
    return {
      task,
      ok: true,
      status: 'success',
      message: outcome?.message || '执行成功',
      quota: outcome?.quota || '',
    };
  } catch (error) {
    if (alreadyDone) {
      log(task, `re-run error: ${error.message}; kept as completed today`);
      return { task, ok: true, status: 'skipped', message: skippedMessage(task) };
    }
    log(task, `failed: ${error.message}`);
    return { task, ok: false, status: 'failed', message: error.message };
  }
}
function printSummary(results) {
  const labels = {
    allapihub: 'All API Hub',
    anyrouter: 'AnyRouter',
    ikuuu: 'iKuuu',
    chy: 'CHY',
    nodeseek: 'NodeSeek',
    deepflood: 'DeepFlood',
    nodebuf: 'NodeBuf',
    hvoy: '禾维AI',
    hybgzs: '黑白福利站',
  };
  console.log('\n========== 本次执行结果 ==========');
  for (const result of results) {
    const status = result.status === 'skipped'
      ? '今日已完成（跳过）'
      : result.ok ? '成功' : '失败';
    console.log(`${labels[result.task] || result.task}: ${status}${result.message ? `；${result.message}` : ''}`);
  }
  console.log('==================================\n');
}
function parseDailyAt() {
  const match = /^(\d{1,2}):(\d{2})$/.exec(DAILY_AT);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) {
    throw new Error(`DAILY_AT must be HH:mm; received ${DAILY_AT}`);
  }
  return { hour: Number(match[1]), minute: Number(match[2]) };
}
function nextDailyRun() {
  const { hour, minute } = parseDailyAt();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  return next.getTime();
}
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function runOnce(enabledTasks = null) {
  const enabled = enabledTasks && enabledTasks.length ? enabledTasks : defaultEnabledTasks();
  log('scheduler', `starting ${today()}; tasks: [${enabled.join(', ')}]`);
  if (!enabled.length) {
    log('scheduler', '未选择任何任务，跳过；可用 --set-default-tasks 配置');
    printSummary([]);
    return [];
  }
  let results = [];
  if (enabled.includes('allapihub')) {
    const allApiHubResult = await runOptionalAllApiHubTask();
    if (allApiHubResult) results.push(allApiHubResult);
  }
  const browserTasks = enabled.filter(t => t !== 'allapihub');
  if (browserTasks.length) {
    let context = await launchContext();
    try {
      if (enabled.includes('anyrouter')) {
        const r = await attempt(context, 'anyrouter', runAnyRouter);
        results.push(r);
        nextAnyRouterRetryAt = r.ok ? 0 : Date.now() + HOUR;
      }
      if (enabled.includes('ikuuu')) results.push(await attempt(context, 'ikuuu', runIkuuu));
      if (enabled.includes('chy')) results.push(await attempt(context, 'chy', runChy));
      const exclusiveSites = [
        { task: 'nodeseek', url: URLS.nodeseek, origin: 'https://www.nodeseek.com/' },
        { task: 'deepflood', url: URLS.deepflood, origin: 'https://www.deepflood.com/' },
      ].filter(site => enabled.includes(site.task));
      if (exclusiveSites.length) {
        const stillNeeded = [];
        for (const site of exclusiveSites) {
          const r = await attempt(context, site.task, ctx => runCfApiAttendance(ctx, site), { alwaysRun: true });
          results.push(r);
          if (!r.ok) stillNeeded.push(site);
        }
        if (stillNeeded.length) {
          const exclusive = await runProfileExclusiveAttendance(context, stillNeeded);
          context = exclusive.context;
          const drMap = new Map(exclusive.results.map(r => [r.task, r]));
          results = results.map(r => drMap.has(r.task) ? drMap.get(r.task) : r);
        }
      }
      if (enabled.includes('nodebuf')) results.push(await attempt(context, 'nodebuf', runNodeBuf));
      if (enabled.includes('hvoy')) results.push(await attempt(context, 'hvoy', runHvoy));
      if (enabled.includes('hybgzs')) results.push(await attempt(context, 'hybgzs', runHybgzs, { alwaysRun: true }));
    } finally {
      await context.close();
    }
  }
  printSummary(results);
  return results;
}
async function daemon() {
  while (true) {
    await runOnce();
    const next = Math.min(nextDailyRun(), nextAnyRouterRetryAt || Number.POSITIVE_INFINITY);
    const wait = Math.max(1000, next - Date.now());
    log('scheduler', `next run: ${new Date(next).toLocaleString()} (${Math.ceil(wait / 60000)} minutes)`);
    await sleep(wait);
  }
}
async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try { await rl.question(question); } finally { rl.close(); }
}
async function setup() {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  const chrome = spawn(findChrome(), [
    `--user-data-dir=${PROFILE_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    URLS.anyrouter,
    URLS.ikuuu,
    URLS.chy,
    URLS.nodeseek,
    URLS.deepflood,
    URLS.nodebuf,
    URLS.hvoy,
    URLS.hybgzs,
  ], { stdio: 'ignore', windowsHide: false });
  await new Promise((resolve, reject) => {
    chrome.once('spawn', resolve);
    chrome.once('error', reject);
  });
  log('setup', 'normal Chrome opened without Playwright automation');
  await ask('Complete all logins in Chrome, close that Chrome window, then press Enter here: ');
  if (chrome.exitCode === null) {
    log('setup', 'waiting for the login Chrome window to close');
    await new Promise(resolve => chrome.once('exit', resolve));
  }
  log('setup', `session saved in ${PROFILE_DIR}`);
}
async function main() {
  const args = process.argv.slice(2);
  const argSet = new Set(args);
  if (argSet.has('--setup')) return setup();
  if (argSet.has('--daemon')) return daemon();
  if (argSet.has('--list-tasks')) { listTasks(); return; }
  if (argSet.has('--clear-default-tasks')) { clearDefaultTasks(); return; }
  const setIdx = args.indexOf('--set-default-tasks');
  if (setIdx !== -1) {
    const input = args.slice(setIdx + 1).filter(t => !t.startsWith('--')).join(' ');
    setDefaultTasks(input);
    return;
  }
  const tasksIdx = args.indexOf('--tasks');
  let selectedTasks = null;
  if (tasksIdx !== -1) {
    const input = args.slice(tasksIdx + 1).filter(t => !t.startsWith('--')).join(' ');
    selectedTasks = parseTaskTokens(input);
  }
  const results = await runOnce(selectedTasks);
  if (results.some(result => !result.ok)) process.exitCode = 1;
}

module.exports = {
  dismissHvoyNotice,
  clickHvoyButton,
  withPageDeadline,
  doHybgzsWheel,
  watchHybgzsCf,
  hybgzsApi,
  doHybgzsCards,
  doHybgzsDriftBottle,
  launchContext,
  isProfileInUseError,
  tryClickTurnstile,
  clickClosedTurnstile,
  anyRouterRequest,
  runAnyRouter,
  waitHybgzsReady,
  clickCapStart,
  hybgzsCapFlow,
  attendanceQuotaSummary,
  attendanceRequestPlans,
  attendanceSuccess,
  extractAttendanceQuota,
  extractAttendanceQuotaFromText,
  extractTrafficQuotaFromText,
  extractQuota,
  findAttendanceButton,
  isCloudflareChallengeText,
  isLoginUrl,
  nodeBufCheckInSuccess,
  parseCfBypassJson,
  runLocalCfBypass,
  runLuckyAttendance,
  runNodeBuf,
  applyCfBypassCookies,
  cloudflareOriginErrorCode,
  findChyClaimButton,
  isChyLoggedOutPage,
  extractAnyRouterBalanceFromText,
  extractNodeBufProfilePointsFromText,
  isCloudflareChallengePage,
  parseDrissionAttendanceJson,
  runLocalDrissionAttendance,
  runProfileExclusiveAttendance,
  runOptionalAllApiHubQuickCheckin,
  tryNodeBufAutoLogin,
};

if (require.main === module) {
  main().catch(error => {
    console.error(error.code === 'BROWSER_PROFILE_BUSY' ? error.message : (error.stack || error));
    process.exitCode = 1;
  });
}


