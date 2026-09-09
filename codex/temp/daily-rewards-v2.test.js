const assert = require('node:assert/strict');
const { test } = require('node:test');
const { EventEmitter } = require('node:events');
const path = require('node:path');
const {
  applyCfBypassCookies,
  attendanceRequestPlans,
  attendanceSuccess,
  extractAnyRouterBalanceFromText,
  extractAttendanceQuota,
  extractAttendanceQuotaFromText,
  extractNodeBufProfilePointsFromText,
  extractTrafficQuotaFromText,
  attendanceQuotaSummary,
  findAttendanceButton,
  findChyClaimButton,
  isChyLoggedOutPage,
  cloudflareOriginErrorCode,
  isCloudflareChallengePage,
  isCloudflareChallengeText,
  nodeBufCheckInSuccess,
  parseCfBypassJson,
  parseDrissionAttendanceJson,
  runLocalDrissionAttendance,
  runLuckyAttendance,
  runProfileExclusiveAttendance,
  runOptionalAllApiHubQuickCheckin,
  runNodeBuf,
  tryNodeBufAutoLogin,
} = require('./daily-rewards-v2.js');

test('CF Cookie 回写只保留 Cloudflare Cookie 并清理旧值', async () => {
  const calls = [];
  const context = {
    async clearCookies(filter) { calls.push(['clear', filter]); },
    async addCookies(cookies) { calls.push(['add', cookies]); },
  };
  const applied = await applyCfBypassCookies(context, 'https://www.nodeseek.com/board', {
    success: true,
    cookies: {
      cf_clearance: 'new-clearance',
      __cf_bm: 'new-bm',
      session: 'must-not-copy',
      pjwt: 'must-not-copy',
    },
  });
  assert.equal(applied, true);
  assert.equal(calls.filter(([kind]) => kind === 'clear').length, 4);
  assert.ok(calls.filter(([kind]) => kind === 'clear').every(([, filter]) => ['cf_clearance', '__cf_bm'].includes(filter.name)));
  const added = calls.find(([kind]) => kind === 'add')[1];
  assert.deepEqual(added.map(cookie => cookie.name).sort(), ['__cf_bm', 'cf_clearance']);
  assert.ok(added.every(cookie => cookie.domain === '.www.nodeseek.com' && cookie.path === '/'));
});

test('CF Cookie 不存在或上下文不支持时不写入', async () => {
  assert.equal(await applyCfBypassCookies({ addCookies: async () => {} }, 'https://www.nodeseek.com/board', {
    success: true,
    cookies: { session: 'only-session' },
  }), false);
  assert.equal(await applyCfBypassCookies({}, 'https://www.nodeseek.com/board', {
    success: true,
    cookies: { cf_clearance: 'x' },
  }), false);
});
test('NodeSeek/DeepFlood 接口成功响应可确认领取', () => {
  assert.equal(attendanceSuccess(200, { success: true, message: '获得鸡腿' }), true);
  assert.equal(attendanceSuccess(200, { message: '今日已领取' }), true);
});

test('未登录或失败响应不会误判为成功', () => {
  assert.equal(attendanceSuccess(401, { message: '未登录' }), false);
  assert.equal(attendanceSuccess(200, { message: '领取失败' }), false);
  assert.equal(attendanceSuccess(404, null, '<html>鸡腿领取页面</html>'), false);
});

test('NodeBuf 只接受已确认签到的接口响应', () => {
  assert.equal(nodeBufCheckInSuccess(200, { summary: { checkedInToday: true } }), true);
  assert.equal(nodeBufCheckInSuccess(200, {
    result: { granted: true, points: 10, streak: 2 },
    dashboard: { summary: { checkedInToday: true } },
  }), true);
  assert.equal(nodeBufCheckInSuccess(401, { summary: { checkedInToday: true } }), false);
  assert.equal(nodeBufCheckInSuccess(200, { result: { granted: false } }), false);
});


function luckyAttendanceContext({
  api = { status: 200, text: JSON.stringify({ success: false, message: '\u63a5\u53e3\u672a\u786e\u8ba4\u6210\u529f' }) },
  bodyBefore = '\u4eca\u65e5\u8fd8\u672a\u7b7e\u5230\uff0c\u8bd5\u8bd5\u624b\u6c14',
  bodyAfter = '\u4eca\u65e5\u7b7e\u5230\u83b7\u5f97\u9e21\u817f5\u4e2a',
  quotaBefore = '\u9e21\u817f 100',
  quotaAfter = '\u9e21\u817f 105',
  hasDataButton = false,
  hasTextButton = false,
  hasHeadInfoButton = false,
} = {}) {
  let body = bodyBefore;
  let clicks = 0;
  let closed = false;
  let apiIndex = 0;
  let quotaReads = 0;
  const apiCalls = [];
  const page = {
    on() {},
    async goto() {},
    url() { return 'https://www.nodeseek.com/board'; },
    locator(selector) {
      if (selector === 'body') return { async innerText() { return body; } };
      const matched = selector.includes('data-rand')
        ? hasDataButton
        : selector.includes('.head-info')
          ? hasHeadInfoButton
          : hasTextButton;
      const locator = {
        first() { return this; },
        filter() { return this; },
        async count() { return matched ? 1 : 0; },
        async scrollIntoViewIfNeeded() {},
        async click() { clicks += 1; body = bodyAfter; },
      };
      return locator;
    },
    async evaluate(callback, request) {
      if (typeof request === 'string') {
        return quotaReads++ === 0 ? quotaBefore : quotaAfter;
      }
      apiCalls.push(request);
      if (!Array.isArray(api)) return api;
      return api[Math.min(apiIndex++, api.length - 1)];
    },
    async waitForTimeout() {},
    async close() { closed = true; },
  };
  return {
    context: { async newPage() { return page; } },
    apiCalls,
    clicks: () => clicks,
    wasClosed: () => closed,
  };
}

