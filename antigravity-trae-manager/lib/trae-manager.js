const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { generateDeviceProfile, generateUuidV4 } = require('./device-spoofer');
const { decryptTraeBase64, fetchTraeCheckinStatus, claimTraeCheckin } = require('./trae-crypto');

class TraeManager {
  constructor(options = {}) {
    this.appData = process.env.APPDATA || 'C:\\Users\\Administrator\\AppData\\Roaming';
    this.userProfile = process.env.USERPROFILE || 'C:\\Users\\Administrator';
    this.baseDir = options.baseDir || path.join(__dirname, '..');
    this.profilesDir = path.join(this.baseDir, 'data', 'trae-profiles');
    this.isolatedDir = path.join(this.baseDir, 'data', 'trae-isolated');

    if (!fs.existsSync(this.profilesDir)) {
      fs.mkdirSync(this.profilesDir, { recursive: true });
    }
    if (!fs.existsSync(this.isolatedDir)) {
      fs.mkdirSync(this.isolatedDir, { recursive: true });
    }
  }

  /**
   * Detect installed Trae editions and paths
   */
  detectInstallations() {
    const candidates = [
      {
        id: 'trae-solo-cn',
        name: 'Trae Solo CN (国内版)',
        exe: 'D:\\devloop-tools\\TRAE SOLO CN\\TRAE SOLO CN.exe',
        processName: 'TRAE SOLO CN.exe',
        configDir: path.join(this.appData, 'TRAE SOLO CN'),
        rulesDir: path.join(this.userProfile, '.trae-cn')
      },
      {
        id: 'trae-solo-global',
        name: 'Trae Work / Solo (国际版)',
        exe: 'D:\\devloop-tools\\TRAE SOLO\\TRAE SOLO.exe',
        processName: 'TRAE SOLO.exe',
        configDir: path.join(this.appData, 'Trae'),
        rulesDir: path.join(this.userProfile, '.trae')
      },
      {
        id: 'trae-localappdata-cn',
        name: 'Trae Solo (Local Programs)',
        exe: path.join(process.env.LOCALAPPDATA || '', 'Programs', 'TRAE SOLO CN', 'TRAE SOLO CN.exe'),
        processName: 'TRAE SOLO CN.exe',
        configDir: path.join(this.appData, 'TRAE SOLO CN'),
        rulesDir: path.join(this.userProfile, '.trae-cn')
      }
    ];

    return candidates.map(c => ({
      ...c,
      installed: fs.existsSync(c.exe),
      configExists: fs.existsSync(c.configDir),
      rulesExists: fs.existsSync(c.rulesDir)
    }));
  }

  getPrimaryEdition() {
    const list = this.detectInstallations();
    const found = list.find(c => c.installed && c.configExists);
    return found || list[0];
  }

  /**
   * Get storage.json and machineid paths for a specific edition
   */
  getPaths(editionId) {
    const editions = this.detectInstallations();
    const ed = editions.find(e => e.id === editionId) || this.getPrimaryEdition();
    return {
      edition: ed,
      storageJson: path.join(ed.configDir, 'User', 'globalStorage', 'storage.json'),
      machineid: path.join(ed.configDir, 'machineid'),
      stateDb: path.join(ed.configDir, 'User', 'globalStorage', 'state.vscdb'),
      configDir: ed.configDir,
      exe: ed.exe,
      processName: ed.processName
    };
  }

  /**
   * Read current device profile (telemetry IDs)
   */
  getDeviceProfile(editionId) {
    const { storageJson, machineid } = this.getPaths(editionId);
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
      console.warn('[TraeManager] Failed to read device profile:', err.message);
    }

