'use strict';

const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = (process.env.VSLLM_BASE_URL || 'https://vsllm.com').replace(/\/$/, '');
const PERSONAL_URL = `${BASE_URL}/console/personal`;
const PROFILE_DIR = path.resolve(process.env.VSLLM_PROFILE_DIR || '.vsllm-profile');
const AUTH_FILE = path.resolve(process.env.VSLLM_AUTH_FILE || '.vsllm-auth.json');
const LOG_FILE = path.resolve(process.env.VSLLM_LOG_FILE || 'vsllm-rewards.log');
const NO_BROWSER_LOGIN = /^(1|true|yes)$/i.test(process.env.HEADLESS || '');
const LOGIN_ONLY = process.argv.includes('--login');
const RUN_ONCE = process.argv.includes('--once');
const LOGIN_WAIT_MS = 10 * 60 * 1000;
const AUTH_POLL_MS = 5000;

class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredError';
  }
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google/Chrome/Application/chrome.exe'),
    process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Google/Chrome/Application/chrome.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
  ].filter(Boolean);
  const chromePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!chromePath) throw new Error('Google Chrome was not found. Set CHROME_PATH.');
  return chromePath;
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, `${line}\n`, 'utf8');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatWait(seconds) {
  const total = Math.max(0, Math.ceil(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return hours > 0 ? `${hours}h ${minutes}m ${secs}s` : `${minutes}m ${secs}s`;
}

function responseMessage(result, fallback) {
  return result?.json?.message || result?.json?.data?.message || fallback;
}

function describePrize(prize) {
  if (!prize) return 'no prize details returned';
  const parts = [
    prize.name,
    prize.rarity,
    prize.subscription_plan_title,
  ].filter(Boolean).map(String);
  return parts.join(' / ') || JSON.stringify(prize);
}

function extractQuota(data) {
  const quota = Number(
    data?.prize?.quota ??
    data?.quota ??
    data?.reward?.quota,
  );
  return Number.isFinite(quota) ? quota : null;
}

async function readUser(page) {
  try {
    return await page.evaluate(() => {
      const raw = window.localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    });
  } catch {
    return null;
  }
}

async function isPersonalPage(page) {
  try {
    const user = await readUser(page);
    return Boolean(user && new URL(page.url()).pathname.startsWith('/console'));
  } catch {
    return false;
  }
}

async function waitForLogin(page) {
  log('Complete login in the opened Chrome window. The script does not read or store your password.');
  const deadline = Date.now() + LOGIN_WAIT_MS;
  while (Date.now() < deadline) {
    const pathname = (() => {
      try { return new URL(page.url()).pathname; } catch { return ''; }
    })();
    if (!pathname.startsWith('/login') && await readUser(page)) {
      await page.goto(PERSONAL_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);
      if (await isPersonalPage(page)) {
        log('Login detected.');
        return;
      }
    }
    await sleep(2000);
  }
  throw new Error('Timed out waiting for login.');
}

async function ensureLogin(page) {
  if (await isPersonalPage(page)) return;
  await page.goto(PERSONAL_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  if (!(await isPersonalPage(page))) await waitForLogin(page);
}

async function captureApiHeaders(page) {
  let captured;
  const names = [
    'new-api-user',
    'authorization',
    'x-device-fp',
    'x-device-vid',
    'x-device-sig',
    'user-agent',
  ];
  const onRequest = (request) => {
    if (!request.url().startsWith(`${BASE_URL}/api/`)) return;
    const requestHeaders = request.headers();
    if (!requestHeaders['new-api-user'] && !requestHeaders.authorization) return;
    captured = Object.fromEntries(
      names.filter((name) => requestHeaders[name]).map((name) => [name, requestHeaders[name]]),
    );
  };

  page.on('request', onRequest);
  try {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
  } finally {
    page.off('request', onRequest);
  }

  if (!captured) {
    const user = await readUser(page);
    if (!user?.id) throw new Error('Could not read the logged-in user ID.');
    captured = { 'new-api-user': String(user.id) };
    log('No device headers were captured; requests will use the user ID only.');
  } else {
    log(`Captured API headers: ${Object.keys(captured).filter((name) => name !== 'authorization').join(', ')}.`);
  }
  return captured;
}

function normalizeAuth(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.baseUrl && String(raw.baseUrl).replace(/\/$/, '') !== BASE_URL) return null;

  const headers = Object.fromEntries(
    Object.entries(raw.headers || {})
      .filter(([, value]) => typeof value === 'string' && value)
      .map(([name, value]) => [name.toLowerCase(), value]),
  );
  const cookies = Array.isArray(raw.cookies)
    ? raw.cookies.filter((cookie) => cookie && typeof cookie.name === 'string' && typeof cookie.value === 'string')
    : [];
  if (!headers['new-api-user'] && !headers.authorization) return null;
  if (!cookies.length && !headers.authorization) return null;

  return {
    version: 1,
    baseUrl: BASE_URL,
    headers,
    cookies,
    savedAt: raw.savedAt || new Date().toISOString(),
  };
}

function loadAuth() {
  try {
    return normalizeAuth(JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')));
  } catch {
    return null;
  }
}

function saveAuth(auth) {
  const normalized = normalizeAuth({ ...auth, savedAt: new Date().toISOString() });
  if (!normalized) throw new Error('Authentication data is incomplete and was not saved.');
  fs.writeFileSync(AUTH_FILE, `${JSON.stringify(normalized, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  Object.assign(auth, normalized);
}

function authFileStamp() {
  try {
    const stat = fs.statSync(AUTH_FILE);
    return `${stat.size}:${stat.mtimeMs}`;
  } catch {
    return '';
  }
}

function buildCookieHeader(cookies) {
  const now = Date.now() / 1000;
  return (cookies || [])
    .filter((cookie) => !Number.isFinite(Number(cookie.expires)) || Number(cookie.expires) <= 0 || Number(cookie.expires) > now)
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
}

function applySetCookieHeaders(cookies, setCookieHeaders) {
  let changed = false;
  for (const raw of setCookieHeaders || []) {
    const parts = String(raw).split(';').map((part) => part.trim());
    const separator = parts[0].indexOf('=');
    if (separator <= 0) continue;

    const name = parts[0].slice(0, separator);
    const value = parts[0].slice(separator + 1);
    const attributes = Object.fromEntries(parts.slice(1).map((part) => {
      const index = part.indexOf('=');
      return index < 0
        ? [part.toLowerCase(), true]
        : [part.slice(0, index).toLowerCase(), part.slice(index + 1)];
    }));
    const index = cookies.findIndex((cookie) => cookie.name === name);
    const maxAge = Number(attributes['max-age']);
    const expires = attributes.expires ? Date.parse(attributes.expires) / 1000 : NaN;
    if ((Number.isFinite(maxAge) && maxAge <= 0) || (Number.isFinite(expires) && expires <= Date.now() / 1000)) {
      if (index >= 0) {
        cookies.splice(index, 1);
        changed = true;
      }
      continue;
    }

    const previous = index >= 0 ? cookies[index] : {};
    const next = {
      ...previous,
      name,
      value,
      domain: attributes.domain || previous.domain || new URL(BASE_URL).hostname,
      path: attributes.path || previous.path || '/',
      expires: Number.isFinite(maxAge)
        ? Math.floor(Date.now() / 1000) + maxAge
        : (Number.isFinite(expires) ? Math.floor(expires) : (previous.expires ?? -1)),
      httpOnly: Boolean(attributes.httponly || previous.httpOnly),
      secure: Boolean(attributes.secure || previous.secure),
    };
    if (JSON.stringify(previous) !== JSON.stringify(next)) {
      if (index >= 0) cookies[index] = next;
      else cookies.push(next);
      changed = true;
    }
  }
  return changed;
}

function createApiClient(auth, fetchImpl = globalThis.fetch, persistAuth = saveAuth) {
  if (typeof fetchImpl !== 'function') throw new Error('This script requires Node.js with built-in fetch support.');
  return {
    async request(method, requestPath, body) {
      const requestHeaders = {
        ...auth.headers,
        accept: 'application/json',
        origin: BASE_URL,
        referer: PERSONAL_URL,
      };
      const cookie = buildCookieHeader(auth.cookies);
      if (cookie) requestHeaders.cookie = cookie;
      if (body !== undefined) requestHeaders['content-type'] = 'application/json';

      const response = await fetchImpl(`${BASE_URL}${requestPath}`, {
        method,
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = { raw: text };
      }

      const setCookies = typeof response.headers?.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : (response.headers?.get?.('set-cookie') ? [response.headers.get('set-cookie')] : []);
      if (applySetCookieHeaders(auth.cookies, setCookies)) persistAuth(auth);
      return { status: response.status, json };
    },
  };
}

async function api(client, method, requestPath, body) {
  const result = await client.request(method, requestPath, body);
  if (result.status === 401) throw new SessionExpiredError();
  return result;
}

async function loginWithBrowser() {
  const { chromium } = require('playwright-core');
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    executablePath: findChrome(),
    headless: false,
    viewport: { width: 1440, height: 1000 },
    // Reduce automated-browser fingerprints so Google Login does not flag
    // this Chrome as an unsafe/untrusted browser.
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-infobars',
    ],
  });
  const page = context.pages()[0] || await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    await ensureLogin(page);
    const headers = await captureApiHeaders(page);
    const auth = normalizeAuth({
      baseUrl: BASE_URL,
      headers,
      cookies: await context.cookies(BASE_URL),
    });
    if (!auth) throw new Error('Could not capture reusable authentication from Chrome.');
    saveAuth(auth);
    log('Authentication saved. Chrome will close; subsequent tasks will run through Node.js only.');
    return auth;
  } finally {
    await context.close();
  }
}

async function waitForAuthUpdate(previousStamp) {
  log('Authentication is required. Keep this Node window open, then run ".\\vsllm login" in another window.');
  while (true) {
    const stamp = authFileStamp();
    if (stamp && stamp !== previousStamp) {
      const auth = loadAuth();
      if (auth) {
        log('Updated authentication was detected; background service is resuming.');
        return auth;
      }
    }
    await sleep(AUTH_POLL_MS);
  }
}

async function getInitialAuth(auth = loadAuth(), openLogin = loginWithBrowser) {
  if (auth) {
    log('Loaded saved authentication; Chrome is not being started.');
    return auth;
  }
  if (!NO_BROWSER_LOGIN) return openLogin();
  if (RUN_ONCE) throw new Error('Authentication is missing. Run ".\\vsllm login" first.');
  return waitForAuthUpdate(authFileStamp());
}

async function refreshAuth(previousStamp) {
  if (!NO_BROWSER_LOGIN) return loginWithBrowser();
  if (RUN_ONCE) throw new Error('Authentication expired. Run ".\\vsllm login" and retry.');
  return waitForAuthUpdate(previousStamp);
}

async function checkIn(client) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const status = await api(client, 'GET', `/api/user/checkin?month=${month}`);
  if (!status.json?.success) {
    log(`Check-in status failed: ${responseMessage(status, `HTTP ${status.status}`)}`);
    return;
  }

  const stats = status.json.data?.stats || {};
  if (stats.checked_in_today) {
    log(`Already checked in today. Total check-ins: ${stats.total_checkins ?? 'unknown'}.`);
    return;
  }

  const result = await api(client, 'POST', '/api/user/checkin');
  if (result.json?.success) {
    log(`Check-in succeeded: ${describePrize(result.json.data || {})}.`);
    return;
  }

  const message = responseMessage(result, `HTTP ${result.status}`);
  if (/turnstile|captcha/i.test(message)) {
    log('Check-in requires Turnstile/CAPTCHA. Complete it manually in a browser; the Node service will not bypass it.');
  } else {
    log(`Check-in failed: ${message}`);
  }
}

function toUnixSeconds(value) {
  if (value === null || value === undefined || value === '') return 0;

  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.floor(numeric > 1e12 ? numeric / 1000 : numeric);
  }

  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : 0;
}

function normalizeDrawState(data) {
  const now = Math.floor(Date.now() / 1000);
  const nextAvailableAt = toUnixSeconds(data.next_available_at);
  const extraDraws = Number(data.extra_draws_left || 0);
  const charges = Number(data.charges_current || 0);

  return {
    enabled: Boolean(data.enabled),
    extraDraws,
    charges,
    nextAvailableAt,
    ready: extraDraws > 0 || charges > 0 || (nextAvailableAt > 0 && nextAvailableAt <= now),
    now,
  };
}

function normalizeAdState(task) {
  const now = Math.floor(Date.now() / 1000);
  const dailyCap = Number(task?.daily_cap || 0);
  const doneCount = Number(task?.done_count || 0);
  const nextAvailableAt = toUnixSeconds(task?.next_available_at);
  const present = Boolean(task);
  const suspended = Boolean(task?.suspended);

  return {
    present,
    suspended,
    dailyCap,
    doneCount,
    durationSec: Number(task?.duration_sec || 0),
    nextAvailableAt,
    rewardType: task?.reward_type || '',
    rewardAmount: Number(task?.reward_amount || 0),
    completed: present && dailyCap > 0 && doneCount >= dailyCap,
    ready: present && !suspended && dailyCap > doneCount && (!nextAvailableAt || nextAvailableAt <= now),
    now,
  };
}

async function readGwentData(client) {
  const status = await api(client, 'GET', '/api/gwent/status');
  if (!status.json?.success) {
    log(`Reward status failed: ${responseMessage(status, `HTTP ${status.status}`)}`);
    return null;
  }
  return status.json.data || {};
}

async function readDrawState(client) {
  const data = await readGwentData(client);
  if (!data) return null;

  const state = normalizeDrawState(data);
  const next = state.nextAvailableAt
    ? new Date(state.nextAvailableAt * 1000).toLocaleString()
    : 'not provided';
  log(`Card status: extra draws=${state.extraDraws}, charges=${state.charges}, next=${next}.`);
  return state;
}

async function drawCard(client) {
  let state = await readDrawState(client);
  if (!state) return null;

  if (!state.enabled) {
    log('Card draw is currently disabled.');
    return state;
  }

  if (!state.ready) {
    if (state.nextAvailableAt > state.now) {
      log(`Card draw is not ready. Retry in about ${formatWait(state.nextAvailableAt - state.now)}.`);
    } else {
      log('Card draw is not ready and the server did not provide a next available time.');
    }
    return state;
  }

  const result = await api(client, 'POST', '/api/gwent/draw');
  if (!result.json?.success) {
    log(`Card draw failed: ${responseMessage(result, `HTTP ${result.status}`)}`);
    return state;
  }

  const data = result.json.data || {};
  const quota = extractQuota(data);
  log(`Card draw succeeded: ${describePrize(data.prize)}.`);
  log(`本次获得额度：${quota === null ? '接口未返回额度字段' : `+${quota.toLocaleString('zh-CN')}`}`);
  state = await readDrawState(client);
  return state;
}

function findQuizAnswerIndex(options) {
  if (!Array.isArray(options)) return -1;
  return options.findIndex((option) => String(option).trim() === '9.11');
}

async function requireManualQuiz(message) {
  log(`${message} Please answer manually in a browser; no other answer will be tried.`);
  return 'manual';
}

async function runQuizTask(client, task) {
  if (!task) {
    log('Daily quiz status was not returned by the server.');
    return 'unavailable';
  }
  if (task.status === 'won') {
    log('Daily quiz: completed correctly today.');
    return 'won';
  }
  if (task.status === 'lost') {
    log('Daily quiz: already answered incorrectly today.');
    return 'lost';
  }
  if (task.suspended) {
    log('Daily quiz: currently suspended.');
    return 'suspended';
  }
  if (task.enabled === false) {
    log('Daily quiz: currently disabled.');
    return 'disabled';
  }

  const started = await api(client, 'POST', '/api/gwent/task3/start');
  if (!started.json?.success) {
    return requireManualQuiz(`Daily quiz start failed: ${responseMessage(started, `HTTP ${started.status}`)}.`);
  }

  const answerIndex = findQuizAnswerIndex(started.json.data?.question?.options);
  if (answerIndex < 0) {
    return requireManualQuiz('Daily quiz: option "9.11" was not found; no answer was submitted.');
  }

  log(`Daily quiz: submitting fixed answer "9.11" (option ${answerIndex + 1}).`);
  const answered = await api(client, 'POST', '/api/gwent/task3/answer', { answer_index: answerIndex });
  if (!answered.json?.success) {
    return requireManualQuiz(`Daily quiz submission failed: ${responseMessage(answered, `HTTP ${answered.status}`)}.`);
  }

  if (answered.json.data?.correct === true) {
    log('Daily quiz: fixed answer "9.11" was correct; reward received.');
    return 'won';
  }
  if (answered.json.data?.correct === false) {
    log('Daily quiz: fixed answer "9.11" was incorrect. No other answer will be tried; answer manually on a future day.');
    return 'lost';
  }

  log('Daily quiz: answer was submitted, but the server did not return the result.');
  return 'submitted';
}
function logAdContent(content) {
  if (!content) return;
  if (typeof content === 'string') {
    log(`Ad content: ${content.replace(/\s+/g, ' ').trim()}`);
    return;
  }

  const title = content.title || content.name;
  const text = content.text || content.description || content.content;
  const url = content.url || content.link;
  if (title) log(`Ad title: ${title}`);
  if (typeof text === 'string') log(`Ad content: ${text.replace(/\s+/g, ' ').trim()}`);
  if (url) log(`Ad link: ${url}`);
}

async function runAdTask(client) {
  let data = await readGwentData(client);
  if (!data) return null;

  await runQuizTask(client, data.tasks?.task3);
  let state = normalizeAdState(data.tasks?.task2);
  if (!state.present) {
    log('Ad reward task was not returned by the server.');
    return state;
  }

  const next = state.nextAvailableAt
    ? new Date(state.nextAvailableAt * 1000).toLocaleString()
    : 'available now';
  log(`Ad reward status: ${state.doneCount}/${state.dailyCap}, next=${next}.`);

  if (state.suspended) {
    log('Ad reward task is currently suspended.');
    return state;
  }
  if (state.completed) {
    log('Ad rewards are complete for today.');
    return state;
  }
  if (!state.ready) {
    log(`Ad reward is cooling down. Retry in about ${formatWait(state.nextAvailableAt - state.now)}.`);
    return state;
  }

  const started = await api(client, 'POST', '/api/gwent/ad/start');
  if (!started.json?.success) {
    log(`Ad start failed: ${responseMessage(started, `HTTP ${started.status}`)}`);
    return state;
  }

  const ad = started.json.data || {};
  const durationSec = Math.ceil(Number(ad.duration_sec ?? state.durationSec));
  logAdContent(ad.content);
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    log('Ad duration was not returned; reward claim was skipped to avoid bypassing the timer.');
    return state;
  }

  log(`Waiting for the full ad duration: ${formatWait(durationSec)}.`);
  await sleep((durationSec + 1) * 1000);

  const claimed = await api(client, 'POST', '/api/gwent/ad/claim');
  if (claimed.json?.success) {
    const reward = state.rewardType === 'charge'
      ? `翻牌充能 +${state.rewardAmount}`
      : `${state.rewardType || '奖励'} +${state.rewardAmount}`;
    log(`广告奖励领取成功：${reward}`);
  } else {
    log(`Ad reward claim failed: ${responseMessage(claimed, `HTTP ${claimed.status}`)}`);
  }

  data = await readGwentData(client);
  state = normalizeAdState(data?.tasks?.task2);
  return state;
}

function nextDailyRunAt() {
  const next = new Date();
  next.setHours(24, 0, 5, 0);
  return Math.floor(next.getTime() / 1000);
}

function getNextSchedule(drawState, adState) {
  const now = Math.floor(Date.now() / 1000);
  if (drawState?.enabled && drawState.ready) return { at: now + 1, reason: 'card draw is available' };
  if (adState?.ready) return { at: now + 1, reason: 'ad reward is available' };

  const candidates = [
    { at: nextDailyRunAt(), reason: 'daily tasks reset' },
  ];
  if (drawState?.enabled && drawState.nextAvailableAt > now) {
    candidates.push({ at: drawState.nextAvailableAt, reason: 'card draw becomes available' });
  }
  if (adState?.present && !adState.completed && !adState.suspended && adState.nextAvailableAt > now) {
    candidates.push({ at: adState.nextAvailableAt, reason: 'ad reward becomes available' });
  }
  return candidates.sort((a, b) => a.at - b.at)[0];
}

async function runCycle(client) {
  await checkIn(client);
  const adState = await runAdTask(client);
  const drawState = await drawCard(client);
  return { drawState, adState };
}

async function main() {
  if (LOGIN_ONLY) {
    await loginWithBrowser();
    return;
  }

  let auth = await getInitialAuth();
  let client = createApiClient(auth);
  do {
    let cycleState;
    try {
      cycleState = await runCycle(client);
    } catch (error) {
      if (!(error instanceof SessionExpiredError)) throw error;
      const previousStamp = authFileStamp();
      log(NO_BROWSER_LOGIN
        ? 'Authentication expired; waiting for ".\\vsllm login" to update it.'
        : 'Authentication expired. Chrome will open only for login and close afterward.');
      auth = await refreshAuth(previousStamp);
      client = createApiClient(auth);
      continue;
    }

    if (RUN_ONCE) break;
    const { drawState, adState } = cycleState || {};
    if (!drawState && !adState) {
      throw new Error('Could not read reward status; cannot schedule the next run safely.');
    }

    const schedule = getNextSchedule(drawState, adState);
    const waitMs = Math.max(1000, schedule.at * 1000 - Date.now());
    log(`Next check: ${new Date(schedule.at * 1000).toLocaleString()} (${schedule.reason}).`);
    await sleep(waitMs);
  } while (true);
}

main().catch((error) => {
  log(`Script stopped: ${error.stack || error.message}`);
  process.exitCode = 1;
});