test('NodeSeek attendance request plans match the two known endpoint formats', () => {
  assert.deepEqual(attendanceRequestPlans(), [
    {
      url: '/api/attendance',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: 'random=true',
    },
    {
      url: '/api/attendance?random=true',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json;charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ content: [] }),
    },
  ]);
});

test('NodeSeek tries the JSON attendance endpoint when the form endpoint fails', async () => {
  const mock = luckyAttendanceContext({
    api: [
      { status: 400, text: JSON.stringify({ success: false, message: '\u8bf7\u6c42\u683c\u5f0f\u9519\u8bef' }) },
      { status: 200, text: JSON.stringify({ success: true, message: '\u83b7\u5f975\u4e2a\u9e21\u817f', current: 105 }) },
    ],
    hasHeadInfoButton: true,
  });
  const result = await runLuckyAttendance(mock.context, {
    task: 'nodeseek',
    url: 'https://www.nodeseek.com/board',
    origin: 'https://www.nodeseek.com/',
  });
  assert.equal(result.ok, true);
  assert.deepEqual(mock.apiCalls.map(call => call.url), [
    '/api/attendance',
    '/api/attendance?random=true',
  ]);
  assert.equal(mock.clicks(), 0);
  assert.match(result.message, /\u7b7e\u5230\u540e\u989d\u5ea6\uff1a105/);
});

test('NodeSeek fallback recognizes an attendance control rendered as a head-info div', async () => {
  const mock = luckyAttendanceContext({ hasHeadInfoButton: true });
  const result = await runLuckyAttendance(mock.context, {
    task: 'nodeseek',
    url: 'https://www.nodeseek.com/board',
    origin: 'https://www.nodeseek.com/',
  });
  assert.equal(result.ok, true);
  assert.equal(mock.clicks(), 1);
});

test('NodeSeek fallback clicks current random attendance control and reports quota', async () => {
  const mock = luckyAttendanceContext({ hasDataButton: true });
  const result = await runLuckyAttendance(mock.context, {
    task: 'nodeseek',
    url: 'https://www.nodeseek.com/board',
    origin: 'https://www.nodeseek.com/',
  });
  assert.equal(result.ok, true);
  assert.equal(mock.clicks(), 1);
  assert.match(result.message, /\u7b7e\u5230\u524d\u989d\u5ea6\uff1a100/);
  assert.match(result.message, /\u7b7e\u5230\u540e\u989d\u5ea6\uff1a105/);
  assert.match(result.message, /\u989d\u5ea6\u53d8\u5316\uff1a5/);
  assert.equal(mock.wasClosed(), true);
});

test('NodeSeek successful first attendance method stops all remaining methods', async () => {
  const mock = luckyAttendanceContext({
    api: [
      { status: 200, text: JSON.stringify({ success: true, message: '\u7b7e\u5230\u6210\u529f', current: 105 }) },
      { status: 200, text: JSON.stringify({ success: true, message: '\u4e0d\u5e94\u6267\u884c\u7b2c\u4e8c\u79cd\u65b9\u5f0f' }) },
    ],
    hasDataButton: true,
  });
  const result = await runLuckyAttendance(mock.context, {
    task: 'nodeseek',
    url: 'https://www.nodeseek.com/board',
    origin: 'https://www.nodeseek.com/',
  });
  assert.equal(result.ok, true);
  assert.equal(mock.apiCalls.length, 1);
  assert.equal(mock.clicks(), 0);
  assert.match(result.message, /\u7b7e\u5230\u540e\u989d\u5ea6\uff1a105/);
});

test('NodeSeek HTTP 500 already-completed response stops all fallback methods and reports quota', async () => {
  const mock = luckyAttendanceContext({
    api: [
      { status: 500, text: JSON.stringify({ success: false, message: '\u4eca\u5929\u5df2\u5b8c\u6210\u7b7e\u5230\uff0c\u8bf7\u52ff\u91cd\u590d\u64cd\u4f5c' }) },
      { status: 200, text: JSON.stringify({ success: true, message: '\u4e0d\u5e94\u6267\u884c\u7b2c\u4e8c\u79cd\u65b9\u5f0f' }) },
    ],
    hasDataButton: true,
    quotaAfter: '\u9e21\u817f 100',
  });
  const result = await runLuckyAttendance(mock.context, {
    task: 'nodeseek',
    url: 'https://www.nodeseek.com/board',
    origin: 'https://www.nodeseek.com/',
  });
  assert.equal(result.ok, true);
  assert.equal(mock.apiCalls.length, 1);
  assert.equal(mock.clicks(), 0);
  assert.match(result.message, /\u5f53\u524d\u989d\u5ea6\uff1a100/);
});

test('NodeSeek completed attendance response does not click again', async () => {
  const mock = luckyAttendanceContext({
    api: { status: 200, text: JSON.stringify({ success: false, message: '\u4eca\u5929\u5df2\u5b8c\u6210\u7b7e\u5230\uff0c\u8bf7\u52ff\u91cd\u590d\u64cd\u4f5c', current: 100 }) },
    hasDataButton: true,
    quotaAfter: '\u9e21\u817f 100',
  });
  const result = await runLuckyAttendance(mock.context, {
    task: 'nodeseek',
    url: 'https://www.nodeseek.com/board',
    origin: 'https://www.nodeseek.com/',
  });
  assert.equal(result.ok, true);
  assert.equal(mock.clicks(), 0);
  assert.match(result.message, /\u5f53\u524d\u989d\u5ea6\uff1a100/);
});

