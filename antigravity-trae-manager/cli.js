#!/usr/bin/env node

const TraeManager = require('./lib/trae-manager');
const AntigravityManager = require('./lib/antigravity-mgr');
const WorkBuddyManager = require('./lib/workbuddy-mgr');
const AccountStore = require('./lib/account-store');

const traeMgr = new TraeManager();
const agyMgr = new AntigravityManager();
const wbAiMgr = new WorkBuddyManager({ editionId: 'workbuddy-ai' });
const wbMgr = new WorkBuddyManager({ editionId: 'workbuddy' });
const accountStore = new AccountStore();

const args = process.argv.slice(2);
const command = args[0] || 'help';

function showHelp() {
  console.log(`
========================================================================
  AI-IDE-Manager | Antigravity, Trae & WorkBuddy 统一账号与机器码 CLI
========================================================================

使用方法:
  node cli.js status                         查看 Trae, WorkBuddy, Antigravity 全局环境与指纹
  node cli.js checkin-all                    签到所有支持的平台，自动跳过未开放/不支持项
  
  -- Trae 操作 --
  node cli.js trae list                      列出所有已保存的 Trae 账号档案
  node cli.js trae switch <accountId>        一键切换 Trae 活跃账号 (自动注入机器码与会话)
  node cli.js trae reset-id                  一键生成并随机重置 Trae 机器码 (防多账号关联)
  node cli.js trae snapshot [名称]           将当前 Trae 打开的会话和机器码保存为新账号
  node cli.js trae launch                    启动 Trae IDE
  node cli.js trae launch-isolated [沙箱名]  启动一个独立隔离的 Trae 窗口 (多开沙箱)
  node cli.js trae close                     安全关闭正在运行的 Trae
  
  -- WorkBuddy 系列操作 --
  node cli.js wbai <操作>                    操作 WorkBuddy AI（国际版）
  node cli.js wb <操作>                      操作 WorkBuddy（国内版）
  支持操作: list | reset-id | models | launch | close | switch <accountId>

  -- Antigravity 操作 --
  node cli.js agy list                       列出 Antigravity 账号
  node cli.js agy switch <accountId>         切换 Antigravity 账号
  node cli.js agy reset-id                   重置 Antigravity 机器码

  -- API 模型测试 --
  node cli.js test                           快速批量体检核心大模型连通性与耗时
  node cli.js test <modelId> [提示词]        单项测试指定模型的 API 连通性

示例:
  node cli.js status
  node cli.js test
  node cli.js test deepseek-v4-pro "你好"
  node cli.js trae reset-id
  node cli.js wb reset-id
========================================================================
`);
}

async function handleStatus() {
  console.log('\n🔍 [1] 正在检测 Trae 安装与机器指纹...');
  const traeEditions = traeMgr.detectInstallations();
  const primaryTrae = traeEditions.find(e => e.installed) || traeEditions[0];
  const traeRunning = await traeMgr.isProcessRunning();
  const traeProfile = traeMgr.getDeviceProfile();
  const traeActive = traeMgr.getActiveAccount();

  console.log(`  - Trae 安装状态 : ${primaryTrae.installed ? '已安装 (' + primaryTrae.name + ')' : '未检测到'}`);
  console.log(`  - 运行状态     : ${traeRunning ? '🟢 正在运行 (' + primaryTrae.processName + ')' : '⚪ 未运行'}`);
  console.log(`  - 程序路径     : ${primaryTrae.exe}`);
  console.log(`  - 配置目录     : ${primaryTrae.configDir}`);
  console.log(`  - 当前用户     : ${traeActive ? traeActive.userId + ' (' + traeActive.tier + ')' : '本地用户'}`);
  console.log(`  - Machine ID   : ${traeProfile.machine_id ? traeProfile.machine_id.slice(0, 32) + '...' : '无'}`);
  console.log(`  - Device UUID  : ${traeProfile.dev_device_id || '无'}`);
  console.log(`  - SQM ID       : ${traeProfile.sqm_id || '无'}`);

  console.log('\n🔍 [2] 正在分别检测 WorkBuddy 系列...');
  for (const manager of [wbAiMgr, wbMgr]) {
    const install = manager.detectInstallation();
    const running = await manager.isProcessRunning();
    const profile = manager.getDeviceProfile();
    const freeModels = manager.getFreeModelOffers();
    console.log(`  - ${manager.edition.name}: ${install.installed ? '已安装' : '未检测到'} / ${running ? '🟢 运行中' : '⚪ 未运行'}`);
    console.log(`    程序路径: ${install.exe}`);
    console.log(`    Device ID: ${profile.device_id || '无'}`);
    console.log(`    官方限时免费模型: ${freeModels.length ? freeModels.map(item => item.modelId).join(', ') : '无'}`);
  }

  console.log('\n🔍 [3] 正在检测 Antigravity 安装与机器指纹...');
  const agyTargets = agyMgr.detectInstallations();
  const primaryAgy = agyTargets.find(t => t.configExists) || agyTargets[0];
  const agyRunning = await agyMgr.isProcessRunning();
  const agyProfile = agyMgr.getDeviceProfile();

  console.log(`  - Antigravity  : ${primaryAgy.name}`);
  console.log(`  - 运行状态     : ${agyRunning ? '🟢 正在运行' : '⚪ 未运行'}`);
  console.log(`  - 配置目录     : ${primaryAgy.configDir}`);
  console.log(`  - Machine ID   : ${agyProfile.machine_id ? agyProfile.machine_id.slice(0, 32) + '...' : '无'}`);

  const traeAccs = accountStore.getAllAccounts('trae');
  const wbAiAccs = accountStore.getAllAccounts('workbuddy-ai');
  const wbAccs = accountStore.getAllAccounts('workbuddy');
  const agyAccs = accountStore.getAllAccounts('antigravity');
  console.log(`\n📁 已持久化账号: Trae (${traeAccs.length}) | WorkBuddy AI 国际版 (${wbAiAccs.length}) | WorkBuddy 国内版 (${wbAccs.length}) | Antigravity (${agyAccs.length})`);
}

