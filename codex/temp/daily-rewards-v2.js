const fs = require('node:fs');
const readline = require('node:readline/promises');
const { spawn } = require('node:child_process');

const common = require('./services/common');
const {
  ROOT,
  PROFILE_DIR,
  HOUR,
  URLS,
  TASK_ORDER,
  findChrome,
  today,
  log,
  readState,
  markDone,
  isDone,
  taskNames,
  readTaskConfig,
  writeTaskConfig,
  parseTaskTokens,
  defaultEnabledTasks,
  listTasks,
  setDefaultTasks,
  clearDefaultTasks,
  launchContext,
  applyStealth,
  attempt,
  printSummary,
  parseDailyAt,
  nextDailyRun,
  sleep,
  withPageDeadline,
  isProfileInUseError,
  tryClickTurnstile,
  clickClosedTurnstile,
  attendanceQuotaSummary,
  extractAttendanceQuota,
  extractAttendanceQuotaFromText,
  extractTrafficQuotaFromText,
  extractQuota,
  isCloudflareChallengeText,
  isLoginUrl,
  cloudflareOriginErrorCode,
  isCloudflareChallengePage,
  messageOf,
} = common;

const cfExclusive = require('./services/cf-exclusive');
const {
  parseCfBypassJson,
  runLocalCfBypass,
  applyCfBypassCookies,
  parseDrissionAttendanceJson,
  runLocalDrissionAttendance,
  runCfApiAttendance,
  runProfileExclusiveAttendance,
  attendanceRequestPlans,
  findAttendanceButton,
  attendanceSuccess,
  runLuckyAttendance,
} = cfExclusive;

const allApiHub = require('./services/allapihub');
const {
  runOptionalAllApiHubQuickCheckin,
  runOptionalAllApiHubTask,
  runAllApiHub,
} = allApiHub;

const anyRouter = require('./services/anyrouter');
const {
  extractAnyRouterBalanceFromText,
  anyRouterRequest,
  runAnyRouter,
} = anyRouter;

const ikuuu = require('./services/ikuuu');
const {
  ikuuuSuccess,
  runIkuuu,
} = ikuuu;

const chy = require('./services/chy');
const {
  findChyClaimButton,
  isChyLoggedOutPage,
  runChy,
} = chy;

const nodeSeek = require('./services/nodeseek');
const { runNodeSeek } = nodeSeek;

const deepFlood = require('./services/deepflood');
const { runDeepFlood } = deepFlood;

const nodeBuf = require('./services/nodebuf');
const {
  nodeBufCheckInSuccess,
  extractNodeBufProfilePointsFromText,
  tryNodeBufAutoLogin,
  runNodeBuf,
} = nodeBuf;

const hvoy = require('./services/hvoy');
const {
  dismissHvoyNotice,
  clickHvoyButton,
  runHvoy,
} = hvoy;

const hybgzs = require('./services/hybgzs');
const {
  hybgzsStats,
  clickWaitPost,
  clickCapStart,
  hybgzsCapFlow,
  waitHybgzsReady,
  doHybgzsCheckin,
  doHybgzsWheel,
  hybgzsApi,
  doHybgzsGiftbox,
  doHybgzsCards,
  fetchJinriShiciNote,
  doHybgzsDriftBottle,
  doHybgzsFarm,
  runHybgzs,
  runHybgzsPage,
  watchHybgzsCf,
} = hybgzs;

let nextAnyRouterRetryAt = 0;

