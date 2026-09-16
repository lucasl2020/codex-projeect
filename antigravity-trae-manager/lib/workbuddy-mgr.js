const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');
const { generateUuidV4 } = require('./device-spoofer');

const EDITIONS = {
  'workbuddy-ai': {
    name: 'WorkBuddy AI（国际版）',
    dataFolder: '.workbuddy-ai',
    authFile: 'workbuddy-desktop-ai.info',
    endpoint: 'https://www.workbuddy.ai',
    defaultExe: 'D:\\devloop-tools\\workbuddyai\\WorkBuddyAI.exe',
    cliPath: 'D:\\devloop-tools\\workbuddyai\\resources\\app.asar.unpacked\\cli\\bin\\codebuddy',
    processName: 'WorkBuddyAI.exe'
  },
  workbuddy: {
    name: 'WorkBuddy（国内版）',
    dataFolder: '.workbuddy',
    authFile: 'workbuddy-desktop.info',
    endpoint: 'https://copilot.tencent.com',
    defaultExe: 'D:\\devloop-tools\\WorkBuddy\\WorkBuddy.exe',
    cliPath: 'D:\\devloop-tools\\WorkBuddy\\resources\\app.asar.unpacked\\cli\\bin\\codebuddy',
    processName: 'WorkBuddy.exe'
  }
};

class WorkBuddyManager {
  constructor(options = {}) {
    this.editionId = options.editionId || 'workbuddy-ai';
    this.edition = EDITIONS[this.editionId];
    if (!this.edition) throw new Error(`未知 WorkBuddy 版本: ${this.editionId}`);
    this.userProfile = options.userProfile || process.env.USERPROFILE || 'C:\\Users\\Administrator';
    this.localAppData = options.localAppData || process.env.LOCALAPPDATA || '';
    this.workbuddyDir = options.workbuddyDir || path.join(this.userProfile, this.edition.dataFolder);
    this.authUserProfile = options.authUserProfile || (options.authLocalAppData || options.localAppData
      ? this.userProfile
      : path.join(this.workbuddyDir, 'isolated-userprofile'));
    this.authLocalAppData = options.authLocalAppData || (options.localAppData
      ? this.localAppData
      : path.join(this.authUserProfile, 'AppData', 'Local'));
    this.baseDir = options.baseDir || path.join(__dirname, '..');
    this.profilesDir = path.join(this.baseDir, 'data', `${this.editionId}-profiles`);
    this.endpoint = options.endpoint || this.edition.endpoint;
    this.fetchImpl = options.fetchImpl || global.fetch;
    this.spawnImpl = options.spawnImpl || spawn;

    if (!fs.existsSync(this.profilesDir)) {
      fs.mkdirSync(this.profilesDir, { recursive: true });
    }
    this.initializeAuthIsolation();
  }

  /**
   * Detect installed WorkBuddy
   */
  detectInstallation() {
    const altFolder = this.editionId === 'workbuddy-ai' ? 'WorkBuddyAI' : 'WorkBuddy';
    const altExe = path.join(this.localAppData, 'Programs', altFolder, this.edition.processName);
    const exe = fs.existsSync(this.edition.defaultExe)
      ? this.edition.defaultExe
      : (fs.existsSync(altExe) ? altExe : this.edition.defaultExe);

    return {
      id: this.editionId,
      name: this.edition.name,
      exe,
      installed: fs.existsSync(exe),
      cliPath: this.edition.cliPath,
      cliExists: fs.existsSync(this.edition.cliPath),
      configDir: this.workbuddyDir,
      configExists: fs.existsSync(this.workbuddyDir),
      processName: this.edition.processName
    };
  }

