const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { generateDeviceProfile, generateUuidV4 } = require('./device-spoofer');

const OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
const CLOUD_CODE_HOSTS = [
  'https://daily-cloudcode-pa.sandbox.googleapis.com',
  'https://daily-cloudcode-pa.googleapis.com',
  'https://cloudcode-pa.googleapis.com'
];

function readProtoFields(buffer) {
  let offset = 0;
  const fields = [];
  const readVarint = () => {
    let value = 0;
    let multiplier = 1;
    let byte;
    do {
      if (offset >= buffer.length) throw new Error('无效的 protobuf 数据');
      byte = buffer[offset++];
      value += (byte & 0x7f) * multiplier;
      multiplier *= 128;
    } while (byte & 0x80);
    return value;
  };

  while (offset < buffer.length) {
    const key = readVarint();
    const field = key >> 3;
    const wireType = key & 7;
    if (wireType === 0) {
      fields.push({ field, wireType, value: readVarint() });
    } else if (wireType === 2) {
      const length = readVarint();
      const value = buffer.subarray(offset, offset + length);
      if (value.length !== length) throw new Error('无效的 protobuf 长度');
      offset += length;
      fields.push({ field, wireType, value });
    } else {
      throw new Error(`不支持的 protobuf wire type: ${wireType}`);
    }
  }
  return fields;
}

function protoBytes(fields, field) {
  return fields.find(item => item.field === field && item.wireType === 2)?.value;
}

function decodeOAuthState(encoded) {
  const outer = readProtoFields(Buffer.from(encoded, 'base64'));
  const entry = readProtoFields(protoBytes(outer, 1));
  const row = readProtoFields(protoBytes(entry, 2));
  const payload = readProtoFields(Buffer.from(protoBytes(row, 1).toString('utf8'), 'base64'));
  const expiryMessage = protoBytes(payload, 4);
  const expirySeconds = expiryMessage
    ? readProtoFields(expiryMessage).find(item => item.field === 1 && item.wireType === 0)?.value
    : null;
  return {
    accessToken: protoBytes(payload, 1)?.toString('utf8') || null,
    refreshToken: protoBytes(payload, 3)?.toString('utf8') || null,
    expiry: expirySeconds ? expirySeconds * 1000 : null
  };
}

class AntigravityManager {
  constructor(options = {}) {
    this.appData = options.appData || process.env.APPDATA || 'C:\\Users\\Administrator\\AppData\\Roaming';
    this.localAppData = options.localAppData || process.env.LOCALAPPDATA || 'C:\\Users\\Administrator\\AppData\\Local';
    this.userProfile = options.userProfile || process.env.USERPROFILE || 'C:\\Users\\Administrator';
    this.baseDir = options.baseDir || path.join(__dirname, '..');
    this.profilesDir = path.join(this.baseDir, 'data', 'antigravity-profiles');
    this.fetchImpl = options.fetchImpl || global.fetch;
    this.credentialProvider = options.credentialProvider || null;
    this.refreshedCredential = null;

    if (!fs.existsSync(this.profilesDir)) {
      fs.mkdirSync(this.profilesDir, { recursive: true });
    }
  }

  /**
   * Detect installed Antigravity components
   */
  detectInstallations() {
    const candidates = [
      {
        id: 'antigravity-classic',
        name: 'Antigravity (Google / Local)',
        exe: 'D:\\devloop-tools\\google-Antigravity\\Antigravity.exe',
        configDir: path.join(this.appData, 'Antigravity'),
        processName: 'Antigravity.exe'
      },
      {
        id: 'antigravity-ide',
        name: 'Antigravity IDE',
        exe: path.join(this.localAppData, 'Programs', 'Antigravity IDE', 'Antigravity IDE.exe'),
        configDir: path.join(this.appData, 'Antigravity IDE'),
        processName: 'Antigravity IDE.exe'
      },
      {
        id: 'antigravity-core',
        name: 'Antigravity Core / CLI',
        exe: path.join(this.userProfile, '.gemini', 'antigravity', 'bin', 'agy.exe'),
        configDir: path.join(this.userProfile, '.gemini', 'antigravity'),
        processName: 'agy.exe'
      }
    ];

    return candidates.map(c => {
      const storageJson = path.join(c.configDir, 'User', 'globalStorage', 'storage.json');
      const machineid = path.join(c.configDir, 'machineid');
      return {
        ...c,
        installed: Boolean(c.exe && fs.existsSync(c.exe)),
        configExists: fs.existsSync(c.configDir),
        storageExists: fs.existsSync(storageJson),
        machineidExists: fs.existsSync(machineid)
      };
    });
  }

