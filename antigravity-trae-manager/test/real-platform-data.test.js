const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { EventEmitter } = require('node:events');

const AccountStore = require('../lib/account-store');
const AntigravityManager = require('../lib/antigravity-mgr');
const ProxyGateway = require('../lib/proxy-gateway');
const WorkBuddyManager = require('../lib/workbuddy-mgr');

function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'antigravity-trae-manager-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function cliSpawn(stdout, stderr = '', code = 0) {
  return () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => {
      if (stdout) child.stdout.emit('data', Buffer.from(stdout));
      if (stderr) child.stderr.emit('data', Buffer.from(stderr));
      child.emit('close', code);
    });
    return child;
  };
}

test('Antigravity 不存在签到能力时拒绝请求且不伪造积分', async (t) => {
  const baseDir = tempDir(t);
  const store = new AccountStore({ baseDir });
  store.addAccount({ tool: 'antigravity', name: '真实账号', isCurrent: true });
  const before = fs.readFileSync(store.dataFile, 'utf8');

  await assert.rejects(() => store.checkin('antigravity'), /不支持签到/);
  assert.equal(fs.readFileSync(store.dataFile, 'utf8'), before);
});

test('Trae 官方签到失败时不修改本地账号数据', async (t) => {
  const baseDir = tempDir(t);
  const store = new AccountStore({ baseDir });
  store.addAccount({ tool: 'trae', name: '真实账号', isCurrent: true });
  const before = fs.readFileSync(store.dataFile, 'utf8');

  await assert.rejects(
    () => store.checkin('trae', { traeMgr: { claimRealCheckin: async () => ({ success: false, error: '上游拒绝' }) } }),
    /上游拒绝/
  );
  assert.equal(fs.readFileSync(store.dataFile, 'utf8'), before);
});

test('WorkBuddy 从官方资源汇总计算真实剩余、总量和已用量', async (t) => {
  const baseDir = tempDir(t);
  const localAppData = path.join(baseDir, 'Local');
  const authDir = path.join(localAppData, 'CodeBuddyExtension', 'Data', 'Public', 'auth');
  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(path.join(authDir, 'workbuddy-desktop.info'), JSON.stringify({
    account: { uid: 'uid-1', nickname: '测试用户', type: 'personal' },
    auth: { accessToken: 'secret-token', domain: 'personal' }
  }));

  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    const data = url.endsWith('/get-user-resource-summary')
      ? { Packages: [
          { PackageCode: 'base', CycleTotalCapacity: 2000, CycleRemainCapacity: 1200, CycleUsedCapacity: 800 },
          { PackageCode: 'gift', CycleTotalCapacity: 300, CycleRemainCapacity: 250, CycleUsedCapacity: 50 }
        ], SubscriptionPackageCode: 'base', IsPaidUser: true }
      : { today_checked_in: true, streak_days: 3, today_credit: 20 };
    return { ok: true, status: 200, json: async () => ({ code: 0, data }) };
  };

  const manager = new WorkBuddyManager({ editionId: 'workbuddy', baseDir, localAppData, userProfile: baseDir, fetchImpl });
  const result = await manager.getRealAccountDetails();

  assert.deepEqual(result.credits, { points: 1450, total: 2300, used: 850 });
  assert.equal(result.checkin.checkedIn, true);
  assert.equal(result.tier, 'base');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, 'https://copilot.tencent.com/v2/billing/meter/checkin-activity-status');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer secret-token');
  assert.equal(calls[0].options.headers['X-User-Id'], 'uid-1');
});

test('WorkBuddy 签到活动关闭时不调用领取接口', async (t) => {
  const baseDir = tempDir(t);
  const manager = new WorkBuddyManager({ editionId: 'workbuddy', baseDir, localAppData: baseDir, userProfile: baseDir });
  const calls = [];
  manager.requestOfficial = async (pathname) => {
    calls.push(pathname);
    return { active: false, today_checked_in: false };
  };

  await assert.rejects(() => manager.claimRealCheckin(), /活动当前未开放/);
  assert.deepEqual(calls, ['/v2/billing/meter/checkin-activity-status']);
});