test('NodeSeek/DeepFlood 只从首页总数取余额，不把签到奖励当余额', () => {
  assert.equal(extractAttendanceQuota({ gain: 5, current: 5, result: { points: 5 } }), undefined);
  assert.equal(extractAttendanceQuota({ result: { points: 5 }, account: { balance: 105 } }), 105);
  assert.equal(extractAttendanceQuotaFromText('\u9e21\u817f 559'), 559);
  assert.equal(extractAttendanceQuotaFromText('\u4eca\u65e5\u7b7e\u5230\u83b7\u5f97\u9e21\u817f8\u4e2a\uff0c\u5f53\u524d\u6392\u540d\u7b2c532'), undefined);
  assert.equal(extractAttendanceQuotaFromText('\u5f53\u524d\u9e21\u817f\uff1a0\uff1b\u672c\u6b21\u83b7\u5f975\u4e2a\u9e21\u817f'), 0);
});

test('CHY 优先识别真实页面的 /claim 链接', async () => {
  const selectors = [];
  const locator = {
    first() { return this; },
    async count() { return 1; },
  };
  const page = {
    locator(selector) { selectors.push(selector); return locator; },
  };

  assert.equal(await findChyClaimButton(page), locator);
  assert.equal(selectors[0], 'a[href="/claim"], a[href$="/claim"], button[data-action="claim"], [data-claim]');
});


test('CHY \u6839\u8def\u5f84\u672a\u767b\u5f55\u9996\u9875\u53ef\u88ab\u660e\u786e\u8bc6\u522b', async () => {
  const login = {
    first() { return this; },
    async count() { return 1; },
  };
  const page = {
    url() { return 'https://dy.chybenzun.top/'; },
    locator(selector) {
      if (selector === 'body') {
        return { async innerText() { return '\u767b\u5f55\u5373\u53ef\u83b7\u53d6\u4e13\u5c5e\u8ba2\u9605\n\u4f7f\u7528 LinuxDO \u767b\u5f55'; } };
      }
      assert.equal(selector, 'a[href="/login"], a[href$="/login"]');
      return login;
    },
  };
  assert.equal(await isChyLoggedOutPage(page), true);
});

test('正常业务页加载 Cloudflare 脚本时不误判为挑战页', () => {
  assert.equal(isCloudflareChallengePage(
    'CHY 公益订阅',
    '领取今日 5GB',
    '<script src="/cdn-cgi/challenge-platform/scripts/jsd/main.js"></script>',
  ), false);
  assert.equal(isCloudflareChallengePage('请稍候…', '正在进行安全验证', '<html></html>'), true);
});
test('Cloudflare 522 源站错误不误判为验证码页面', () => {
  const title = 'nodeseek.com | 522: Connection timed out';
  const body = 'Connection timed out Error code 522 Browser Working Cloudflare Working Host Error Ray ID: abc';
  assert.equal(cloudflareOriginErrorCode(title, body), '522');
  assert.equal(isCloudflareChallengePage(title, body), false);
});

test('Cloudflare challenge text can be detected', () => {
  assert.equal(isCloudflareChallengeText('Just a moment...'), true);
  assert.equal(isCloudflareChallengeText('www.nodeseek.com 正在进行安全验证'), true);
  assert.equal(isCloudflareChallengeText('今日还未签到, 试试手气'), false);
});

test('DrissionPage 签到 JSON 解析保留额度', () => {
  assert.deepEqual(parseDrissionAttendanceJson(JSON.stringify({
    ok: true,
    already: false,
    message: '页面点击签到成功',
    before_quota: 100,
    after_quota: 105,
    error: '',
  })), {
    ok: true,
    already: false,
    dryRun: false,
    message: '页面点击签到成功',
    beforeQuota: 100,
    afterQuota: 105,
    error: '',
  });
});

test('DrissionPage 签到复用主浏览器的持久 Profile', async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  let args;
  const profileDir = 'D:\\profiles\\daily-rewards';
  const resultPromise = runLocalDrissionAttendance({
    url: 'https://www.nodeseek.com/board',
    origin: 'https://www.nodeseek.com/',
    profileDir,
  }, {
    helperPath: 'drission-attendance-json.py',
    timeoutMs: 15000,
    fsApi: { existsSync: () => true },
    spawnImpl: (_python, childArgs) => {
      args = childArgs;
      process.nextTick(() => {
        child.stdout.emit('data', JSON.stringify({ ok: true, message: '今日已签到' }));
        child.emit('close', 0);
      });
      return child;
    },
  });

  assert.equal((await resultPromise).ok, true);
  assert.deepEqual(args.slice(args.indexOf('--quota-url'), args.indexOf('--quota-url') + 2), [
    '--quota-url',
    'https://www.nodeseek.com/',
  ]);
  assert.deepEqual(args.slice(-2), ['--user-data-dir', profileDir]);
});

test('CF bypass helper JSON parser accepts success payload', () => {
  const parsed = parseCfBypassJson(JSON.stringify({
    success: true,
    strategy: 'drissionpage',
    user_agent: 'UA',
    cookies: { cf_clearance: 'abc', session: 'x' },
  }));
  assert.equal(parsed.success, true);
  assert.equal(parsed.strategy, 'drissionpage');
  assert.equal(parsed.cookies.cf_clearance, 'abc');
});

