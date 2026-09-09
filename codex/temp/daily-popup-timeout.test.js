const assert = require('node:assert/strict');
const { test } = require('node:test');
const { dismissHvoyNotice, clickHvoyButton, withPageDeadline, doHybgzsWheel, hybgzsCapFlow } = require('./daily-rewards-v2.js');

function noticePage(visible) {
  let closed = 0;
  const notice = {
    isVisible: async () => visible,
    getByRole: (role, options) => {
      assert.equal(options.name, '我知道了');
      return { click: async () => { closed++; visible = false; } };
    },
    waitFor: async () => assert.equal(visible, false),
  };
  return { page: { locator: selector => {
    assert.equal(selector, '[role="dialog"][aria-labelledby="region-restriction-notice-title"]');
    return notice;
  } }, show() { visible = true; }, closed: () => closed };
}

test('禾维只关闭已确认的说明弹窗', async () => {
  const mock = noticePage(true);
  assert.equal(await dismissHvoyNotice(mock.page), true);
  assert.equal(mock.closed(), 1);
  assert.equal(await dismissHvoyNotice(mock.page), false);
});

test('签到时延迟出现说明弹窗，关闭后重试点击', async () => {
  const mock = noticePage(false);
  let attempts = 0;
  await clickHvoyButton(mock.page, { click: async () => {
    if (++attempts === 1) { mock.show(); throw new Error('弹窗遮挡'); }
  } });
  assert.equal(attempts, 2);
  assert.equal(mock.closed(), 1);
});

test('非弹窗导致的点击失败不再吞掉', async () => {
  const mock = noticePage(false);
  await assert.rejects(clickHvoyButton(mock.page, { click: async () => { throw new Error('未找到按钮'); } }), /未找到按钮/);
});

test('卡住的页面达到总时限会关闭，不继续后台执行', async () => {
  let closed = false;
  await assert.rejects(withPageDeadline({ close: async () => { closed = true; } }, () => new Promise(() => {}), 10), /本轮未完成/);
  assert.equal(closed, true);
});

test('正常完成不会触发超时关闭', async () => {
  let closed = false;
  assert.equal(await withPageDeadline({ close: async () => { closed = true; } }, async () => '完成', 10), '完成');
  await new Promise(r => setTimeout(r, 20));
  assert.equal(closed, false);
});

test('转盘返回不变的剩余次数时只抽一次', async () => {
  let clicks = 0;
  const spin = { click: async () => { clicks++; }, waitFor: async () => {}, isVisible: async () => true };
  const response = { status: () => 200, json: async () => ({ success: true, data: { remainingSpins: 3 } }) };
  const page = {
    goto: async () => {}, locator: () => ({ first: () => spin }),
    waitForResponse: async () => response, waitForTimeout: async () => {},
  };
  const result = await doHybgzsWheel(page, 3);
  assert.equal(result.result, 'fail');
  assert.match(result.message, /次数未减少/);
  assert.equal(clicks, 1);
});

test('验证准备接口明确失败时立即返回，不继续空等90秒', async () => {
  const response = {
    url: () => 'https://cdk.hybgzs.com/api/cap/challenge',
    request: () => ({ method: () => 'POST' }),
    status: () => 429, json: async () => ({ success: false, error: '操作频繁' }),
  };
  const page = {
    waitForResponse: predicate => predicate(response) ? Promise.resolve(response) : new Promise(() => {}),
    waitForTimeout: () => new Promise(() => {}),
  };
  const result = await hybgzsCapFlow(page, { click: async () => {} }, '/api/checkin');
  assert.equal(result.capError, '操作频繁');
});