async function main() {
  switch (command) {
    case 'status':
      await handleStatus();
      break;

    case 'checkin-all': {
      const result = await accountStore.checkinAll({ traeMgr, wbAiMgr, wbMgr, agyMgr });
      const icon = { success: '✅', already: 'ℹ️', skipped: '⏭️', failed: '❌' };
      console.log('\n--- 一键签到结果 ---');
      for (const item of result.results) {
        console.log(`${icon[item.status] || '•'} ${item.name}: ${item.message}`);
      }
      const s = result.summary;
      console.log(`\n成功 ${s.success} / 已签到 ${s.already} / 跳过 ${s.skipped} / 失败 ${s.failed}`);
      break;
    }

    case 'trae': {
      const sub = args[1] || 'list';
      if (sub === 'list') {
        const accs = accountStore.getAllAccounts('trae');
        console.log('\n--- Trae 账号列表 ---');
        accs.forEach((a, idx) => {
          const flag = a.isCurrent ? '⭐ [当前生效]' : '  ';
          console.log(`${flag} [${idx + 1}] ID: ${a.id} | 名称: ${a.name} | 邮箱: ${a.email} | 订阅: ${a.tier}`);
        });
      } else if (sub === 'reset-id') {
        const res = traeMgr.resetDeviceProfile();
        console.log('\n🎉 Trae 机器码与遥测指纹已成功重置！');
        console.log('  全新 MachineId :', res.profile.machine_id);
        console.log('  全新 DeviceUUID:', res.profile.dev_device_id);
        console.log('  全新 SQM ID   :', res.profile.sqm_id);
      } else if (sub === 'launch') {
        traeMgr.launch();
        console.log('🚀 Trae 已成功启动！');
      } else if (sub === 'launch-isolated') {
        const id = args[2] || 'instance_' + Date.now().toString(36);
        const res = traeMgr.launchIsolated(id);
        console.log(`🪟 Trae 隔离多开沙箱已启动！\n  实例名称: ${id}\n  沙箱目录: ${res.instanceDataDir}`);
      } else if (sub === 'close') {
        await traeMgr.closeProcess();
        console.log('🛑 Trae 进程已关闭。');
      } else if (sub === 'snapshot') {
        const name = args[2] || `Trae 备份 (${new Date().toLocaleTimeString()})`;
        const id = 'acc_trae_' + Date.now().toString(36);
        traeMgr.saveAccountSnapshot(id, name);
        const active = traeMgr.getActiveAccount();
        accountStore.addAccount({
          id,
          tool: 'trae',
          email: active && active.userId ? `${active.userId}@trae.solo` : 'snapshot@trae.solo',
          name,
          tier: active ? active.tier : 'Free',
          isCurrent: true
        });
        console.log(`📸 成功将当前 Trae 状态保存为新账号: ${name} (ID: ${id})`);
      } else if (sub === 'switch') {
        const id = args[2];
        if (!id) {
          console.error('错误: 请提供 accountId');
          return;
        }
        const acc = accountStore.getAccountById(id);
        if (!acc) {
          console.error(`未找到 ID 为 ${id} 的账号`);
          return;
        }
        if (acc.deviceProfile) {
          traeMgr.setDeviceProfile(acc.deviceProfile);
        }
        try { traeMgr.applyAccountSnapshot(id); } catch(e) {}
        accountStore.setActiveAccount(id);
        console.log(`⚡ 成功激活 Trae 账号: ${acc.name}`);
      }
      break;
    }

    case 'wbai':
    case 'wb':
    case 'workbuddy': {
      const manager = command === 'wbai' ? wbAiMgr : wbMgr;
      const tool = manager.editionId;
      const editionName = manager.edition.name;
      const sub = args[1] || 'list';
      if (sub === 'list') {
        const accs = accountStore.getAllAccounts(tool);
        console.log(`\n--- ${editionName}档案列表 ---`);
        accs.forEach((a, idx) => {
          const flag = a.isCurrent ? '⭐ [当前生效]' : '  ';
          console.log(`${flag} [${idx + 1}] ID: ${a.id} | 名称: ${a.name} | 标识: ${a.email} | 等级: ${a.tier}`);
        });
      } else if (sub === 'reset-id') {
        const res = manager.resetDeviceProfile();
        console.log(`\n🎉 ${editionName} Device-ID 与 Qimei 已成功重置！`);
        console.log('  全新 Device ID:', res.profile.device_id);
        console.log('  全新 Qimei36  :', res.profile.qimei36);
      } else if (sub === 'launch') {
        manager.launch();
        console.log(`🚀 ${editionName}客户端已成功启动！`);
      } else if (sub === 'close') {
        await manager.closeProcess();
        console.log(`🛑 ${editionName}进程已关闭。`);
      } else if (sub === 'models') {
        const models = manager.getCustomModels();
        console.log(`\n--- ${editionName}自定义大模型清单 (共 ${models.length} 个) ---`);
        models.forEach((m, idx) => {
          console.log(`  [${idx + 1}] ${m.id.padEnd(20)} | 名称: ${m.name || m.id} | 接口: ${m.url}`);
        });
      } else if (sub === 'switch') {
        const id = args[2];
        if (!id) {
          console.error('错误: 请提供 accountId');
          return;
        }
        const acc = accountStore.getAccountById(id);
        if (!acc) {
          console.error(`未找到 ID 为 ${id} 的账号`);
          return;
        }
        if (acc.tool !== tool) {
          console.error(`该档案属于 ${acc.tool}，不能应用到 ${editionName}`);
          return;
        }
        if (acc.deviceProfile) {
          manager.setDeviceProfile(acc.deviceProfile);
        }
        accountStore.setActiveAccount(id);
        console.log(`🧩 已应用 ${editionName}设备档案（登录账号未改变）: ${acc.name}`);
      }
      break;
    }

    case 'agy': {
      const sub = args[1] || 'list';
      if (sub === 'list') {
        const accs = accountStore.getAllAccounts('antigravity');
        console.log('\n--- Antigravity 账号列表 ---');
        accs.forEach((a, idx) => {
          const flag = a.isCurrent ? '⭐ [当前生效]' : '  ';
          console.log(`${flag} [${idx + 1}] ID: ${a.id} | 名称: ${a.name} | 邮箱: ${a.email}`);
        });
      } else if (sub === 'reset-id') {
        const res = agyMgr.resetDeviceProfile();
        console.log('\n🎉 Antigravity 机器码已成功重置！');
        console.log('  全新 MachineId:', res.profile.machine_id);
      }
      break;
    }

    case 'test': {
      const modelId = args[1];
      const customPrompt = args[2] || 'Say OK in one word.';
      const ProxyGateway = require('./lib/proxy-gateway');
      const gateway = new ProxyGateway({ workbuddyEndpoint: 'http://127.0.0.1:18888' });

      if (modelId) {
        console.log(`\n🧪 正在测试指定模型: ${modelId} ...`);
        console.log(`  提示词: "${customPrompt}"`);
        const result = await gateway.testModel(modelId, customPrompt, { timeout: 30000 });
        if (result.success) {
          console.log(`\n✅ [200 OK] 测试通过！`);
          console.log(`  - 耗时: ${result.durationMs} ms (首字: ${result.ttftMs} ms)`);
          console.log(`  - 回复: ${result.content || result.preview}`);
          if (result.usage) {
            console.log(`  - Token消耗: 提示词 ${result.usage.prompt_tokens} / 回复 ${result.usage.completion_tokens}`);
          }
        } else {
          console.log(`\n❌ 调用失败 (状态: ${result.status})`);
          console.log(`  - 错误详情: ${result.error}`);
        }
      } else {
        const coreModels = [
          'deepseek-v4-pro',
          'default-1.2',
          'deepseek-r1-0528',
          'deepseek-v3-0324',
          'hunyuan-2.0-instruct',
          'claude-sonnet-5',
          'grok-4.6'
        ];
        console.log(`\n🧪 开始批量体检核心模型 (${coreModels.length} 款) ...`);
        console.log('----------------------------------------------------------------------');
        for (const mId of coreModels) {
          process.stdout.write(`  探测 [${mId}] ... `);
          const res = await gateway.testModel(mId, 'Say OK in one word.', { timeout: 25000 });
          if (res.success) {
            console.log(`✅ 通过 (${res.durationMs}ms) -> "${res.preview || 'OK'}"`);
          } else {
            console.log(`❌ 失败 (${res.status || 'ERR'} - ${res.error})`);
          }
        }
        console.log('----------------------------------------------------------------------');
        console.log('🎉 核心模型体检完成！可在 Web 仪表盘 http://127.0.0.1:19999 查看全量报告。');
      }
      break;
    }

    case 'help':
    default:
      showHelp();
      break;
  }
}

main().catch(err => {
  console.error('执行出错:', err.message);
});
