const assert = require('node:assert/strict');
const { test } = require('node:test');
const { EventEmitter } = require('node:events');
const path = require('node:path');
const {
  attendanceRequestPlans,
  attendanceSuccess,
  extractAttendanceQuota,
  extractAttendanceQuotaFromText,
  extractTrafficQuotaFromText,
  attendanceQuotaSummary,
  findAttendanceButton,
  isCloudflareChallengeText,
  nodeBufCheckInSuccess,
  parseCfBypassJson,
  runLuckyAttendance,
  runOptionalAllApiHubQuickCheckin,
  runNodeBuf,
  tryNodeBufAutoLogin,
} = require('./daily-rewards-v2.js');

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
  bodyBefore = '\u9e21\u817f\uff1a100',
  bodyAfter = '\u9e21\u817f\uff1a105 \u7b7e\u5230\u6210\u529f',
  hasDataButton = false,
  hasTextButton = false,
  hasHeadInfoButton = false,
} = {}) {
  let body = bodyBefore;
  let clicks = 0;
  let closed = false;
  let apiIndex = 0;
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
  });
  const result = await runLuckyAttendance(mock.context, {
    task: 'nodeseek',
    url: 'https://www.nodeseek.com/board',
    origin: 'https://www.nodeseek.com/',
  });
  assert.equal(result.ok, true);
  assert.equal(mock.apiCalls.length, 1);
  assert.equal(mock.clicks(), 0);
  assert.match(result.message, /\u7b7e\u5230\u524d\u989d\u5ea6\uff1a100/);
  assert.match(result.message, /\u7b7e\u5230\u540e\u989d\u5ea6\uff1a100/);
  assert.match(result.message, /\u989d\u5ea6\u53d8\u5316\uff1a0/);
});

test('NodeSeek completed attendance response does not click again', async () => {
  const mock = luckyAttendanceContext({
    api: { status: 200, text: JSON.stringify({ success: false, message: '\u4eca\u5929\u5df2\u5b8c\u6210\u7b7e\u5230\uff0c\u8bf7\u52ff\u91cd\u590d\u64cd\u4f5c', current: 100 }) },
    hasDataButton: true,
  });
  const result = await runLuckyAttendance(mock.context, {
    task: 'nodeseek',
    url: 'https://www.nodeseek.com/board',
    origin: 'https://www.nodeseek.com/',
  });
  assert.equal(result.ok, true);
  assert.equal(mock.clicks(), 0);
  assert.match(result.message, /\u7b7e\u5230\u524d\u989d\u5ea6\uff1a100/);
  assert.match(result.message, /\u7b7e\u5230\u540e\u989d\u5ea6\uff1a100/);
  assert.match(result.message, /\u989d\u5ea6\u53d8\u5316\uff1a0/);
});

test('NodeSeek quota extraction prefers current and preserves zero', () => {
  assert.equal(extractAttendanceQuota({ gain: 5, current: 0 }), 0);
  assert.equal(extractAttendanceQuotaFromText('\u5f53\u524d\u9e21\u817f\uff1a0\uff1b\u53ea\u89815\u4e2a\u9e21\u817f'), 0);
});

test('Cloudflare challenge text can be detected', () => {
  assert.equal(isCloudflareChallengeText('Just a moment...'), true);
  assert.equal(isCloudflareChallengeText('www.nodeseek.com 正在进行安全验证'), true);
  assert.equal(isCloudflareChallengeText('今日还未签到, 试试手气'), false);
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
  assert.equal(attendanceQuotaSummary(0, 0), '签到前额度：0；签到后额度：0；额度变化：0');
});

test('流量文本可解析剩余/可用流量', () => {
  assert.equal(extractTrafficQuotaFromText('剩余流量 12.5 GB'), 12.5 * 1024);
  assert.equal(extractTrafficQuotaFromText('可用流量：1024MB'), 1024);
  assert.equal(extractTrafficQuotaFromText('剩余流量 1 TB'), 1 * 1024 * 1024);
  assert.equal(extractTrafficQuotaFromText('今日已签到'), undefined);
});

test('NodeSeek 无额度时成功结果不展示未获取', async () => {
  const mock = luckyAttendanceContext({
    api: { status: 200, text: JSON.stringify({ success: true, message: '签到成功' }) },
    bodyBefore: '试试手气',
    bodyAfter: '签到成功',
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


function nodeBufContext(responses, { initialUrl = 'https://nodebuf.com/user/points' } = {}) {
  const calls = [];
  let closed = false;
  let currentUrl = initialUrl;
  let loginClicks = 0;
  const page = {
    async goto() {},
    url() { return currentUrl; },
    async waitForFunction() {},
    async waitForURL(predicate) {
      assert.equal(predicate(new URL(currentUrl)), true);
    },
    locator(selector) {
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
      return responses[endpoint];
    },
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
