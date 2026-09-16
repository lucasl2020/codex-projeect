const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const {
  ROOT,
  PROFILE_DIR,
  HEADLESS,
  log,
  parseJson,
  attendanceQuotaSummary,
  attempt,
  launchContext,
  isLoginUrl,
  isCloudflareChallengeText,
  isCloudflareChallengePage,
  cloudflareOriginErrorCode,
  tryClickTurnstile,
} = require('./common');

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
  return process.env.CF_BYPASS_HELPER || path.join(ROOT, 'cf-bypass-json.py');
}

async function runLocalCfBypass(url, {
  helperPath = defaultCfBypassHelperPath(),
  pythonPath = process.env.PYTHON_PATH || 'python',
  headless = HEADLESS,
  timeoutMs = 45000,
  spawnImpl = spawn,
  fsApi = fs,
} = {}) {
  let cfSolver = null;
  try { cfSolver = require('../cf-solver'); } catch { cfSolver = null; }
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

async function runCfApiAttendance(context, site) {
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

function attendanceAlreadyDone(data, text = '') {
  const { messageOf } = require('./common');
  const message = messageOf(data) || String(text).trim();
  return /\u5df2(?:\u7ecf)?\u9886\u53d6|\u5df2(?:\u7ecf)?\u7b7e\u5230|\u4eca\u65e5\u5df2|\u4eca\u5929\u5df2.*\u7b7e\u5230|\u5b8c\u6210\u7b7e\u5230|already|claimed|completed.*(?:sign|check)/i.test(message);
}

function attendanceSuccess(status, data, text = '') {
  const { messageOf } = require('./common');
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

async function readAttendanceQuota(page) {
  const { extractAttendanceQuotaFromText } = require('./common');
  const text = await page.evaluate(() => document.body.innerText, 'quota').catch(() => '');
  return extractAttendanceQuotaFromText(text);
}

async function runLuckyAttendance(context, site) {
  const { extractAttendanceQuota } = require('./common');
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
        const { messageOf } = require('./common');
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

module.exports = {
  parseCfBypassJson,
  defaultCfBypassHelperPath,
  runLocalCfBypass,
  applyCfBypassCookies,
  ensureCloudflareCleared,
  parseDrissionAttendanceJson,
  defaultDrissionHelperPath,
  resolveDrissionPython,
  runLocalDrissionAttendance,
  runCfApiAttendance,
  runProfileExclusiveAttendance,
  attendanceRequestPlans,
  findAttendanceButton,
  attendanceAlreadyDone,
  attendanceSuccess,
  readAttendanceQuota,
  runLuckyAttendance,
};