  /**
   * Get device profile (device-id, qimei, owner UID)
   */
  getDeviceProfile() {
    const deviceIdFile = path.join(this.workbuddyDir, 'device-id');
    const qimeiFile = path.join(this.workbuddyDir, 'qimei-cache.json');
    const settingsFile = path.join(this.workbuddyDir, 'settings.json');

    let deviceId = null;
    let qimei36 = null;
    let ownerUid = null;

    try {
      if (fs.existsSync(deviceIdFile)) {
        deviceId = fs.readFileSync(deviceIdFile, 'utf8').trim();
      }
      if (fs.existsSync(qimeiFile)) {
        const qData = JSON.parse(fs.readFileSync(qimeiFile, 'utf8'));
        qimei36 = qData.qimei36 || null;
      }
      if (fs.existsSync(settingsFile)) {
        const sData = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
        ownerUid = sData.claw?.legacyOwnerUid || null;
      }
    } catch (e) {
      console.warn(`[${this.edition.name}] Failed to read device profile:`, e.message);
    }

    return {
      device_id: deviceId,
      qimei36,
      owner_uid: ownerUid,
      exists: fs.existsSync(deviceIdFile) || fs.existsSync(qimeiFile)
    };
  }

  /**
   * Randomize / Reset device ID and Qimei
   */
  resetDeviceProfile() {
    const newDeviceId = generateUuidV4();
    // Generate a valid 36-char Tencent Qimei format (hexadecimal)
    const newQimei = crypto.randomBytes(18).toString('hex').toLowerCase();

    const deviceIdFile = path.join(this.workbuddyDir, 'device-id');
    const qimeiFile = path.join(this.workbuddyDir, 'qimei-cache.json');

    if (!fs.existsSync(this.workbuddyDir)) {
      fs.mkdirSync(this.workbuddyDir, { recursive: true });
    }

    if (fs.existsSync(deviceIdFile) && !fs.existsSync(deviceIdFile + '.prev.bak')) {
      try { fs.copyFileSync(deviceIdFile, deviceIdFile + '.prev.bak'); } catch (_) {}
    }
    if (fs.existsSync(qimeiFile) && !fs.existsSync(qimeiFile + '.prev.bak')) {
      try { fs.copyFileSync(qimeiFile, qimeiFile + '.prev.bak'); } catch (_) {}
    }

    fs.writeFileSync(deviceIdFile, newDeviceId, 'utf8');
    fs.writeFileSync(qimeiFile, JSON.stringify({ qimei36: newQimei }, null, 2), 'utf8');

    return {
      success: true,
      profile: {
        device_id: newDeviceId,
        qimei36: newQimei,
        reset_at: Date.now()
      }
    };
  }

  /**
   * Set specific device profile
   */
  setDeviceProfile(profile) {
    if (!profile) return;
    const deviceIdFile = path.join(this.workbuddyDir, 'device-id');
    const qimeiFile = path.join(this.workbuddyDir, 'qimei-cache.json');

    if (profile.device_id) {
      fs.writeFileSync(deviceIdFile, profile.device_id, 'utf8');
    }
    if (profile.qimei36) {
      fs.writeFileSync(qimeiFile, JSON.stringify({ qimei36: profile.qimei36 }, null, 2), 'utf8');
    }
    return { success: true };
  }

  /**
   * Get Active User Details
   */
  getActiveAccount() {
    const dev = this.getDeviceProfile();
    const session = this.getAuthSession();
    if (!session || this.getAuthCompatibilityError(session)) return null;
    const realName = session.account.nickname || null;

    return {
      tool: this.editionId,
      edition: this.edition.name,
      name: realName ? `${this.edition.name}（${realName}）` : this.edition.name,
      username: realName,
      userId: session.account.uid || null,
      ownerUid: session.account.uid || null,
      tier: session.account.type || null,
      endpoint: this.endpoint,
      deviceProfile: dev,
      lastUpdated: Date.now()
    };
  }

  getAuthSession() {
    const file = this.getAuthFilePath();
    return this.readAuthSession(file);
  }

  readAuthSession(file) {
    if (!fs.existsSync(file)) return null;
    try {
      const session = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (session?.auth?.accessToken && session?.account?.uid) return session;
    } catch (e) {
      console.warn(`[${this.edition.name}] Failed to read auth session:`, e.message);
    }
    return null;
  }

  getAuthFilePath() {
    return path.join(
      this.authLocalAppData,
      'CodeBuddyExtension',
      'Data',
      'Public',
      'auth',
      this.edition.authFile
    );
  }

