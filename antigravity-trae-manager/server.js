const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { URL } = require('url');

const TraeManager = require('./lib/trae-manager');
const AntigravityManager = require('./lib/antigravity-mgr');
const WorkBuddyManager = require('./lib/workbuddy-mgr');
const AccountStore = require('./lib/account-store');
const ProxyGateway = require('./lib/proxy-gateway');
const { createIDEInstances } = require('./lib/vscode-ide-mgr');
const { generateDeviceProfile } = require('./lib/device-spoofer');
const { listenWithPortFallback } = require('./lib/port-listener');
const { AsyncStatusCache } = require('./lib/status-cache');
const {
  parseToolCallsAndContent,
  formatChatMessages,
  buildChatCompletionResponse,
  buildChatCompletionStreamChunks
} = require('./lib/opencode-compat');

const START_PORT = parseInt(process.env.PORT || '19999', 10);
let PORT = START_PORT;
const HOST = process.env.HOST || '127.0.0.1';

const traeMgr = new TraeManager();
const agyMgr = new AntigravityManager();
const wbAiMgr = new WorkBuddyManager({ editionId: 'workbuddy-ai' });
const wbMgr = new WorkBuddyManager({ editionId: 'workbuddy' });
const { cursorMgr, windsurfMgr, vscodeMgr } = createIDEInstances();
const extraIdes = new Map([
  ['cursor', cursorMgr],
  ['windsurf', windsurfMgr],
  ['vscode', vscodeMgr]
]);
const accountStore = new AccountStore();
const proxyGateway = new ProxyGateway({
  workbuddyEndpoint: 'http://127.0.0.1:18888',
  sourceEdition: 'workbuddy',
  promotionProvider: () => wbMgr.getPromotions()
});
const wbAiCatalogGateway = new ProxyGateway({
  sourceEdition: 'workbuddy-ai',
  promotionProvider: () => wbAiMgr.getPromotions()
});
const antigravityStatusCache = new AsyncStatusCache({ ttlMs: 60000 });
const workBuddyStatusCaches = new Map([
  ['workbuddy-ai', new AsyncStatusCache({ ttlMs: 60000 })],
  ['workbuddy', new AsyncStatusCache({ ttlMs: 60000 })]
]);
let lastAntigravityWarning = null;
const lastWorkBuddyWarnings = new Map();

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err?.stack || err?.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.warn('[Server] Unhandled Rejection:', reason?.message || reason);
});

function sanitizeCustomModels(models) {
  return models.map(({ apiKey, ...model }) => ({
    ...model,
    hasApiKey: Boolean(apiKey)
  }));
}

function getDomesticCachedModels() {
  const promotions = wbMgr.getPromotions();
  const official = wbMgr.getOfficialModels();
  const custom = sanitizeCustomModels(wbMgr.getCustomModels()).map(model => ({
    ...model,
    owned_by: 'workbuddy-custom',
    sourceEdition: 'workbuddy',
    catalogId: `workbuddy:${model.id}`
  }));
  return [...official, ...custom].map(model => proxyGateway.enrichModel(model, promotions));
}

async function fetchDomesticModelsCatalog() {
  const cached = getDomesticCachedModels();
  const bridged = await proxyGateway.fetchModelsCatalog();
  const merged = new Map(cached.map(model => [model.catalogId, model]));
  for (const model of bridged) merged.set(model.catalogId, model);
  return [...merged.values()];
}

function isDomesticCustomModel(modelId, explicit = false) {
  return explicit || wbMgr.getCustomModels().some(model => model.id === modelId);
}

async function testDomesticBatch(models, prompt, concurrency) {
  const results = [];
  const queue = [...models];
  const worker = async () => {
    while (queue.length > 0) {
      results.push(await wbMgr.testModel(queue.shift(), prompt, { timeout: 30000 }));
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, models.length) }, worker));
  const passed = results.filter(result => result.success).length;
  return {
    summary: {
      total: results.length,
      passed,
      failed: results.length - passed,
      passRate: results.length ? `${Math.round((passed / results.length) * 100)}%` : '0%',
      avgLatencyMs: results.length
        ? Math.round(results.reduce((sum, result) => sum + (result.durationMs || 0), 0) / results.length)
        : 0
    },
    results
  };
}

async function fetchAllModelsCatalog() {
  const domesticModels = await fetchDomesticModelsCatalog();
  const internationalPromotions = wbAiMgr.getPromotions();
  const internationalModels = wbAiMgr.getOfficialModels()
    .map(model => wbAiCatalogGateway.enrichModel(model, internationalPromotions));
  return [...internationalModels, ...domesticModels];
}

