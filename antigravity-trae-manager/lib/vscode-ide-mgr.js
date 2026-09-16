const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { generateDeviceProfile, generateUuidV4 } = require('./device-spoofer');

let DatabaseSync = null;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch {
  // SQLite optional fallback
}

class VSCodeBasedIDEManager {
  constructor(options = {}) {
    this.id = options.id || 'vscode';
    this.name = options.name || 'VS Code';
    this.brandColor = options.brandColor || '#3b82f6';
    this.icon = options.icon || '💻';
    this.baseDir = options.baseDir || path.resolve(__dirname, '..');
    this.userProfile = process.env.USERPROFILE || 'C:\\Users\\Administrator';
    this.appData = process.env.APPDATA || path.join(this.userProfile, 'AppData', 'Roaming');
    this.localAppData = process.env.LOCALAPPDATA || path.join(this.userProfile, 'AppData', 'Local');

    this.exeCandidates = options.exeCandidates || [];
    this.processNames = options.processNames || [];
    this.configDirs = options.configDirs || [];

    this.profilesDir = path.join(this.baseDir, 'data', 'profiles');
    if (!fs.existsSync(this.profilesDir)) {
      fs.mkdirSync(this.profilesDir, { recursive: true });
    }
  }

  detectInstallation() {
    let foundExe = null;
    for (const p of this.exeCandidates) {
      if (p && fs.existsSync(p)) {
        foundExe = p;
        break;
      }
    }

    let foundConfigDir = null;
    for (const d of this.configDirs) {
      if (d && fs.existsSync(d)) {
        foundConfigDir = d;
        break;
      }
    }
    if (!foundConfigDir && this.configDirs.length > 0) {
      foundConfigDir = this.configDirs[0];
    }

    const storageJson = foundConfigDir ? path.join(foundConfigDir, 'User', 'globalStorage', 'storage.json') : null;
    const stateDb = foundConfigDir ? path.join(foundConfigDir, 'User', 'globalStorage', 'state.vscdb') : null;
    const machineid = foundConfigDir ? path.join(foundConfigDir, 'machineid') : null;

    return {
      id: this.id,
      name: this.name,
      icon: this.icon,
      brandColor: this.brandColor,
      installed: Boolean(foundExe && fs.existsSync(foundExe)),
      exe: foundExe,
      configDir: foundConfigDir,
      configExists: Boolean(foundConfigDir && fs.existsSync(foundConfigDir)),
      storageExists: Boolean(storageJson && fs.existsSync(storageJson)),
      stateDbExists: Boolean(stateDb && fs.existsSync(stateDb)),
      machineidExists: Boolean(machineid && fs.existsSync(machineid)),
      processName: this.processNames[0] || 'Code.exe'
    };
  }

  getPaths() {
    const info = this.detectInstallation();
    const configDir = info.configDir || path.join(this.appData, this.name);
    return {
      exe: info.exe,
      processName: info.processName,
      configDir,
      storageJson: path.join(configDir, 'User', 'globalStorage', 'storage.json'),
      stateDb: path.join(configDir, 'User', 'globalStorage', 'state.vscdb'),
      machineid: path.join(configDir, 'machineid')
    };
  }

  isProcessRunning() {
    return new Promise(resolve => {
      const info = this.detectInstallation();
      const proc = info.processName;
      if (!proc) return resolve(false);

      exec(`tasklist /FO CSV /NH /FI "IMAGENAME eq ${proc}"`, (err, stdout) => {
        if (err || !stdout) return resolve(false);
        const running = stdout.toLowerCase().includes(proc.toLowerCase());
        resolve(running);
      });
    });
  }