test('NodeSeek can locate plain 试试手气 text control', async () => {
  const page = {
    locator(selector) {
      if (selector.includes('data-rand')) {
        return {
          first() { return this; },
          async count() { return 0; },
        };
      }
      return {
        first() { return this; },
        filter() { return this; },
        async count() { return 0; },
      };
    },
    getByText(text) {
      const matched = String(text).includes('试试手气') || (text instanceof RegExp && text.test('试试手气'));
      return {
        first() { return this; },
        async count() { return matched ? 1 : 0; },
        async scrollIntoViewIfNeeded() {},
        async click() {},
      };
    },
  };
  const button = await findAttendanceButton(page);
  assert.ok(button);
  assert.equal(await button.count(), 1);
});

test('NodeSeek Cloudflare challenge without clearance fails with clear message', async () => {
  let body = 'Just a moment... www.nodeseek.com 正在进行安全验证 Ray ID: abc';
  const page = {
    on() {},
    async goto() {},
    url() { return 'https://www.nodeseek.com/board'; },
    async title() { return 'Just a moment...'; },
    locator(selector) {
      if (selector === 'body') return { async innerText() { return body; } };
      return {
        first() { return this; },
        filter() { return this; },
        async count() { return 0; },
        async scrollIntoViewIfNeeded() {},
        async click() {},
      };
    },
    getByText() {
      return {
        first() { return this; },
        async count() { return 0; },
      };
    },
    async evaluate() {
      return { status: 403, text: '<html>Just a moment...</html>' };
    },
    async waitForTimeout() {},
    async reload() {},
    async close() {},
  };
  const context = {
    async newPage() { return page; },
    async addCookies() {},
  };
  await assert.rejects(
    () => runLuckyAttendance(context, {
      task: 'nodeseek',
      url: 'https://www.nodeseek.com/board',
      origin: 'https://www.nodeseek.com/',
      waitMs: 0,
      bypassCloudflare: async () => ({ success: false, error: 'all strategies failed' }),
    }),
    /Cloudflare|安全验证|cf_clearance|绕过/,
  );
});


test('NodeSeek Cloudflare 时 DrissionPage 成功后停止其他签到方式', async () => {
  let apiCalls = 0;
  const page = {
    on() {},
    async goto() {},
    url() { return 'https://www.nodeseek.com/board'; },
    async title() { return 'Just a moment...'; },
    locator(selector) {
      if (selector === 'body') return { async innerText() { return 'Just a moment... Ray ID: abc'; } };
      return {
        first() { return this; },
        filter() { return this; },
        async count() { return 0; },
      };
    },
    async evaluate() { apiCalls += 1; return { status: 500, text: '' }; },
    async waitForTimeout() {},
    async close() {},
  };
  const context = { async newPage() { return page; }, async addCookies() {} };
  const result = await runLuckyAttendance(context, {
    task: 'nodeseek',
    url: 'https://www.nodeseek.com/board',
    origin: 'https://www.nodeseek.com/',
    waitMs: 0,
    bypassCloudflare: async () => ({ success: false, error: 'blocked' }),
    drissionFallback: true,
    runDrissionAttendance: async () => ({
      ok: true,
      message: '页面点击签到成功',
      beforeQuota: 100,
      afterQuota: 105,
    }),
  });
  assert.equal(result.ok, true);
  assert.match(result.message, /页面点击签到成功/);
  assert.match(result.message, /签到前额度：100/);
  assert.equal(apiCalls, 0);
});


test('NodeSeek 优先复用 DrissionPage 持久会话，成功时不打开 Playwright 页面', async () => {
  let pages = 0;
  let drissionCalls = 0;
  const context = {
    async newPage() {
      pages += 1;
      throw new Error('Playwright page should not be opened');
    },
  };
  const result = await runLuckyAttendance(context, {
    task: 'nodeseek',
    url: 'https://www.nodeseek.com/board',
    origin: 'https://www.nodeseek.com/',
    drissionFallback: true,
    drissionFirst: true,
    runDrissionAttendance: async () => {
      drissionCalls += 1;
      return {
        ok: true,
        message: '页面原生点击签到成功',
        beforeQuota: 100,
        afterQuota: 105,
      };
    },
  });
  assert.equal(result.ok, true);
  assert.equal(drissionCalls, 1);
  assert.equal(pages, 0);
  assert.match(result.message, /签到前额度：100/);
});



test('NodeSeek DrissionPage 明确网络失败时不打开 Playwright 页面', async () => {
  let pages = 0;
  const context = {
    async newPage() {
      pages += 1;
      throw new Error('Playwright page should not be opened');
    },
  };
  await assert.rejects(
    () => runLuckyAttendance(context, {
      task: 'nodeseek',
      url: 'https://www.nodeseek.com/board',
      origin: 'https://www.nodeseek.com/',
      drissionFallback: true,
      drissionFirst: true,
      runDrissionAttendance: async () => ({
        ok: false,
        error: '页面加载失败：本机无法访问目标网站；这不是验证码问题。',
      }),
    }),
    /页面加载失败.*不是验证码问题/,
  );
  assert.equal(pages, 0);
});

test('NodeSeek DrissionPage 独占模式失败时不打开第二个浏览器', async () => {
  let pages = 0;
  const context = {
    async newPage() {
      pages += 1;
      throw new Error('Playwright page should not be opened');
    },
  };
  await assert.rejects(
    () => runLuckyAttendance(context, {
      task: 'nodeseek',
      url: 'https://www.nodeseek.com/board',
      origin: 'https://www.nodeseek.com/',
      drissionFirst: true,
      drissionOnly: true,
      runDrissionAttendance: async () => ({
        ok: false,
        error: '登录状态已失效',
      }),
    }),
    /登录状态已失效/,
  );
  assert.equal(pages, 0);
});