async function runOnce(enabledTasks = null) {
  const enabled = enabledTasks && enabledTasks.length ? enabledTasks : defaultEnabledTasks();
  console.log('========================================================');
  console.log('             每日任务签到 - 联合调度执行');
  console.log('========================================================');
  console.log('各站点服务配置状态：');
  TASK_ORDER.forEach((item, idx) => {
    const isAct = enabled.includes(item.task);
    const tag = isAct ? '[√ 开启]' : '[× 关闭]';
    const script = item.script || `services/${item.task}.js`;
    console.log(`  ${tag} [${idx + 1}] ${item.label.padEnd(12)} -> ${script}`);
  });
  console.log('（提示：可随时运行“设置默认站点.cmd”修改默认开启项）');
  console.log('========================================================\n');

  log('scheduler', `starting ${today()}; tasks: [${enabled.join(', ')}]`);
  if (!enabled.length) {
    log('scheduler', '未选择任何任务，跳过；可用 --set-default-tasks 配置');
    printSummary([]);
    return [];
  }
  let results = [];
  if (enabled.includes('allapihub')) {
    console.log('\n--------------------------------------------------------');
    console.log('正在执行 All API Hub: services/allapihub.js');
    console.log('--------------------------------------------------------');
    const allApiHubResult = await runOptionalAllApiHubTask();
    if (allApiHubResult) results.push(allApiHubResult);
  }
  const browserTasks = enabled.filter(t => t !== 'allapihub');
  if (browserTasks.length) {
    let context = await launchContext();
    try {
      if (enabled.includes('anyrouter')) {
        console.log('\n--------------------------------------------------------');
        console.log('正在执行 AnyRouter: services/anyrouter.js');
        console.log('--------------------------------------------------------');
        const r = await attempt(context, 'anyrouter', runAnyRouter);
        results.push(r);
        nextAnyRouterRetryAt = r.ok ? 0 : Date.now() + HOUR;
      }
      if (enabled.includes('ikuuu')) {
        console.log('\n--------------------------------------------------------');
        console.log('正在执行 iKuuu: services/ikuuu.js');
        console.log('--------------------------------------------------------');
        results.push(await attempt(context, 'ikuuu', runIkuuu));
      }
      if (enabled.includes('chy')) {
        console.log('\n--------------------------------------------------------');
        console.log('正在执行 CHY: services/chy.js');
        console.log('--------------------------------------------------------');
        results.push(await attempt(context, 'chy', runChy));
      }
      const exclusiveSites = [
        { task: 'nodeseek', url: URLS.nodeseek, origin: 'https://www.nodeseek.com/', script: 'services/nodeseek.js' },
        { task: 'deepflood', url: URLS.deepflood, origin: 'https://www.deepflood.com/', script: 'services/deepflood.js' },
      ].filter(site => enabled.includes(site.task));
      if (exclusiveSites.length) {
        const stillNeeded = [];
        for (const site of exclusiveSites) {
          console.log('\n--------------------------------------------------------');
          console.log(`正在执行 ${site.task}: ${site.script}`);
          console.log('--------------------------------------------------------');
          const r = await attempt(context, site.task, ctx => runCfApiAttendance(ctx, site), { alwaysRun: true });
          results.push(r);
          if (!r.ok) stillNeeded.push(site);
        }
        if (stillNeeded.length) {
          const exclusive = await runProfileExclusiveAttendance(context, stillNeeded);
          context = exclusive.context;
          const drMap = new Map(exclusive.results.map(r => [r.task, r]));
          results = results.map(r => drMap.has(r.task) ? drMap.get(r.task) : r);
        }
      }
      if (enabled.includes('nodebuf')) {
        console.log('\n--------------------------------------------------------');
        console.log('正在执行 NodeBuf: services/nodebuf.js');
        console.log('--------------------------------------------------------');
        results.push(await attempt(context, 'nodebuf', runNodeBuf));
      }
      if (enabled.includes('hvoy')) {
        console.log('\n--------------------------------------------------------');
        console.log('正在执行 禾维AI: services/hvoy.js');
        console.log('--------------------------------------------------------');
        results.push(await attempt(context, 'hvoy', runHvoy));
      }
      if (enabled.includes('hybgzs')) {
        console.log('\n--------------------------------------------------------');
        console.log('正在执行 黑白福利站: services/hybgzs.js');
        console.log('--------------------------------------------------------');
        results.push(await attempt(context, 'hybgzs', runHybgzs, { alwaysRun: true }));
      }
    } finally {
      await context.close();
    }
  }
  printSummary(results);
  return results;
}

