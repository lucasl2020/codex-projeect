const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const PROFILE_DIR = process.env.PROFILE_DIR || path.join(ROOT, 'browser-profile');
const STATE_FILE = process.env.STATE_FILE || path.join(ROOT, 'state.json');
const DAILY_AT = process.env.DAILY_AT || '09:00';
const HEADLESS = process.env.HEADLESS === '1';
const HOUR = 60 * 60 * 1000;
const ALL_API_HUB_EXTENSION_ID = 'lapnciffpekdengooeolaienkeoilfeo';
const ALL_API_HUB_OPTIONS_URL = `chrome-extension://${ALL_API_HUB_EXTENSION_ID}/options.html?runNow=true#autoCheckin`;
const CAP_WASM_PATH = path.join(ROOT, 'cap_wasm_bg.wasm');
const capWasmBuffer = fs.existsSync(CAP_WASM_PATH) ? fs.readFileSync(CAP_WASM_PATH) : null;
const URLS = {
  anyrouter: 'https://anyrouter.top/console/personal',
  ikuuu: 'https://ikuuu.top/user',
  chy: 'https://dy.chybenzun.top/',
  nodeseek: 'https://www.nodeseek.com/board',
  deepflood: 'https://www.deepflood.com/board',
  nodebuf: 'https://nodebuf.com/user/points',
  hvoy: 'https://www.hvoyai.com/',
  hybgzs: 'https://cdk.hybgzs.com/dashboard',
};
let nextAnyRouterRetryAt = 0;

const TASK_ORDER = [
  { task: 'allapihub', label: 'All API Hub', script: 'services/allapihub.js' },
  { task: 'anyrouter', label: 'AnyRouter', script: 'services/anyrouter.js' },
  { task: 'ikuuu', label: 'iKuuu', script: 'services/ikuuu.js' },
  { task: 'chy', label: 'CHY', script: 'services/chy.js' },
  { task: 'nodeseek', label: 'NodeSeek', script: 'services/nodeseek.js' },
  { task: 'deepflood', label: 'DeepFlood', script: 'services/deepflood.js' },
  { task: 'nodebuf', label: 'NodeBuf', script: 'services/nodebuf.js' },
  { task: 'hvoy', label: '禾维AI', script: 'services/hvoy.js' },
  { task: 'hybgzs', label: '黑白福利站', script: 'services/hybgzs.js' },
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
  console.log('可执行站点与独立服务列表：');
  TASK_ORDER.forEach((item, index) => {
    const marker = defaults.includes(item.task) ? ' [默认开启]' : ' [已关闭]';
    console.log(`  ${index + 1}. ${item.label} (${item.script})${marker}`);
  });
  console.log('\n输入示例：1,2,3  或  ikuuu,nodebuf  (可多选；留空或 0 = 恢复全部默认开启)');
}
function setDefaultTasks(input) {
  const tasks = parseTaskTokens(input);
  if (tasks.length === 0) {
    console.log('未识别到有效任务，已忽略。可用任务：' + taskNames().join(', '));
    return;
  }
  writeTaskConfig(tasks);
  console.log('已保存默认站点配置：' + TASK_ORDER.map(item => `${item.label}:${tasks.includes(item.task) ? '开' : '关'}`).join('；'));
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

function messageOf(data) {
  if (!data || typeof data !== 'object') return '';
  return String(data.message ?? data.msg ?? data.error ?? data.data?.message ?? '');
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
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

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

async function applyStealth(context) {
  if (typeof context?.addInitScript === 'function') {
    await context.addInitScript(() => {
      try {
        Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => undefined, configurable: true });
      } catch {}
      try {
        Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 16, configurable: true });
      } catch {}
    }).catch(() => {});
  }
  if (capWasmBuffer && typeof context?.route === 'function') {
    await context.route(/cap_wasm_bg\.wasm/, async route => {
      try {
        await route.fulfill({
          status: 200,
          contentType: 'application/wasm',
          body: capWasmBuffer,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      } catch {
        await route.continue().catch(() => {});
      }
    }).catch(() => {});
  }
}

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

async function withPageDeadline(page, action, timeoutMs) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(async () => {
      try { await page.close(); } catch {}
      reject(new Error(`本轮未完成，已达页面总时限（${timeoutMs / 1000} 秒），安全关闭页面。`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([action(), timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

async function runServiceStandalone(taskName, runner, options = {}) {
  log('standalone', `正在单独执行任务：${taskName}`);
  let context = null;
  try {
    if (options.noBrowser) {
      const r = await runner(null);
      printSummary([r || { task: taskName, ok: true, status: 'success' }]);
      process.exitCode = (r && !r.ok) ? 1 : 0;
      return;
    }
    context = await launchContext(options.headless !== undefined ? options.headless : HEADLESS);
    const result = await attempt(context, taskName, runner, options);
    printSummary([result]);
    process.exitCode = result.ok ? 0 : 1;
  } catch (err) {
    console.error(err.code === 'BROWSER_PROFILE_BUSY' ? err.message : (err.stack || err));
    process.exitCode = 1;
  } finally {
    if (context) await context.close().catch(() => {});
  }
}

module.exports = {
  ROOT,
  PROFILE_DIR,
  STATE_FILE,
  DAILY_AT,
  HEADLESS,
  HOUR,
  ALL_API_HUB_EXTENSION_ID,
  ALL_API_HUB_OPTIONS_URL,
  CAP_WASM_PATH,
  capWasmBuffer,
  URLS,
  TASK_ORDER,
  TASK_CONFIG_FILE,
  nextAnyRouterRetryAt,
  taskNames,
  readTaskConfig,
  writeTaskConfig,
  parseTaskTokens,
  defaultEnabledTasks,
  listTasks,
  setDefaultTasks,
  clearDefaultTasks,
  findChrome,
  today,
  log,
  parseJson,
  readState,
  markDone,
  lastQuota,
  skippedMessage,
  isDone,
  isLoginUrl,
  isCloudflareChallengeText,
  cloudflareOriginErrorCode,
  isCloudflareChallengePage,
  messageOf,
  extractQuota,
  extractAttendanceQuota,
  extractAttendanceQuotaFromText,
  formatAttendanceQuota,
  attendanceQuotaSummary,
  extractTrafficQuotaFromText,
  formatTrafficQuota,
  trafficQuotaSummary,
  extractNodeBufAccountPoints,
  readPageTrafficQuota,
  waitForPageTrafficQuota,
  extractApiQuota,
  responseJson,
  isProfileInUseError,
  sleep,
  launchContext,
  applyStealth,
  clickClosedTurnstile,
  tryClickTurnstile,
  hybgzsCfWatchers,
  watchHybgzsCf,
  attempt,
  printSummary,
  parseDailyAt,
  nextDailyRun,
  withPageDeadline,
  runServiceStandalone,
};
