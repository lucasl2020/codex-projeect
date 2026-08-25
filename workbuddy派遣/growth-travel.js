#!/usr/bin/env node
/**
 * WorkBuddy 成长计划 - 派猫旅行自动脚本
 *
 * 直接调用成长计划后端接口完成：派遣猫猫 → 等待回家 → 领取奖励，无需浏览器。
 *
 * 用法：
 *   node growth-travel.js           单次执行：能领就领，能派就派，旅行中就报告进度
 *   node growth-travel.js --status  只查当前状态
 *   node growth-travel.js --watch   持续监控：旅行期间循环轮询，回家后自动领取
 *
 * 建议配合 Windows 任务计划程序，每 30 分钟运行一次单次执行即可。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE = 'https://copilot.tencent.com';
const SESSION_PATH = path.join(
  os.homedir(), 'AppData', 'Local', 'CodeBuddyExtension',
  'Data', 'Public', 'auth', 'workbuddy-desktop.info'
);

function loadSession() {
  const s = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
  return { token: s.auth.accessToken, uid: s.account.uid, domain: s.auth.domain };
}

async function api(method, p, body) {
  const { token, uid, domain } = loadSession();
  const res = await fetch(BASE + p, {
    method,
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'X-User-Id': uid,
      'X-Domain': domain,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 401) throw new Error('登录态已失效，请打开 WorkBuddy 重新登录后再运行');
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.msg || ('接口错误 code=' + json.code));
  return json.data;
}

function fmtDuration(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h} 小时 ${m} 分` : `${m} 分钟`;
}

async function printStatus() {
  const st = await api('GET', '/activity/growth/buddy/travel/status');
  const stateText = { idle: '空闲', traveling: '旅行中', arrived: '已到家待领取' }[st.state] || st.state;
  console.log(`状态：${stateText}`);
  if (st.state === 'traveling') {
    const remain = st.arrive_at - st.server_now;
    console.log(`到家时间：${new Date(st.arrive_at * 1000).toLocaleString('zh-CN')}（还差 ${fmtDuration(remain)}）`);
  }
  if (st.location) console.log(`地点：${st.location.name}`);
  console.log(`今日是否已派：${st.daily_limit_reached ? '是' : '否'}`);
  return st;
}

async function main() {
  const watch = process.argv.includes('--watch');
  const statusOnly = process.argv.includes('--status');

  console.log(`当前时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`);

  let st = await printStatus();
  if (statusOnly) return;

  if (watch) {
    console.log('开始监控，Ctrl+C 退出。');
    // 监控循环：旅行中等待，到家领取，领取后再查是否可继续
    while (true) {
      if (st.state === 'arrived') {
        const r = await api('POST', '/activity/growth/buddy/travel/claim', {});
        console.log(`已领取奖励：+${r.reward_credit} 积分`);
        if (r.letter && r.letter.guide_text) console.log(`猫猫来信：${r.letter.guide_text}`);
      } else if (st.state === 'idle' && !st.daily_limit_reached) {
        await depart();
      }
      await new Promise(res => setTimeout(res, 60 * 1000));
      st = await api('GET', '/activity/growth/buddy/travel/status');
    }
  }

  // 单次执行
  if (st.state === 'arrived') {
    const r = await api('POST', '/activity/growth/buddy/travel/claim', {});
    console.log(`已领取奖励：+${r.reward_credit} 积分`);
    if (r.letter && r.letter.guide_text) console.log(`猫猫来信：${r.letter.guide_text}`);
    return;
  }
  if (st.state === 'traveling') {
    console.log('猫猫还在旅行中，下次运行再来看。');
    return;
  }
  if (st.daily_limit_reached) {
    console.log('今日已派过猫猫，明天再来。');
    return;
  }
  await depart();
}

async function depart() {
  const cfg = await api('GET', '/activity/growth/buddy/travel/config');
  if (!cfg.locations || cfg.locations.length === 0) throw new Error('没有可派遣的地点');
  const loc = cfg.locations[0];
  const r = await api('POST', '/activity/growth/buddy/travel/depart', { location_id: loc.id });
  const remain = (r.arrive_at || 0) - (r.server_now || 0);
  console.log(`已派猫猫去「${loc.name}」，预计 ${remain > 0 ? fmtDuration(remain) : '1~4 小时'} 后回家。`);
}

main().catch(e => { console.error('失败：' + e.message); process.exit(1); });
