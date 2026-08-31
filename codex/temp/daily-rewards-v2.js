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
};
let nextAnyRouterRetryAt = 0;

// 任务配置（task-config.json 存 { "defaults": ["ikuuu", ...] }）。
const TASK_ORDER = [
  { task: 'anyrouter', label: 'anyrouter' },
  { task: 'ikuuu', label: 'iKuuu' },
  { task: 'chy', label: 'CHY' },
  { task: 'nodeseek', label: 'NodeSeek' },
  { task: 'deepflood', label: 'DeepFlood' },
  { task: 'nodebuf', label: 'NodeBuf' },
  { task: 'allapihub', label: 'All API Hub' },
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
    await context.clearCookies({ domain: host });
    await context.clearCookies({ domain });
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
async function ensureCloudflareCleared(page, {
  url,
  context,
  task = 'page',
  bypassCloudflare,
  headless = HEADLESS,
  waitMs = 12000,
} = {}) {
  const readChallenge = async () => {
    const title = await page.title?.().catch?.(() => '') || '';
    const body = await page.locator('body').innerText().catch(() => '');
    const html = await page.content?.().catch?.(() => '') || body;
    return {
      title,
      body,
      challenged: isCloudflareChallengeText(title) || isCloudflareChallengeText(body) || isCloudflareChallengeText(html),
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

  log(task, 'Cloudflare still present; trying local bypass/captcha helper');
  const bypass = bypassCloudflare
    ? await bypassCloudflare(url)
    : await runLocalCfBypass(url, { headless: false });
  if (!bypass?.success) {
    throw new Error('Cloudflare \u5b89\u5168\u9a8c\u8bc1\u672a\u901a\u8fc7' + (bypass?.error ? '\uff1a' + bypass.error : '') +
      '\uff1b\u8bf7\u5148\u5728\u6d4f\u89c8\u5668\u4e2d\u5b8c\u6210\u9a8c\u8bc1\u6216\u68c0\u67e5 D:\\codex-projeect\\6a6ff848a2c537419fd0b6cf');
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
async function getAnyRouterSelf(context) {
  try {
    const response = await context.request.get('https://anyrouter.top/api/user/self', { timeout: 20000 });
    return response.ok() ? parseJson(await response.text()) : null;
  } catch { return null; }
}
async function launchContext(headless = HEADLESS) {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  return chromium.launchPersistentContext(PROFILE_DIR, {
    executablePath: findChrome(),
    headless,
    viewport: null,
    acceptDownloads: false,
    ignoreDefaultArgs: ['--disable-extensions'],
  });
}

async function runAnyRouter(context) {
  const page = await context.newPage();
  try {
    const before = await getAnyRouterSelf(context);
    const signInResponsePromise = page.waitForResponse(
      response => response.request().method() === 'POST' && response.url().endsWith('/api/user/sign_in'),
      { timeout: 12000 },
    ).catch(() => null);
    await page.goto(URLS.anyrouter, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (isLoginUrl(page.url())) throw new Error('Not logged in; run the setup command first.');

    await page.waitForTimeout(2500);
    let response = await signInResponsePromise;
    let data = await responseJson(response);
    if (!response) {
      const fallback = await page.evaluate(async () => {
        const res = await fetch('/api/user/sign_in', { method: 'POST', credentials: 'include' });
        return { status: res.status, text: await res.text() };
      });
      data = parseJson(fallback.text);
      log('anyrouter', `fallback API response HTTP ${fallback.status}`);
    }

    const after = await getAnyRouterSelf(context);
    const beforeQuota = extractQuota(before);
    const afterQuota = extractQuota(after);
    const quota = attendanceQuotaSummary(beforeQuota, afterQuota);
    const baseMessage = messageOf(data) || 'no message returned';
    log('anyrouter', baseMessage + (quota ? '; ' + quota : ''));
    if (Number.isFinite(beforeQuota) && Number.isFinite(afterQuota)) {
      if (afterQuota > beforeQuota || anyRouterAlreadyDone(data)) {
        return { ok: true, message: baseMessage + (quota ? '\uff1b' + quota : '') };
      }
      log('anyrouter', 'API returned no confirmed quota increase; will retry hourly.');
      return { ok: false, message: baseMessage + (quota ? '\uff1b' + quota : '') };
    }
    if (anyRouterSuccess(data)) {
      return { ok: true, message: baseMessage + (quota ? '\uff1b' + quota : '') };
    }
    return { ok: false, message: baseMessage };
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
    if (alreadyDone) {
      log(task, 'already completed today; skipped');
      return { task, ok: true, status: 'skipped', message: outcome?.message || skippedMessage(task) };
    }
    markDone(task, outcome?.quota);
    log(task, 'completed today');
    return {
      task,
      ok: true,
      status: 'success',
      message: outcome?.message || '\u6267\u884c\u6210\u529f',
    };
  } catch (error) {
    if (alreadyDone) {
      log(task, 'already completed today; skipped');
      return { task, ok: true, status: 'skipped', message: skippedMessage(task) };
    }
    log(task, `failed: ${error.message}`);
    return { task, ok: false, status: 'failed', message: error.message };
  }
}
function printSummary(results) {
  const labels = {
    anyrouter: 'AnyRouter',
    ikuuu: 'iKuuu',
    chy: 'CHY',
    nodeseek: 'NodeSeek',
    deepflood: 'DeepFlood',
    nodebuf: 'NodeBuf',
    allapihub: 'All API Hub',
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
  let context = await launchContext();
  let results = [];
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
  } finally {
    await context.close();
  }
  if (enabled.includes('allapihub')) {
    const allApiHubResult = await runOptionalAllApiHubTask();
    if (allApiHubResult) results.push(allApiHubResult);
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
  const results = await runOnce();
  if (results.some(result => !result.ok)) process.exitCode = 1;
}

module.exports = {
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
    console.error(error.stack || error);
    process.exitCode = 1;
  });
}


