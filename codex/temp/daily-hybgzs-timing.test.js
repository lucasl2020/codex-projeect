const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { watchHybgzsCf, clickCapStart, hybgzsApi, doHybgzsDriftBottle } = require('./daily-rewards-v2.js');

test('通用接口设置请求超时，非 JSON 响应不会误报今日已完成', async () => {
  let timeout;
  const page = { evaluate(fn, arg) {
    return vm.runInNewContext(`(${fn.toString()})(arg)`, {
      arg, AbortSignal: { timeout(ms) { timeout = ms; return {}; } },
      fetch: async () => ({ status: 403, json: async () => { throw new Error('HTML challenge'); } }),
    });
  } };
  await assert.rejects(hybgzsApi(page, '/api/test'), /未返回 JSON/);
  assert.equal(timeout, 15000);
});

test('全程 CF 检查在没有签到按钮操作时仍自动点击，并可停止', async () => {
  let clicks = 0;
  const checkbox = { isVisible: async () => true, isChecked: async () => false, click: async () => { clicks++; } };
  const page = { frames: () => [{ url: () => 'https://challenges.cloudflare.com/test', locator: () => ({ first: () => checkbox }) }] };
  const stop = watchHybgzsCf(page);
  await stop();
  assert.equal(clicks, 1);
});

test('漂流瓶反复冷却最多等待一分钟，并标记未完成', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => { throw new Error('使用固定诗词以隔离网络'); };
  try {
    const waits = [];
    let throws = 0;
    let picks = 0;
    const page = {
      evaluate: async (_, { u }) => {
        if (u.endsWith('/settings')) return { status: 200, data: { data: { usage: { pickRemaining: 1 } } } };
        if (u.endsWith('/throw')) { throws++; return { status: 200, data: { success: false, error: '冷却' } }; }
        picks++;
        return { status: 200, data: { success: false, code: 'PICK_COOLDOWN', error: '冷却' } };
      },
      waitForTimeout: async ms => waits.push(ms),
    };
    const result = await doHybgzsDriftBottle(page);
    assert.equal(result.ok, false);
    assert.equal(throws, 2);
    assert.equal(picks, 1);
    assert.deepEqual(waits, [60000]);
  } finally { global.fetch = originalFetch; }
});
test('绮问演算按钮出现后不因缺少 role=dialog 空等默认超时', async () => {
  const textTimeouts = [];
  const ring = {
    waitFor: async () => {},
    isVisible: async () => true,
    isDisabled: async () => false,
    boundingBox: async () => ({ x: 10, y: 10, width: 20, height: 20 }),
  };
  const missingDialog = {
    innerText: options => {
      if (!options?.timeout) return new Promise(() => {});
      textTimeouts.push(options.timeout);
      return Promise.resolve('');
    },
  };
  const page = {
    locator: selector => ({ first: () => selector === '[role="dialog"]' ? missingDialog : ring }),
    mouse: { move: async () => {}, down: async () => {}, up: async () => {} },
    waitForTimeout: async () => {},
  };

  const result = await Promise.race([
    clickCapStart(page, { timeout: 20 }),
    new Promise(resolve => setTimeout(() => resolve('timeout'), 250)),
  ]);

  assert.equal(result, true);
  assert.ok(textTimeouts.length >= 1);
  assert.ok(textTimeouts.every(timeout => timeout <= 100));
});