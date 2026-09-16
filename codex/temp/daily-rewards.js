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
const URLS = {
  anyrouter: 'https://anyrouter.top/console/personal',
  ikuuu: 'https://ikuuu.top/user',
  chy: 'https://dy.chybenzun.top/',
};
let nextAnyRouterRetryAt = 0;

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
function markDone(task) {
  const state = readState();
  state.tasks ||= {};
  state.tasks[task] = today();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}
function isDone(task) {
  return readState().tasks?.[task] === today();
}
function isLoginUrl(url) {
  return /\/login(?:$|[?#])|\/auth\/login(?:$|[?#])/.test(url);
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
  return data?.ret === 1 || /\u5df2\u7b7e\u5230|\u7b7e\u5230\u6210\u529f|already/i.test(messageOf(data));
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
    const delta = Number.isFinite(beforeQuota) && Number.isFinite(afterQuota)
      ? `; quota ${beforeQuota} -> ${afterQuota} (delta ${afterQuota - beforeQuota})`
      : '';
    log('anyrouter', `${messageOf(data) || 'no message returned'}${delta}`);
    if (Number.isFinite(beforeQuota) && Number.isFinite(afterQuota)) {
      if (afterQuota > beforeQuota || anyRouterAlreadyDone(data)) return true;
      log('anyrouter', 'API returned no confirmed quota increase; will retry hourly.');
      return false;
    }
    return anyRouterSuccess(data);
  } finally {
    await page.close();
  }
}

async function runIkuuu(context) {
  const page = await context.newPage();
  try {
    await page.goto(URLS.ikuuu, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (isLoginUrl(page.url())) throw new Error('Not logged in; run the setup command first.');
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
    log('ikuuu', `POST /user/checkin HTTP ${result.status}${messageOf(data) ? `; ${messageOf(data)}` : ''}`);
    if (ikuuuSuccess(data)) return true;

    if (result.status >= 400 || !data || data.ret === undefined) {
      const button = page.locator('button, a, [role="button"]').filter({ hasText: /\u7b7e\u5230/ }).first();
      if (await button.count()) {
        await button.click({ timeout: 15000 });
        await page.waitForTimeout(1500);
        const body = await page.locator('body').innerText().catch(() => '');
        if (/\u7b7e\u5230\u6210\u529f|\u5df2\u7b7e\u5230|already/i.test(body)) return true;
      }
    }
    return false;
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

    const claim = page.locator('button, a, [role="button"], [onclick]')
      .filter({ hasText: /\u9886\u53d6\u4eca\u65e5\s*5GB/ }).first();
    if (!(await claim.count())) {
      const body = await page.locator('body').innerText().catch(() => '');
      if (/\u5df2\u9886\u53d6|\u4eca\u65e5\u5df2|\u660e\u65e5\u518d\u6765/.test(body)) return true;
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
      return true;
    }
    const body = await page.locator('body').innerText().catch(() => '');
    if (/\u9886\u53d6\u6210\u529f|\u5df2\u9886\u53d6|\u6d41\u91cf\u5df2\u5230\u8d26|\u4eca\u65e5\u5df2/.test(body)) return true;
    log('chy', `clicked but no clear business response; observed: ${requests.map(item => `${item.method} ${item.url}`).join('; ') || 'none'}`);
    return false;
  } finally {
    await page.close();
  }
}

async function attempt(context, task, fn) {
  if (isDone(task)) {
    log(task, 'already completed today; skipped');
    return true;
  }
  try {
    const ok = await fn(context);
    if (!ok) throw new Error('The site did not confirm success.');
    markDone(task);
    log(task, 'completed today');
    return true;
  } catch (error) {
    log(task, `failed: ${error.message}`);
    return false;
  }
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

async function runOnce() {
  log('scheduler', `starting ${today()}`);
  const context = await launchContext();
  try {
    const anyRouterOk = await attempt(context, 'anyrouter', runAnyRouter);
    nextAnyRouterRetryAt = anyRouterOk ? 0 : Date.now() + HOUR;
    await attempt(context, 'ikuuu', runIkuuu);
    await attempt(context, 'chy', runChy);
  } finally {
    await context.close();
  }
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
  const args = new Set(process.argv.slice(2));
  if (args.has('--setup')) return setup();
  if (args.has('--daemon')) return daemon();
  return runOnce();
}
main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});

