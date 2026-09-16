const {
  URLS,
  HEADLESS,
  log,
  parseJson,
  responseJson,
  messageOf,
  extractQuota,
  tryClickTurnstile,
  runServiceStandalone,
} = require('./common');

function extractAnyRouterBalanceFromText(text) {
  const m = String(text || '').match(/\$(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : undefined;
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

if (require.main === module) {
  runServiceStandalone('anyrouter', runAnyRouter);
}

module.exports = {
  extractAnyRouterBalanceFromText,
  anyRouterSuccess,
  anyRouterAlreadyDone,
  anyRouterRequest,
  runAnyRouter,
};
