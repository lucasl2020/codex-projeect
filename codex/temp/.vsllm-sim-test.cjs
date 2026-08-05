'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const target = path.join(__dirname, 'vsllm-rewards.cjs');
let source = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
source = source.replace(
  "function log(message) {\n  const line = `[${new Date().toISOString()}] ${message}`;\n  console.log(line);\n  fs.appendFileSync(LOG_FILE, `${line}\\n`, 'utf8');\n}",
  "const testLogs = [];\nfunction log(message) { testLogs.push(message); }",
);
source = source.replace(
  "function sleep(ms) {\n  return new Promise((resolve) => setTimeout(resolve, ms));\n}",
  "const testSleeps = [];\nfunction sleep(ms) { testSleeps.push(ms); return Promise.resolve(); }",
);
source = source.replace(/main\(\)\.catch\([\s\S]*$/, "module.exports = { extractQuota, normalizeAdState, getNextSchedule, findQuizAnswerIndex, createApiClient, api, getInitialAuth, runQuizTask, runAdTask, testLogs, testSleeps };");
const moduleForTest = { exports: {} };
const localRequire = createRequire(target);
vm.runInNewContext(source, {
  module: moduleForTest,
  exports: moduleForTest.exports,
  require: localRequire,
  process,
  console,
  setTimeout,
  clearTimeout,
  URL,
  Date,
  fetch,
}, { filename: target });
const {
  extractQuota,
  normalizeAdState,
  getNextSchedule,
  findQuizAnswerIndex,
  createApiClient,
  api,
  getInitialAuth,
  runQuizTask,
  runAdTask,
  testLogs,
  testSleeps,
} = moduleForTest.exports;

function makeClient(responses, calls, bodies = []) {
  return {
    request: async (method, requestPath, body) => {
      calls.push(`${method} ${requestPath}`);
      bodies.push(body);
      return responses.shift();
    },
  };
}

async function main() {
  assert.equal(extractQuota({ prize: { quota: 1000 } }), 1000);
  assert.equal(extractQuota({}), null);
  const now = Math.floor(Date.now() / 1000);
  assert.equal(normalizeAdState({ daily_cap: 3, done_count: 1, next_available_at: 0 }).ready, true);
  assert.equal(normalizeAdState({ daily_cap: 3, done_count: 1, next_available_at: now + 7200 }).ready, false);
  assert.equal(normalizeAdState({ daily_cap: 3, done_count: 3 }).completed, true);
  const schedule = getNextSchedule(
    { enabled: true, ready: false, nextAvailableAt: now + 7200 },
    { present: true, ready: false, completed: false, suspended: false, nextAvailableAt: now + 3600 },
  );
  assert.equal(schedule.reason, 'ad reward becomes available');

  assert.equal(findQuizAnswerIndex(['8.11', ' 9.11 ', '10.11']), 1);
  assert.equal(findQuizAnswerIndex(['8.11', '10.11']), -1);

  const cachedAuth = { headers: {}, cookies: [] };
  let loginOpened = false;
  assert.equal(await getInitialAuth(cachedAuth, async () => { loginOpened = true; }), cachedAuth);
  assert.equal(loginOpened, false);

  const auth = {
    headers: { 'new-api-user': '42', 'x-device-fp': 'fingerprint' },
    cookies: [{ name: 'session', value: 'old', expires: -1 }],
  };
  let persisted = 0;
  const fetchCalls = [];
  const client = createApiClient(auth, async (url, options) => {
    fetchCalls.push({ url, options });
    return {
      status: 200,
      headers: { getSetCookie: () => ['session=new; Path=/; HttpOnly'] },
      text: async () => JSON.stringify({ success: true }),
    };
  }, () => { persisted += 1; });
  const apiResult = await client.request('POST', '/api/test', { value: 1 });
  assert.equal(apiResult.status, 200);
  assert.equal(fetchCalls[0].url, 'https://vsllm.com/api/test');
  assert.equal(fetchCalls[0].options.headers.cookie, 'session=old');
  assert.equal(fetchCalls[0].options.headers['new-api-user'], '42');
  assert.equal(fetchCalls[0].options.body, '{"value":1}');
  assert.equal(auth.cookies[0].value, 'new');
  assert.equal(persisted, 1);

  await assert.rejects(
    api(makeClient([{ status: 401, json: null }], []), 'GET', '/api/test'),
    { name: 'SessionExpiredError' },
  );

  const quizCalls = [];
  const quizBodies = [];
  const quizResult = await runQuizTask(makeClient([
    { status: 200, json: { success: true, data: { question: { text: 'test', options: ['8.11', '9.11', '10.11'] } } } },
    { status: 200, json: { success: true, data: { correct: true } } },
  ], quizCalls, quizBodies), { status: 'pending' });
  assert.equal(quizResult, 'won');
  assert.deepEqual(quizCalls, [
    'POST /api/gwent/task3/start',
    'POST /api/gwent/task3/answer',
  ]);
  assert.equal(quizBodies[1].answer_index, 1);

  const missingCalls = [];
  testLogs.length = 0;
  const missingResult = await runQuizTask(makeClient([
    { status: 200, json: { success: true, data: { question: { text: 'test', options: ['8.11', '10.11'] } } } },
  ], missingCalls), { status: 'pending' });
  assert.equal(missingResult, 'manual');
  assert.deepEqual(missingCalls, ['POST /api/gwent/task3/start']);
  assert.ok(testLogs.some((line) => line.includes('9.11') && line.includes('manually')));

  const failedCalls = [];
  testLogs.length = 0;
  const failedResult = await runQuizTask(makeClient([
    { status: 200, json: { success: true, data: { question: { text: 'test', options: ['9.11', '10.11'] } } } },
    { status: 500, json: { success: false, message: 'failed' } },
  ], failedCalls), { status: 'pending' });
  assert.equal(failedResult, 'manual');
  assert.deepEqual(failedCalls, [
    'POST /api/gwent/task3/start',
    'POST /api/gwent/task3/answer',
  ]);
  assert.ok(testLogs.some((line) => line.includes('no other answer') && line.includes('manually')));

  const calls = [];
  const responses = [
    { status: 200, json: { success: true, data: { tasks: { task2: { daily_cap: 3, done_count: 0, duration_sec: 15, next_available_at: 0, reward_type: 'charge', reward_amount: 1, suspended: false }, task3: { status: 'won' } } } } },
    { status: 200, json: { success: true, data: { duration_sec: 15, content: 'test ad' } } },
    { status: 200, json: { success: true, data: {} } },
    { status: 200, json: { success: true, data: { tasks: { task2: { daily_cap: 3, done_count: 1, duration_sec: 15, next_available_at: now + 7200, reward_type: 'charge', reward_amount: 1, suspended: false } } } } },
  ];
  const state = await runAdTask(makeClient(responses, calls));
  assert.equal(state.doneCount, 1);
  assert.deepEqual(calls, [
    'GET /api/gwent/status',
    'POST /api/gwent/ad/start',
    'POST /api/gwent/ad/claim',
    'GET /api/gwent/status',
  ]);
  assert.equal(testSleeps.at(-1), 16000);
  console.log('VSLLM simulation tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