  getSharedAuthFilePath() {
    return path.join(
      this.localAppData,
      'CodeBuddyExtension',
      'Data',
      'Public',
      'auth',
      this.edition.authFile
    );
  }

  initializeAuthIsolation() {
    const target = this.getAuthFilePath();
    const source = this.getSharedAuthFilePath();
    if (path.resolve(target) === path.resolve(source) || fs.existsSync(target)) return;
    const session = this.readAuthSession(source);
    if (!session || this.getAuthCompatibilityError(session)) return;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }

  getAuthRegion(domain) {
    const value = String(domain || '').toLowerCase();
    if (!value) return 'unknown';
    if (value.endsWith('.cn') || value.endsWith('copilot.tencent.com')) return 'domestic';
    if (value.endsWith('.ai') || value.endsWith('workbuddy.ai')) return 'international';
    return 'unknown';
  }

  getAuthCompatibilityError(session = this.getAuthSession()) {
    if (!session?.auth?.domain) return null;
    const domain = String(session.auth.domain).toLowerCase();
    const region = this.getAuthRegion(domain);
    if (this.editionId === 'workbuddy-ai' && region === 'domestic') {
      return `WorkBuddy AI（国际版）当前混入了国内版登录域名 ${domain}，请使用“一键修复国际版登录”后重新登录国际版账号`;
    }
    if (this.editionId === 'workbuddy' && region === 'international') {
      return `WorkBuddy（国内版）当前混入了国际版登录域名 ${domain}，请重新登录国内版账号`;
    }
    return null;
  }

  getAuthState() {
    const activeSession = this.getAuthSession();
    const session = activeSession || this.readAuthSession(this.getSharedAuthFilePath());
    if (!session) {
      return {
        present: false,
        compatible: false,
        domain: null,
        region: 'unknown',
        repairAvailable: false,
        error: null
      };
    }
    const domain = String(session.auth.domain || '').toLowerCase() || null;
    const error = this.getAuthCompatibilityError(session);
    return {
      present: true,
      compatible: !error,
      domain,
      region: this.getAuthRegion(domain),
      repairAvailable: Boolean(error),
      error
    };
  }