// Auto-seed initial active accounts if accounts.json is empty
(function initSeed() {
  const traeAccounts = accountStore.getAllAccounts('trae');
  if (traeAccounts.length === 0) {
    const active = traeMgr.getActiveAccount();
    if (active) {
      accountStore.addAccount({
        tool: 'trae',
        email: active.userId ? `${active.userId}@trae.solo` : 'local-user@trae.solo',
        name: `Trae 默认用户 (${active.tier})`,
        tier: active.tier,
        credits: { general: active.generalCredits, work: active.workCredits },
        isCurrent: true,
        customLabel: '本机默认账号',
        deviceProfile: active.deviceProfile
      });
      console.log('[Init] Auto-discovered local Trae profile and added as primary account.');
    }
  }

  for (const manager of [wbAiMgr, wbMgr]) {
    const accounts = accountStore.getAllAccounts(manager.editionId);
    const active = manager.getActiveAccount();
    if (accounts.length === 0 && active) {
      accountStore.addAccount({
        tool: manager.editionId,
        email: '',
        name: active.name,
        tier: active.tier,
        isCurrent: true,
        customLabel: `${manager.edition.name} 已登录会话`,
        deviceProfile: active.deviceProfile
      });
      console.log(`[Init] Auto-discovered local ${manager.edition.name} profile.`);
    } else if (manager.editionId === 'workbuddy' && active) {
      const stale = accounts.find(account => account.isCurrent && /^WorkBuddy AI/.test(account.name));
      if (stale) {
        accountStore.updateAccount(stale.id, { name: active.name, tier: active.tier });
      }
    }
  }

  const agyAccounts = accountStore.getAllAccounts('antigravity');
  if (agyAccounts.length === 0) {
    const agyProfile = agyMgr.getDeviceProfile();
    accountStore.addAccount({
      tool: 'antigravity',
      email: 'antigravity-primary@local',
      name: 'Antigravity 本地默认',
      tier: 'Unknown',
      isCurrent: true,
      customLabel: 'Antigravity IDE 活跃凭据',
      deviceProfile: agyProfile
    });
  }
})();

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

