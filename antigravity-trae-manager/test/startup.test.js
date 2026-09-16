const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');

const projectDir = path.join(__dirname, '..');

test('端口被占用时监听器自动选择下一个端口', async (t) => {
  const { listenWithPortFallback } = require('../lib/port-listener');
  const blocker = http.createServer();
  await new Promise((resolve, reject) => {
    blocker.once('error', reject);
    blocker.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => blocker.close());

  const startPort = blocker.address().port;
  const server = http.createServer((_req, res) => res.end('ok'));
  t.after(() => server.close());

  const selectedPort = await listenWithPortFallback(server, {
    host: '127.0.0.1',
    startPort,
    maxAttempts: 10
  });

  assert.equal(selectedPort, startPort + 1);
});

test('Windows 启动脚本使用安全的 ASCII 与 CRLF 格式', () => {
  const buffer = fs.readFileSync(path.join(projectDir, 'start.bat'));
  assert.equal([...buffer].every(byte => byte < 128), true, 'start.bat 必须只包含 ASCII');

  for (let index = 0; index < buffer.length; index += 1) {
    if (buffer[index] === 0x0a) {
      assert.equal(buffer[index - 1], 0x0d, 'start.bat 必须使用 CRLF 换行');
    }
  }

  const content = buffer.toString('ascii');
  assert.doesNotMatch(content, /Antigravity\s*&\s*Trae/);
  assert.match(content, /OPEN_BROWSER=1/);
});

test('网页网关地址跟随当前服务端口', () => {
  const app = fs.readFileSync(path.join(projectDir, 'public', 'app.js'), 'utf8');
  assert.doesNotMatch(app, /127\.0\.0\.1:19999/);
  assert.match(app, /window\.location\.origin/);
});

test('模型测试下拉框可读并包含 WorkBuddy AI 国际版筛选项', () => {
  const html = fs.readFileSync(path.join(projectDir, 'public', 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(projectDir, 'public', 'style.css'), 'utf8');
  const app = fs.readFileSync(path.join(projectDir, 'public', 'app.js'), 'utf8');
  assert.match(html, /option value="workbuddy-ai"/);
  assert.match(css, /select option/);
  assert.match(css, /color-scheme:\s*dark/);
  assert.match(app, /sourceEdition/);
  assert.match(app, /catalogId/);
});

test('无签到能力的 IDE 不显示签到入口', () => {
  const html = fs.readFileSync(path.join(projectDir, 'public', 'index.html'), 'utf8');
  assert.doesNotMatch(html, /wbai-checkin-btn/);
  assert.doesNotMatch(html, /doCheckin\('workbuddy-ai'\)/);
  assert.match(html, /WorkBuddy AI（国际版）无签到功能/);
});

test('国际版跨区登录提供独立的一键修复入口', () => {
  const html = fs.readFileSync(path.join(projectDir, 'public', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(projectDir, 'public', 'app.js'), 'utf8');
  const server = fs.readFileSync(path.join(projectDir, 'server.js'), 'utf8');

  assert.match(html, /wbai-repair-auth-btn/);
  assert.match(html, /wb-repair-auth-btn/);
  assert.match(app, /repairWorkBuddyLogin/);
  assert.match(app, /auth\?\.repairAvailable/);
  assert.match(server, /repair-auth/);
  assert.match(server, /backupIncompatibleAuth/);
  assert.match(server, /\.invalidate\(\)/);
});

test('国内版官方模型不再强制依赖 18888 桥接', () => {
  const app = fs.readFileSync(path.join(projectDir, 'public', 'app.js'), 'utf8');
  const server = fs.readFileSync(path.join(projectDir, 'server.js'), 'utf8');

  assert.match(server, /wbMgr\.testModel/);
  assert.match(server, /getOfficialModels/);
  assert.match(app, /isCustomModel/);
  assert.match(server, /body\.isCustomModel/);
});

test('状态和模型目录不会返回自定义模型 API 密钥', () => {
  const server = fs.readFileSync(path.join(projectDir, 'server.js'), 'utf8');

  assert.match(server, /function sanitizeCustomModels/);
  assert.match(server, /customModels: sanitizeCustomModels/);
  assert.match(server, /const list = sanitizeCustomModels/);
  assert.match(server, /hasApiKey: Boolean\(apiKey\)/);
});

test('模型目录按所属 IDE 显示官方积分倍率', () => {
  const html = fs.readFileSync(path.join(projectDir, 'public', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(projectDir, 'public', 'app.js'), 'utf8');

  assert.match(html, /积分倍率/);
  assert.match(app, /function getModelCreditLabel/);
  assert.match(app, /getModelCreditLabel\(m\)/);
  assert.match(app, /model-credit-badge/);
  assert.match(app, /官方未标注/);
});

test('状态缓存会抑制刷新周期内的重复失败请求', async () => {
  const { AsyncStatusCache } = require('../lib/status-cache');
  let calls = 0;
  const cache = new AsyncStatusCache({ ttlMs: 60000 });
  const loader = async () => {
    calls += 1;
    throw new Error('fetch failed');
  };

  const first = await cache.get(loader);
  const second = await cache.get(loader);
  assert.equal(calls, 1);
  assert.equal(first.error, 'fetch failed');
  assert.equal(second.error, 'fetch failed');
});

test('状态缓存可在登录修复后立即失效', async () => {
  const { AsyncStatusCache } = require('../lib/status-cache');
  const cache = new AsyncStatusCache({ ttlMs: 60000 });
  let calls = 0;
  const loader = async () => ({ calls: ++calls });

  assert.equal((await cache.get(loader)).value.calls, 1);
  assert.equal((await cache.get(loader)).value.calls, 1);
  cache.invalidate();
  assert.equal((await cache.get(loader)).value.calls, 2);
});