  backupIncompatibleAuth() {
    const activeSession = this.getAuthSession();
    const sharedSession = this.readAuthSession(this.getSharedAuthFilePath());
    const session = activeSession && this.getAuthCompatibilityError(activeSession)
      ? activeSession
      : sharedSession;
    const error = this.getAuthCompatibilityError(session);
    if (!error) return { repaired: false, error: null, backupPath: null };

    const authFile = session === activeSession ? this.getAuthFilePath() : this.getSharedAuthFilePath();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${authFile}.cross-region-${timestamp}.bak`;
    fs.renameSync(authFile, backupPath);
    return { repaired: true, error, backupPath };
  }

  getProductConfig() {
    try {
      const infoFile = path.join(this.workbuddyDir, 'local_storage', 'wb_entry_d43e96994f944cfb77961c2ea7d04605.info');
      const stored = JSON.parse(fs.readFileSync(infoFile, 'utf8'));
      return (Array.isArray(stored) ? stored[0]?.data : stored?.data) || {};
    } catch {
      return {};
    }
  }

  getPromotions() {
    const promotions = this.getProductConfig().modelPromotions || [];
    return promotions.map(p => ({
        id: p.id,
        label: p.badge?.label || '活动',
        models: p.modelIds || [],
        discount: p.discount?.discountedCredits || null,
        discountFactor: Number.isFinite(p.discount?.factor) ? p.discount.factor : null,
        isFree: Number.isFinite(p.discount?.factor)
          ? p.discount.factor === 0
          : /^0(?:\.0+)?x$/i.test(p.discount?.discountedCredits || ''),
        description: p.hover?.textZh || p.hover?.textEn || ''
    }));
  }

  getOfficialModels() {
    const models = this.getProductConfig().models || [];
    return models.filter(model => model?.id).map(model => ({
      ...model,
      object: 'model',
      owned_by: `${this.editionId}-official`,
      description: model.descriptionZh || model.descriptionEn || '',
      sourceEdition: this.editionId,
      catalogId: `${this.editionId}:${model.id}`
    }));
  }

  getCliNodePath() {
    const versionsDir = path.join(this.workbuddyDir, 'binaries', 'node', 'versions');
    try {
      const version = fs.readdirSync(versionsDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
        .map(entry => entry.name)
        .sort()
        .pop();
      const nodePath = version ? path.join(versionsDir, version, 'node.exe') : null;
      if (nodePath && fs.existsSync(nodePath)) return nodePath;
    } catch {}
    return process.execPath;
  }

  async testModel(modelId, prompt = 'Say OK in one word.', options = {}) {
    const startedAt = Date.now();
    const authCompatibilityError = this.getAuthCompatibilityError();
    if (authCompatibilityError) {
      return { success: false, model: modelId, status: 409, durationMs: 0, error: authCompatibilityError };
    }
    const cliPath = this.detectInstallation().cliPath;
    if (!fs.existsSync(cliPath)) {
      return { success: false, model: modelId, status: 503, durationMs: 0, error: `${this.edition.name} CLI 未安装` };
    }

    const args = [
      cliPath,
      '-p', prompt,
      '--model', modelId,
      '--tools=',
      '--no-session-persistence',
      '--output-format', 'json'
    ];
    if (options.systemPrompt) args.push('--system-prompt', options.systemPrompt);

    return new Promise(resolve => {
      let settled = false;
      let stdout = '';
      let stderr = '';
      const child = this.spawnImpl(this.getCliNodePath(), args, {
        windowsHide: true,
        env: {
          ...process.env,
          USERPROFILE: this.authUserProfile,
          HOME: this.authUserProfile,
          LOCALAPPDATA: this.authLocalAppData,
          ELECTRON_RUN_AS_NODE: '1'
        }
      });
      const finish = result => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ model: modelId, durationMs: Date.now() - startedAt, ...result });
      };
      const timer = setTimeout(() => {
        try { child.kill(); } catch {}
        finish({ success: false, status: 408, error: 'WorkBuddy CLI 请求超时' });
      }, options.timeout || 40000);

      child.stdout?.on('data', data => { stdout += data.toString(); });
      child.stderr?.on('data', data => { stderr += data.toString(); });
      child.on('error', error => finish({ success: false, status: 502, error: error.message }));
      child.on('close', code => {
        let content = '';
        let resultError = '';
        let parsedJson = false;
        try {
          const parsed = JSON.parse(stdout.trim());
          parsedJson = true;
          const items = Array.isArray(parsed)
            ? parsed
            : (parsed.history || parsed.messages || parsed.output || [parsed]);
          for (const item of items) {
            if (item.type === 'message' && item.role === 'assistant') {
              if (typeof item.content === 'string') content += item.content;
              if (Array.isArray(item.content)) {
                content += item.content
                  .filter(part => part.type === 'output_text' || part.type === 'text')
                  .map(part => part.text || '')
                  .join('');
              }
            } else if (item.type === 'result' && item.is_error) {
              resultError = String(item.result || item.error || 'WorkBuddy CLI 调用失败');
            } else if (item.type === 'result' && item.result && !content) {
              content = String(item.result);
            }
          }
        } catch {
          content = stdout.trim();
        }

        const cliWarningPattern = /The model repeatedly wrote tool calls as plain text instead of invoking the tools[\s\S]*?(?:very long\)\.|\n|$)/gi;
        content = content.replace(cliWarningPattern, '').trim();

        const diagnostic = [resultError, stderr.trim(), parsedJson && !content ? stdout.trim() : '']
          .filter(Boolean)
          .join('\n');
        if (/\b401\b|Authentication required|\/login command/i.test(diagnostic)) {
          finish({ success: false, status: 401, error: `${this.edition.name} 登录已失效，请在客户端或 CLI 重新登录后重试` });
          return;
        }
        if (code !== 0) {
          finish({ success: false, status: 500, error: stderr.trim() || `WorkBuddy CLI 退出码 ${code}` });
          return;
        }
        content = content.trim();
        if (!content) {
          finish({
            success: false,
            status: 502,
            error: stderr.trim() || `${this.edition.name} CLI 未返回模型正文，请确认客户端已登录后重试`
          });
          return;
        }
        finish({ success: true, status: 200, content, preview: content.slice(0, 120) });
      });
    });
  }

  getFreeModelOffers() {
    return this.getPromotions()
      .filter(promotion => promotion.isFree)
      .flatMap(promotion => promotion.models.map(modelId => ({
        modelId,
        label: promotion.label,
        description: promotion.description,
        promotionId: promotion.id
      })));
  }

  async requestOfficial(apiPath, session = this.getAuthSession()) {
    if (!session?.auth?.accessToken || !session?.account?.uid) {
      throw new Error(`未检测到 ${this.edition.name} 官方登录会话，请先在客户端中登录`);
    }
    const authCompatibilityError = this.getAuthCompatibilityError(session);
    if (authCompatibilityError) throw new Error(authCompatibilityError);
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${session.auth.accessToken}`,
      'Content-Type': 'application/json',
      'X-User-Id': session.account.uid
    };
    if (session.auth.domain) headers['X-Domain'] = session.auth.domain;
    if (session.account.enterpriseId) {
      headers['X-Enterprise-Id'] = session.account.enterpriseId;
      headers['X-Tenant-Id'] = session.account.enterpriseId;
    }

