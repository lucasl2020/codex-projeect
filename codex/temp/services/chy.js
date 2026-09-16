const {
  URLS,
  log,
  isLoginUrl,
  isCloudflareChallengeText,
  readPageTrafficQuota,
  trafficQuotaSummary,
  runServiceStandalone,
} = require('./common');
const { ensureCloudflareCleared } = require('./cf-exclusive');

async function findChyClaimButton(page) {
  return page.locator('a[href="/claim"], a[href$="/claim"], button[data-action="claim"], [data-claim]').first();
}

async function isChyLoggedOutPage(page) {
  const body = await page.locator('body').innerText().catch(() => '');
  if (/登录即可获取|使用 LinuxDO 登录|请先登录/.test(body)) return true;
  const loginLink = await page.locator('a[href="/login"], a[href$="/login"]').first().count().catch(() => 0);
  return loginLink > 0;
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
      return { ok: true, message: message + (quota ? '；' + quota : ''), quota: quota || '' };
    };

    const claimText = /领取今日\s*5\s*GB|领取今日.*5\s*GB|领取.*5\s*GB|今日领取|领取流量|Claim\s*5\s*GB/i;
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
      if (/已领取|今日已|明日再来|already\s*claimed/i.test(body)) {
        return finish('今日已领取');
      }
      if (isCloudflareChallengeText(body) || isCloudflareChallengeText(await page.title?.().catch?.(() => '') || '')) {
        throw new Error('CHY Cloudflare 安全验证未通过，无法定位领取按钮。');
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
      return finish('点击领取成功');
    }
    const body = await page.locator('body').innerText().catch(() => '');
    if (/领取成功|已领取|流量已到账|今日已/.test(body)) {
      return finish('页面确认领取成功');
    }
    log('chy', `clicked but no clear business response; observed: ${requests.map(item => `${item.method} ${item.url}`).join('; ') || 'none'}`);
    return false;
  } finally {
    await page.close();
  }
}

if (require.main === module) {
  runServiceStandalone('chy', runChy);
}

module.exports = {
  findChyClaimButton,
  isChyLoggedOutPage,
  runChy,
};