test('NodeSeek 和 DeepFlood 释放主 Profile 后串行使用同一登录会话', async () => {
  const events = [];
  const originalContext = {
    async close() { events.push('close-primary'); },
  };
  const reopenedContext = { name: 'reopened' };
  const sites = [
    { task: 'nodeseek', url: 'https://www.nodeseek.com/board' },
    { task: 'deepflood', url: 'https://www.deepflood.com/board' },
  ];

  const outcome = await runProfileExclusiveAttendance(originalContext, sites, {
    profileDir: 'D:\\profiles\\daily-rewards',
    attemptImpl: async (context, task, fn) => {
      assert.equal(context, null);
      events.push(`attempt:${task}`);
      return { task, ...(await fn()) };
    },
    runAttendanceImpl: async (context, site) => {
      assert.equal(context, null);
      assert.equal(site.drissionFirst, true);
      assert.equal(site.drissionOnly, true);
      assert.equal(site.profileDir, 'D:\\profiles\\daily-rewards');
      events.push(`attendance:${site.task}`);
      return { ok: true };
    },
    launchContextImpl: async () => {
      events.push('reopen-primary');
      return reopenedContext;
    },
  });

  assert.equal(outcome.context, reopenedContext);
  assert.deepEqual(outcome.results.map(result => result.task), ['nodeseek', 'deepflood']);
  assert.deepEqual(events, [
    'close-primary',
    'attempt:nodeseek',
    'attendance:nodeseek',
    'attempt:deepflood',
    'attendance:deepflood',
    'reopen-primary',
  ]);
});

test('DeepFlood 返回 Cloudflare 522 时不启动验证码或签到回退', async () => {
  let bypassCalls = 0;
  let drissionCalls = 0;
  let apiCalls = 0;
  const page = {
    on() {},
    async goto() {},
    url() { return 'https://www.deepflood.com/board'; },
    async title() { return 'nodeseek.com | 522: Connection timed out'; },
    locator(selector) {
      if (selector === 'body') {
        return { async innerText() { return 'Connection timed out Error code 522 Browser Working Cloudflare Working Host Error Ray ID: abc'; } };
      }
      return {
        first() { return this; },
        filter() { return this; },
        async count() { return 0; },
      };
    },
    async evaluate() { apiCalls += 1; return { status: 500, text: '' }; },
    async waitForTimeout() {},
    async close() {},
  };
  const context = { async newPage() { return page; }, async addCookies() {} };
  await assert.rejects(
    () => runLuckyAttendance(context, {
      task: 'deepflood',
      url: 'https://www.deepflood.com/board',
      origin: 'https://www.deepflood.com/',
      waitMs: 0,
      bypassCloudflare: async () => { bypassCalls += 1; return { success: false }; },
      drissionFallback: true,
      runDrissionAttendance: async () => { drissionCalls += 1; return { ok: false }; },
    }),
    /Cloudflare 522.*不是验证码问题/,
  );
  assert.equal(bypassCalls, 0);
  assert.equal(drissionCalls, 0);
  assert.equal(apiCalls, 0);
});

test('DeepFlood Cloudflare 时 DrissionPage 失败后不再调用接口', async () => {
  let apiCalls = 0;
  const page = {
    on() {},
    async goto() {},
    url() { return 'https://www.deepflood.com/board'; },
    async title() { return '请稍候…'; },
    locator(selector) {
      if (selector === 'body') return { async innerText() { return '正在进行安全验证 Ray ID: abc'; } };
      return {
        first() { return this; },
        filter() { return this; },
        async count() { return 0; },
      };
    },
    async evaluate() { apiCalls += 1; return { status: 500, text: '' }; },
    async waitForTimeout() {},
    async close() {},
  };
  const context = { async newPage() { return page; }, async addCookies() {} };
  await assert.rejects(
    () => runLuckyAttendance(context, {
      task: 'deepflood',
      url: 'https://www.deepflood.com/board',
      origin: 'https://www.deepflood.com/',
      waitMs: 0,
      bypassCloudflare: async () => ({ success: false, error: 'blocked' }),
      drissionFallback: true,
      runDrissionAttendance: async () => ({
        ok: false,
        error: 'Cloudflare 安全验证未完成；请在打开的 Chrome 窗口中完成验证',
      }),
    }),
    /DrissionPage 回退失败.*Cloudflare 安全验证未完成/,
  );
  assert.equal(apiCalls, 0);
});
test('额度摘要在无可靠额度时完全跳过', () => {
  assert.equal(attendanceQuotaSummary(undefined, undefined), '');
  assert.equal(attendanceQuotaSummary(NaN, NaN), '');
});

test('额度摘要仅在有可靠数字时显示', () => {
  assert.equal(
    attendanceQuotaSummary(100, 105),
    '签到前额度：100；签到后额度：105；额度变化：5',
  );
  assert.equal(attendanceQuotaSummary(100, undefined), '当前额度：100');
  assert.equal(attendanceQuotaSummary(undefined, 105), '当前额度：105');
  assert.equal(attendanceQuotaSummary(0, 0), '当前额度：0');
});