    return profile;
  }

  /**
   * Write new device profile to Trae configuration
   */
  setDeviceProfile(profile, editionId) {
    const { storageJson, machineid } = this.getPaths(editionId);

    // 1. Write machineid file (UUID format)
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

  /**
   * Reset / Randomize device IDs to bypass risk control
   */
  resetDeviceProfile(editionId) {
    const freshProfile = generateDeviceProfile();
    return this.setDeviceProfile(freshProfile, editionId);
  }

  /**
   * Read active account & quota details from Trae local storage
   */
  getActiveAccount(editionId) {
    const { storageJson } = this.getPaths(editionId);
    if (!fs.existsSync(storageJson)) {
      return null;
    }

    try {
      const data = JSON.parse(fs.readFileSync(storageJson, 'utf8'));
      let serverData = null;
      let identity = 'Free';
      let generalCredits = 0;
      let workCredits = 0;
      let userId = null;

      if (data['iCubeServerData://icube.cloudide']) {
        try {
          serverData = JSON.parse(data['iCubeServerData://icube.cloudide']);
          if (serverData.entitlementInfo) {
            identity = serverData.entitlementInfo.identityStr || identity;
          }
          if (serverData.commercialActivityInfo && Array.isArray(serverData.commercialActivityInfo.activities)) {
            for (const act of serverData.commercialActivityInfo.activities) {
              if (act.workExtra) {
                generalCredits += act.workExtra.general_credits || 0;
                workCredits += act.workExtra.work_credits || 0;
              }
            }
          }
        } catch (e) {}
      }

      if (data.icube_gtm && data.icube_gtm.users) {
        const uids = Object.keys(data.icube_gtm.users);
        if (uids.length > 0) userId = uids[0];
      }

      const devProfile = this.getDeviceProfile(editionId);

      return {
        tool: 'trae',
        editionId,
        userId: userId || 'Local User',
        tier: identity,
        generalCredits,
        workCredits,
        hasAuthToken: Boolean(data['iCubeAuthInfo://icube.cloudide']),
        deviceProfile: devProfile,
        lastUpdated: Date.now()
      };
    } catch (err) {
      console.warn('[TraeManager] Failed to parse active account:', err.message);
      return null;
    }
  }

  /**
   * Decrypt real active Trae credentials and query official live checkin status from api.trae.cn
   */
  async getRealAccountDetails(editionId) {
    const { storageJson } = this.getPaths(editionId);
    if (!fs.existsSync(storageJson)) return null;

    try {
      const data = JSON.parse(fs.readFileSync(storageJson, 'utf8'));
      const devProfile = this.getDeviceProfile(editionId);
      const devDeviceId = data['telemetry.devDeviceId'] || devProfile.dev_device_id || '';

      let auth = null;
      if (data['iCubeAuthInfo://icube.cloudide']) {
        auth = await decryptTraeBase64(data['iCubeAuthInfo://icube.cloudide']);
      }

      let serverData = null;
      let identity = 'Free';
      if (data['iCubeServerData://icube.cloudide']) {
        try {
          serverData = JSON.parse(data['iCubeServerData://icube.cloudide']);
          if (serverData.entitlementInfo) {
            identity = serverData.entitlementInfo.identityStr || identity;
          }
        } catch (e) {}
      }

      let liveCheckin = null;
      if (auth && auth.token) {
        liveCheckin = await fetchTraeCheckinStatus(auth.token, devDeviceId);
      }

      const activities = (serverData?.commercialActivityInfo?.activities || []).map(act => ({
        id: act.activityId,
        generalCredits: act.workExtra?.general_credits ?? 0,
        workCredits: act.workExtra?.work_credits ?? 0,
        enabled: Boolean(act.enabled),
        eligible: Boolean(act.eligible),
        grantable: Boolean(act.grantable),
        granted: Boolean(act.granted),
        expired: Boolean(act.expired)
      }));

      return {
        tool: 'trae',
        editionId,
        userId: auth?.userId || null,
        username: auth?.account?.username || null,
        phone: auth?.account?.nonPlainTextMobile || null,
        avatarUrl: auth?.account?.avatar_url || '',
        tier: identity,
        liveCheckin,
        activities,
        deviceProfile: devProfile,
        lastUpdated: Date.now()
      };
    } catch (err) {
      console.warn('[TraeManager] Failed to get real account details:', err.message);
      return null;
    }
  }

  async getRealCheckinStatus(editionId) {
    const { storageJson } = this.getPaths(editionId);
    if (!fs.existsSync(storageJson)) {
      return { success: false, error: 'Trae storage.json 未找到' };
    }
    const data = JSON.parse(fs.readFileSync(storageJson, 'utf8'));
    const auth = await decryptTraeBase64(data['iCubeAuthInfo://icube.cloudide']);
    if (!auth?.token) {
      return { success: false, error: '当前 Trae 未检测到官方已登录会话' };
    }
    const devProfile = this.getDeviceProfile(editionId);
    const deviceId = data['telemetry.devDeviceId'] || devProfile.dev_device_id || '';
    return fetchTraeCheckinStatus(auth.token, deviceId);
  }

  /**
   * Execute real official check-in against api.trae.cn
   */
  async claimRealCheckin(editionId) {
    const { storageJson } = this.getPaths(editionId);
    if (!fs.existsSync(storageJson)) {
      throw new Error('Trae storage.json 未找到，无法获取官方登录凭据');
    }

    const data = JSON.parse(fs.readFileSync(storageJson, 'utf8'));
    const devProfile = this.getDeviceProfile(editionId);
    const devDeviceId = data['telemetry.devDeviceId'] || devProfile.dev_device_id || '';

    if (!data['iCubeAuthInfo://icube.cloudide']) {
      throw new Error('当前 Trae 未检测到官方已登录会话，请先登录 Trae 账号');
    }

    const auth = await decryptTraeBase64(data['iCubeAuthInfo://icube.cloudide']);
    if (!auth || !auth.token) {
      throw new Error('解密 Trae 官方安全令牌失败');
    }

    const current = await fetchTraeCheckinStatus(auth.token, devDeviceId);
    if (current.success && current.checkedIn) {
      return {
        success: true,
        claimed: false,
        alreadyCheckedIn: true,
        rewardPoints: current.credits,
        latestStatus: current,
        userId: auth.userId,
        username: auth.account?.username
      };
    }

    const result = await claimTraeCheckin(auth.token, devDeviceId);
    if (!result.success) return result;
    return {
      ...result,
      alreadyCheckedIn: false,
      userId: auth.userId,
      username: auth.account?.username
    };
  }

  /**
   * Save current account state as a snapshot profile
   */
  saveAccountSnapshot(accountId, customName = '', editionId) {
    const { storageJson, machineid, stateDb } = this.getPaths(editionId);
    const targetDir = path.join(this.profilesDir, accountId);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const activeInfo = this.getActiveAccount(editionId);

    // Copy core files
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
      name: customName || (activeInfo ? `Trae (${activeInfo.userId})` : 'Trae Account'),
      tool: 'trae',
      editionId,
      activeInfo,
      deviceProfile: this.getDeviceProfile(editionId),
      savedAt: Date.now()
    };

    fs.writeFileSync(path.join(targetDir, 'meta.json'), JSON.stringify(metadata, null, 2), 'utf8');
    return metadata;
  }

  /**
   * Apply a saved account snapshot to active Trae
   */
  applyAccountSnapshot(accountId, editionId) {
    const { storageJson, machineid, stateDb } = this.getPaths(editionId);
    const targetDir = path.join(this.profilesDir, accountId);

    if (!fs.existsSync(targetDir)) {
      throw new Error(`Profile '${accountId}' not found`);
    }

    const savedStorage = path.join(targetDir, 'storage.json');
    const savedMachineid = path.join(targetDir, 'machineid');
    const savedStateDb = path.join(targetDir, 'state.vscdb');

    if (fs.existsSync(savedStorage)) {
      const parent = path.dirname(storageJson);
      if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
      fs.copyFileSync(savedStorage, storageJson);
    }
    if (fs.existsSync(savedMachineid)) {
      const parent = path.dirname(machineid);
      if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
      fs.copyFileSync(savedMachineid, machineid);
    }
    if (fs.existsSync(savedStateDb)) {
      const parent = path.dirname(stateDb);
      if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
      fs.copyFileSync(savedStateDb, stateDb);
    }

    return { success: true, accountId };
  }

  /**
   * Check if Trae is running
   */
  isProcessRunning(editionId) {
    const { processName } = this.getPaths(editionId);
    return new Promise((resolve) => {
      exec('tasklist /NH /FO CSV', (err, stdout) => {
        if (err || !stdout) return resolve(false);
        const text = stdout.toLowerCase();
        const target = (processName || '').toLowerCase();
        resolve(text.includes(`"${target}"`) || text.includes(target) || text.includes('trae solo cn') || text.includes('trae.exe'));
      });
    });
  }

  /**
   * Gracefully close or force kill Trae process
   */
  closeProcess(editionId, force = true) {
    const { processName } = this.getPaths(editionId);
    return new Promise((resolve) => {
      const forceFlag = force ? '/F' : '';
      const cmd = `taskkill ${forceFlag} /T /IM "${processName}" /IM "TRAE SOLO CN.exe" /IM "TRAE.exe" /IM "aha_doctor.exe"`;
      exec(cmd, () => resolve(true));
    });
  }

  /**
   * Launch Trae normally
   */
  launch(editionId, extraArgs = []) {
    const { exe } = this.getPaths(editionId);
    if (!fs.existsSync(exe)) {
      throw new Error(`Trae executable not found at: ${exe}`);
    }
    const child = spawn(exe, extraArgs, {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    return { success: true, pid: child.pid };
  }

  /**
   * Launch Trae in isolated multi-instance sandbox mode (--user-data-dir)
   */
  launchIsolated(instanceId, editionId, extraArgs = []) {
    const { exe } = this.getPaths(editionId);
    if (!fs.existsSync(exe)) {
      throw new Error(`Trae executable not found at: ${exe}`);
    }
    const instanceDataDir = path.join(this.isolatedDir, instanceId);
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
}

module.exports = TraeManager;
