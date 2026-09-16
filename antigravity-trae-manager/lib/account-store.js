const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AccountStore {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(__dirname, '..');
    this.dataFile = path.join(this.baseDir, 'data', 'accounts.json');
    this.ensureDataFile();
  }

  ensureDataFile() {
    const dir = path.dirname(this.dataFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.dataFile)) {
      const initialData = {
        version: '1.0.0',
        accounts: [],
        settings: {
          autoSwitchDeviceProfile: true,
          closeBeforeSwitch: true,
          defaultTool: 'trae',
          apiProxyPort: 18888
        }
      };
      fs.writeFileSync(this.dataFile, JSON.stringify(initialData, null, 2), 'utf8');
    }
  }

  _read() {
    try {
      this.ensureDataFile();
      return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
    } catch (err) {
      console.error('[AccountStore] Read error, resetting:', err.message);
      return { version: '1.0.0', accounts: [], settings: {} };
    }
  }

  _write(data) {
    fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2), 'utf8');
  }

  getAllAccounts(toolFilter = null) {
    const data = this._read();
    if (!toolFilter) return data.accounts;
    return data.accounts.filter(a => a.tool === toolFilter);
  }

  getAccountById(id) {
    const data = this._read();
    return data.accounts.find(a => a.id === id) || null;
  }

  addAccount(accountData) {
    const data = this._read();
    const newAccount = {
      id: accountData.id || 'acc_' + crypto.randomUUID().slice(0, 8),
      tool: accountData.tool || 'trae', // 'trae' | 'antigravity'
      email: accountData.email || '',
      name: accountData.name || accountData.email || 'New Account',
      avatar: accountData.avatar || '',
      tier: accountData.tier || 'Free', // Free, Pro, Ultra, Team
      credits: accountData.credits || { general: 0, work: 0 },
      isCurrent: Boolean(accountData.isCurrent),
      customLabel: accountData.customLabel || '',
      deviceProfile: accountData.deviceProfile || null,
      token: accountData.token || null,
      notes: accountData.notes || '',
      disabled: Boolean(accountData.disabled),
      createdAt: Date.now(),
      lastUsed: Date.now()
    };

    // If marked as current, unmark others of same tool
    if (newAccount.isCurrent) {
      for (const a of data.accounts) {
        if (a.tool === newAccount.tool) {
          a.isCurrent = false;
        }
      }
    }

    data.accounts.push(newAccount);
    this._write(data);
    return newAccount;
  }

  updateAccount(id, updates) {
    const data = this._read();
    const index = data.accounts.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error(`Account with id ${id} not found`);
    }

    if (updates.isCurrent) {
      const tool = data.accounts[index].tool;
      for (const a of data.accounts) {
        if (a.tool === tool) a.isCurrent = false;
      }
    }

    data.accounts[index] = {
      ...data.accounts[index],
      ...updates,
      updatedAt: Date.now()
    };

    this._write(data);
    return data.accounts[index];
  }

  deleteAccount(id) {
    const data = this._read();
    const initialLen = data.accounts.length;
    data.accounts = data.accounts.filter(a => a.id !== id);
    this._write(data);
    return data.accounts.length < initialLen;
  }

  setActiveAccount(id) {
    const data = this._read();
    const target = data.accounts.find(a => a.id === id);
    if (!target) {
      throw new Error(`Account ${id} not found`);
    }

    for (const a of data.accounts) {
      if (a.tool === target.tool) {
        a.isCurrent = (a.id === id);
      }
    }

    target.lastUsed = Date.now();
    this._write(data);
    return target;
  }

  getActiveAccount(tool = 'trae') {
    const data = this._read();
    return data.accounts.find(a => a.tool === tool && a.isCurrent) || null;
  }

  getSettings() {
    const data = this._read();
    return data.settings || {};
  }

  updateSettings(updates) {
    const data = this._read();
    data.settings = { ...data.settings, ...updates };
    this._write(data);
    return data.settings;
  }

  exportData() {
    return this._read();
  }

  importData(imported) {
    if (!imported || !Array.isArray(imported.accounts)) {
      throw new Error('Invalid backup file format');
    }
    this._write(imported);
    return true;
  }

  /**
   * Daily check-in / claim points for a platform account via REAL backend APIs
   */
  async checkin(tool, managers = {}) {
    if (tool === 'antigravity' || tool === 'workbuddy-ai') {
      const platform = tool === 'workbuddy-ai' ? 'WorkBuddy AI（国际版）' : 'Antigravity';
      throw new Error(`${platform} 官方不支持签到`);
    }

    const data = this._read();
    let account = data.accounts.find(a => a.tool === tool && a.isCurrent);
    if (!account) {
      account = data.accounts.find(a => a.tool === tool);
    }
    if (!account) {
      throw new Error(`未找到 ${tool} 平台的可用账号档案`);
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Trae: Call official ByteDance API
    if (tool === 'trae') {
      if (!managers.traeMgr) throw new Error('Trae 官方管理服务未初始化');

      const realClaim = await managers.traeMgr.claimRealCheckin();
      if (!realClaim?.success) {
        throw new Error(realClaim?.error || 'Trae 官方签到失败');
      }
      const realStatus = realClaim.latestStatus?.success ? realClaim.latestStatus : null;
      const reward = Number.isFinite(realStatus?.credits)
        ? realStatus.credits
        : realClaim.rewardPoints ?? null;
      account.name = realClaim.username ? `Trae (${realClaim.username})` : account.name;
      account.credits = {
        checkinToday: reward,
        general: realStatus?.credits ?? null,
        work: realStatus?.extraCredits ?? null
      };
      account.checkin = {
        checkedIn: realStatus?.checkedIn ?? true,
        lastCheckinDate: todayStr,
        lastCheckinTime: Date.now(),
        isRealApi: true
      };
      this._write(data);

      return {
        success: true,
        realApi: true,
        alreadyCheckedIn: Boolean(realClaim.alreadyCheckedIn),
        rewardPoints: reward,
        reward,
        account,
        message: realClaim.alreadyCheckedIn
          ? 'Trae 官方接口确认今日已经签到'
          : `Trae 官方接口签到成功${reward == null ? '' : `，本次奖励 ${reward} 分`}`
      };
    }

    // 2. WorkBuddy domestic: Call the official platform session
    if (tool === 'workbuddy') {
      const manager = managers.wbMgr;
      if (!manager) throw new Error(`${tool} 官方管理服务未初始化`);
      const claimRes = await manager.claimRealCheckin();
      if (!claimRes?.success) {
        throw new Error(claimRes?.error || 'WorkBuddy 官方签到失败');
      }

      account.credits = claimRes.credits;
      account.checkin = {
        ...claimRes.checkin,
        lastCheckinDate: claimRes.checkin?.checkedIn ? todayStr : null,
        lastCheckinTime: Date.now(),
        isRealApi: true
      };
      this._write(data);

      return {
        success: true,
        realApi: true,
        alreadyCheckedIn: Boolean(claimRes.alreadyCheckedIn),
        rewardPoints: claimRes.rewardPoints,
        reward: claimRes.rewardPoints,
        totalCredits: account.credits?.points ?? null,
        account,
        message: claimRes.message
      };
    }

    throw new Error(`不支持的平台: ${tool}`);
  }

  async checkinAll(managers = {}) {
    const platforms = [
      { tool: 'trae', name: 'ByteDance Trae' },
      { tool: 'workbuddy', name: 'WorkBuddy（国内版）', manager: managers.wbMgr }
    ];
    const results = [];

    for (const platform of platforms) {
      try {
        if (platform.manager) {
          const status = await platform.manager.getRealCheckinStatus();
          if (!status.active) {
            let details = null;
            if (typeof platform.manager.getRealAccountDetails === 'function') {
              try {
                details = await platform.manager.getRealAccountDetails();
              } catch {}
            }
            const account = this.getActiveAccount(platform.tool);
            if (details?.credits && account) {
              this.updateAccount(account.id, { credits: details.credits });
            }
            results.push({
              tool: platform.tool,
              name: platform.name,
              status: 'skipped',
              skipped: true,
              totalCredits: details?.credits?.points ?? null,
              credits: details?.credits || null,
              message: '官方签到活动当前未开放'
            });
            continue;
          }
        }

        const result = await this.checkin(platform.tool, managers);
        results.push({
          tool: platform.tool,
          name: platform.name,
          status: result.alreadyCheckedIn ? 'already' : 'success',
          success: true,
          alreadyCheckedIn: Boolean(result.alreadyCheckedIn),
          reward: result.reward ?? null,
          totalCredits: result.totalCredits ?? null,
          message: result.message
        });
      } catch (error) {
        results.push({
          tool: platform.tool,
          name: platform.name,
          status: 'failed',
          success: false,
          message: error.message
        });
      }
    }

    return {
      success: true,
      results,
      summary: {
        success: results.filter(item => item.status === 'success').length,
        already: results.filter(item => item.status === 'already').length,
        skipped: results.filter(item => item.status === 'skipped').length,
        failed: results.filter(item => item.status === 'failed').length
      }
    };
  }
}

module.exports = AccountStore;