test('流量文本可解析剩余/可用流量', () => {
  assert.equal(extractTrafficQuotaFromText('剩余流量 12.5 GB'), 12.5 * 1024);
  assert.equal(extractTrafficQuotaFromText('可用流量：1024MB'), 1024);
  assert.equal(extractTrafficQuotaFromText('剩余流量 1 TB'), 1 * 1024 * 1024);
  assert.equal(extractTrafficQuotaFromText('今日已签到'), undefined);
});

test('NodeBuf 和 AnyRouter 从指定页面的明确字段读取总余额', () => {
  assert.equal(extractNodeBufProfilePointsFromText('\u79ef\u5206\u4e2d\u5fc3 \u79ef\u5206 791 \u8fde\u7eed\u7b7e\u5230 26'), 791);
  assert.equal(extractAnyRouterBalanceFromText('\u5f53\u524d\u4f59\u989d $1350.00 \u5386\u53f2\u6d88\u8017 $0.00'), 1350);
});

test('NodeSeek 签到响应只有本次奖励时不展示为总余额', async () => {
  const mock = luckyAttendanceContext({
    api: { status: 200, text: JSON.stringify({ success: true, message: '\u83b7\u5f978\u4e2a\u9e21\u817f', result: { points: 8 } }) },
    quotaBefore: '',
    quotaAfter: '',
  });
  const result = await runLuckyAttendance(mock.context, {
    task: 'nodeseek',
    url: 'https://www.nodeseek.com/board',
    origin: 'https://www.nodeseek.com/',
  });
  assert.equal(result.ok, true);
  assert.doesNotMatch(result.message, /\u989d\u5ea6/);
});

test('NodeSeek 无额度时成功结果不展示未获取', async () => {
  const mock = luckyAttendanceContext({
    api: { status: 200, text: JSON.stringify({ success: true, message: '签到成功' }) },
    bodyBefore: '试试手气',
    bodyAfter: '签到成功',
    quotaBefore: '',
    quotaAfter: '',
  });
  const result = await runLuckyAttendance(mock.context, {
    task: 'nodeseek',
    url: 'https://www.nodeseek.com/board',
    origin: 'https://www.nodeseek.com/',
  });
  assert.equal(result.ok, true);
  assert.doesNotMatch(result.message, /额度/);
  assert.doesNotMatch(result.message, /未获取/);
});

test('NodeBuf 有总积分时显示额度，奖励 points 不当总额', async () => {
  const mock = nodeBufContext({
    GET: {
      status: 200,
      text: JSON.stringify({ summary: { checkedInToday: false, points: 88 } }),
    },
    POST: {
      status: 200,
      text: JSON.stringify({
        result: { granted: true, points: 10, streak: 3 },
        dashboard: { summary: { checkedInToday: true, points: 98 } },
      }),
    },
  });
  const result = await runNodeBuf(mock.context);
  assert.equal(result.ok, true);
  assert.match(result.message, /签到前额度：88/);
  assert.match(result.message, /签到后额度：98/);
  assert.match(result.message, /额度变化：10/);
  assert.doesNotMatch(result.message, /未获取/);
});

test('NodeBuf 无总积分字段时不显示额度', async () => {
  const mock = nodeBufContext({
    GET: { status: 200, text: JSON.stringify({ summary: { checkedInToday: true } }) },
  });
  const result = await runNodeBuf(mock.context);
  assert.equal(result.ok, true);
  assert.doesNotMatch(String(result.message || ''), /额度/);
  assert.doesNotMatch(String(result.message || ''), /未获取/);
});


function nodeBufContext(responses, { initialUrl = 'https://nodebuf.com/user/profile' } = {}) {
  const calls = [];
  let closed = false;
  let currentUrl = initialUrl;
  let loginClicks = 0;
  const responsePoints = response => {
    const data = JSON.parse(response?.text || 'null');
    return data?.dashboard?.summary?.points ?? data?.summary?.points;
  };
  const beforePoints = responsePoints(responses.GET);
  const afterPoints = responsePoints(responses.POST);
  let body = Number.isFinite(beforePoints) ? `\u4e2a\u4eba\u8d44\u6599 \u79ef\u5206 ${beforePoints}` : '\u4e2a\u4eba\u8d44\u6599';
  const page = {
    async goto() {},
    url() { return currentUrl; },
    async waitForFunction() {},
    async waitForURL(predicate) {
      assert.equal(predicate(new URL(currentUrl)), true);
    },
    locator(selector) {
      if (selector === 'body') return { async innerText() { return body; } };
      return {
        first() { return this; },
        async count() {
          return selector === 'form button[type="submit"]' ? 1 : 0;
        },
        async click() {
          loginClicks += 1;
          currentUrl = 'https://nodebuf.com/user/points';
        },
      };
    },
    async evaluate(callback) {
      const endpoint = callback.toString().includes('/check-in') ? 'POST' : 'GET';
      calls.push(endpoint);
      if (endpoint === 'POST' && Number.isFinite(afterPoints)) body = `\u4e2a\u4eba\u8d44\u6599 \u79ef\u5206 ${afterPoints}`;
      return responses[endpoint];
    },
    async reload() {},
    async close() { closed = true; },
  };
  return {
    context: { async newPage() { return page; } },
    calls,
    loginClicks: () => loginClicks,
    wasClosed: () => closed,
  };
}