    const response = await this.fetchImpl(`${this.endpoint}${apiPath}`, {
      method: 'POST',
      headers,
      body: '{}',
      signal: AbortSignal.timeout(15000)
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.code !== 0 || payload?.data == null) {
      throw new Error(payload?.msg || payload?.message || `${this.edition.name} API HTTP ${response.status}`);
    }
    return payload.data;
  }

  normalizeCheckin(data) {
    return {
      checkedIn: Boolean(data?.today_checked_in ?? data?.checked_in ?? data?.is_checked_in),
      streakDays: data?.streak_days ?? null,
      todayCredit: data?.today_credit ?? data?.daily_credit ?? data?.credit ?? null,
      totalCredits: data?.total_credits ?? null,
      activityName: data?.activity_name || null,
      active: Boolean(data?.active)
    };
  }

  async getRealCheckinStatus() {
    if (this.editionId === 'workbuddy-ai') {
      return { supported: false, available: false, checkedIn: false, active: false };
    }
    return this.normalizeCheckin(await this.requestOfficial('/v2/billing/meter/checkin-activity-status'));
  }

  /**
   * Get Real WorkBuddy AI Account details & active promotions
   */
  async getRealAccountDetails() {
    const authCompatibilityError = this.getAuthCompatibilityError();
    if (authCompatibilityError) throw new Error(authCompatibilityError);
    const active = this.getActiveAccount();
    if (!active) throw new Error(`未检测到 ${this.edition.name} 官方登录会话`);
    const summary = await this.requestOfficial('/billing/meter/get-user-resource-summary');
    const checkin = this.editionId === 'workbuddy-ai'
      ? { supported: false, available: false, checkedIn: false, active: false }
      : await this.getRealCheckinStatus();
    const packages = (summary.Packages || []).map(item => ({
      packageCode: item.PackageCode || '',
      total: Number(item.CycleTotalCapacity) || 0,
      points: Number(item.CycleRemainCapacity) || 0,
      used: Number(item.CycleUsedCapacity) || 0
    }));
    const credits = packages.reduce((total, item) => ({
      points: total.points + item.points,
      total: total.total + item.total,
      used: total.used + item.used
    }), { points: 0, total: 0, used: 0 });

    return {
      tool: this.editionId,
      edition: this.edition.name,
      installed: this.detectInstallation().installed,
      name: active.name,
      username: active.username,
      userId: active.ownerUid,
      endpoint: active.endpoint,
      tier: summary.SubscriptionPackageCode || (summary.IsPaidUser ? 'Paid' : active.tier),
      promotions: this.getPromotions(),
      freeModels: this.getFreeModelOffers(),
      credits,
      checkin,
      deviceProfile: active.deviceProfile,
      lastUpdated: Date.now()
    };
  }

