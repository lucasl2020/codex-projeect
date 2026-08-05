'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

function runNode(args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, options);
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`VSLLM test process timed out.\n${stdout}\n${stderr}`));
    }, 10000);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

test('有效认证时整轮任务只使用 Node HTTP，不启动 Chrome', async (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vsllm-node-test-'));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  const requests = [];
  const server = http.createServer((request, response) => {
    requests.push({
      method: request.method,
      url: request.url,
      cookie: request.headers.cookie,
      user: request.headers['new-api-user'],
    });
    response.setHeader('content-type', 'application/json');
    if (request.method === 'GET' && request.url.startsWith('/api/user/checkin?month=')) {
      response.end(JSON.stringify({
        success: true,
        data: { stats: { checked_in_today: true, total_checkins: 1 } },
      }));
      return;
    }
    if (request.method === 'GET' && request.url === '/api/gwent/status') {
      response.end(JSON.stringify({
        success: true,
        data: {
          enabled: false,
          extra_draws_left: 0,
          charges_current: 0,
          next_available_at: 0,
          tasks: {
            task2: { daily_cap: 1, done_count: 1, suspended: false },
            task3: { status: 'won' },
          },
        },
      }));
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ success: false, message: 'unexpected test request' }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const authFile = path.join(tempDir, 'auth.json');
  fs.writeFileSync(authFile, JSON.stringify({
    version: 1,
    baseUrl,
    headers: { 'new-api-user': '42', 'x-device-fp': 'test-device' },
    cookies: [{ name: 'session', value: 'test-session', expires: -1 }],
  }));

  const missingChromeDir = path.join(tempDir, 'no-chrome');
  const result = await runNode([
    path.resolve(__dirname, '..', 'vsllm-rewards.cjs'),
    '--once',
  ], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      VSLLM_BASE_URL: baseUrl,
      VSLLM_AUTH_FILE: authFile,
      VSLLM_LOG_FILE: path.join(tempDir, 'vsllm.log'),
      VSLLM_PROFILE_DIR: path.join(tempDir, 'profile'),
      CHROME_PATH: path.join(missingChromeDir, 'chrome.exe'),
      PROGRAMFILES: missingChromeDir,
      'PROGRAMFILES(X86)': missingChromeDir,
      LOCALAPPDATA: missingChromeDir,
      HEADLESS: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  assert.equal(result.code, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /Loaded saved authentication; Chrome is not being started\./);
  assert.equal(requests.length, 3);
  assert.ok(requests.every((request) => request.method === 'GET'));
  assert.ok(requests.every((request) => request.cookie === 'session=test-session'));
  assert.ok(requests.every((request) => request.user === '42'));
});


test('严格后台认证过期时保持 Node 进程，认证更新后自动恢复', async (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vsllm-auth-refresh-test-'));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  const authFile = path.join(tempDir, 'auth.json');
  const requests = [];
  let baseUrl;
  const writeAuth = (session) => fs.writeFileSync(authFile, JSON.stringify({
    version: 1,
    baseUrl,
    headers: { 'new-api-user': '42' },
    cookies: [{ name: 'session', value: session, expires: -1 }],
  }));

  let resolveResumed;
  const resumed = new Promise((resolve) => { resolveResumed = resolve; });
  let replacementScheduled = false;
  const server = http.createServer((request, response) => {
    requests.push({ method: request.method, url: request.url, cookie: request.headers.cookie });
    response.setHeader('content-type', 'application/json');
    if (request.headers.cookie === 'session=expired') {
      response.statusCode = 401;
      response.end(JSON.stringify({ success: false, message: 'expired' }));
      if (!replacementScheduled) {
        replacementScheduled = true;
        setTimeout(() => writeAuth('renewed'), 200);
      }
      return;
    }
    if (request.headers.cookie !== 'session=renewed') {
      response.statusCode = 403;
      response.end(JSON.stringify({ success: false, message: 'unexpected authentication' }));
      return;
    }
    if (request.method === 'GET' && request.url.startsWith('/api/user/checkin?month=')) {
      response.end(JSON.stringify({
        success: true,
        data: { stats: { checked_in_today: true, total_checkins: 1 } },
      }));
      return;
    }
    if (request.method === 'GET' && request.url === '/api/gwent/status') {
      response.end(JSON.stringify({
        success: true,
        data: {
          enabled: false,
          tasks: {
            task2: { daily_cap: 1, done_count: 1, suspended: false },
            task3: { status: 'won' },
          },
        },
      }));
      if (requests.filter((entry) => entry.cookie === 'session=renewed').length >= 3) resolveResumed();
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ success: false, message: 'unexpected test request' }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
  writeAuth('expired');
  const missingChromeDir = path.join(tempDir, 'no-chrome');
  const child = spawn(process.execPath, [
    path.resolve(__dirname, '..', 'vsllm-rewards.cjs'),
  ], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      VSLLM_BASE_URL: baseUrl,
      VSLLM_AUTH_FILE: authFile,
      VSLLM_LOG_FILE: path.join(tempDir, 'vsllm.log'),
      VSLLM_PROFILE_DIR: path.join(tempDir, 'profile'),
      CHROME_PATH: path.join(missingChromeDir, 'chrome.exe'),
      PROGRAMFILES: missingChromeDir,
      'PROGRAMFILES(X86)': missingChromeDir,
      LOCALAPPDATA: missingChromeDir,
      HEADLESS: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const closed = new Promise((resolve) => child.on('close', (code) => resolve(code)));

  let resumeTimeout;
  try {
    await Promise.race([
      resumed,
      closed.then((code) => Promise.reject(new Error(`VSLLM service exited early (${code}).\n${stdout}\n${stderr}`))),
      new Promise((_, reject) => {
        resumeTimeout = setTimeout(() => reject(new Error(`VSLLM service did not resume.\n${stdout}\n${stderr}`)), 9000);
      }),
    ]);
  } finally {
    clearTimeout(resumeTimeout);
  }

  assert.equal(child.exitCode, null, `${stdout}\n${stderr}`);
  child.kill();
  await closed;
  assert.match(stdout, /Authentication expired; waiting/);
  assert.match(stdout, /Updated authentication was detected; background service is resuming\./);
  assert.equal(requests[0].cookie, 'session=expired');
  assert.equal(requests.filter((request) => request.cookie === 'session=renewed').length, 3);
  assert.ok(requests.every((request) => request.method === 'GET'));
});