function serveStatic(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

async function getWorkBuddyStatus(manager) {
  const info = manager.detectInstallation();
  const running = await manager.isProcessRunning();
  const deviceProfile = manager.getDeviceProfile();
  const auth = manager.getAuthState();
  const active = manager.getActiveAccount();
  const snapshot = await workBuddyStatusCaches.get(manager.editionId)
    .get(() => manager.getRealAccountDetails());
  const real = snapshot.value;
  const error = snapshot.error;
  if (error && lastWorkBuddyWarnings.get(manager.editionId) !== error) {
    lastWorkBuddyWarnings.set(manager.editionId, error);
    console.warn(`[Server] Error fetching real ${manager.edition.name} account:`, error);
  } else if (!error) {
    lastWorkBuddyWarnings.delete(manager.editionId);
  }
  const storedAccount = accountStore.getActiveAccount(manager.editionId);
  const today = new Date().toISOString().slice(0, 10);
  const storedCheckin = storedAccount?.checkin?.lastCheckinDate === today
    ? { ...storedAccount.checkin, checkedIn: true }
    : null;
  if (real && storedAccount) {
    const nextCheckin = {
      checkedIn: real.checkin.checkedIn,
      active: real.checkin.active,
      todayCredit: real.checkin.todayCredit,
      streakDays: real.checkin.streakDays,
      lastCheckinDate: real.checkin.checkedIn ? today : null,
      isRealApi: true
    };
    if (JSON.stringify(storedAccount.credits) !== JSON.stringify(real.credits)
      || JSON.stringify(storedAccount.checkin) !== JSON.stringify(nextCheckin)) {
      accountStore.updateAccount(storedAccount.id, {
        name: real.name,
        tier: real.tier,
        credits: real.credits,
        checkin: nextCheckin
      });
    }
  }
  return {
    editionId: manager.editionId,
    edition: manager.edition.name,
    installed: info.installed,
    info,
    running,
    auth,
    deviceProfile,
    activeAccount: auth.compatible ? (real || active) : null,
    storedAccount,
    customModels: sanitizeCustomModels(manager.getCustomModels()),
    promotions: real?.promotions || manager.getPromotions(),
    freeModels: real?.freeModels || manager.getFreeModelOffers(),
    credits: auth.compatible
      ? (real?.credits || storedAccount?.credits || { available: false, points: null, total: null, used: null })
      : { available: false, points: null, total: null, used: null },
    checkin: manager.editionId === 'workbuddy-ai'
      ? { supported: false, available: false, checkedIn: false, active: false }
      : (real?.checkin || storedCheckin || { available: false, checkedIn: false, active: false }),
    stale: auth.compatible && (snapshot.stale || Boolean(error && (real || storedAccount?.credits))),
    error
  };
}

const server = http.createServer(async (req, res) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // -------------------------------------------------------------
  // 1. OpenAI-Compatible API Gateway Routes (/v1/...)
  // -------------------------------------------------------------
  if (pathname === '/v1/models' && req.method === 'GET') {
    const models = await fetchAllModelsCatalog();
    return sendJson(res, 200, { object: 'list', data: models });
  }

  if (pathname === '/v1/chat/completions' && req.method === 'POST') {
    const body = await parseBody(req);
    if (isDomesticCustomModel(body.model, body.isCustomModel)) {
      return proxyGateway.forwardRequest(req, res, '/v1/chat/completions', body);
    }

    const rawTools = Array.isArray(body.tools) ? body.tools
      : (Array.isArray(body.functions) ? body.functions.map(fn => ({ type: 'function', function: fn })) : null);
    const rawToolChoice = body.tool_choice || (body.function_call ? (
      typeof body.function_call === 'string' ? body.function_call : { type: 'function', function: body.function_call }
    ) : null);

    const targetModel = (body.model || 'default-1.2').replace(/^(?:workbuddy-ai|workbuddy):/, '');
    const isWbAi = body.sourceEdition === 'workbuddy-ai'
      || (typeof body.model === 'string' && (
           body.model.startsWith('workbuddy-ai:')
           || wbAiMgr.getOfficialModels().some(m => m.id === targetModel)
         ));
    const targetMgr = isWbAi ? wbAiMgr : wbMgr;

    const allowTools = Array.isArray(rawTools) && rawTools.length > 0 && rawToolChoice !== 'none';
    const { prompt, systemPrompt } = formatChatMessages(body.messages, rawTools, rawToolChoice);

    const result = await targetMgr.testModel(targetModel, prompt, {
      systemPrompt,
      stream: false,
      max_tokens: body.max_tokens,
      temperature: body.temperature,
      timeout: 60000
    });

    proxyGateway.logRequest({
      model: body.model,
      stream: Boolean(body.stream),
      durationMs: result.durationMs,
      status: result.status,
      error: result.success ? null : result.error,
      clientIp: req.socket.remoteAddress || '127.0.0.1'
    });

    if (!result.success) {
      const status = result.status >= 400 && result.status < 600 ? result.status : 502;
      return sendJson(res, status, { error: { message: result.error, type: 'workbuddy_cli_error' } });
    }

    const parsed = parseToolCallsAndContent(result.content, rawTools, { allowTools });

    if (!allowTools && parsed.hasToolCallsWhenDisabled) {
      return sendJson(res, 502, {
        error: {
          message: 'Model attempted tool call but no tools were provided or enabled in request',
          type: 'tools_not_enabled'
        }
      });
    }

    if (parsed.hasUnknownTool) {
      return sendJson(res, 502, {
        error: {
          message: `Model attempted to call undeclared tool: ${parsed.unknownToolName}`,
          type: 'unsupported_tool_call_format'
        }
      });
    }

    if (parsed.isMalformed) {
      return sendJson(res, 502, {
        error: {
          message: parsed.malformedReason || 'Model produced unsupported or malformed tool call markup',
          type: 'unsupported_tool_call_format'
        }
      });
    }

    const id = `chatcmpl-${Date.now()}`;
    if (body.stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      const chunks = buildChatCompletionStreamChunks(id, body.model, parsed);
      for (const chunk of chunks) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      return res.end('data: [DONE]\n\n');
    }

    const response = buildChatCompletionResponse(id, body.model, parsed);
    return sendJson(res, 200, response);
  }

  // -------------------------------------------------------------
  // 2. REST API Endpoints for Dashboard
  // -------------------------------------------------------------

  // GET /api/status - Comprehensive System Health & Inspection
  if (pathname === '/api/status' && req.method === 'GET') {
    const traeEditions = traeMgr.detectInstallations();
    const traeRunning = await traeMgr.isProcessRunning();
    const traeDevice = traeMgr.getDeviceProfile();
    const traeActiveAccount = traeMgr.getActiveAccount();
    let traeReal = null;
    try {
      traeReal = await traeMgr.getRealAccountDetails();
    } catch (e) {
      console.warn('[Server] Error fetching real Trae account:', e.message);
    }

    const agyTargets = agyMgr.detectInstallations();
    const agyRunning = await agyMgr.isProcessRunning();
    const agyDevice = agyMgr.getDeviceProfile();
    const agySnapshot = await antigravityStatusCache.get(() => agyMgr.getRealAccountDetails());
    const agyReal = agySnapshot.value;
    const agyError = agySnapshot.error;
    if (agyError && agyError !== lastAntigravityWarning) {
      lastAntigravityWarning = agyError;
      console.warn('[Server] Error fetching real Antigravity quota:', agyError);
    } else if (!agyError) {
      lastAntigravityWarning = null;
    }

    const [wbAiStatus, wbStatus] = await Promise.all([
      getWorkBuddyStatus(wbAiMgr),
      getWorkBuddyStatus(wbMgr)
    ]);

    const [cursorRunning, windsurfRunning, vscodeRunning] = await Promise.all([
      cursorMgr.isProcessRunning(),
      windsurfMgr.isProcessRunning(),
      vscodeMgr.isProcessRunning()
    ]);
    const cursorInfo = cursorMgr.detectInstallation();
    const windsurfInfo = windsurfMgr.detectInstallation();
    const vscodeInfo = vscodeMgr.detectInstallation();

    const cursorAccount = cursorMgr.getActiveAccount();
    const windsurfAccount = windsurfMgr.getActiveAccount();
    const vscodeAccount = vscodeMgr.getActiveAccount();

    const cursorStored = accountStore.getActiveAccount('cursor');
    const windsurfStored = accountStore.getActiveAccount('windsurf');
    const vscodeStored = accountStore.getActiveAccount('vscode');

    const metrics = proxyGateway.getMetrics();
    const models = await fetchAllModelsCatalog();

    const traeStored = accountStore.getActiveAccount('trae');
    return sendJson(res, 200, {
      service: 'antigravity-trae-manager',
      version: '1.0.0',
      trae: {
        installed: traeEditions.some(e => e.installed),
        editions: traeEditions,
        running: traeRunning,
        deviceProfile: traeDevice,
        activeAccount: traeReal || traeActiveAccount,
        storedAccount: traeStored,
        realApi: Boolean(traeReal?.liveCheckin?.success),
        credits: {
          available: false,
          points: null,
          total: null,
          reason: 'Trae 当前接口只返回签到奖励与活动条件，不返回账户剩余额度'
        },
        checkin: {
          available: Boolean(traeReal?.liveCheckin?.success),
          checkedIn: Boolean(traeReal?.liveCheckin?.checkedIn),
          credits: traeReal?.liveCheckin?.credits ?? null,
          extraCredits: traeReal?.liveCheckin?.extraCredits ?? null,
          totalCredits: traeReal?.liveCheckin?.credits ?? null,
          error: traeReal?.liveCheckin?.success === false ? traeReal.liveCheckin.error : null
        },
        activities: traeReal?.activities || []
      },
      workbuddyAi: wbAiStatus,
      workbuddy: wbStatus,
      antigravity: {
        installed: agyTargets.some(t => t.configExists || t.installed),
        targets: agyTargets,
        running: agyRunning,
        deviceProfile: agyDevice,
        activeAccount: agyReal,
        quota: agyReal ? {
          models: agyReal.models,
          groups: agyReal.quotaGroups,
          lowestRemainingPercent: agyReal.lowestRemainingPercent
        } : null,
        checkin: { supported: false },
        stale: agySnapshot.stale,
        error: agyError
      },
      cursor: {
        installed: cursorInfo.installed,
        info: cursorInfo,
        running: cursorRunning,
        deviceProfile: cursorMgr.getDeviceProfile(),
        activeAccount: cursorAccount,
        storedAccount: cursorStored,
        checkin: { supported: false }
      },
      windsurf: {
        installed: windsurfInfo.installed,
        info: windsurfInfo,
        running: windsurfRunning,
        deviceProfile: windsurfMgr.getDeviceProfile(),
        activeAccount: windsurfAccount,
        storedAccount: windsurfStored,
        checkin: { supported: false }
      },
      vscode: {
        installed: vscodeInfo.installed,
        info: vscodeInfo,
        running: vscodeRunning,
        deviceProfile: vscodeMgr.getDeviceProfile(),
        activeAccount: vscodeAccount,
        storedAccount: vscodeStored,
        checkin: { supported: false }
      },
      gateway: {
        port: PORT,
        endpoint: `http://${HOST}:${PORT}/v1`,
        metrics,
        availableModelsCount: models.length
      }
    });
  }

  // GET /api/accounts - List Accounts
  if (pathname === '/api/accounts' && req.method === 'GET') {
    const tool = parsedUrl.searchParams.get('tool');
    const accounts = accountStore.getAllAccounts(tool);
    return sendJson(res, 200, { accounts });
  }

  // POST /api/accounts - Add Account
  if (pathname === '/api/accounts' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.deviceProfile) {
      body.deviceProfile = generateDeviceProfile();
    }
    const newAcc = accountStore.addAccount(body);
    return sendJson(res, 201, { success: true, account: newAcc });
  }

  // PUT /api/accounts/:id - Update Account
  if (pathname.startsWith('/api/accounts/') && req.method === 'PUT') {
    const id = pathname.split('/')[3];
    const body = await parseBody(req);
    try {
      const updated = accountStore.updateAccount(id, body);
      return sendJson(res, 200, { success: true, account: updated });
    } catch (e) {
      return sendJson(res, 404, { error: e.message });
    }
  }

  // DELETE /api/accounts/:id - Delete Account
  if (pathname.startsWith('/api/accounts/') && req.method === 'DELETE') {
    const id = pathname.split('/')[3];
    const ok = accountStore.deleteAccount(id);
    return sendJson(res, 200, { success: ok });
  }

  // POST /api/accounts/:id/switch - One-Click Switch Account
  if (pathname.match(/^\/api\/accounts\/[^/]+\/switch$/) && req.method === 'POST') {
    const id = pathname.split('/')[3];
    const account = accountStore.getAccountById(id);
    if (!account) return sendJson(res, 404, { error: 'Account not found' });

    const body = await parseBody(req);
    const autoRestart = body.autoRestart !== false;

    if (account.tool === 'trae') {
      const isRunning = await traeMgr.isProcessRunning();
      if (isRunning) {
        await traeMgr.closeProcess();
        await new Promise(r => setTimeout(r, 1000));
      }

      // 1. Apply device profile to Trae
      if (account.deviceProfile) {
        traeMgr.setDeviceProfile(account.deviceProfile);
      }

      // 2. Try applying snapshot if exists
      try {
        traeMgr.applyAccountSnapshot(account.id);
      } catch (e) {
        // Snapshot may not exist if manually added
      }

      accountStore.setActiveAccount(id);

      // 3. Restart Trae if requested
      let launched = null;
      if (autoRestart) {
        try {
          launched = traeMgr.launch();
        } catch (e) {}
      }

      return sendJson(res, 200, {
        success: true,
        message: `Successfully switched to Trae account: ${account.name}`,
        account,
        launched
      });
    }

    if (account.tool === 'antigravity') {
      try {
        agyMgr.applyAccountSnapshot(account.id);
      } catch (e) {}
      if (account.deviceProfile) {
        agyMgr.setDeviceProfile(account.deviceProfile);
      }
      accountStore.setActiveAccount(id);
      return sendJson(res, 200, {
        success: true,
        message: `已切换并应用 Antigravity 档案：${account.name}`,
        account
      });
    }

    if (account.tool === 'workbuddy' || account.tool === 'workbuddy-ai') {
      const manager = account.tool === 'workbuddy-ai' ? wbAiMgr : wbMgr;
      try {
        manager.applyAccountSnapshot(account.id);
      } catch (e) {}
      if (account.deviceProfile) {
        manager.setDeviceProfile(account.deviceProfile);
      }
      accountStore.setActiveAccount(id);
      return sendJson(res, 200, {
        success: true,
        message: `已切换并应用 ${manager.edition.name} 档案：${account.name}`,
        account
      });
    }

    if (extraIdes.has(account.tool)) {
      const manager = extraIdes.get(account.tool);
      try {
        manager.applyAccountSnapshot(account.id);
      } catch (e) {}
      if (account.deviceProfile) {
        manager.setDeviceProfile(account.deviceProfile);
      }
      accountStore.setActiveAccount(id);
      return sendJson(res, 200, {
        success: true,
        message: `已切换并应用 ${manager.name} 档案：${account.name}`,
        account
      });
    }

    return sendJson(res, 400, { error: 'Unknown tool type' });
  }

  // Dynamic REST endpoints for extra IDEs (cursor, windsurf, vscode)
  const extraIdeAction = pathname.match(/^\/api\/(cursor|windsurf|vscode)\/(launch|close|launch-isolated|reset-machine-id|snapshot)$/);
  if (extraIdeAction && req.method === 'POST') {
    const ideKey = extraIdeAction[1];
    const action = extraIdeAction[2];
    const manager = extraIdes.get(ideKey);

    if (action === 'launch') {
      try {
        const resLaunch = manager.launch();
        return sendJson(res, 200, { success: true, ...resLaunch });
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }

    if (action === 'close') {
      await manager.closeProcess();
      return sendJson(res, 200, { success: true });
    }

    if (action === 'launch-isolated') {
      const body = await parseBody(req);
      const instanceId = body.instanceId || `${ideKey}_sandbox_` + Date.now().toString(36);
      try {
        const resLaunch = manager.launchIsolated(instanceId);
        return sendJson(res, 200, {
          success: true,
          message: `${manager.name} 多开隔离沙箱启动成功`,
          ...resLaunch
        });
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }

    if (action === 'reset-machine-id') {
      const isRunning = await manager.isProcessRunning();
      if (isRunning) {
        await manager.closeProcess();
        await new Promise(r => setTimeout(r, 800));
      }
      const resProfile = manager.resetDeviceProfile();
      return sendJson(res, 200, {
        success: true,
        message: `${manager.name} 设备指纹已成功重置`,
        profile: resProfile.profile
      });
    }

    if (action === 'snapshot') {
      const body = await parseBody(req);
      const customName = body.name || `${manager.name} 备份 (${new Date().toLocaleTimeString()})`;
      const id = `acc_${ideKey}_` + Date.now().toString(36);

      const meta = manager.saveAccountSnapshot(id, customName);
      const active = manager.getActiveAccount();

      const account = accountStore.addAccount({
        id,
        tool: ideKey,
        email: active?.email || `${id}@${ideKey}.local`,
        name: customName,
        tier: active?.tier || 'Free',
        credits: { general: 0, work: 0 },
        isCurrent: true,
        customLabel: '实时快照创建',
        deviceProfile: meta.deviceProfile
      });

      return sendJson(res, 200, { success: true, account });
    }
  }

  // POST /api/trae/snapshot - Snapshot current running Trae as an account
  if (pathname === '/api/trae/snapshot' && req.method === 'POST') {
    const body = await parseBody(req);
    const customName = body.name || `Trae 备份 (${new Date().toLocaleTimeString()})`;
    const id = 'acc_trae_' + Date.now().toString(36);

    const meta = traeMgr.saveAccountSnapshot(id, customName);
    const active = traeMgr.getActiveAccount();

    const account = accountStore.addAccount({
      id,
      tool: 'trae',
      email: active && active.userId ? `${active.userId}@trae.solo` : 'snapshot@trae.solo',
      name: customName,
      tier: active ? active.tier : 'Free',
      credits: active ? { general: active.generalCredits, work: active.workCredits } : { general: 0, work: 0 },
      isCurrent: true,
      customLabel: '实时快照创建',
      deviceProfile: meta.deviceProfile
    });

    return sendJson(res, 200, { success: true, account });
  }

  // POST /api/workbuddy/snapshot or /api/workbuddy-ai/snapshot
  if ((pathname === '/api/workbuddy/snapshot' || pathname === '/api/workbuddy-ai/snapshot') && req.method === 'POST') {
    const editionId = pathname.includes('workbuddy-ai') ? 'workbuddy-ai' : 'workbuddy';
    const manager = editionId === 'workbuddy-ai' ? wbAiMgr : wbMgr;
    const body = await parseBody(req);
    const customName = body.name || `${manager.edition.name} 备份 (${new Date().toLocaleTimeString()})`;
    const id = `acc_${editionId}_` + Date.now().toString(36);

    const meta = manager.saveAccountSnapshot(id, customName);
    const active = manager.getActiveAccount();

    const account = accountStore.addAccount({
      id,
      tool: editionId,
      email: active?.userId ? `${active.userId}@workbuddy` : `${editionId}@local`,
      name: customName,
      tier: 'personal',
      credits: 0,
      isCurrent: true,
      customLabel: '实时快照创建',
      deviceProfile: meta.deviceProfile
    });

    return sendJson(res, 200, { success: true, account });
  }

  // POST /api/antigravity/snapshot
  if (pathname === '/api/antigravity/snapshot' && req.method === 'POST') {
    const body = await parseBody(req);
    const customName = body.name || `Antigravity 备份 (${new Date().toLocaleTimeString()})`;
    const id = 'acc_agy_' + Date.now().toString(36);

    const meta = agyMgr.saveAccountSnapshot(id, customName);
    const details = await agyMgr.getRealAccountDetails().catch(() => null);

    const account = accountStore.addAccount({
      id,
      tool: 'antigravity',
      email: details?.email || `${id}@antigravity.google`,
      name: customName,
      tier: details?.tier || 'Free',
      credits: 0,
      isCurrent: true,
      customLabel: '实时快照创建',
      deviceProfile: meta.deviceProfile
    });

    return sendJson(res, 200, { success: true, account });
  }

  // POST /api/trae/reset-machine-id - One-Click Randomize Trae Machine Code
  if (pathname === '/api/trae/reset-machine-id' && req.method === 'POST') {
    const isRunning = await traeMgr.isProcessRunning();
    if (isRunning) {
      await traeMgr.closeProcess();
      await new Promise(r => setTimeout(r, 800));
    }

    const resProfile = traeMgr.resetDeviceProfile();
    return sendJson(res, 200, {
      success: true,
      message: 'Trae machine ID and telemetry profile successfully randomized',
      profile: resProfile.profile
    });
  }

  // POST /api/antigravity/reset-machine-id - One-Click Randomize Antigravity Machine Code
  if (pathname === '/api/antigravity/reset-machine-id' && req.method === 'POST') {
    const resProfile = agyMgr.resetDeviceProfile();
    return sendJson(res, 200, {
      success: true,
      message: 'Antigravity device profile successfully randomized',
      profile: resProfile.profile
    });
  }

  // POST /api/trae/launch - Launch Trae normally
  if (pathname === '/api/trae/launch' && req.method === 'POST') {
    try {
      const resLaunch = traeMgr.launch();
      return sendJson(res, 200, { success: true, ...resLaunch });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // POST /api/trae/launch-isolated - Launch Trae Multi-Instance Sandbox
  if (pathname === '/api/trae/launch-isolated' && req.method === 'POST') {
    const body = await parseBody(req);
    const instanceId = body.instanceId || 'instance_' + Date.now().toString(36);
    try {
      const resLaunch = traeMgr.launchIsolated(instanceId);
      return sendJson(res, 200, {
        success: true,
        message: `Multi-instance sandbox launched successfully for ${instanceId}`,
        ...resLaunch
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // POST /api/workbuddy/launch-isolated or /api/workbuddy-ai/launch-isolated
  if ((pathname === '/api/workbuddy/launch-isolated' || pathname === '/api/workbuddy-ai/launch-isolated') && req.method === 'POST') {
    const editionId = pathname.includes('workbuddy-ai') ? 'workbuddy-ai' : 'workbuddy';
    const manager = editionId === 'workbuddy-ai' ? wbAiMgr : wbMgr;
    const body = await parseBody(req);
    const instanceId = body.instanceId || 'wb_sandbox_' + Date.now().toString(36);
    try {
      const resLaunch = manager.launchIsolated(instanceId);
      return sendJson(res, 200, {
        success: true,
        message: `${manager.edition.name} 多开隔离沙箱启动成功`,
        ...resLaunch
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // POST /api/antigravity/launch-isolated
  if (pathname === '/api/antigravity/launch-isolated' && req.method === 'POST') {
    const body = await parseBody(req);
    const instanceId = body.instanceId || 'agy_sandbox_' + Date.now().toString(36);
    try {
      const resLaunch = agyMgr.launchIsolated(instanceId);
      return sendJson(res, 200, {
        success: true,
        message: 'Antigravity 多开隔离沙箱启动成功',
        ...resLaunch
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // POST /api/trae/close - Close Trae
  if (pathname === '/api/trae/close' && req.method === 'POST') {
    await traeMgr.closeProcess();
    return sendJson(res, 200, { success: true });
  }

  // POST /api/antigravity/launch - Launch Antigravity
  if (pathname === '/api/antigravity/launch' && req.method === 'POST') {
    try {
      const resLaunch = agyMgr.launch();
      return sendJson(res, 200, { success: true, ...resLaunch });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // POST /api/antigravity/close - Close Antigravity
  if (pathname === '/api/antigravity/close' && req.method === 'POST') {
    await agyMgr.closeProcess();
    return sendJson(res, 200, { success: true });
  }

  // POST /api/checkin/all - Check in every supported IDE, skip unavailable ones
  if (pathname === '/api/checkin/all' && req.method === 'POST') {
    try {
      const result = await accountStore.checkinAll({ traeMgr, wbAiMgr, wbMgr, agyMgr });
      return sendJson(res, 200, result);
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // POST /api/checkin - Daily check-in / claim points for one platform via real APIs
  if (pathname === '/api/checkin' && req.method === 'POST') {
    const body = await parseBody(req);
    const tool = body.tool || 'trae';
    try {
      const result = await accountStore.checkin(tool, { traeMgr, wbAiMgr, wbMgr, agyMgr });
      return sendJson(res, 200, result);
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  const workBuddyAction = pathname.match(/^\/api\/(workbuddy(?:-ai)?)\/(reset-device-id|repair-auth|launch|close)$/);
  if (workBuddyAction && req.method === 'POST') {
    const manager = workBuddyAction[1] === 'workbuddy-ai' ? wbAiMgr : wbMgr;
    const action = workBuddyAction[2];
    if (action === 'repair-auth') {
      try {
        if (await manager.isProcessRunning()) {
          await manager.closeProcess();
          await new Promise(r => setTimeout(r, 800));
        }
        const repair = manager.backupIncompatibleAuth();
        workBuddyStatusCaches.get(manager.editionId).invalidate();
        const launched = manager.launch();
        return sendJson(res, 200, {
          success: true,
          repaired: repair.repaired,
          backupFile: repair.backupPath ? path.basename(repair.backupPath) : null,
          pid: launched.pid,
          message: repair.repaired
            ? `错误的跨区登录态已备份并隔离，请在已打开的${manager.edition.name}客户端重新登录`
            : `未发现需要隔离的跨区会话，已打开${manager.edition.name}客户端`
        });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }
    if (action === 'reset-device-id') {
      if (await manager.isProcessRunning()) {
        await manager.closeProcess();
        await new Promise(r => setTimeout(r, 800));
      }
      const resProfile = manager.resetDeviceProfile();
      return sendJson(res, 200, {
        success: true,
        message: `${manager.edition.name} device ID and Qimei signature successfully randomized`,
        profile: resProfile.profile
      });
    }
    if (action === 'launch') {
      try {
        return sendJson(res, 200, { success: true, ...manager.launch() });
      } catch (err) {
        return sendJson(res, manager.getAuthState().repairAvailable ? 409 : 500, {
          success: false,
          error: err.message
        });
      }
    }
    await manager.closeProcess();
    return sendJson(res, 200, { success: true });
  }

  // GET /api/workbuddy/models - List Custom Models
  if (pathname === '/api/workbuddy/models' && req.method === 'GET') {
    const list = sanitizeCustomModels(wbMgr.getCustomModels());
    return sendJson(res, 200, { models: list });
  }

  // POST /api/workbuddy/models - Add Custom Model
  if (pathname === '/api/workbuddy/models' && req.method === 'POST') {
    const body = await parseBody(req);
    const updated = wbMgr.addCustomModel(body);
    return sendJson(res, 200, { success: true, models: sanitizeCustomModels(updated) });
  }

  // DELETE /api/workbuddy/models/:id - Delete Custom Model
  if (pathname.startsWith('/api/workbuddy/models/') && req.method === 'DELETE') {
    const modelId = decodeURIComponent(pathname.split('/')[4]);
    const updated = wbMgr.deleteCustomModel(modelId);
    return sendJson(res, 200, { success: true, models: sanitizeCustomModels(updated) });
  }

  // GET /api/proxy/trae-config - Trae Custom Model Config
  if (pathname === '/api/proxy/trae-config' && req.method === 'GET') {
    const config = proxyGateway.generateTraeConfig(PORT);
    return sendJson(res, 200, config);
  }

  // GET /api/proxy/metrics - Live Metrics and Logs
  if (pathname === '/api/proxy/metrics' && req.method === 'GET') {
    const metrics = proxyGateway.getMetrics();
    return sendJson(res, 200, metrics);
  }

  // GET /api/models - List Models from Proxy
  if (pathname === '/api/models' && req.method === 'GET') {
    const models = await fetchAllModelsCatalog();
    return sendJson(res, 200, { models });
  }

  // POST /api/test/single - Test a single model
  if (pathname === '/api/test/single' && req.method === 'POST') {
    const body = await parseBody(req);
    const modelId = body.model || 'deepseek-v4-pro';
    const prompt = body.prompt || 'Say OK in one word.';
    const options = {
      stream: Boolean(body.stream),
      max_tokens: body.max_tokens || 256,
      temperature: body.temperature !== undefined ? body.temperature : 0.5,
      timeout: body.timeout || 35000
    };
    const result = body.sourceEdition === 'workbuddy-ai'
      ? await wbAiMgr.testModel(modelId, prompt, options)
      : (isDomesticCustomModel(modelId, body.isCustomModel)
        ? await proxyGateway.testModel(modelId, prompt, options)
        : await wbMgr.testModel(modelId, prompt, options));
    return sendJson(res, 200, result);
  }

  // POST /api/test/batch - Batch test multiple models
  if (pathname === '/api/test/batch' && req.method === 'POST') {
    const body = await parseBody(req);
    let models = body.models;
    if (!Array.isArray(models) || models.length === 0) {
      models = [
        'deepseek-v4-pro',
        'default-1.2',
        'deepseek-r1-0528',
        'deepseek-v3-0324',
        'hunyuan-2.0-instruct',
        'claude-sonnet-5',
        'grok-4.6'
      ];
    }
    const prompt = body.prompt || 'Say OK in one word.';
    const concurrency = Math.min(parseInt(body.concurrency || '2', 10), 4);
    const hasCustomModel = models.some(modelId => isDomesticCustomModel(modelId));
    const result = hasCustomModel
      ? await proxyGateway.testBatch(models, prompt, concurrency)
      : await testDomesticBatch(models, prompt, concurrency);
    return sendJson(res, 200, result);
  }

  // -------------------------------------------------------------
  // 3. Static Web Dashboard
  // -------------------------------------------------------------
  const publicDir = path.join(__dirname, 'public');

  if (pathname === '/' || pathname === '/index.html') {
    return serveStatic(res, path.join(publicDir, 'index.html'), 'text/html; charset=utf-8');
  }
  if (pathname === '/style.css') {
    return serveStatic(res, path.join(publicDir, 'style.css'), 'text/css; charset=utf-8');
  }
  if (pathname === '/app.js') {
    return serveStatic(res, path.join(publicDir, 'app.js'), 'application/javascript; charset=utf-8');
  }

  sendJson(res, 404, { error: 'Not Found' });
});

function openDashboard(url) {
  if (process.env.OPEN_BROWSER !== '1' || process.platform !== 'win32') return;
  const child = spawn('cmd.exe', ['/d', '/s', '/c', `start "" "${url}"`], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();
}

listenWithPortFallback(server, {
  host: HOST,
  startPort: START_PORT,
  maxAttempts: 100,
  onRetry: (occupiedPort, nextPort) => {
    console.warn(`[Startup] Port ${occupiedPort} is occupied; trying ${nextPort}...`);
  }
}).then(selectedPort => {
  PORT = selectedPort;
  console.log('===============================================================');
  console.log('  🚀 AI-IDE-Manager (Antigravity & Trae Multi-Account Gateway)');
  console.log('===============================================================');
  console.log(`  🌐 Dashboard Web UI : http://${HOST}:${PORT}`);
  console.log(`  🔌 OpenAI API Gateway: http://${HOST}:${PORT}/v1`);
  console.log(`  🛸 Antigravity Mgmt  : Ready`);
  console.log(`  ⚡ Trae Integration  : Ready (Solo CN & Global)`);
  console.log('===============================================================');
  openDashboard(`http://${HOST}:${PORT}`);
}).catch(error => {
  console.error(`[Startup] Unable to bind a port: ${error.message}`);
  process.exitCode = 1;
});