  /**
   * Claim WorkBuddy AI Daily Free Quota Package
   */
  async claimRealCheckin() {
    if (this.editionId === 'workbuddy-ai') {
      throw new Error('WorkBuddy AI（国际版）官方不支持签到');
    }
    const before = await this.getRealCheckinStatus();
    if (!before.active) {
      throw new Error(`${this.edition.name} 官方签到活动当前未开放`);
    }
    if (before.checkedIn) {
      const details = await this.getRealAccountDetails();
      return {
        success: true,
        alreadyCheckedIn: true,
        rewardPoints: before.todayCredit,
        credits: details.credits,
        checkin: details.checkin,
        message: `${this.edition.name} 官方接口确认今日已经签到`
      };
    }

    const claim = await this.requestOfficial('/v2/billing/meter/daily-checkin');
    const details = await this.getRealAccountDetails();
    return {
      success: true,
      claimed: true,
      alreadyCheckedIn: false,
      rewardPoints: claim.credit ?? claim.today_credit ?? details.checkin.todayCredit,
      credits: details.credits,
      checkin: details.checkin,
      message: `${this.edition.name} 官方接口签到成功`
    };
  }

  /**
   * Read Custom Models from ~/.workbuddy/models.json
   */
  getCustomModels() {
    const modelsFile = path.join(this.workbuddyDir, 'models.json');
    if (!fs.existsSync(modelsFile)) return [];
    try {
      return JSON.parse(fs.readFileSync(modelsFile, 'utf8'));
    } catch (e) {
      return [];
    }
  }

  /**
   * Add a custom model to models.json
   */
  addCustomModel(model) {
    const modelsFile = path.join(this.workbuddyDir, 'models.json');
    const list = this.getCustomModels();
    const existingIdx = list.findIndex(m => m.id === model.id);
    if (existingIdx >= 0) {
      list[existingIdx] = model;
    } else {
      list.push(model);
    }
    fs.writeFileSync(modelsFile, JSON.stringify(list, null, 2), 'utf8');
    return list;
  }

  /**
   * Delete a custom model from models.json
   */
  deleteCustomModel(modelId) {
    const modelsFile = path.join(this.workbuddyDir, 'models.json');
    let list = this.getCustomModels();
    list = list.filter(m => m.id !== modelId);
    fs.writeFileSync(modelsFile, JSON.stringify(list, null, 2), 'utf8');
    return list;
  }

  /**
   * Process management
   */
  isProcessRunning() {
    return new Promise((resolve) => {
      exec('tasklist /NH /FO CSV', (err, stdout) => {
        if (err || !stdout) return resolve(false);
        const text = stdout.toLowerCase();
        const target = (this.edition.processName || '').toLowerCase();
        resolve(text.includes(`"${target}"`) || text.includes(target));
      });
    });
  }

  closeProcess() {
    return new Promise((resolve) => {
      exec(`taskkill /F /T /IM "${this.edition.processName}"`, () => resolve(true));
    });
  }

  syncAuthForLaunch() {
    try {
      const sharedFile = this.getSharedAuthFilePath();
      const targetFile = this.getAuthFilePath();

      const targetSession = this.readAuthSession(targetFile);
      if (targetSession && !this.getAuthCompatibilityError(targetSession)) {
        fs.mkdirSync(path.dirname(sharedFile), { recursive: true });
        fs.writeFileSync(sharedFile, JSON.stringify(targetSession, null, 2), 'utf8');
      } else {
        const sharedSession = this.readAuthSession(sharedFile);
        if (sharedSession && !this.getAuthCompatibilityError(sharedSession)) {
          fs.mkdirSync(path.dirname(targetFile), { recursive: true });
          fs.writeFileSync(targetFile, JSON.stringify(sharedSession, null, 2), 'utf8');
        }
      }
    } catch (e) {
      console.warn(`[${this.edition.name}] syncAuthForLaunch:`, e.message);
    }
  }

