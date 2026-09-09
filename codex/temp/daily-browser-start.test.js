const assert = require('node:assert/strict');
const { test } = require('node:test');
const { launchContext, isProfileInUseError } = require('./daily-rewards-v2.js');

const occupied = new Error('browserType.launchPersistentContext: Target page, context or browser has been closed\n[pid=23584][out] ����\nprocess did exit: exitCode=0, signal=null');

test('识别用户日志中的乱码会话转交和配置锁冲突，不混淆崩溃', () => {
  assert.equal(isProfileInUseError(occupied), true);
  assert.equal(isProfileInUseError(new Error('Failed to create a ProcessSingleton')), true);
  assert.equal(isProfileInUseError(new Error('browserType.launchPersistentContext: Target page, context or browser has been closed\nprocess did exit: exitCode=1')), false);
});

test('配置释放后自动重试成功，沿用原配置', async () => {
  let attempts = 0;
  let time = 0;
  const profiles = [];
  const context = { async addInitScript() {} };
  const result = await launchContext(false, {
    now: () => time, wait: async ms => { time += ms; },
    launch: async profile => {
      profiles.push(profile);
      if (++attempts === 1) throw occupied;
      return context;
    },
  });
  assert.equal(result, context);
  assert.equal(attempts, 2);
  assert.equal(profiles[0], profiles[1]);
});

test('持续占用时有限等待并给出明确错误', async () => {
  let time = 0;
  let attempts = 0;
  await assert.rejects(launchContext(false, {
    now: () => time, wait: async ms => { time += ms; }, waitMs: 6000,
    launch: async () => { attempts++; throw occupied; },
  }), { code: 'BROWSER_PROFILE_BUSY' });
  assert.equal(time, 6000);
  assert.equal(attempts, 3);
});

test('其他启动错误立即报错，不进入配置占用重试', async () => {
  const error = new Error('Chrome executable missing');
  await assert.rejects(launchContext(false, {
    launch: async () => { throw error; },
    wait: async () => assert.fail('不应等待'),
  }), error);
});