async function daemon() {
  while (true) {
    await runOnce();
    const next = Math.min(nextDailyRun(), nextAnyRouterRetryAt || Number.POSITIVE_INFINITY);
    const wait = Math.max(1000, next - Date.now());
    log('scheduler', `next run: ${new Date(next).toLocaleString()} (${Math.ceil(wait / 60000)} minutes)`);
    await sleep(wait);
  }
}

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try { return await rl.question(question); }
  finally { rl.close(); }
}

async function setup() {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  const chrome = spawn(findChrome(), [
    `--user-data-dir=${PROFILE_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    URLS.anyrouter,
    URLS.ikuuu,
    URLS.chy,
    URLS.nodeseek,
    URLS.deepflood,
    URLS.nodebuf,
    URLS.hvoy,
    URLS.hybgzs,
  ], { stdio: 'ignore', windowsHide: false });
  await new Promise((resolve, reject) => {
    chrome.once('spawn', resolve);
    chrome.once('error', reject);
  });
  log('setup', 'normal Chrome opened without Playwright automation');
  await ask('Complete all logins in Chrome, close that Chrome window, then press Enter here: ');
  if (chrome.exitCode === null) {
    log('setup', 'waiting for the login Chrome window to close');
    await new Promise(resolve => chrome.once('exit', resolve));
  }
  log('setup', `session saved in ${PROFILE_DIR}`);
}

async function main() {
  const args = process.argv.slice(2);
  const argSet = new Set(args);
  if (argSet.has('--setup')) return setup();
  if (argSet.has('--daemon')) return daemon();
  if (argSet.has('--list-tasks')) { listTasks(); return; }
  if (argSet.has('--clear-default-tasks')) { clearDefaultTasks(); return; }
  const setIdx = args.indexOf('--set-default-tasks');
  if (setIdx !== -1) {
    const input = args.slice(setIdx + 1).filter(t => !t.startsWith('--')).join(' ');
    setDefaultTasks(input);
    return;
  }
  const tasksIdx = args.indexOf('--tasks');
  let selectedTasks = null;
  if (tasksIdx !== -1) {
    const input = args.slice(tasksIdx + 1).filter(t => !t.startsWith('--')).join(' ');
    selectedTasks = parseTaskTokens(input);
  }
  const results = await runOnce(selectedTasks);
  if (results.some(result => !result.ok)) process.exitCode = 1;
}

module.exports = {
  dismissHvoyNotice,
  clickHvoyButton,
  withPageDeadline,
  doHybgzsWheel,
  watchHybgzsCf,
  hybgzsApi,
  doHybgzsCards,
  doHybgzsDriftBottle,
  launchContext,
  isProfileInUseError,
  tryClickTurnstile,
  clickClosedTurnstile,
  anyRouterRequest,
  runAnyRouter,
  waitHybgzsReady,
  clickCapStart,
  hybgzsCapFlow,
  attendanceQuotaSummary,
  attendanceRequestPlans,
  attendanceSuccess,
  extractAttendanceQuota,
  extractAttendanceQuotaFromText,
  extractTrafficQuotaFromText,
  extractQuota,
  findAttendanceButton,
  isCloudflareChallengeText,
  isLoginUrl,
  nodeBufCheckInSuccess,
  parseCfBypassJson,
  runLocalCfBypass,
  runLuckyAttendance,
  runNodeBuf,
  applyCfBypassCookies,
  cloudflareOriginErrorCode,
  findChyClaimButton,
  isChyLoggedOutPage,
  extractAnyRouterBalanceFromText,
  extractNodeBufProfilePointsFromText,
  isCloudflareChallengePage,
  parseDrissionAttendanceJson,
  runLocalDrissionAttendance,
  runProfileExclusiveAttendance,
  runOptionalAllApiHubQuickCheckin,
  tryNodeBufAutoLogin,
  // 附加导出各个新独立模块方法
  runIkuuu,
  ikuuuSuccess,
  runChy,
  runNodeSeek,
  runDeepFlood,
  runHvoy,
  runHybgzs,
  runOptionalAllApiHubTask,
};

if (require.main === module) {
  main().catch(error => {
    console.error(error.code === 'BROWSER_PROFILE_BUSY' ? error.message : (error.stack || error));
    process.exitCode = 1;
  });
}