  getPrimaryTarget() {
    const list = this.detectInstallations();
    const found = list.find(c => c.storageExists || c.configExists);
    return found || list[0];
  }

  getPaths(targetId) {
    const targets = this.detectInstallations();
    const target = targets.find(t => t.id === targetId) || this.getPrimaryTarget();
    return {
      target,
      storageJson: path.join(target.configDir, 'User', 'globalStorage', 'storage.json'),
      stateDb: path.join(target.configDir, 'User', 'globalStorage', 'state.vscdb'),
      machineid: path.join(target.configDir, 'machineid'),
      configDir: target.configDir,
      processName: target.processName
    };
  }

  getDeviceProfile(targetId) {
    const { storageJson, machineid } = this.getPaths(targetId);
    let profile = {
      machine_id: null,
      mac_machine_id: null,
      dev_device_id: null,
      sqm_id: null,
      raw_machineid_file: null,
      exists: false
    };

    try {
      if (fs.existsSync(machineid)) {
        profile.raw_machineid_file = fs.readFileSync(machineid, 'utf8').trim();
      }
      if (fs.existsSync(storageJson)) {
        const raw = fs.readFileSync(storageJson, 'utf8');
        const data = JSON.parse(raw);
        profile.machine_id = data['telemetry.machineId'] || null;
        profile.mac_machine_id = data['telemetry.macMachineId'] || null;
        profile.dev_device_id = data['telemetry.devDeviceId'] || null;
        profile.sqm_id = data['telemetry.sqmId'] || null;
        profile.exists = true;
      }
    } catch (err) {
      console.warn('[AntigravityManager] Failed to read device profile:', err.message);
    }

    return profile;
  }

  setDeviceProfile(profile, targetId) {
    const { storageJson, machineid } = this.getPaths(targetId);

    // 1. Write machineid
    const rawUuid = profile.dev_device_id || generateUuidV4();
    const machineidDir = path.dirname(machineid);
    if (!fs.existsSync(machineidDir)) fs.mkdirSync(machineidDir, { recursive: true });
    fs.writeFileSync(machineid, rawUuid, 'utf8');

    // 2. Write storage.json
    let data = {};
    if (fs.existsSync(storageJson)) {
      try {
        data = JSON.parse(fs.readFileSync(storageJson, 'utf8'));
      } catch (e) {
        data = {};
      }
    } else {
      const storageDir = path.dirname(storageJson);
      if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
    }

    if (profile.machine_id) data['telemetry.machineId'] = profile.machine_id;
    if (profile.mac_machine_id) data['telemetry.macMachineId'] = profile.mac_machine_id;
    if (profile.dev_device_id) data['telemetry.devDeviceId'] = profile.dev_device_id;
    if (profile.sqm_id) data['telemetry.sqmId'] = profile.sqm_id;

    fs.writeFileSync(storageJson, JSON.stringify(data, null, 4), 'utf8');
    return { success: true, profile };
  }

  resetDeviceProfile(targetId) {
    const freshProfile = generateDeviceProfile();
    return this.setDeviceProfile(freshProfile, targetId);
  }