  launch(extraArgs = []) {
    const { exe } = this.getPaths();
    if (!exe || !fs.existsSync(exe)) {
      throw new Error(`${this.name} 可执行文件未找到: ${exe}`);
    }

    const child = spawn(exe, extraArgs, {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    return { success: true, pid: child.pid, exe };
  }

  closeProcess() {
    return new Promise((resolve) => {
      const { processName } = this.getPaths();
      if (!processName) return resolve({ success: true, closed: 0 });

      exec(`taskkill /F /IM ${processName} /T`, (err) => {
        resolve({ success: !err });
      });
    });
  }

  launchIsolated(instanceId, extraArgs = []) {
    const { exe } = this.getPaths();
    if (!exe || !fs.existsSync(exe)) {
      throw new Error(`${this.name} 可执行文件未找到: ${exe}`);
    }

    const isolatedDir = path.join(this.baseDir, 'data', `${this.id}-isolated`);
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

  getDeviceProfile() {
    const { storageJson, machineid } = this.getPaths();
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
      console.warn(`[${this.name}] Failed to read device profile:`, err.message);
    }

    return profile;
  }

  setDeviceProfile(profile) {
    const { storageJson, machineid } = this.getPaths();

    const rawUuid = profile.dev_device_id || generateUuidV4();
    try {
      fs.mkdirSync(path.dirname(machineid), { recursive: true });
      fs.writeFileSync(machineid, profile.raw_machineid_file || rawUuid, 'utf8');
    } catch (e) {
      console.warn(`[${this.name}] Failed to write machineid file:`, e.message);
    }

    try {
      let data = {};
      if (fs.existsSync(storageJson)) {
        try {
          data = JSON.parse(fs.readFileSync(storageJson, 'utf8'));
        } catch {}
      } else {
        fs.mkdirSync(path.dirname(storageJson), { recursive: true });
      }

      if (profile.machine_id) data['telemetry.machineId'] = profile.machine_id;
      if (profile.mac_machine_id) data['telemetry.macMachineId'] = profile.mac_machine_id;
      if (profile.dev_device_id) data['telemetry.devDeviceId'] = profile.dev_device_id;
      if (profile.sqm_id) data['telemetry.sqmId'] = profile.sqm_id;

      fs.writeFileSync(storageJson, JSON.stringify(data, null, 4), 'utf8');
    } catch (e) {
      console.warn(`[${this.name}] Failed to write storage.json:`, e.message);
    }

    return this.getDeviceProfile();
  }

  resetDeviceProfile() {
    const newProfile = generateDeviceProfile();
    const updated = this.setDeviceProfile(newProfile);
    return { success: true, profile: updated };
  }

  getActiveAccount() {
    const { stateDb, storageJson } = this.getPaths();
    if (this.id === 'cursor') {
      return this._getCursorAccount(stateDb, storageJson);
    } else if (this.id === 'windsurf') {
      return this._getWindsurfAccount(stateDb, storageJson);
    } else {
      return this._getVSCodeAccount(stateDb, storageJson);
    }
  }

  _getCursorAccount(stateDb, storageJson) {
    let email = null;
    let username = null;
    let tier = 'Free';

    if (DatabaseSync && fs.existsSync(stateDb)) {
      try {
        const db = new DatabaseSync(stateDb, { readOnly: true });
        const getVal = (key) => {
          const row = db.prepare('SELECT value FROM ItemTable WHERE key = ?').get(key);
          return row ? row.value : null;
        };

        email = getVal('cursorAuth/cachedEmail') || null;
        tier = getVal('cursorAuth/stripeMembershipType') || 'Free';
        const profileRaw = getVal('cursorAuth/cachedScopedProfile');
        if (profileRaw) {
          try {
            const p = JSON.parse(profileRaw);
            username = p.displayName || null;
          } catch {}
        }
        db.close();
      } catch (e) {
        console.warn('[Cursor] state.vscdb read error:', e.message);
      }
    }

    if (!email && fs.existsSync(storageJson)) {
      try {
        const data = JSON.parse(fs.readFileSync(storageJson, 'utf8'));
        email = data['cursorAuth.cachedEmail'] || null;
      } catch {}
    }

    if (!email && !username) {
      return null;
    }

    return {
      tool: this.id,
      name: username ? `${this.name}（${username}）` : `${this.name} 默认`,
      username: username || email,
      email: email || `${this.id}@local`,
      tier: tier === 'pro' ? 'Pro' : (tier === 'business' ? 'Business' : 'Free'),
      userId: email
    };
  }

  _getWindsurfAccount(stateDb, storageJson) {
    let email = null;
    let username = null;
    let tier = 'Free';

    if (DatabaseSync && fs.existsSync(stateDb)) {
      try {
        const db = new DatabaseSync(stateDb, { readOnly: true });
        const rows = db.prepare("SELECT key, value FROM ItemTable WHERE key LIKE '%codeium%' OR key LIKE '%windsurf%'").all();
        for (const row of rows) {
          if (row.key.includes('user') || row.key.includes('account')) {
            try {
              const parsed = JSON.parse(row.value);
              if (parsed.email) email = parsed.email;
              if (parsed.name || parsed.username) username = parsed.name || parsed.username;
            } catch {}
          }
        }
        db.close();
      } catch {}
    }

    const windsurfConfig = path.join(this.userProfile, '.windsurf', 'config.json');
    if (!email && fs.existsSync(windsurfConfig)) {
      try {
        const conf = JSON.parse(fs.readFileSync(windsurfConfig, 'utf8'));
        email = conf.user?.email || null;
        username = conf.user?.name || null;
      } catch {}
    }

    if (!email && !username) return null;

    return {
      tool: this.id,
      name: username ? `${this.name}（${username}）` : `${this.name} 默认`,
      username: username || email,
      email: email || `${this.id}@local`,
      tier,
      userId: email
    };
  }

  _getVSCodeAccount(stateDb, storageJson) {
    let email = null;
    let username = null;
    let tier = 'Copilot';

    if (DatabaseSync && fs.existsSync(stateDb)) {
      try {
        const db = new DatabaseSync(stateDb, { readOnly: true });
        const row = db.prepare("SELECT value FROM ItemTable WHERE key LIKE '%cachedPolicyData%'").get();
        if (row && row.value) {
          try {
            const data = JSON.parse(row.value);
            if (data.accountPolicyData?.accountId) {
              username = `GitHub User (${data.accountPolicyData.accountId})`;
              email = `gh_${data.accountPolicyData.accountId}@github.com`;
            }
          } catch {}
        }

        const syncRow = db.prepare("SELECT value FROM ItemTable WHERE key = 'userDataSyncAccountProvider'").get();
        if (syncRow && syncRow.value) {
          tier = syncRow.value.toUpperCase();
        }
        db.close();
      } catch {}
    }

    if (!email && !username) return null;

    return {
      tool: this.id,
      name: username ? `${this.name}（${username}）` : `${this.name} 默认`,
      username: username || email,
      email: email || `${this.id}@local`,
      tier,
      userId: email
    };
  }

  saveAccountSnapshot(accountId, customName = '') {
    const { storageJson, machineid, stateDb } = this.getPaths();
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

    const activeUser = this.getActiveAccount();
    const metadata = {
      id: accountId,
      name: customName || (activeUser?.username ? `${this.name} (${activeUser.username})` : `${this.name} 档案`),
      tool: this.id,
      activeUser,
      deviceProfile: this.getDeviceProfile(),
      savedAt: Date.now()
    };

    fs.writeFileSync(path.join(targetDir, 'meta.json'), JSON.stringify(metadata, null, 2), 'utf8');
    return metadata;
  }

  applyAccountSnapshot(accountId) {
    const { storageJson, machineid, stateDb } = this.getPaths();
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

    const metaFile = path.join(targetDir, 'meta.json');
    if (fs.existsSync(metaFile)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
        if (meta.deviceProfile) {
          this.setDeviceProfile(meta.deviceProfile);
        }
      } catch {}
    }
    return true;
  }
}

function createIDEInstances() {
  const userProfile = process.env.USERPROFILE || 'C:\\Users\\Administrator';
  const appData = process.env.APPDATA || path.join(userProfile, 'AppData', 'Roaming');
  const localAppData = process.env.LOCALAPPDATA || path.join(userProfile, 'AppData', 'Local');

  const cursorMgr = new VSCodeBasedIDEManager({
    id: 'cursor',
    name: 'Cursor',
    icon: '🖱️',
    brandColor: '#0066ff',
    exeCandidates: [
      'D:\\devloop-tools\\cursor\\cursor\\Cursor.exe',
      path.join(localAppData, 'Programs', 'cursor', 'Cursor.exe'),
      path.join(process.env.PROGRAMFILES || '', 'Cursor', 'Cursor.exe')
    ],
    processNames: ['Cursor.exe', 'cursor.exe'],
    configDirs: [
      path.join(appData, 'Cursor')
    ]
  });

  const windsurfMgr = new VSCodeBasedIDEManager({
    id: 'windsurf',
    name: 'Windsurf',
    icon: '🌊',
    brandColor: '#0ea5e9',
    exeCandidates: [
      path.join(localAppData, 'Programs', 'windsurf', 'Windsurf.exe'),
      'D:\\devloop-tools\\windsurf\\Windsurf.exe',
      path.join(process.env.PROGRAMFILES || '', 'Windsurf', 'Windsurf.exe')
    ],
    processNames: ['Windsurf.exe', 'windsurf.exe'],
    configDirs: [
      path.join(appData, 'Windsurf')
    ]
  });

  const vscodeMgr = new VSCodeBasedIDEManager({
    id: 'vscode',
    name: 'VS Code',
    icon: '💻',
    brandColor: '#2563eb',
    exeCandidates: [
      'D:\\devloop-tools\\vscode\\Code.exe',
      path.join(localAppData, 'Programs', 'Microsoft VS Code', 'Code.exe'),
      path.join(process.env.PROGRAMFILES || '', 'Microsoft VS Code', 'Code.exe')
    ],
    processNames: ['Code.exe', 'code.exe'],
    configDirs: [
      path.join(appData, 'Code')
    ]
  });

  return { cursorMgr, windsurfMgr, vscodeMgr };
}

module.exports = {
  VSCodeBasedIDEManager,
  createIDEInstances
};