function nodeBufLoginPage({ autofilled = true, turnstile = false, twoFactor = false } = {}) {
  let currentUrl = 'https://nodebuf.com/auth/login?redirect=/user/points';
  let clicks = 0;
  return {
    page: {
      url() { return currentUrl; },
      async waitForFunction() {
        if (!autofilled) throw new Error('Timeout');
      },
      async waitForURL(predicate) {
        if (!predicate(new URL(currentUrl))) throw new Error('Timeout');
      },
      locator(selector) {
        return {
          first() { return this; },
          async count() {
            if (selector.includes('challenges.cloudflare.com')) return turnstile ? 1 : 0;
            if (selector === 'input[name="twoFactorCode"]') return twoFactor ? 1 : 0;
            return selector === 'form button[type="submit"]' ? 1 : 0;
          },
          async click() {
            clicks += 1;
            if (!twoFactor) currentUrl = 'https://nodebuf.com/user/points';
          },
        };
      },
    },
    clicks: () => clicks,
  };
}

test('NodeBuf 可使用 Chrome 已自动填充的密码提交登录', async () => {
  const mock = nodeBufLoginPage();
  assert.equal(await tryNodeBufAutoLogin(mock.page, { timeout: 1 }), true);
  assert.equal(mock.clicks(), 1);
});

test('NodeBuf 未自动填充密码时不会提交登录', async () => {
  const mock = nodeBufLoginPage({ autofilled: false });
  await assert.rejects(
    () => tryNodeBufAutoLogin(mock.page, { timeout: 1 }),
    /未检测到 Chrome 自动填充/,
  );
  assert.equal(mock.clicks(), 0);
});

test('NodeBuf 无头模式不会尝试密码自动填充', async () => {
  const mock = nodeBufLoginPage();
  await assert.rejects(
    () => tryNodeBufAutoLogin(mock.page, { timeout: 1, headless: true }),
    /HEADLESS=1/,
  );
  assert.equal(mock.clicks(), 0);
});
test('NodeBuf 出现 Turnstile 时不会自动提交登录', async () => {
  const mock = nodeBufLoginPage({ turnstile: true });
  await assert.rejects(
    () => tryNodeBufAutoLogin(mock.page, { timeout: 1 }),
    /Turnstile/,
  );
  assert.equal(mock.clicks(), 0);
});

test('NodeBuf 要求二步验证时停止后续操作', async () => {
  const mock = nodeBufLoginPage({ twoFactor: true });
  await assert.rejects(
    () => tryNodeBufAutoLogin(mock.page, { timeout: 1 }),
    /二步验证/,
  );
  assert.equal(mock.clicks(), 1);
});

test('NodeBuf 今日已签到时不重复提交', async () => {
  const mock = nodeBufContext({
    GET: { status: 200, text: JSON.stringify({ summary: { checkedInToday: true } }) },
  });
  const result = await runNodeBuf(mock.context);
  assert.equal(result === true || result?.ok === true, true);
  assert.deepEqual(mock.calls, ['GET']);
  assert.equal(mock.wasClosed(), true);
});

test('NodeBuf 登录页自动登录后继续查询签到状态', async () => {
  const mock = nodeBufContext({
    GET: { status: 200, text: JSON.stringify({ summary: { checkedInToday: true } }) },
  }, { initialUrl: 'https://nodebuf.com/auth/login?redirect=/user/points' });
  const result = await runNodeBuf(mock.context);
  assert.equal(result === true || result?.ok === true, true);
  assert.equal(mock.loginClicks(), 1);
  assert.deepEqual(mock.calls, ['GET']);
  assert.equal(mock.wasClosed(), true);
});

test('NodeBuf 未签到时只调用一次签到接口', async () => {
  const mock = nodeBufContext({
    GET: { status: 200, text: JSON.stringify({ summary: { checkedInToday: false } }) },
    POST: { status: 200, text: JSON.stringify({
      result: { granted: true, points: 10, streak: 3 },
      dashboard: { summary: { checkedInToday: true } },
    }) },
  });
  const result = await runNodeBuf(mock.context);
  assert.equal(result === true || result?.ok === true, true);
  assert.equal(mock.calls[0], 'GET');
  assert.equal(mock.calls[1], 'POST');
  assert.equal(mock.calls.filter(item => item === 'POST').length, 1);
  assert.equal(mock.wasClosed(), true);
});

test('NodeBuf 未登录时不调用签到接口', async () => {
  const mock = nodeBufContext({
    GET: { status: 401, text: JSON.stringify({ message: 'Unauthorized' }) },
  });
  await assert.rejects(() => runNodeBuf(mock.context), /未登录/);
  assert.deepEqual(mock.calls, ['GET']);
  assert.equal(mock.wasClosed(), true);
});
function allApiHubFileSystem({
  lastUsed = 'Default',
  profiles = ['Default'],
  installedProfiles = [],
} = {}) {
  const userDataDir = 'C:\\Chrome User Data';
  return {
    userDataDir,
    fsApi: {
      readFileSync() {
        return JSON.stringify({ profile: { last_used: lastUsed } });
      },
      readdirSync() {
        return profiles.map(name => ({ name, isDirectory: () => true }));
      },
      existsSync(target) {
        return installedProfiles.some(profile => target === path.join(
          userDataDir,
          profile,
          'Extensions',
          'lapnciffpekdengooeolaienkeoilfeo',
        ));
      },
    },
  };
}

test('All API Hub \u6269\u5c55\u4e0d\u5b58\u5728\u65f6\u9759\u9ed8\u8df3\u8fc7', async () => {
  const { userDataDir, fsApi } = allApiHubFileSystem();
  let launched = false;
  assert.deepEqual(await runOptionalAllApiHubQuickCheckin({
    userDataDir,
    fsApi,
    getChromePath: () => { throw new Error('\u4e0d\u5e94\u542f\u52a8 Chrome'); },
    launch: () => { launched = true; },
  }), { available: false, triggered: false });
  assert.equal(launched, false);
});

