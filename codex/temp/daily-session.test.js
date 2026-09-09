const assert = require('node:assert/strict');
const { test } = require('node:test');
const { applyCfBypassCookies, anyRouterRequest, runAnyRouter, waitHybgzsReady, hybgzsCapFlow } = require('./daily-rewards-v2.js');

test('CF 更新不删除登录 Cookie', async () => {
  let cookies = [{ name: 'session', domain: '.cdk.hybgzs.com' }, { name: 'cf_clearance', domain: '.cdk.hybgzs.com' }];
  await applyCfBypassCookies({
    async clearCookies(filter) {
      cookies = cookies.filter(c => !(c.domain === filter.domain && (!filter.name || c.name === filter.name)));
    },
    async addCookies(values) { cookies.push(...values); },
  }, 'https://cdk.hybgzs.com/dashboard', { success: true, cookies: { cf_clearance: 'new' } });
  assert.ok(cookies.some(c => c.name === 'session'));
});

test('Any Router 同源请求从当前登录用户读取鉴权头', async () => {
  const vm = require('node:vm');
  const calls = [];
  const page = { evaluate(fn, arg) {
    return vm.runInNewContext(`(${fn.toString()})(arg)`, {
      arg, localStorage: { getItem: () => JSON.stringify({ id: 42 }) }, AbortSignal,
      fetch: async (url, options) => {
        calls.push({ url, options });
        return { status: 200, text: async () => '{"success":true}' };
      },
    });
  } };
  await anyRouterRequest(page, '/api/user/self');
  await anyRouterRequest(page, '/api/user/sign_in', 'POST');
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.options.headers['New-Api-User'], '42');
    assert.equal(call.options.credentials, 'include');
  }
});

test('黑白福利站拒绝错误 JSON，不误报验证通过', async () => {
  const page = { evaluate: async () => ({ status: 200, text: '{"success":false,"error":"服务异常"}' }), url: () => 'https://cdk.hybgzs.com/dashboard' };
  await assert.rejects(waitHybgzsReady(page, { waitMs: 0 }), /服务异常/);
});

test('黑白福利站区分未登录和 CF 超时', async () => {
  const page = { evaluate: async () => ({ status: 401, text: '{"success":false}' }), url: () => 'https://cdk.hybgzs.com/dashboard' };
  await assert.rejects(waitHybgzsReady(page, { waitMs: 0 }), /未登录/);
  page.evaluate = async () => ({ status: 403, text: '<html>Just a moment</html>' });
  await assert.rejects(waitHybgzsReady(page, { waitMs: 0 }), /验证.*超时/);
});

test('验证放行后继续读取统计，不刷新或替换会话', async () => {
  let count = 0;
  const page = {
    url: () => 'https://cdk.hybgzs.com/dashboard',
    evaluate: async () => ++count === 1 ? { status: 403, text: '<html>challenge</html>' } : { status: 200, text: '{"success":true,"data":{"walletBalance":1}}' },
    bringToFront: async () => {}, waitForTimeout: async () => {},
  };
  const stats = await waitHybgzsReady(page, { waitMs: 1000 });
  assert.equal(stats.data.data.walletBalance, 1);
});

test('验证弹窗等待真实业务响应，点击失败不吞掉错误', async () => {
  let timeout;
  const response = {};
  const page = {
    waitForResponse: async (_, options) => { timeout = options.timeout; return response; },
    bringToFront: async () => {}, waitForTimeout: async () => {},
  };
  const result = await hybgzsCapFlow(page, { click: async () => {} }, '/api/checkin');
  assert.equal(result.resp, response);
  assert.equal(timeout, 90000);
  await assert.rejects(hybgzsCapFlow(page, { click: async () => { throw new Error('按钮不可点击'); } }, '/api/checkin'), /按钮不可点击/);
});

test('Any Router 登录有效后补发早先鉴权失败的签到，成功请求不重复', async () => {
  for (const initialStatus of [401, 200]) {
    let listener;
    let posts = 0;
    let closed = false;
    const page = {
      on(_, fn) { listener = fn; },
      async goto() {
        listener({
          url: () => 'https://anyrouter.top/api/user/sign_in', request: () => ({ method: () => 'POST' }),
          status: () => initialStatus,
          text: async () => JSON.stringify(initialStatus === 401 ? { success: false, message: '未登录' } : { success: true }),
        });
      },
      async evaluate(_, { method }) {
        if (method === 'POST') posts++;
        return { status: 200, text: JSON.stringify({ success: true, data: { id: 42, quota: 500000 } }) };
      },
      async waitForTimeout() {},
      async close() { closed = true; },
    };
    const result = await runAnyRouter({ newPage: async () => page });
    assert.equal(result.ok, true);
    assert.match(result.message, /签到成功/);
    assert.equal(posts, initialStatus === 401 ? 1 : 0);
    assert.equal(closed, true);
  }
});

test('统计接口返回 JSON 人机验证要求时继续等待', async () => {
  let count = 0;
  const page = {
    url: () => 'https://cdk.hybgzs.com/dashboard',
    evaluate: async () => ++count === 1
      ? { status: 403, text: '{"success":false,"error":{"message":"需要人机验证"}}' }
      : { status: 200, text: '{"success":true,"data":{}}' },
    bringToFront: async () => {}, waitForTimeout: async () => {},
  };
  assert.equal((await waitHybgzsReady(page, { waitMs: 1000 })).status, 200);
  assert.equal(count, 2);
});