  launch(extraArgs = []) {
    this.syncAuthForLaunch();
    const { exe } = this.detectInstallation();
    if (!fs.existsSync(exe)) {
      throw new Error(`${this.edition.name} executable not found at: ${exe}`);
    }
    const child = spawn(exe, extraArgs, {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    return { success: true, pid: child.pid };
  }

  /**
   * Launch WorkBuddy in isolated multi-instance sandbox mode (--user-data-dir)
   */
  launchIsolated(instanceId, extraArgs = []) {
    const { exe } = this.detectInstallation();
    if (!fs.existsSync(exe)) {
      throw new Error(`${this.edition.name} executable not found at: ${exe}`);
    }
    const isolatedDir = path.join(this.baseDir, 'data', `${this.editionId}-isolated`);
    const instanceDataDir = path.join(isolatedDir, instanceId);
    if (!fs.existsSync(instanceDataDir)) {
      fs.mkdirSync(instanceDataDir, { recursive: true });
    }

    const args = ['--user-data-dir', instanceDataDir, ...extraArgs];
    const child = spawn(exe, args, {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    return { success: true, pid: child.pid, instanceDataDir };
  }

  /**
   * Save current account state as a snapshot profile
   */
  saveAccountSnapshot(accountId, customName = '') {
    const targetDir = path.join(this.profilesDir, accountId);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const authFile = this.getAuthFilePath();
    const sharedAuth = this.getSharedAuthFilePath();
    const deviceIdFile = path.join(this.workbuddyDir, 'device-id');
    const qimeiFile = path.join(this.workbuddyDir, 'qimei-cache.json');

    const activeSession = this.getAuthSession() || this.readAuthSession(sharedAuth);

    if (fs.existsSync(authFile)) {
      fs.copyFileSync(authFile, path.join(targetDir, this.edition.authFile));
    } else if (fs.existsSync(sharedAuth)) {
      fs.copyFileSync(sharedAuth, path.join(targetDir, this.edition.authFile));
    }

    if (fs.existsSync(deviceIdFile)) {
      fs.copyFileSync(deviceIdFile, path.join(targetDir, 'device-id'));
    }
    if (fs.existsSync(qimeiFile)) {
      fs.copyFileSync(qimeiFile, path.join(targetDir, 'qimei-cache.json'));
    }

    const activeUser = this.getActiveAccount();
    const metadata = {
      id: accountId,
      name: customName || (activeUser?.username ? `${this.edition.name} (${activeUser.username})` : `${this.edition.name} 档案`),
      tool: this.editionId,
      editionId: this.editionId,
      activeUser,
      deviceProfile: this.getDeviceProfile(),
      savedAt: Date.now()
    };

    fs.writeFileSync(path.join(targetDir, 'meta.json'), JSON.stringify(metadata, null, 2), 'utf8');
    return metadata;
  }

  /**
   * Apply a saved account snapshot to active WorkBuddy
   */
  applyAccountSnapshot(accountId) {
    const targetDir = path.join(this.profilesDir, accountId);
    if (!fs.existsSync(targetDir)) {
      throw new Error(`Profile '${accountId}' not found`);
    }

    const savedAuth = path.join(targetDir, this.edition.authFile);
    const savedDeviceId = path.join(targetDir, 'device-id');
    const savedQimei = path.join(targetDir, 'qimei-cache.json');

    if (fs.existsSync(savedAuth)) {
      const authFile = this.getAuthFilePath();
      const sharedAuth = this.getSharedAuthFilePath();
      fs.mkdirSync(path.dirname(authFile), { recursive: true });
      fs.copyFileSync(savedAuth, authFile);
      fs.mkdirSync(path.dirname(sharedAuth), { recursive: true });
      fs.copyFileSync(savedAuth, sharedAuth);
    }

    if (fs.existsSync(savedDeviceId)) {
      const dest = path.join(this.workbuddyDir, 'device-id');
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(savedDeviceId, dest);
    }
    if (fs.existsSync(savedQimei)) {
      const dest = path.join(this.workbuddyDir, 'qimei-cache.json');
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(savedQimei, dest);
    }

    return { success: true, accountId };
  }
}

module.exports = WorkBuddyManager;
