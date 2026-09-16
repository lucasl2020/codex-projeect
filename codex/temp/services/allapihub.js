const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const {
  ALL_API_HUB_EXTENSION_ID,
  ALL_API_HUB_OPTIONS_URL,
  findChrome,
  parseJson,
  isDone,
  markDone,
  log,
  printSummary,
} = require('./common');

function normalChromeUserDataDir() {
  return process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data')
    : null;
}

function chromeProfileNames(userDataDir, fsApi = fs) {
  let lastUsed = '';
  try {
    lastUsed = parseJson(fsApi.readFileSync(path.join(userDataDir, 'Local State'), 'utf8'))?.profile?.last_used || '';
  } catch {}

  const names = [lastUsed, 'Default'];
  try {
    for (const entry of fsApi.readdirSync(userDataDir, { withFileTypes: true })) {
      if (entry.isDirectory() && /^Profile \d+$/.test(entry.name)) names.push(entry.name);
    }
  } catch {}
  return [...new Set(names.filter(name => name === 'Default' || /^Profile \d+$/.test(name)))];
}

function findAllApiHubChromeProfile(userDataDir = normalChromeUserDataDir(), fsApi = fs) {
  if (!userDataDir) return null;
  return chromeProfileNames(userDataDir, fsApi).find(profile => fsApi.existsSync(
    path.join(userDataDir, profile, 'Extensions', ALL_API_HUB_EXTENSION_ID),
  )) || null;
}

function waitForSpawn(child) {
  return new Promise((resolve, reject) => {
    child.once('spawn', resolve);
    child.once('error', reject);
  });
}

async function runOptionalAllApiHubQuickCheckin({
  trigger = true,
  userDataDir = normalChromeUserDataDir(),
  fsApi = fs,
  getChromePath = findChrome,
  launch = spawn,
} = {}) {
  const profile = findAllApiHubChromeProfile(userDataDir, fsApi);
  if (!profile) return { available: false, triggered: false };
  if (!trigger) return { available: true, triggered: false };

  const chrome = launch(getChromePath(), [
    `--profile-directory=${profile}`,
    ALL_API_HUB_OPTIONS_URL,
  ], { stdio: 'ignore', windowsHide: true });
  await waitForSpawn(chrome);
  return { available: true, triggered: true };
}

async function runOptionalAllApiHubTask() {
  const task = 'allapihub';
  const alreadyDone = isDone(task);
  try {
    const result = await runOptionalAllApiHubQuickCheckin({ trigger: !alreadyDone });
    if (!result.available) {
      log(task, '正常 Chrome Profile 未安装扩展，已跳过');
      return { task, ok: true, status: 'skipped', message: '正常 Chrome Profile 未安装扩展，已跳过' };
    }
    if (alreadyDone) {
      log(task, 'already triggered today; skipped');
      return { task, ok: true, status: 'skipped', message: '今日已触发，跳过' };
    }
    markDone(task);
    log(task, '已向正常 Chrome 请求快速签到');
    return { task, ok: true, status: 'success', message: '已触发扩展快速签到' };
  } catch (error) {
    log(task, `failed: ${error.message}`);
    return { task, ok: false, status: 'failed', message: error.message };
  }
}

async function runAllApiHub() {
  return runOptionalAllApiHubTask();
}

if (require.main === module) {
  (async () => {
    log('standalone', '正在单独执行任务：All API Hub');
    const result = await runOptionalAllApiHubTask();
    printSummary([result]);
    process.exitCode = result.ok ? 0 : 1;
  })().catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = {
  normalChromeUserDataDir,
  chromeProfileNames,
  findAllApiHubChromeProfile,
  waitForSpawn,
  runOptionalAllApiHubQuickCheckin,
  runOptionalAllApiHubTask,
  runAllApiHub,
};