test('WorkBuddy AI 国际版与 WorkBuddy 国内版使用各自会话和官方域名', async (t) => {
  const baseDir = tempDir(t);
  const localAppData = path.join(baseDir, 'Local');
  const authDir = path.join(localAppData, 'CodeBuddyExtension', 'Data', 'Public', 'auth');
  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(path.join(authDir, 'workbuddy-desktop-ai.info'), JSON.stringify({
    account: { uid: 'international-user' },
    auth: { accessToken: 'international-token', domain: 'www.workbuddy.ai' }
  }));
  fs.writeFileSync(path.join(authDir, 'workbuddy-desktop.info'), JSON.stringify({
    account: { uid: 'domestic-user' },
    auth: { accessToken: 'domestic-token', domain: 'www.codebuddy.cn' }
  }));

  const international = new WorkBuddyManager({
    editionId: 'workbuddy-ai', baseDir, localAppData, userProfile: baseDir
  });
  const domestic = new WorkBuddyManager({
    editionId: 'workbuddy', baseDir, localAppData, userProfile: baseDir
  });

  assert.equal(international.getAuthSession().account.uid, 'international-user');
  assert.equal(international.endpoint, 'https://www.workbuddy.ai');
  assert.equal(international.workbuddyDir, path.join(baseDir, '.workbuddy-ai'));
  assert.equal(domestic.getAuthSession().account.uid, 'domestic-user');
  assert.equal(domestic.endpoint, 'https://copilot.tencent.com');
  assert.equal(domestic.workbuddyDir, path.join(baseDir, '.workbuddy'));
});

test('WorkBuddy AI 国际版拒绝误写入的国内版登录会话', async (t) => {
  const baseDir = tempDir(t);
  const authDir = path.join(baseDir, 'CodeBuddyExtension', 'Data', 'Public', 'auth');
  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(path.join(authDir, 'workbuddy-desktop-ai.info'), JSON.stringify({
    account: { uid: 'domestic-user' },
    auth: { accessToken: 'domestic-token', domain: 'www.codebuddy.cn' }
  }));
  let spawnCalls = 0;
  const manager = new WorkBuddyManager({
    editionId: 'workbuddy-ai', baseDir, localAppData: baseDir, userProfile: baseDir,
    spawnImpl: () => { spawnCalls += 1; }
  });

  const result = await manager.testModel('model-id', '测试问题');
  assert.equal(result.success, false);
  assert.equal(result.status, 409);
  assert.match(result.error, /www\.codebuddy\.cn/);
  assert.match(result.error, /国际版/);
  assert.equal(spawnCalls, 0);
  await assert.rejects(() => manager.getRealAccountDetails(), /www\.codebuddy\.cn/);
  assert.equal(manager.getActiveAccount(), null);
  assert.deepEqual(manager.getAuthState(), {
    present: true,
    compatible: false,
    domain: 'www.codebuddy.cn',
    region: 'domestic',
    repairAvailable: true,
    error: result.error
  });
});

test('WorkBuddy AI 国际版可备份跨区会话且不会改动国内版会话', (t) => {
  const baseDir = tempDir(t);
  const authDir = path.join(baseDir, 'CodeBuddyExtension', 'Data', 'Public', 'auth');
  fs.mkdirSync(authDir, { recursive: true });
  const internationalAuth = path.join(authDir, 'workbuddy-desktop-ai.info');
  const domesticAuth = path.join(authDir, 'workbuddy-desktop.info');
  const invalidSession = JSON.stringify({
    account: { uid: 'domestic-user' },
    auth: { accessToken: 'domestic-token', domain: 'www.codebuddy.cn' }
  });
  fs.writeFileSync(internationalAuth, invalidSession);
  fs.writeFileSync(domesticAuth, 'domestic-session-must-stay');

  const manager = new WorkBuddyManager({
    editionId: 'workbuddy-ai', baseDir, localAppData: baseDir, userProfile: baseDir
  });
  const repaired = manager.backupIncompatibleAuth();

  assert.equal(repaired.repaired, true);
  assert.equal(fs.existsSync(internationalAuth), false);
  assert.equal(fs.readFileSync(repaired.backupPath, 'utf8'), invalidSession);
  assert.equal(fs.readFileSync(domesticAuth, 'utf8'), 'domestic-session-must-stay');
  assert.equal(manager.getAuthSession(), null);
  assert.equal(manager.backupIncompatibleAuth().repaired, false);
});

test('WorkBuddy 国内版拒绝误写入的国际版登录会话', (t) => {
  const baseDir = tempDir(t);
  const authDir = path.join(baseDir, 'CodeBuddyExtension', 'Data', 'Public', 'auth');
  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(path.join(authDir, 'workbuddy-desktop.info'), JSON.stringify({
    account: { uid: 'international-user' },
    auth: { accessToken: 'international-token', domain: 'www.workbuddy.ai' }
  }));
  const manager = new WorkBuddyManager({
    editionId: 'workbuddy', baseDir, localAppData: baseDir, userProfile: baseDir
  });

  assert.match(manager.getAuthCompatibilityError(), /www\.workbuddy\.ai/);
  assert.equal(manager.getAuthState().region, 'international');
  assert.equal(manager.getAuthState().repairAvailable, true);
  assert.equal(manager.getActiveAccount(), null);
});