test('All API Hub \u4f7f\u7528\u6700\u8fd1\u7684\u6b63\u5e38 Chrome Profile \u89e6\u53d1\u5feb\u901f\u7b7e\u5230', async () => {
  const { userDataDir, fsApi } = allApiHubFileSystem({
    lastUsed: 'Profile 2',
    profiles: ['Default', 'Profile 2'],
    installedProfiles: ['Profile 2'],
  });
  const child = new EventEmitter();
  let call;
  assert.deepEqual(await runOptionalAllApiHubQuickCheckin({
    userDataDir,
    fsApi,
    getChromePath: () => 'C:\\Chrome\\chrome.exe',
    launch: (...args) => {
      call = args;
      process.nextTick(() => child.emit('spawn'));
      return child;
    },
  }), { available: true, triggered: true });
  assert.deepEqual(call, [
    'C:\\Chrome\\chrome.exe',
    [
      '--profile-directory=Profile 2',
      'chrome-extension://lapnciffpekdengooeolaienkeoilfeo/options.html?runNow=true#autoCheckin',
    ],
    { stdio: 'ignore', windowsHide: true },
  ]);
  assert.equal(call[1].some(argument => argument.startsWith('--user-data-dir=')), false);
});

test('All API Hub \u5728\u6700\u8fd1 Profile \u672a\u5b89\u88c5\u65f6\u67e5\u627e\u5176\u4ed6\u6b63\u5e38 Chrome Profile', async () => {
  const { userDataDir, fsApi } = allApiHubFileSystem({
    lastUsed: 'Profile 2',
    profiles: ['Default', 'Profile 2', 'Profile 5'],
    installedProfiles: ['Profile 5'],
  });
  const child = new EventEmitter();
  let args;
  await runOptionalAllApiHubQuickCheckin({
    userDataDir,
    fsApi,
    getChromePath: () => 'C:\\Chrome\\chrome.exe',
    launch: (...launchArgs) => {
      args = launchArgs;
      process.nextTick(() => child.emit('spawn'));
      return child;
    },
  });
  assert.equal(args[1][0], '--profile-directory=Profile 5');
});

test('All API Hub \u5f53\u65e5\u5df2\u89e6\u53d1\u65f6\u4e0d\u542f\u52a8 Chrome', async () => {
  const { userDataDir, fsApi } = allApiHubFileSystem({ installedProfiles: ['Default'] });
  assert.deepEqual(await runOptionalAllApiHubQuickCheckin({
    trigger: false,
    userDataDir,
    fsApi,
    getChromePath: () => { throw new Error('\u4e0d\u5e94\u542f\u52a8 Chrome'); },
    launch: () => { throw new Error('\u4e0d\u5e94\u542f\u52a8 Chrome'); },
  }), { available: true, triggered: false });
});

test('All API Hub Chrome \u542f\u52a8\u5931\u8d25\u65f6\u8fd4\u56de\u9519\u8bef', async () => {
  const { userDataDir, fsApi } = allApiHubFileSystem({ installedProfiles: ['Default'] });
  const child = new EventEmitter();
  await assert.rejects(
    () => runOptionalAllApiHubQuickCheckin({
      userDataDir,
      fsApi,
      getChromePath: () => 'C:\\Chrome\\chrome.exe',
      launch: () => {
        process.nextTick(() => child.emit('error', new Error('Chrome launch failed')));
        return child;
      },
    }),
    /Chrome launch failed/,
  );
});



test('NodeSeek API Cloudflare 403 falls back to page button', async () => {
  let body = '今日还未签到, 试试手气 鸡腿：100';
  let clicks = 0;
  let quotaReads = 0;
  const apiCalls = [];
  const page = {
    on() {},
    async goto() {},
    url() { return 'https://www.nodeseek.com/board'; },
    async title() { return 'NodeSeek'; },
    locator(selector) {
      if (selector === 'body') return { async innerText() { return body; } };
      return {
        first() { return this; },
        filter({ hasText } = {}) {
          this._matched = !hasText || hasText.test?.('试试手气') || String(hasText).includes('试试手气');
          return this;
        },
        async count() { return this._matched ? 1 : 0; },
        async scrollIntoViewIfNeeded() {},
        async click() { clicks += 1; body = '签到成功 鸡腿：105'; },
      };
    },
    getByText(text) {
      const matched = text instanceof RegExp ? text.test('试试手气') : String(text).includes('试试手气');
      return {
        first() { return this; },
        async count() { return matched ? 1 : 0; },
        async scrollIntoViewIfNeeded() {},
        async click() { clicks += 1; body = '签到成功 鸡腿：105'; },
      };
    },
    async evaluate(cb, request) {
      if (typeof request === 'string') return quotaReads++ === 0 ? '鸡腿 100' : '鸡腿 105';
      apiCalls.push(request);
      return { status: 403, text: '<html>Just a moment...</html>' };
    },
    async waitForTimeout() {},
    async reload() {},
    async close() {},
  };
  const result = await runLuckyAttendance({ async newPage() { return page; }, async addCookies() {} }, {
    task: 'nodeseek',
    url: 'https://www.nodeseek.com/board',
    origin: 'https://www.nodeseek.com/',
    waitMs: 0,
  });
  assert.equal(result.ok, true);
  assert.equal(apiCalls.length, 1);
  assert.equal(clicks, 1);
  assert.match(result.message, /签到后额度：105|当前额度：105|签到成功/);
});