  getStoredCredentials(targetId) {
    if (this.credentialProvider) return this.credentialProvider();
    const { stateDb } = this.getPaths(targetId);
    if (!fs.existsSync(stateDb)) {
      throw new Error('未找到 Antigravity 登录状态数据库');
    }
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(stateDb, { readOnly: true });
    try {
      const row = db.prepare('SELECT value FROM ItemTable WHERE key = ?')
        .get('antigravityUnifiedStateSync.oauthToken');
      if (!row?.value) throw new Error('Antigravity 当前没有已登录 OAuth 会话');
      return decodeOAuthState(row.value);
    } finally {
      db.close();
    }
  }

  async requestJson(url, options = {}) {
    const response = await this.fetchImpl(url, {
      ...options,
      signal: AbortSignal.timeout(15000)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error_description || data?.error?.message || `HTTP ${response.status}`);
    }
    return data;
  }

  async getValidCredential(targetId) {
    if (this.refreshedCredential?.expiry > Date.now() + 30000) {
      return this.refreshedCredential;
    }
    const credential = await this.getStoredCredentials(targetId);
    if (credential.accessToken && (!credential.expiry || credential.expiry > Date.now() + 30000)) {
      return credential;
    }
    if (!credential.refreshToken) {
      throw new Error('Antigravity 登录令牌已过期，且没有可用刷新令牌');
    }
    const body = new URLSearchParams({
      client_id: OAUTH_CLIENT_ID,
      client_secret: OAUTH_CLIENT_SECRET,
      refresh_token: credential.refreshToken,
      grant_type: 'refresh_token'
    });
    const refreshed = await this.requestJson('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    this.refreshedCredential = {
      accessToken: refreshed.access_token,
      refreshToken: credential.refreshToken,
      expiry: Date.now() + Number(refreshed.expires_in || 3600) * 1000
    };
    return this.refreshedCredential;
  }