test('WorkBuddy 两个版本使用独立认证目录且共享目录覆盖不会串号', async (t) => {
  const baseDir = tempDir(t);
  const sharedLocalAppData = path.join(baseDir, 'shared-local');
  const sharedAuthDir = path.join(sharedLocalAppData, 'CodeBuddyExtension', 'Data', 'Public', 'auth');
  const internationalUserProfile = path.join(baseDir, 'international-profile');
  const domesticUserProfile = path.join(baseDir, 'domestic-profile');
  const internationalLocalAppData = path.join(internationalUserProfile, 'AppData', 'Local');
  const domesticLocalAppData = path.join(domesticUserProfile, 'AppData', 'Local');
  fs.mkdirSync(sharedAuthDir, { recursive: true });
  fs.writeFileSync(path.join(sharedAuthDir, 'workbuddy-desktop-ai.info'), JSON.stringify({
    account: { uid: 'international-user' },
    auth: { accessToken: 'international-token', domain: 'www.workbuddy.ai' }
  }));
  fs.writeFileSync(path.join(sharedAuthDir, 'workbuddy-desktop.info'), JSON.stringify({
    account: { uid: 'domestic-user' },
    auth: { accessToken: 'domestic-token', domain: 'www.codebuddy.cn' }
  }));

  let domesticSpawnLocalAppData = null;
  const domestic = new WorkBuddyManager({
    editionId: 'workbuddy', baseDir, localAppData: sharedLocalAppData,
    authLocalAppData: domesticLocalAppData, authUserProfile: domesticUserProfile, userProfile: baseDir,
    spawnImpl: (command, args, options) => {
      domesticSpawnLocalAppData = options.env.LOCALAPPDATA;
      assert.equal(options.env.USERPROFILE, domesticUserProfile);
      assert.equal(options.env.HOME, domesticUserProfile);
      return cliSpawn(JSON.stringify({ history: [{
        type: 'message', role: 'assistant', content: [{ type: 'text', text: '国内版回答' }]
      }] }))(command, args, options);
    }
  });
  const international = new WorkBuddyManager({
    editionId: 'workbuddy-ai', baseDir, localAppData: sharedLocalAppData,
    authLocalAppData: internationalLocalAppData, authUserProfile: internationalUserProfile, userProfile: baseDir
  });
  const cliPath = path.join(baseDir, 'codebuddy');
  fs.writeFileSync(cliPath, 'fixture');
  domestic.detectInstallation = () => ({ cliPath });

  assert.equal(domestic.getAuthSession().auth.domain, 'www.codebuddy.cn');
  assert.equal(international.getAuthSession().auth.domain, 'www.workbuddy.ai');
  fs.writeFileSync(path.join(sharedAuthDir, 'workbuddy-desktop.info'), JSON.stringify({
    account: { uid: 'international-user' },
    auth: { accessToken: 'international-token', domain: 'www.workbuddy.ai' }
  }));
  assert.equal(domestic.getAuthSession().auth.domain, 'www.codebuddy.cn');

  const result = await domestic.testModel('domestic-model', '测试');
  assert.equal(result.success, true);
  assert.equal(result.content, '国内版回答');
  assert.equal(domesticSpawnLocalAppData, domesticLocalAppData);
});

test('只有官方活动明确为零倍率的模型才标记为限时免费', (t) => {
  const baseDir = tempDir(t);
  const storageDir = path.join(baseDir, '.workbuddy-ai', 'local_storage');
  fs.mkdirSync(storageDir, { recursive: true });
  fs.writeFileSync(path.join(storageDir, 'wb_entry_d43e96994f944cfb77961c2ea7d04605.info'), JSON.stringify([{
    data: {
      modelPromotions: [
        { id: 'free', badge: { label: 'Free now' }, modelIds: ['model-free'], discount: { discountedCredits: '0x', factor: 0 } },
        { id: 'sale', badge: { label: 'Discount' }, modelIds: ['model-sale'], discount: { discountedCredits: '0.5x', factor: 0.5 } }
      ]
    }
  }]));

  const manager = new WorkBuddyManager({
    editionId: 'workbuddy-ai', baseDir, localAppData: baseDir, userProfile: baseDir
  });
  const promotions = manager.getPromotions();
  assert.equal(promotions[0].isFree, true);
  assert.equal(promotions[1].isFree, false);
  assert.deepEqual(manager.getFreeModelOffers().map(item => item.modelId), ['model-free']);
});

