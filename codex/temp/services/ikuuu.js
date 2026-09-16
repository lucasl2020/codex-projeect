const {
  URLS,
  log,
  parseJson,
  messageOf,
  isLoginUrl,
  waitForPageTrafficQuota,
  extractApiQuota,
  trafficQuotaSummary,
  formatTrafficQuota,
  runServiceStandalone,
} = require('./common');

function ikuuuSuccess(data) {
  return data?.ret === 1 || /\u5df2(?:\u7ecf)?\u7b7e\u5230|\u7b7e\u5230\u8fc7|\u7b7e\u5230\u6210\u529f|already/i.test(messageOf(data));
}

async function runIkuuu(context) {
  const page = await context.newPage();
  try {
    await page.goto(URLS.ikuuu, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (isLoginUrl(page.url())) throw new Error('Not logged in; run the setup command first.');
    const beforeQuota = await waitForPageTrafficQuota(page);
    let data = null;
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
      return { ok: true, message: message + (quota ? '；' + quota : ''), quota: quota || '' };
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
    data = parseJson(result.text);
    if (!data && /^\s*(<(!doctype|html)|<\?xml)/i.test(result.text)) {
      throw new Error('ikuuu 登录已失效（checkin 返回登录页），请运行「重新登录全部网站.cmd」后重试。');
    }
    log('ikuuu', `POST /user/checkin HTTP ${result.status}${messageOf(data) ? `; ${messageOf(data)}` : ''}`);
    if (ikuuuSuccess(data)) return finish(messageOf(data) || '签到成功');

    if (result.status >= 400 || !data || data.ret === undefined) {
      const button = page.locator('button, a, [role="button"]').filter({ hasText: /签到/ }).first();
      if (await button.count()) {
        await button.click({ timeout: 15000 });
        await page.waitForTimeout(1500);
        const body = await page.locator('body').innerText().catch(() => '');
        if (/签到成功|已签到|already/i.test(body)) {
          return finish('页面签到成功');
        }
      }
    }
    return false;
  } finally {
    await page.close();
  }
}

if (require.main === module) {
  runServiceStandalone('ikuuu', runIkuuu);
}

module.exports = {
  ikuuuSuccess,
  runIkuuu,
};
