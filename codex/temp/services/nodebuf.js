const {
  URLS,
  HEADLESS,
  log,
  parseJson,
  isLoginUrl,
  extractNodeBufAccountPoints,
  attendanceQuotaSummary,
  runServiceStandalone,
} = require('./common');

function nodeBufCheckInSuccess(status, data) {
  return status >= 200 && status < 300 && (
    data?.summary?.checkedInToday === true ||
    data?.dashboard?.summary?.checkedInToday === true
  );
}

function extractNodeBufProfilePointsFromText(text) {
  const m = String(text || '').match(/积分\s*(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : undefined;
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
      throw new Error('NodeBuf 未登录；请先运行“重新登录全部网站.cmd”。');
    }
    const beforeQuota = extractNodeBufAccountPoints(dashboard);
    if (nodeBufCheckInSuccess(dashboardResult.status, dashboard)) {
      log('nodebuf', 'GET /api/account/points：今日已签到');
      const quota = attendanceQuotaSummary(beforeQuota, beforeQuota);
      return { ok: true, message: '今日已签到' + (quota ? '；' + quota : ''), quota: quota || '' };
    }
    if (dashboardResult.status < 200 || dashboardResult.status >= 300 || !dashboard?.summary) {
      throw new Error(`NodeBuf 积分信息接口异常（HTTP ${dashboardResult.status}）。`);
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
      (reward?.granted ? `；获得 ${reward.points} 积分；连续 ${reward.streak} 天` : ''));
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
        ? `签到成功；获得 ${reward.points} 积分`
        : '签到成功') + (quota ? '；' + quota : ''),
      quota: quota || '',
    };
  } finally {
    await page.close();
  }
}

if (require.main === module) {
  runServiceStandalone('nodebuf', runNodeBuf);
}

module.exports = {
  nodeBufCheckInSuccess,
  extractNodeBufProfilePointsFromText,
  tryNodeBufAutoLogin,
  runNodeBuf,
};