test('WorkBuddy 两个版本分别读取官方缓存模型并生成独立目录键', (t) => {
  const baseDir = tempDir(t);
  for (const [folder, editionId, modelId] of [
    ['.workbuddy-ai', 'workbuddy-ai', 'global-model'],
    ['.workbuddy', 'workbuddy', 'domestic-model']
  ]) {
    const storageDir = path.join(baseDir, folder, 'local_storage');
    fs.mkdirSync(storageDir, { recursive: true });
    fs.writeFileSync(path.join(storageDir, 'wb_entry_d43e96994f944cfb77961c2ea7d04605.info'), JSON.stringify([{
      data: { models: [{ id: modelId, name: modelId, maxInputTokens: 200000 }] }
    }]));
    const manager = new WorkBuddyManager({ editionId, baseDir, localAppData: baseDir, userProfile: baseDir });
    const [model] = manager.getOfficialModels();
    assert.equal(model.id, modelId);
    assert.equal(model.sourceEdition, editionId);
    assert.equal(model.catalogId, `${editionId}:${modelId}`);
  }
});

test('WorkBuddy CLI 返回正文时提取完整回答而不是占位 OK', async (t) => {
  const baseDir = tempDir(t);
  const cliPath = path.join(baseDir, 'codebuddy');
  fs.writeFileSync(cliPath, 'fixture');
  const stdout = JSON.stringify({ history: [{
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: '这是完整回答' }]
  }] });
  const manager = new WorkBuddyManager({
    editionId: 'workbuddy-ai', baseDir, localAppData: baseDir, userProfile: baseDir,
    spawnImpl: cliSpawn(stdout)
  });
  manager.detectInstallation = () => ({ cliPath });

  const result = await manager.testModel('model-id', '测试问题');
  assert.equal(result.success, true);
  assert.equal(result.content, '这是完整回答');
  assert.equal(result.preview, '这是完整回答');
});

test('WorkBuddy CLI 空正文或登录失效不能误报 200 OK', async (t) => {
  const baseDir = tempDir(t);
  const cliPath = path.join(baseDir, 'codebuddy');
  fs.writeFileSync(cliPath, 'fixture');
  const manager = new WorkBuddyManager({
    editionId: 'workbuddy-ai', baseDir, localAppData: baseDir, userProfile: baseDir,
    spawnImpl: cliSpawn('[]', '401 Authentication required. Please use /login command')
  });
  manager.detectInstallation = () => ({ cliPath });

  const result = await manager.testModel('model-id', '测试问题');
  assert.equal(result.success, false);
  assert.equal(result.status, 401);
  assert.match(result.error, /登录|Authentication required/);
  assert.notEqual(result.preview, 'OK');
});

test('WorkBuddy AI 国际版不提供签到且不会调用管理器', async (t) => {
  const baseDir = tempDir(t);
  const store = new AccountStore({ baseDir });
  store.addAccount({ tool: 'workbuddy-ai', name: '国际版账号', isCurrent: true });
  let calls = 0;
  const wbAiMgr = {
    claimRealCheckin: async () => {
      calls++;
      return {
        success: true,
        alreadyCheckedIn: true,
        rewardPoints: null,
        credits: { points: 130, total: 130, used: 0 },
        checkin: { checkedIn: true, active: true },
        message: '官方已签到'
      };
    }
  };

  await assert.rejects(() => store.checkin('workbuddy-ai', { wbAiMgr }), /不支持签到/);
  assert.equal(calls, 0);
});

test('Trae 签到奖励只使用 credits，不叠加 extra_credits', async (t) => {
  const baseDir = tempDir(t);
  const store = new AccountStore({ baseDir });
  store.addAccount({ tool: 'trae', name: 'Trae', isCurrent: true });
  const result = await store.checkin('trae', {
    traeMgr: {
      claimRealCheckin: async () => ({
        success: true,
        alreadyCheckedIn: true,
        rewardPoints: 200,
        latestStatus: {
          success: true,
          checkedIn: true,
          credits: 150,
          extraCredits: 50,
          totalCheckinCredits: 200
        }
      })
    }
  });

  assert.equal(result.reward, 150);
  assert.equal(result.rewardPoints, 150);
  assert.equal(result.account.credits.checkinToday, 150);
});