  async requestCloudCode(apiName, token, body, optional = false) {
    let lastError;
    for (const host of CLOUD_CODE_HOSTS) {
      try {
        return await this.requestJson(`${host}/${apiName}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'antigravity'
          },
          body: JSON.stringify(body)
        });
      } catch (error) {
        lastError = error;
      }
    }
    if (optional) return null;
    throw lastError;
  }

  resolveTier(project) {
    const tier = project.paidTier || project.currentTier
      || project.allowedTiers?.find(item => item.isDefault || item.is_default)
      || project.allowedTiers?.[0];
    return tier?.name || tier?.id || null;
  }

  async getRealAccountDetails(targetId) {
    const credential = await this.getValidCredential(targetId);
    const headers = { Authorization: `Bearer ${credential.accessToken}` };
    const [user, project] = await Promise.all([
      this.requestJson('https://www.googleapis.com/oauth2/v2/userinfo', { headers }).catch(() => null),
      this.requestCloudCode('v1internal:loadCodeAssist', credential.accessToken, {
        metadata: { ideType: 'ANTIGRAVITY' }
      })
    ]);
    const projectId = project.cloudaicompanionProject || null;
    const payload = projectId ? { project: projectId } : {};
    const [quota, summary] = await Promise.all([
      this.requestCloudCode('v1internal:fetchAvailableModels', credential.accessToken, payload),
      this.requestCloudCode('v1internal:retrieveUserQuotaSummary', credential.accessToken, payload, true)
    ]);
    const models = Object.entries(quota.models || {})
      .filter(([id, info]) => info.quotaInfo && /^(gemini|claude|gpt|image|imagen)/.test(id))
      .map(([id, info]) => ({
        id,
        name: info.displayName || id,
        remainingPercent: Math.round(Number(info.quotaInfo.remainingFraction || 0) * 100),
        resetTime: info.quotaInfo.resetTime || null
      }));

    return {
      tool: 'antigravity',
      email: user?.email || null,
      name: user?.name || null,
      avatarUrl: user?.picture || null,
      tier: this.resolveTier(project),
      projectId,
      models,
      quotaGroups: summary?.groups || [],
      lowestRemainingPercent: models.length ? Math.min(...models.map(model => model.remainingPercent)) : null,
      lastUpdated: Date.now()
    };
  }

  isProcessRunning(targetId) {
    const { processName } = this.getPaths(targetId);
    return new Promise((resolve) => {
      exec('tasklist /NH /FO CSV', (err, stdout) => {
        if (err || !stdout) return resolve(false);
        const text = stdout.toLowerCase();
        const target = (processName || '').toLowerCase();
        resolve(text.includes(`"${target}"`) || text.includes(target) || text.includes('antigravity'));
      });
    });
  }

  closeProcess(targetId) {
    const { processName } = this.getPaths(targetId);
    return new Promise((resolve) => {
      exec(`taskkill /F /T /IM "${processName}" /IM "Antigravity.exe"`, () => resolve(true));
    });
  }

  launch(targetId, extraArgs = []) {
    const { target } = this.getPaths(targetId);
    const exe = target.exe;
    if (!exe || !fs.existsSync(exe)) {
      throw new Error(`Antigravity executable not found at: ${exe}`);
    }
    const child = spawn(exe, extraArgs, {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    return { success: true, pid: child.pid, exe };
  }

  /**
   * Launch Antigravity in isolated multi-instance sandbox mode (--user-data-dir)
   */
  launchIsolated(instanceId, targetId, extraArgs = []) {
    const { target } = this.getPaths(targetId);
    const exe = target.exe;
    if (!exe || !fs.existsSync(exe)) {
      throw new Error(`Antigravity executable not found at: ${exe}`);
    }
    const isolatedDir = path.join(this.baseDir, 'data', 'antigravity-isolated');
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
  saveAccountSnapshot(accountId, customName = '', targetId) {
    const { storageJson, machineid, stateDb } = this.getPaths(targetId);
    const targetDir = path.join(this.profilesDir, accountId);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    if (fs.existsSync(storageJson)) {
      fs.copyFileSync(storageJson, path.join(targetDir, 'storage.json'));
    }
    if (fs.existsSync(machineid)) {
      fs.copyFileSync(machineid, path.join(targetDir, 'machineid'));
    }
    if (fs.existsSync(stateDb)) {
      fs.copyFileSync(stateDb, path.join(targetDir, 'state.vscdb'));
    }

    const metadata = {
      id: accountId,
      name: customName || `Antigravity (${accountId})`,
      tool: 'antigravity',
      targetId,
      deviceProfile: this.getDeviceProfile(targetId),
      savedAt: Date.now()
    };

    fs.writeFileSync(path.join(targetDir, 'meta.json'), JSON.stringify(metadata, null, 2), 'utf8');
    return metadata;
  }

  /**
   * Apply a saved account snapshot to active Antigravity
   */
  applyAccountSnapshot(accountId, targetId) {
    const { storageJson, machineid, stateDb } = this.getPaths(targetId);
    const targetDir = path.join(this.profilesDir, accountId);
    if (!fs.existsSync(targetDir)) {
      throw new Error(`Profile '${accountId}' not found`);
    }

    const savedStorage = path.join(targetDir, 'storage.json');
    const savedMachineid = path.join(targetDir, 'machineid');
    const savedStateDb = path.join(targetDir, 'state.vscdb');

    if (fs.existsSync(savedStorage)) {
      fs.mkdirSync(path.dirname(storageJson), { recursive: true });
      fs.copyFileSync(savedStorage, storageJson);
    }
    if (fs.existsSync(savedMachineid)) {
      fs.mkdirSync(path.dirname(machineid), { recursive: true });
      fs.copyFileSync(savedMachineid, machineid);
    }
    if (fs.existsSync(savedStateDb)) {
      fs.mkdirSync(path.dirname(stateDb), { recursive: true });
      fs.copyFileSync(savedStateDb, stateDb);
    }

    return { success: true, accountId };
  }
}

module.exports = AntigravityManager;