test('一键签到只处理 Trae 与 WorkBuddy 国内版', async (t) => {
  const baseDir = tempDir(t);
  const store = new AccountStore({ baseDir });
  for (const tool of ['trae', 'workbuddy-ai', 'workbuddy']) {
    store.addAccount({ tool, name: tool, isCurrent: true });
  }
  let internationalClaims = 0;
  let domesticClaims = 0;
  const managers = {
    traeMgr: {
      claimRealCheckin: async () => ({
        success: true,
        alreadyCheckedIn: true,
        rewardPoints: 150,
        latestStatus: { success: true, checkedIn: true, credits: 150, extraCredits: 50 }
      })
    },
    wbAiMgr: {
      getRealCheckinStatus: async () => ({ active: false, checkedIn: false }),
      claimRealCheckin: async () => { internationalClaims++; }
    },
    wbMgr: {
      getRealCheckinStatus: async () => ({ active: true, checkedIn: false }),
      claimRealCheckin: async () => {
        domesticClaims++;
        return {
          success: true,
          alreadyCheckedIn: false,
          rewardPoints: 10,
          credits: { points: 110, total: 200, used: 90 },
          checkin: { checkedIn: true, active: true },
          message: 'WorkBuddy 官方接口签到成功'
        };
      }
    }
  };

  const result = await store.checkinAll(managers);
  assert.deepEqual(result.results.map(item => [item.tool, item.status]), [
    ['trae', 'already'],
    ['workbuddy', 'success']
  ]);
  assert.equal(internationalClaims, 0);
  assert.equal(domesticClaims, 1);
  assert.deepEqual(result.summary, { success: 1, already: 1, skipped: 0, failed: 0 });
});

test('网关仅把官方零倍率活动标记为限时免费', () => {
  const gateway = new ProxyGateway({
    sourceEdition: 'workbuddy',
    promotionProvider: () => []
  });
  const free = gateway.enrichModel(
    { id: 'hy3', name: 'HY3' },
    [{ models: ['hy3'], label: '限时免费', description: '活动期内免费', discount: '0x', isFree: true }]
  );
  const paid = gateway.enrichModel(
    { id: 'glm', name: 'GLM' },
    [{ models: ['glm'], label: '折扣', description: '五折', discount: '0.5x', isFree: false }]
  );

  assert.equal(free.sourceEdition, 'workbuddy');
  assert.equal(free.isFree, true);
  assert.equal(paid.isFree, false);
});

test('国际版网关模型元数据明确标记 WorkBuddy AI 来源', () => {
  const gateway = new ProxyGateway({ sourceEdition: 'workbuddy-ai' });
  const model = gateway.enrichModel({ id: 'global-model', name: 'Global Model' }, []);
  assert.equal(model.catalogId, 'workbuddy-ai:global-model');
  assert.equal(model.sourceIdeId, 'workbuddy-ai');
  assert.match(model.sourceIde, /国际版/);
});

test('Antigravity 展示官方逐模型剩余比例，不换算成虚构积分', async (t) => {
  const baseDir = tempDir(t);
  const responses = new Map([
    ['v1internal:loadCodeAssist', { cloudaicompanionProject: 'project-1', currentTier: { name: 'Standard' } }],
    ['v1internal:fetchAvailableModels', { models: {
      'gemini-2.5-pro': { displayName: 'Gemini 2.5 Pro', quotaInfo: { remainingFraction: 0.42, resetTime: '2026-09-13T00:00:00Z' } },
      'internal-chat': { quotaInfo: { remainingFraction: 1 } }
    } }],
    ['v1internal:retrieveUserQuotaSummary', { groups: [] }],
    ['userinfo', { email: 'user@example.com', name: '测试用户' }]
  ]);
  const fetchImpl = async (url) => {
    const key = [...responses.keys()].find(candidate => url.includes(candidate));
    return { ok: true, status: 200, json: async () => responses.get(key) };
  };
  const manager = new AntigravityManager({
    baseDir,
    userProfile: baseDir,
    appData: baseDir,
    localAppData: baseDir,
    fetchImpl,
    credentialProvider: () => ({ accessToken: 'token', refreshToken: 'refresh', expiry: Date.now() + 60_000 })
  });

  const result = await manager.getRealAccountDetails();
  assert.equal(result.email, 'user@example.com');
  assert.equal(result.tier, 'Standard');
  assert.equal(result.models.length, 1);
  assert.deepEqual(result.models[0], {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    remainingPercent: 42,
    resetTime: '2026-09-13T00:00:00Z'
  });
  assert.equal(result.credits, undefined);
});

test('已知虚构额度不再出现在状态接口和页面展示中', () => {
  const files = ['server.js', 'public/app.js', 'lib/account-store.js', 'lib/workbuddy-mgr.js'];
  const source = files.map(file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8')).join('\n');
  for (const fake of ['total: 6700', 'points: 15000', 'total: 20000', 'points: 4000', 'total: 10000']) {
    assert.equal(source.includes(fake), false, `仍包含虚构额度代码：${fake}`);
  }
});
