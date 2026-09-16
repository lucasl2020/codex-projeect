// State
let globalStatus = null;
let allAccounts = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  fetchStatus();
  fetchAccounts();
  fetchTraeConfig();
  loadModelsForTester();

  // Auto-refresh every 8 seconds
  setInterval(() => {
    fetchStatus(true);
  }, 8000);
});

// Navigation Setup
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      const targetTab = item.getAttribute('data-tab');
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      const activePane = document.getElementById(`tab-${targetTab}`);
      if (activePane) activePane.classList.add('active');

      // Update Headings
      const headingMap = {
        dashboard: ['仪表盘概览', '实时监控 Trae、Cursor、WorkBuddy、Antigravity、Windsurf 与 VS Code 本地开发环境及调度网关'],
        trae: ['Trae 账号调度管理', '无缝切换 ByteDance Trae 账号、管理独立机器码与多开沙箱'],
        cursor: ['Cursor 账号调度管理', '无缝切换 Cursor 账号、读取本地会员信息与多开沙箱'],
        workbuddy: ['WorkBuddy 系列管理', '管理两个版本的额度与设备档案，以及 WorkBuddy 国内版签到'],
        antigravity: ['Antigravity 账号管理', '管理 Antigravity IDE 与 CLI 凭据与设备指纹'],
        windsurf: ['Windsurf 账号调度管理', '管理 Windsurf / Codeium 账号、沙箱隔离与机器码防风控'],
        vscode: ['VS Code / MarsCode 调度管理', '管理 VS Code / MarsCode 插件态、GitHub 会话与隔离多开'],
        security: ['机器码防风控中心', '深度伪装与随机化各 IDE 核心硬件指纹 (Trae / Cursor / Windsurf / VS Code / Antigravity / WorkBuddy)'],
        gateway: ['OpenAI 兼容 API 代理网关', '转发 WorkBuddy 当前实时模型目录，提供各 IDE 与外部工具直连调用'],
        tester: ['API 模型连通性测试中心', '对当前实时模型目录进行连通性体检、批量测速与交互式流式调试'],
        monitor: ['实时监控日志', '查看 API 请求吞吐量、响应延迟与异常诊断'],
        settings: ['系统与环境设置', '检测本地程序安装路径与配置目录']
      };

      if (headingMap[targetTab]) {
        document.getElementById('page-heading').innerText = headingMap[targetTab][0];
        document.getElementById('page-subheading').innerText = headingMap[targetTab][1];
      }
    });
  });
}

function switchNavTab(targetTab) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(n => {
    if (n.getAttribute('data-tab') === targetTab) {
      n.click();
    }
  });
}

function renderWorkBuddyEdition(prefix, status, tool) {
  const supportsCheckin = tool === 'workbuddy';
  const authConflict = Boolean(status?.auth?.repairAvailable);
  const badge = document.getElementById(`${prefix}-status-badge`);
  if (!badge) return;
  if (!status?.installed) {
    badge.className = 'badge badge-warning';
    badge.innerText = '未检测到程序';
    document.getElementById(`${prefix}-active-name`).innerText = status?.edition || '未安装';
    return;
  }

  badge.className = authConflict ? 'badge badge-danger' : (status.running ? 'badge badge-success' : 'badge badge-info');
  badge.innerText = authConflict ? '🔴 登录区域冲突' : (status.running ? '🟢 正在运行' : '⚪ 已安装（未运行）');
  document.getElementById(`${prefix}-active-name`).innerText =
    authConflict ? `${status.edition}登录不可用`
      : (status.activeAccount?.username ? `${status.edition}（${status.activeAccount.username}）` : status.edition);
  document.getElementById(`${prefix}-meta-text`).innerText =
    authConflict ? `错误登录域名：${status.auth.domain}`
      : (status.activeAccount?.userId ? `UID: ${status.activeAccount.userId.slice(0, 18)}... ｜ ${status.info?.name || status.edition}` : (status.info?.exe || ''));

  const points = status.credits?.points;
  const total = status.credits?.total;
  const used = status.credits?.used;
  document.getElementById(`${prefix}-credits-num`).innerText = Number.isFinite(points) ? points.toLocaleString() : '--';
  document.getElementById(`${prefix}-credits-sub`).innerText = Number.isFinite(total)
    ? `官方剩余 ${points.toLocaleString()} / 总量 ${total.toLocaleString()} / 已用 ${used.toLocaleString()}`
    : (status.error || '暂未取得官方额度');

  const freeOffers = status.freeModels || [];
  const freeEl = document.getElementById(`${prefix}-free-models`);
  if (freeEl) {
    freeEl.innerText = freeOffers.length
      ? `🎁 官方限时免费：${freeOffers.map(item => item.modelId).join('、')}`
      : '当前未发现官方零倍率模型活动';
    freeEl.title = freeOffers.map(item => `${item.modelId}：${item.description || item.label}`).join('\n');
  }

  const checkedIn = Boolean(status.checkin?.checkedIn);
  const tag = document.getElementById(`${prefix}-checkin-tag`);
  tag.className = checkedIn ? 'credit-tag done' : 'credit-tag';
  tag.innerText = !supportsCheckin ? '无签到功能'
    : (status.error ? '状态不可用'
      : (!status.checkin?.active ? '签到活动未开放' : (checkedIn ? '官方已签到' : '今日待签到')));

  const button = document.getElementById(`${prefix}-checkin-btn`);
  if (button) {
    button.innerHTML = checkedIn ? '<span class="icon">✅</span> 已签到' : '<span class="icon">🎁</span> 签到';
    button.disabled = Boolean(status.error) || !status.checkin?.active;
    button.onclick = () => doCheckin(tool);
  }

  const launch = document.getElementById(`${prefix}-launch-btn`);
  const stop = document.getElementById(`${prefix}-stop-btn`);
  const repair = document.getElementById(`${prefix}-repair-auth-btn`);
  if (launch && stop) {
    launch.disabled = authConflict;
    launch.style.opacity = status.running || authConflict ? '0.6' : '1';
    stop.style.opacity = status.running ? '1' : '0.6';
  }
  if (repair) repair.style.display = authConflict ? 'inline-flex' : 'none';
}

function renderGenericIdeStatus(prefix, status, defaultTitle) {
  const badge = document.getElementById(`${prefix}-status-badge`);
  if (!badge) return;
  if (!status || !status.installed) {
    badge.className = 'badge badge-warning';
    badge.innerText = '未检测到程序';
    const activeEl = document.getElementById(`${prefix}-active-name`);
    if (activeEl) activeEl.innerText = '未安装';
    const metaEl = document.getElementById(`${prefix}-meta-text`);
    if (metaEl) metaEl.innerText = status?.info?.configDir ? `配置: ${status.info.configDir}` : '未找到安装程序';
    return;
  }

  badge.className = status.running ? 'badge badge-success' : 'badge badge-info';
  badge.innerText = status.running ? '🟢 正在运行' : '⚪ 已就绪 (未运行)';
  const activeUser = status.activeAccount?.username ? `${defaultTitle} (${status.activeAccount.username})` : (status.info?.name || defaultTitle);
  const activeEl = document.getElementById(`${prefix}-active-name`);
  if (activeEl) activeEl.innerText = activeUser;

  const metaEl = document.getElementById(`${prefix}-meta-text`);
  if (metaEl) {
    metaEl.innerText = status.activeAccount?.email
      ? `邮箱: ${status.activeAccount.email}`
      : (status.info?.exe || status.info?.configDir || '');
  }

  const tier = status.activeAccount?.tier || 'Free';
  const credEl = document.getElementById(`${prefix}-credits-num`);
  if (credEl) credEl.innerText = tier;

  const credSub = document.getElementById(`${prefix}-credits-sub`);
  if (credSub) {
    credSub.innerText = status.activeAccount?.email
      ? `活跃账户: ${status.activeAccount.email}`
      : (status.info?.exe ? '本地已配置' : '就绪');
  }

  const launch = document.getElementById(`${prefix}-launch-btn`);
  const stop = document.getElementById(`${prefix}-stop-btn`);
  if (launch && stop) {
    launch.style.opacity = status.running ? '0.6' : '1';
    stop.style.opacity = status.running ? '1' : '0.6';
  }
}

// Fetch Full System Status
async function fetchStatus(silent = false) {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    globalStatus = data;

    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Trae Status & Credits
    const traeBadge = document.getElementById('trae-status-badge');
    if (data.trae && data.trae.installed) {
      traeBadge.className = data.trae.running ? 'badge badge-success' : 'badge badge-info';
      traeBadge.innerText = data.trae.running ? '🟢 正在运行' : '⚪ 已就绪 (未运行)';
      const primaryEdition = data.trae.editions.find(e => e.installed);
      const realUser = data.trae.activeAccount?.username ? `Trae (${data.trae.activeAccount.username})` : (primaryEdition ? primaryEdition.name : 'Trae Solo');
      document.getElementById('trae-active-name').innerText = realUser;
      document.getElementById('trae-meta-text').innerText = data.trae.activeAccount?.phone ? `手机: ${data.trae.activeAccount.phone} ｜ UID: ${data.trae.activeAccount.userId}` : (primaryEdition ? primaryEdition.exe : '');

      // Real Credits & Checkin
      const checkinPts = data.trae.checkin?.totalCredits;
      document.getElementById('trae-credits-num').innerText = Number.isFinite(checkinPts) ? checkinPts.toLocaleString() : '--';
      document.getElementById('trae-credits-sub').innerText = Number.isFinite(checkinPts)
        ? `今日官方签到奖励：${checkinPts} 分（不是账户余额）`
        : (data.trae.credits?.reason || '暂未取得官方签到数据');
      const isTraeCheckedIn = Boolean(data.trae.checkin?.checkedIn);
      const traeTag = document.getElementById('trae-checkin-tag');
      const traeBtn = document.getElementById('trae-checkin-btn');
      if (traeTag) {
        traeTag.className = isTraeCheckedIn ? 'credit-tag done' : 'credit-tag';
        traeTag.innerText = data.trae.checkin?.available ? (isTraeCheckedIn ? '官方已签到' : '今日待签到') : '状态不可用';
      }
      if (traeBtn) {
        traeBtn.innerHTML = isTraeCheckedIn ? '<span class="icon">✅</span> 官方已签到' : '<span class="icon">🎁</span> 官方签到';
        traeBtn.disabled = !data.trae.checkin?.available;
        if (isTraeCheckedIn) traeBtn.classList.add('checked-in');
        else traeBtn.classList.remove('checked-in');
      }

      const tLaunch = document.getElementById('trae-launch-btn');
      const tStop = document.getElementById('trae-stop-btn');
      if (tLaunch && tStop) {
        if (data.trae.running) {
          tLaunch.style.opacity = '0.6';
          tStop.style.opacity = '1';
        } else {
          tLaunch.style.opacity = '1';
          tStop.style.opacity = '0.6';
        }
      }
    } else {
      traeBadge.className = 'badge badge-warning';
      traeBadge.innerText = '未检测到程序';
      document.getElementById('trae-active-name').innerText = '未安装';
    }

    // 2. WorkBuddy AI international and WorkBuddy domestic
    renderWorkBuddyEdition('wbai', data.workbuddyAi, 'workbuddy-ai');
    renderWorkBuddyEdition('wb', data.workbuddy, 'workbuddy');

    // 3. Antigravity Status & Credits
    const agyBadge = document.getElementById('agy-status-badge');
    if (data.antigravity && data.antigravity.installed) {
      agyBadge.className = data.antigravity.running ? 'badge badge-success' : 'badge badge-info';
      agyBadge.innerText = data.antigravity.running ? '🟢 正在运行' : '⚪ 配置就绪';
      document.getElementById('agy-active-name').innerText = 'Antigravity (Google / IDE)';
      const mainTarget = data.antigravity.targets?.find(t => t.installed || t.configExists);
      document.getElementById('agy-meta-text').innerText = mainTarget ? (mainTarget.exe || mainTarget.configDir) : '配置就绪';

      const agyLowest = data.antigravity.quota?.lowestRemainingPercent;
      const agyModels = data.antigravity.quota?.models || [];
      document.getElementById('agy-credits-num').innerText = Number.isFinite(agyLowest) ? `${agyLowest}%` : '--';
      document.getElementById('agy-credits-sub').innerText = Number.isFinite(agyLowest)
        ? `官方逐模型配额中最低剩余；已获取 ${agyModels.length} 个模型`
        : (data.antigravity.error || '暂未取得 Google 官方配额');
      const agyTag = document.getElementById('agy-checkin-tag');
      if (agyTag) {
        agyTag.className = 'credit-tag';
        agyTag.innerText = '无签到功能';
      }

      const agyLaunch = document.getElementById('agy-launch-btn');
      const agyStop = document.getElementById('agy-stop-btn');
      if (agyLaunch && agyStop) {
        if (data.antigravity.running) {
          agyLaunch.style.opacity = '0.6';
          agyStop.style.opacity = '1';
        } else {
          agyLaunch.style.opacity = '1';
          agyStop.style.opacity = '0.6';
        }
      }
    } else {
      agyBadge.className = 'badge badge-info';
      agyBadge.innerText = '未启动';
      document.getElementById('agy-active-name').innerText = 'Antigravity 就绪';
    }

    // 3b. Cursor, Windsurf, VS Code / MarsCode
    renderGenericIdeStatus('cursor', data.cursor, 'Cursor');
    renderGenericIdeStatus('windsurf', data.windsurf, 'Windsurf');
    renderGenericIdeStatus('vscode', data.vscode, 'VS Code');

    // 4. Gateway Metrics
    if (data.gateway && data.gateway.metrics) {
      const m = data.gateway.metrics;
      document.getElementById('gateway-requests-val').innerText = `${m.totalRequests} 次调用`;
      document.getElementById('gateway-models-val').innerText = `已载入 ${data.gateway.availableModelsCount ?? 0} 个实时模型`;
      document.getElementById('mon-total-req').innerText = m.totalRequests;
      document.getElementById('mon-active-streams').innerText = m.activeStreams;
      document.getElementById('mon-avg-latency').innerText = `${m.averageLatencyMs} ms`;

      renderLogsTable(m.recentLogs);
    }

    // 5. Device Fingerprints
    if (data.trae && data.trae.deviceProfile) {
      const p = data.trae.deviceProfile;
      document.getElementById('dash-machine-id').innerText = p.machine_id ? p.machine_id.slice(0, 24) + '...' : '未生成';
      document.getElementById('dash-dev-uuid').innerText = p.dev_device_id || '未生成';
      document.getElementById('dash-sqm-id').innerText = p.sqm_id || '未生成';
      document.getElementById('dash-raw-id').innerText = p.raw_machineid_file || '未找到';

      renderFullFingerprint('trae-full-fingerprint', p);
    }

    if (data.workbuddy && data.workbuddy.deviceProfile) {
      renderWbFingerprint('wb-full-fingerprint', data.workbuddy.deviceProfile);
      renderWbCustomModels(data.workbuddy.customModels || []);
    }

    if (data.antigravity && data.antigravity.deviceProfile) {
      renderFullFingerprint('agy-full-fingerprint', data.antigravity.deviceProfile);
    }

    if (data.cursor && data.cursor.deviceProfile) {
      renderFullFingerprint('cursor-full-fingerprint', data.cursor.deviceProfile);
    }
    if (data.windsurf && data.windsurf.deviceProfile) {
      renderFullFingerprint('windsurf-full-fingerprint', data.windsurf.deviceProfile);
    }
    if (data.vscode && data.vscode.deviceProfile) {
      renderFullFingerprint('vscode-full-fingerprint', data.vscode.deviceProfile);
    }

    // 6. Models catalog
    if (data.gateway && data.gateway.availableModelsCount) {
      document.getElementById('model-count-num').innerText = data.gateway.availableModelsCount;
      fetchModelsList();
    }

    // 7. Update IDE status banner on Tester tab
    const tWbDot = document.getElementById('tester-wb-dot');
    const tWbDesc = document.getElementById('tester-wb-desc');
    if (tWbDot && data.workbuddy) {
      tWbDot.className = data.workbuddy.running ? 'ide-status-dot online' : 'ide-status-dot';
      if (tWbDesc) tWbDesc.innerText = data.workbuddy.auth?.compatible
        ? '官方模型 CLI 直连可用；自定义模型使用 18888'
        : (data.workbuddy.error || '国内版登录不可用');
    }

    const tTraeDot = document.getElementById('tester-trae-dot');
    const tTraeDesc = document.getElementById('tester-trae-desc');
    if (tTraeDot && data.trae) {
      tTraeDot.className = data.trae.running ? 'ide-status-dot online' : 'ide-status-dot';
      if (tTraeDesc) tTraeDesc.innerText = data.trae.running ? 'IDE 运行中 (OpenAI 协议接入)' : '已就绪 (未运行)';
    }

    const tAgyDot = document.getElementById('tester-agy-dot');
    const tAgyDesc = document.getElementById('tester-agy-desc');
    if (tAgyDot && data.antigravity) {
      tAgyDot.className = data.antigravity.running ? 'ide-status-dot online' : 'ide-status-dot';
      if (tAgyDesc) tAgyDesc.innerText = data.antigravity.running ? 'IDE 运行中 (配置已加载)' : '已就绪';
    }

  } catch (err) {
    if (!silent) console.error('Failed to fetch status:', err);
  }
}

// Fetch Accounts List
async function fetchAccounts() {
  try {
    const res = await fetch('/api/accounts');
    const data = await res.json();
    allAccounts = data.accounts || [];

    const traeAccounts = allAccounts.filter(a => a.tool === 'trae');
    const cursorAccounts = allAccounts.filter(a => a.tool === 'cursor');
    const wbAiAccounts = allAccounts.filter(a => a.tool === 'workbuddy-ai');
    const wbAccounts = allAccounts.filter(a => a.tool === 'workbuddy');
    const agyAccounts = allAccounts.filter(a => a.tool === 'antigravity');
    const windsurfAccounts = allAccounts.filter(a => a.tool === 'windsurf');
    const vscodeAccounts = allAccounts.filter(a => a.tool === 'vscode');

    const updateBadge = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    };

    updateBadge('trae-count-badge', traeAccounts.length);
    updateBadge('cursor-count-badge', cursorAccounts.length);
    updateBadge('wb-count-badge', wbAiAccounts.length + wbAccounts.length);
    updateBadge('agy-count-badge', agyAccounts.length);
    updateBadge('windsurf-count-badge', windsurfAccounts.length);
    updateBadge('vscode-count-badge', vscodeAccounts.length);

    updateBadge('trae-accounts-count', `${traeAccounts.length} 个账号档案`);
    updateBadge('cursor-accounts-count', `${cursorAccounts.length} 个账号档案`);
    updateBadge('wbai-accounts-count', `${wbAiAccounts.length} 个国际版档案`);
    updateBadge('wb-accounts-count', `${wbAccounts.length} 个账号档案`);
    updateBadge('agy-accounts-count', `${agyAccounts.length} 个账号档案`);
    updateBadge('windsurf-accounts-count', `${windsurfAccounts.length} 个账号档案`);
    updateBadge('vscode-accounts-count', `${vscodeAccounts.length} 个账号档案`);

    renderAccountsGrid('trae-accounts-list', traeAccounts);
    renderAccountsGrid('cursor-accounts-list', cursorAccounts);
    renderAccountsGrid('wbai-accounts-list', wbAiAccounts);
    renderAccountsGrid('wb-accounts-list', wbAccounts);
    renderAccountsGrid('agy-accounts-list', agyAccounts);
    renderAccountsGrid('windsurf-accounts-list', windsurfAccounts);
    renderAccountsGrid('vscode-accounts-list', vscodeAccounts);
  } catch (err) {
    console.error('Failed to fetch accounts:', err);
  }
}

// Render Accounts
function renderAccountsGrid(containerId, accounts) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (accounts.length === 0) {
    container.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <p style="color: var(--text-muted);">暂无账号档案，点击右上角“添加账号”或“捕获快照”开始使用。</p>
      </div>
    `;
    return;
  }

  container.innerHTML = accounts.map(acc => {
    const isCheckedIn = Boolean(acc.checkin?.checkedIn);
    const supportsCheckin = acc.tool === 'trae' ||
      (acc.tool === 'workbuddy' && acc.checkin?.active);
    const toolLabelMap = {
      trae: 'ByteDance Trae',
      cursor: 'Cursor',
      windsurf: 'Windsurf',
      vscode: 'VS Code / MarsCode',
      'workbuddy-ai': 'WorkBuddy AI（国际版）',
      workbuddy: 'WorkBuddy（国内版）',
      antigravity: 'Antigravity'
    };

    return `
    <div class="account-card ${acc.isCurrent ? 'active' : ''}">
      <div class="acc-card-header">
        <div class="acc-avatar">${(acc.name || 'U')[0].toUpperCase()}</div>
        <div class="acc-titles">
          <h4>${escapeHtml(acc.name)}</h4>
          <span>${escapeHtml(acc.email || '无邮箱')}</span>
        </div>
      </div>

      <div class="acc-details">
        <div class="acc-details-row">
          <span class="acc-details-label">所属平台:</span>
          <span class="badge ${acc.tool === 'trae' ? 'badge-primary' : (acc.tool.startsWith('workbuddy') ? 'badge-success' : 'badge-secondary')}">
            ${toolLabelMap[acc.tool] || acc.tool}
          </span>
        </div>
        <div class="acc-details-row">
          <span class="acc-details-label">订阅等级:</span>
          <span class="badge ${acc.tier === 'Free' ? 'badge-info' : 'badge-primary'}">${escapeHtml(acc.tier || '未知')}</span>
        </div>
        <div class="acc-details-row">
          <span class="acc-details-label">额度数据:</span>
          <span>请查看顶部官方实时状态</span>
        </div>
        <div class="acc-details-row">
          <span class="acc-details-label">每日签到:</span>
          <span style="font-size: 0.78rem; color: ${isCheckedIn ? 'var(--accent-emerald)' : 'var(--accent-amber)'}; font-weight: 600;">
            ${supportsCheckin ? (isCheckedIn ? '官方已签到' : '以实时状态为准') : '平台不提供签到'}
          </span>
        </div>
        <div class="acc-details-row">
          <span class="acc-details-label">用户备注:</span>
          <span>${escapeHtml(acc.customLabel || '默认')}</span>
        </div>
        ${acc.deviceProfile && acc.deviceProfile.machine_id ? `
        <div class="acc-details-row">
          <span class="acc-details-label">专属机器码:</span>
          <code style="font-size: 0.72rem; color: var(--accent-cyan);">${acc.deviceProfile.machine_id.slice(0, 16)}...</code>
        </div>
        ` : ''}
      </div>

      <div class="acc-card-actions">
        ${supportsCheckin ? `<button class="btn btn-sm btn-success ${isCheckedIn ? 'checked-in' : ''}" onclick="doCheckin('${acc.tool}')" title="通过平台官方接口签到">
          <span class="icon">${isCheckedIn ? '✅' : '🎁'}</span> ${isCheckedIn ? '已签到' : '签到'}
        </button>` : ''}
        ${acc.isCurrent ? `
          <button class="btn btn-sm btn-secondary" disabled>正在生效</button>
        ` : `
          <button class="btn btn-sm btn-primary" onclick="switchAccount('${acc.id}')">⚡ 切换账号</button>
        `}
        <button class="btn btn-sm btn-outline" onclick="launchIsolatedForAccount('${acc.id}')" title="使用该账号开启独立隔离窗口多开">🪟 多开启动</button>
        <button class="btn btn-sm btn-danger" onclick="deleteAccount('${acc.id}')">删除</button>
      </div>
    </div>
  `;}).join('');
}

// Render Fingerprint
function renderFullFingerprint(elementId, profile) {
  const el = document.getElementById(elementId);
  if (!el || !profile) return;

  el.innerHTML = `
    <div class="code-box">
      <div class="code-line">
        <span class="code-label">telemetry.machineId:</span>
        <span class="code-val">${profile.machine_id || '未生成'}</span>
      </div>
      <div class="code-line">
        <span class="code-label">telemetry.devDeviceId:</span>
        <span class="code-val">${profile.dev_device_id || '未生成'}</span>
      </div>
      <div class="code-line">
        <span class="code-label">telemetry.sqmId:</span>
        <span class="code-val">${profile.sqm_id || '未生成'}</span>
      </div>
      <div class="code-line">
        <span class="code-label">machineid 文件:</span>
        <span class="code-val">${profile.raw_machineid_file || '未创建'}</span>
      </div>
    </div>
  `;
}

// Render Request Logs Table
function renderLogsTable(logs) {
  const tbody = document.getElementById('logs-tbody');
  if (!tbody) return;

  if (!logs || logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">暂无近期调用记录</td></tr>';
    return;
  }

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td>${new Date(l.timestamp).toLocaleTimeString()}</td>
      <td><code>${escapeHtml(l.model)}</code></td>
      <td><span class="badge ${l.stream ? 'badge-info' : 'badge-primary'}">${l.stream ? 'SSE 流式' : 'JSON'}</span></td>
      <td>${l.durationMs} ms</td>
      <td><span class="badge ${l.status >= 200 && l.status < 300 ? 'badge-success' : 'badge-danger'}">${l.status}</span></td>
      <td>${escapeHtml(l.clientIp)}</td>
    </tr>
  `).join('');
}

// Fetch Models list for Tags
async function fetchModelsList() {
  try {
    const res = await fetch('/api/models');
    const data = await res.json();
    const tagsContainer = document.getElementById('models-list-tags');
    if (tagsContainer && data.models) {
      tagsContainer.innerHTML = data.models.slice(0, 36).map(m => {
        const comp = m.companyShort || m.company || '官方';
        const badgeClass = m.badgeClass || 'badge-official';
        const creditLabel = getModelCreditLabel(m);
        return `
          <span class="model-tag" title="${escapeHtml(m.company || '')} - ${escapeHtml(m.id)} - ${escapeHtml(creditLabel)}" style="display:inline-flex; align-items:center; gap:0.25rem;">
            <span class="company-badge ${badgeClass}" style="margin:0; padding:0.05rem 0.35rem; font-size:0.68rem;">${escapeHtml(comp)}</span>
            <span>${escapeHtml(m.name || m.id)}</span>
            <span class="model-credit-badge ${m.isFree ? 'free' : ''}">${escapeHtml(creditLabel)}</span>
          </span>
        `;
      }).join('');
      if (data.models.length > 36) {
        tagsContainer.innerHTML += `<span class="model-tag" style="background: rgba(139,92,246,0.2);">+${data.models.length - 36} 更多</span>`;
      }
    }
  } catch (e) {}
}

// Fetch Trae Config Snippet
async function fetchTraeConfig() {
  try {
    const res = await fetch('/api/proxy/trae-config');
    const data = await res.json();
    const snippetEl = document.getElementById('trae-json-snippet');
    if (snippetEl) {
      snippetEl.innerText = JSON.stringify(data, null, 2);
    }
  } catch (e) {}
}

// Switch Account
async function switchAccount(id) {
  const account = allAccounts.find(item => item.id === id);
  const toolLabelMap = {
    trae: 'Trae',
    cursor: 'Cursor',
    windsurf: 'Windsurf',
    vscode: 'VS Code / MarsCode',
    'workbuddy-ai': 'WorkBuddy AI（国际版）',
    workbuddy: 'WorkBuddy（国内版）',
    antigravity: 'Antigravity'
  };
  const toolName = toolLabelMap[account?.tool] || account?.tool || 'IDE';
  const prompt = `确认切换到该 ${toolName} 账号档案？\n系统将同步专属机器码并在存在会话快照时还原对应会话。`;
  if (!confirm(prompt)) return;

  try {
    const res = await fetch(`/api/accounts/${id}/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoRestart: false })
    });
    const data = await res.json();
    if (data.success) {
      alert(`🎉 账号档案已成功切换并生效：${data.account.name}`);
      fetchStatus();
      fetchAccounts();
    } else {
      alert('切换失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('请求失败: ' + err.message);
  }
}

// Delete Account
async function deleteAccount(id) {
  if (!confirm('确定要删除此账号档案吗？')) return;
  try {
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    fetchAccounts();
  } catch (err) {
    alert('删除失败: ' + err.message);
  }
}

// Reset Trae Machine Code
async function resetTraeMachineId() {
  if (!confirm('确定要为 Trae 重新生成随机机器码吗？\n这将生成全新的 4 项硬件遥测指纹，有效防止多账号关联风控。')) return;

  try {
    const res = await fetch('/api/trae/reset-machine-id', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(`🛡 Trae 机器码已成功随机重置！\n全新 MachineId: ${data.profile.machine_id.slice(0, 16)}...\n全新 UUID: ${data.profile.dev_device_id}`);
      fetchStatus();
    }
  } catch (err) {
    alert('重置失败: ' + err.message);
  }
}

// Reset Antigravity Machine Code
async function resetAgyMachineId() {
  if (!confirm('确定要为 Antigravity 重新生成随机机器码吗？')) return;

  try {
    const res = await fetch('/api/antigravity/reset-machine-id', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(`🛡 Antigravity 机器码已成功伪装重置！\n全新 MachineId: ${data.profile.machine_id.slice(0, 16)}...`);
      fetchStatus();
    }
  } catch (err) {
    alert('重置失败: ' + err.message);
  }
}

// Create Trae Snapshot
async function createTraeSnapshot() {
  const name = prompt('请输入新 Trae 账号备份名称：', `Trae 备份 (${new Date().toLocaleTimeString()})`);
  if (!name) return;

  try {
    const res = await fetch('/api/trae/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (data.success) {
      alert(`📸 成功将当前 Trae 会话与机器码备份为独立账号: ${data.account.name}`);
      fetchAccounts();
      fetchStatus();
    } else {
      alert('备份失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('备份失败: ' + err.message);
  }
}

// Create WorkBuddy Snapshot
async function createWorkBuddySnapshot(editionId = 'workbuddy') {
  const nameLabel = workBuddyEditionName(editionId);
  const defaultName = `${nameLabel} 备份 (${new Date().toLocaleTimeString()})`;
  const name = prompt(`请输入新 ${nameLabel} 档案备份名称：`, defaultName);
  if (!name) return;

  try {
    const res = await fetch(`/api/${editionId}/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (data.success) {
      alert(`📸 成功将当前 ${nameLabel} 会话与设备标识备份为独立档案: ${data.account.name}`);
      fetchAccounts();
      fetchStatus();
    } else {
      alert('备份失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('备份请求失败: ' + err.message);
  }
}

// Create Antigravity Snapshot
async function createAntigravitySnapshot() {
  const defaultName = `Antigravity 备份 (${new Date().toLocaleTimeString()})`;
  const name = prompt('请输入新 Antigravity 账号档案名称：', defaultName);
  if (!name) return;

  try {
    const res = await fetch('/api/antigravity/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (data.success) {
      alert(`📸 成功将当前 Antigravity 登录会话与核心指纹备份为独立档案: ${data.account.name}`);
      fetchAccounts();
      fetchStatus();
    } else {
      alert('备份失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('备份请求失败: ' + err.message);
  }
}

// Launch Trae
async function launchTrae() {
  try {
    const res = await fetch('/api/trae/launch', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('🚀 Trae 启动成功！');
      setTimeout(fetchStatus, 1500);
    } else {
      alert('启动失败: ' + data.error);
    }
  } catch (err) {
    alert('请求失败: ' + err.message);
  }
}

// Close Trae
async function closeTrae() {
  if (!confirm('确定要停止 Trae 进程吗？')) return;
  try {
    const res = await fetch('/api/trae/close', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('⏹️ Trae 进程已成功停止！');
      setTimeout(fetchStatus, 1000);
    } else {
      alert('停止失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('请求失败: ' + err.message);
  }
}

// Launch Trae Isolated
async function launchTraeIsolated() {
  const instanceId = prompt('请输入 Trae 多开沙箱名称 (英文/数字)：', 'sub_dev_' + Math.floor(Math.random() * 1000));
  if (!instanceId) return;

  try {
    const res = await fetch('/api/trae/launch-isolated', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId })
    });
    const data = await res.json();
    if (data.success) {
      alert(`🪟 Trae 多开沙箱窗口已启动！\n沙箱目录: ${data.instanceDataDir}`);
      setTimeout(fetchStatus, 1500);
    } else {
      alert('启动失败: ' + data.error);
    }
  } catch (err) {
    alert('请求失败: ' + err.message);
  }
}

// Launch WorkBuddy Isolated
async function launchWorkBuddyIsolated(editionId = 'workbuddy') {
  const nameLabel = workBuddyEditionName(editionId);
  const instanceId = prompt(`请输入 ${nameLabel} 多开沙箱名称 (英文/数字)：`, `wb_${editionId === 'workbuddy-ai' ? 'ai_' : ''}` + Math.floor(Math.random() * 1000));
  if (!instanceId) return;

  try {
    const res = await fetch(`/api/${editionId}/launch-isolated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId })
    });
    const data = await res.json();
    if (data.success) {
      alert(`🪟 ${nameLabel} 隔离多开沙箱窗口已启动！\n沙箱目录: ${data.instanceDataDir}`);
      setTimeout(fetchStatus, 1500);
    } else {
      alert('启动失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('请求失败: ' + err.message);
  }
}

// Launch Antigravity Isolated
async function launchAntigravityIsolated() {
  const instanceId = prompt('请输入 Antigravity 多开沙箱名称 (英文/数字)：', 'agy_' + Math.floor(Math.random() * 1000));
  if (!instanceId) return;

  try {
    const res = await fetch('/api/antigravity/launch-isolated', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId })
    });
    const data = await res.json();
    if (data.success) {
      alert(`🪟 Antigravity 隔离多开沙箱窗口已启动！\n沙箱目录: ${data.instanceDataDir}`);
      setTimeout(fetchStatus, 1500);
    } else {
      alert('启动失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('请求失败: ' + err.message);
  }
}

// Generic IDE Functions (Cursor, Windsurf, VS Code / MarsCode)
async function launchGenericIde(tool) {
  const names = { cursor: 'Cursor', windsurf: 'Windsurf', vscode: 'VS Code' };
  const name = names[tool] || tool;
  try {
    const res = await fetch(`/api/${tool}/launch`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(`🚀 ${name} 启动成功！`);
      setTimeout(fetchStatus, 1500);
    } else {
      alert('启动失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('请求失败: ' + err.message);
  }
}

async function closeGenericIde(tool) {
  const names = { cursor: 'Cursor', windsurf: 'Windsurf', vscode: 'VS Code' };
  const name = names[tool] || tool;
  if (!confirm(`确定要停止 ${name} 进程吗？`)) return;
  try {
    const res = await fetch(`/api/${tool}/close`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(`⏹️ ${name} 进程已成功停止！`);
      setTimeout(fetchStatus, 1000);
    } else {
      alert('停止失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('请求失败: ' + err.message);
  }
}

async function launchIsolatedGenericIde(tool) {
  const names = { cursor: 'Cursor', windsurf: 'Windsurf', vscode: 'VS Code' };
  const name = names[tool] || tool;
  const instanceId = prompt(`请输入 ${name} 多开沙箱名称 (英文/数字)：`, `${tool}_dev_` + Math.floor(Math.random() * 1000));
  if (!instanceId) return;

  try {
    const res = await fetch(`/api/${tool}/launch-isolated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId })
    });
    const data = await res.json();
    if (data.success) {
      alert(`🪟 ${name} 多开沙箱窗口已启动！\n沙箱目录: ${data.instanceDataDir}`);
      setTimeout(fetchStatus, 1500);
    } else {
      alert('启动失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('请求失败: ' + err.message);
  }
}

async function resetGenericIdeMachineId(tool) {
  const names = { cursor: 'Cursor', windsurf: 'Windsurf', vscode: 'VS Code' };
  const name = names[tool] || tool;
  if (!confirm(`确定要为 ${name} 重新生成随机机器码吗？\n这将生成全新 4 项硬件遥测指纹，有效防止多账号关联风控。`)) return;

  try {
    const res = await fetch(`/api/${tool}/reset-machine-id`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(`🛡 ${name} 机器码已成功随机重置！\n全新 MachineId: ${data.profile.machine_id ? data.profile.machine_id.slice(0, 16) + '...' : '已更新'}\n全新 UUID: ${data.profile.dev_device_id || '已生成'}`);
      fetchStatus();
    } else {
      alert('重置失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('重置失败: ' + err.message);
  }
}

async function createGenericIdeSnapshot(tool) {
  const names = { cursor: 'Cursor', windsurf: 'Windsurf', vscode: 'VS Code' };
  const name = names[tool] || tool;
  const accName = prompt(`请输入新 ${name} 账号备份名称：`, `${name} 备份 (${new Date().toLocaleTimeString()})`);
  if (!accName) return;

  try {
    const res = await fetch(`/api/${tool}/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: accName })
    });
    const data = await res.json();
    if (data.success) {
      alert(`📸 成功将当前 ${name} 会话与机器码备份为独立账号: ${data.account.name}`);
      fetchAccounts();
      fetchStatus();
    } else {
      alert('备份失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('备份失败: ' + err.message);
  }
}

// Universal Isolated Launcher for any Account
async function launchIsolatedForAccount(accountId) {
  const acc = allAccounts.find(item => item.id === accountId);
  const tool = acc?.tool || 'trae';
  const toolNameMap = {
    trae: 'Trae',
    cursor: 'Cursor',
    windsurf: 'Windsurf',
    vscode: 'VS Code / MarsCode',
    'workbuddy-ai': 'WorkBuddy AI（国际版）',
    workbuddy: 'WorkBuddy（国内版）',
    antigravity: 'Antigravity'
  };
  const name = toolNameMap[tool] || tool;

  let endpoint = '/api/trae/launch-isolated';
  if (tool === 'workbuddy-ai') endpoint = '/api/workbuddy-ai/launch-isolated';
  else if (tool === 'workbuddy') endpoint = '/api/workbuddy/launch-isolated';
  else if (tool === 'antigravity') endpoint = '/api/antigravity/launch-isolated';
  else if (tool === 'cursor' || tool === 'windsurf' || tool === 'vscode') endpoint = `/api/${tool}/launch-isolated`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId: accountId })
    });
    const data = await res.json();
    if (data.success) {
      alert(`🪟 已为账号 [${acc?.name || accountId}] 启动独立隔离沙箱 ${name}！\n沙箱目录: ${data.instanceDataDir}`);
    } else {
      alert('启动失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('启动失败: ' + err.message);
  }
}

// Universal Quick Action Modal Logic
let currentQuickActionType = 'snapshot';

function openQuickActionModal(actionType = 'snapshot') {
  currentQuickActionType = actionType;
  const modal = document.getElementById('quick-action-modal');
  if (!modal) return;

  const titleEl = document.getElementById('qa-modal-title');
  const descEl = document.getElementById('qa-modal-desc');
  const inputGroup = document.getElementById('qa-input-group');
  const inputLabel = document.getElementById('qa-input-label');
  const confirmBtn = document.getElementById('qa-confirm-btn');

  if (actionType === 'snapshot') {
    titleEl.innerText = '📸 全平台会话快照捕获';
    descEl.innerText = '请选择目标 IDE，一键将当前打开的会话与机器码完整备份为独立档案：';
    inputGroup.style.display = 'block';
    inputLabel.innerText = '快照备份名称';
    confirmBtn.innerText = '立即备份';
  } else if (actionType === 'isolated') {
    titleEl.innerText = '🪟 全平台多开隔离沙箱';
    descEl.innerText = '请选择目标 IDE，在全新独立的用户数据目录中启动一个互不干扰的多开窗口：';
    inputGroup.style.display = 'block';
    inputLabel.innerText = '隔离沙箱名称 (英文/数字)';
    confirmBtn.innerText = '启动多开沙箱';
  } else if (actionType === 'reset') {
    titleEl.innerText = '🛡 全平台硬件指纹与急救重置';
    descEl.innerText = '请选择目标 IDE，为其伪造/随机化底层硬件设备标识与遥测机器码：';
    inputGroup.style.display = 'none';
    confirmBtn.innerText = '立即急救重置';
  }

  onQuickActionToolChange();
  modal.classList.add('active');
}

function closeQuickActionModal() {
  const modal = document.getElementById('quick-action-modal');
  if (modal) modal.classList.remove('active');
}

function onQuickActionToolChange() {
  const tool = document.getElementById('qa-target-tool').value;
  const inputVal = document.getElementById('qa-input-val');
  const hintEl = document.getElementById('qa-extra-hint');
  const toolNameMap = {
    trae: 'ByteDance Trae',
    cursor: 'Cursor',
    workbuddy: 'WorkBuddy（国内版）',
    'workbuddy-ai': 'WorkBuddy AI（国际版）',
    antigravity: 'Google Antigravity',
    windsurf: 'Windsurf',
    vscode: 'VS Code / MarsCode'
  };
  const name = toolNameMap[tool] || tool;
  const timeStr = new Date().toLocaleTimeString();

  if (currentQuickActionType === 'snapshot') {
    inputVal.value = `${name} 备份 (${timeStr})`;
    hintEl.innerText = `💡 提示：将读取 ${name} 当前客户端活跃会话与专属设备标识并保存在本地独立档案中。`;
  } else if (currentQuickActionType === 'isolated') {
    inputVal.value = `${tool.replace(/-/g, '_')}_sandbox_` + Math.floor(Math.random() * 1000);
    hintEl.innerText = `💡 提示：将使用 --user-data-dir 参数启动一个全新的独立 ${name} 窗口，不会影响主窗口和既有账号。`;
  } else if (currentQuickActionType === 'reset') {
    if (tool === 'trae') {
      hintEl.innerText = '⚡ Trae：将全新随机化 machine_id, dev_device_id, mac_machine_id, sqm_id 4项遥测指纹。';
    } else if (tool === 'antigravity') {
      hintEl.innerText = '🛸 Antigravity：将随机伪装 storage.json 与 machineid 核心硬件指纹。';
    } else if (tool === 'cursor' || tool === 'windsurf' || tool === 'vscode') {
      hintEl.innerText = `🛡️ ${name}：将随机重置 storage.json 中的 machineId, devDeviceId, sqmId 与 machineid 文件。`;
    } else {
      hintEl.innerText = `🤖 ${name}：将随机重置 device-id 与腾讯 Qimei36/16 标识并清除风控缓存。`;
    }
  }
}

async function executeQuickAction() {
  const tool = document.getElementById('qa-target-tool').value;
  const val = document.getElementById('qa-input-val').value.trim();

  closeQuickActionModal();

  if (currentQuickActionType === 'snapshot') {
    if (tool === 'trae') {
      try {
        const res = await fetch('/api/trae/snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: val })
        });
        const data = await res.json();
        if (data.success) {
          alert(`📸 成功将当前 Trae 会话备份为新档案: ${data.account.name}`);
          fetchAccounts();
          fetchStatus();
        } else alert('备份失败: ' + (data.error || '未知错误'));
      } catch (e) { alert('请求失败: ' + e.message); }
    } else if (tool === 'antigravity') {
      try {
        const res = await fetch('/api/antigravity/snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: val })
        });
        const data = await res.json();
        if (data.success) {
          alert(`📸 成功将当前 Antigravity 会话备份为新档案: ${data.account.name}`);
          fetchAccounts();
          fetchStatus();
        } else alert('备份失败: ' + (data.error || '未知错误'));
      } catch (e) { alert('请求失败: ' + e.message); }
    } else if (tool === 'cursor' || tool === 'windsurf' || tool === 'vscode') {
      try {
        const res = await fetch(`/api/${tool}/snapshot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: val })
        });
        const data = await res.json();
        if (data.success) {
          const names = { cursor: 'Cursor', windsurf: 'Windsurf', vscode: 'VS Code' };
          alert(`📸 成功将当前 ${names[tool] || tool} 会话备份为新档案: ${data.account.name}`);
          fetchAccounts();
          fetchStatus();
        } else alert('备份失败: ' + (data.error || '未知错误'));
      } catch (e) { alert('请求失败: ' + e.message); }
    } else {
      try {
        const res = await fetch(`/api/${tool}/snapshot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: val })
        });
        const data = await res.json();
        if (data.success) {
          alert(`📸 成功将当前 ${workBuddyEditionName(tool)} 会话备份为新档案: ${data.account.name}`);
          fetchAccounts();
          fetchStatus();
        } else alert('备份失败: ' + (data.error || '未知错误'));
      } catch (e) { alert('请求失败: ' + e.message); }
    }
  } else if (currentQuickActionType === 'isolated') {
    const instanceId = val || 'sandbox_' + Date.now().toString(36);
    let endpoint = '/api/trae/launch-isolated';
    if (tool === 'workbuddy' || tool === 'workbuddy-ai') endpoint = `/api/${tool}/launch-isolated`;
    else if (tool === 'antigravity') endpoint = '/api/antigravity/launch-isolated';
    else if (tool === 'cursor' || tool === 'windsurf' || tool === 'vscode') endpoint = `/api/${tool}/launch-isolated`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🪟 隔离多开沙箱已启动！\n沙箱目录: ${data.instanceDataDir}`);
        setTimeout(fetchStatus, 1500);
      } else {
        alert('启动失败: ' + (data.error || '未知错误'));
      }
    } catch (e) { alert('请求失败: ' + e.message); }
  } else if (currentQuickActionType === 'reset') {
    if (tool === 'trae') {
      resetTraeMachineId();
    } else if (tool === 'antigravity') {
      resetAgyMachineId();
    } else if (tool === 'cursor' || tool === 'windsurf' || tool === 'vscode') {
      resetGenericIdeMachineId(tool);
    } else {
      resetWorkBuddyDeviceId(tool);
    }
  }
}

// Copy Trae Config
function copyTraeConfig() {
  const snippet = document.getElementById('trae-json-snippet').innerText;
  copyText(snippet);
  alert('📋 Trae 自定义模型配置已成功复制到剪贴板！');
}

// Copy Text Helper
function copyText(text) {
  navigator.clipboard.writeText(text);
}

// Modal handling
function openAddAccountModal(tool = 'trae') {
  document.getElementById('acc-tool').value = tool;
  document.getElementById('acc-name').value = '';
  document.getElementById('acc-email').value = '';
  document.getElementById('account-modal').classList.add('active');
}

function closeAccountModal() {
  document.getElementById('account-modal').classList.remove('active');
}

async function saveAccountFromModal() {
  const tool = document.getElementById('acc-tool').value;
  const name = document.getElementById('acc-name').value.trim();
  const email = document.getElementById('acc-email').value.trim();
  const tier = document.getElementById('acc-tier').value;

  if (!name) {
    alert('请输入账号名称');
    return;
  }

  try {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool,
        name,
        email,
        tier,
        isCurrent: false
      })
    });
    const data = await res.json();
    if (data.success) {
      closeAccountModal();
      fetchAccounts();
    }
  } catch (err) {
    alert('添加失败: ' + err.message);
  }
}

// WorkBuddy Custom Models Render
function renderWbCustomModels(models) {
  const tbody = document.getElementById('wb-custom-models-tbody');
  if (!tbody) return;

  if (!models || models.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: var(--text-muted);">暂无自定义模型，可点击右上角添加。</td></tr>';
    return;
  }

  tbody.innerHTML = models.map(m => `
    <tr>
      <td><code>${escapeHtml(m.id)}</code></td>
      <td><strong>${escapeHtml(m.name || m.id)}</strong></td>
      <td><span class="badge badge-info">${escapeHtml(m.vendor || 'Custom')}</span></td>
      <td><code style="font-size: 0.75rem;">${escapeHtml(m.url || '默认')}</code></td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteCustomModel('${escapeHtml(m.id)}')">删除</button>
      </td>
    </tr>
  `).join('');
}

// WorkBuddy Fingerprint Render
function renderWbFingerprint(elementId, profile) {
  const el = document.getElementById(elementId);
  if (!el || !profile) return;

  el.innerHTML = `
    <div class="code-box">
      <div class="code-line">
        <span class="code-label">device-id (UUID):</span>
        <span class="code-val">${profile.device_id || '未创建'}</span>
      </div>
      <div class="code-line">
        <span class="code-label">Tencent Qimei:</span>
        <span class="code-val">${profile.qimei36 || '未生成'}</span>
      </div>
      <div class="code-line">
        <span class="code-label">Owner UID:</span>
        <span class="code-val">${profile.owner_uid || '无'}</span>
      </div>
    </div>
  `;
}

function workBuddyEditionName(editionId) {
  return editionId === 'workbuddy-ai' ? 'WorkBuddy AI（国际版）' : 'WorkBuddy（国内版）';
}

// Launch a specific WorkBuddy edition
async function launchWorkBuddy(editionId = 'workbuddy-ai') {
  const name = workBuddyEditionName(editionId);
  try {
    const res = await fetch(`/api/${editionId}/launch`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(`🚀 ${name}客户端启动成功！`);
      setTimeout(fetchStatus, 1500);
    } else {
      alert('启动失败: ' + data.error);
    }
  } catch (err) {
    alert('请求失败: ' + err.message);
  }
}

async function repairWorkBuddyLogin(editionId) {
  const name = workBuddyEditionName(editionId);
  if (!confirm(`将关闭 ${name}，备份并隔离当前跨区登录态，然后重新打开登录页。是否继续？`)) return;
  try {
    const res = await fetch(`/api/${editionId}/repair-auth`, { method: 'POST' });
    const data = await res.json();
    if (!data.success) {
      alert('修复失败: ' + (data.error || '未知错误'));
      return;
    }
    const backup = data.backupFile ? `\n备份文件：${data.backupFile}` : '';
    alert(`✅ ${data.message}${backup}`);
    setTimeout(fetchStatus, 1500);
  } catch (err) {
    alert('修复请求失败: ' + err.message);
  }
}

// Close a specific WorkBuddy edition
async function closeWorkBuddy(editionId = 'workbuddy-ai') {
  const name = workBuddyEditionName(editionId);
  if (!confirm(`确定要停止 ${name}进程吗？`)) return;
  try {
    const res = await fetch(`/api/${editionId}/close`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(`⏹️ ${name}进程已成功停止！`);
      setTimeout(fetchStatus, 1000);
    } else {
      alert('停止失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('请求失败: ' + err.message);
  }
}

// Launch Antigravity
async function launchAntigravity() {
  try {
    const res = await fetch('/api/antigravity/launch', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('🚀 Antigravity 启动成功！');
      setTimeout(fetchStatus, 1500);
    } else {
      alert('启动失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('请求失败: ' + err.message);
  }
}

// Close Antigravity
async function closeAntigravity() {
  if (!confirm('确定要停止 Antigravity 进程吗？')) return;
  try {
    const res = await fetch('/api/antigravity/close', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('⏹️ Antigravity 进程已成功停止！');
      setTimeout(fetchStatus, 1000);
    } else {
      alert('停止失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('请求失败: ' + err.message);
  }
}

// Daily Check-in / Claim Points
async function doCheckinAll() {
  if (!confirm('确认一键签到 Trae 与 WorkBuddy 国内版？未开放的签到活动会自动跳过。')) return;
  const button = document.getElementById('checkin-all-btn');
  const original = button?.innerHTML;
  if (button) {
    button.disabled = true;
    button.innerHTML = '<span class="icon">⏳</span> 正在逐个平台处理...';
  }

  try {
    const res = await fetch('/api/checkin/all', { method: 'POST' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '批量签到失败');

    const icon = { success: '✅', already: 'ℹ️', skipped: '⏭️', failed: '❌' };
    const lines = data.results.map(item => {
      const details = [];
      if (Number.isFinite(item.reward)) details.push(`奖励 ${item.reward.toLocaleString()} 分`);
      if (Number.isFinite(item.totalCredits)) details.push(`剩余 ${item.totalCredits.toLocaleString()} 分`);
      return `${icon[item.status] || '•'} ${item.name}：${item.message}${details.length ? `（${details.join('，')}）` : ''}`;
    });
    const summary = data.summary;
    alert(`一键签到处理完成\n\n${lines.join('\n')}\n\n成功 ${summary.success} / 已签到 ${summary.already} / 跳过 ${summary.skipped} / 失败 ${summary.failed}`);
    await Promise.all([fetchStatus(), fetchAccounts()]);
  } catch (error) {
    alert('一键签到失败：' + error.message);
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = original;
    }
  }
}

async function doCheckin(tool) {
  const toolNameMap = {
    trae: 'ByteDance Trae',
    'workbuddy-ai': 'WorkBuddy AI（国际版）',
    workbuddy: 'WorkBuddy（国内版）',
    antigravity: 'Google Antigravity'
  };
  const name = toolNameMap[tool] || tool;

  try {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool })
    });
    const data = await res.json();

    if (data.success) {
      const details = [];
      if (Number.isFinite(data.reward)) details.push(`本次官方奖励：${data.reward.toLocaleString()} 分`);
      if (Number.isFinite(data.totalCredits)) details.push(`官方剩余额度：${data.totalCredits.toLocaleString()} 分`);
      alert(`${data.alreadyCheckedIn ? 'ℹ️' : '🎉'} 【${name}】\n${data.message}${details.length ? `\n${details.join('\n')}` : ''}`);
      fetchStatus();
      fetchAccounts();
    } else {
      alert('签到失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('签到请求失败: ' + err.message);
  }
}

// Reset WorkBuddy Device ID & Qimei
async function resetWorkBuddyDeviceId(editionId = 'workbuddy-ai') {
  const name = workBuddyEditionName(editionId);
  if (!confirm(`确定要为 ${name}重新生成随机 Device-ID 与腾讯 Qimei 指纹吗？\n\n⚠️ 提示：重置设备特征码将隔离硬件关联，服务端可能需要您重新授权登录。`)) return;

  try {
    const res = await fetch(`/api/${editionId}/reset-device-id`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(`🛡 ${name}设备标识重置成功！\n全新 Device ID: ${data.profile.device_id}\n全新 Qimei36: ${data.profile.qimei36}`);
      fetchStatus();
    } else {
      alert('重置失败: ' + (data.error || '未知错误'));
    }
  } catch (err) {
    alert('重置失败: ' + err.message);
  }
}

// Custom Model Modal
function openAddCustomModelModal() {
  document.getElementById('cm-id').value = '';
  document.getElementById('cm-name').value = '';
  document.getElementById('cm-url').value = '';
  document.getElementById('cm-key').value = '';
  document.getElementById('custom-model-modal').classList.add('active');
}

function closeCustomModelModal() {
  document.getElementById('custom-model-modal').classList.remove('active');
}

async function saveCustomModel() {
  const id = document.getElementById('cm-id').value.trim();
  const name = document.getElementById('cm-name').value.trim();
  const url = document.getElementById('cm-url').value.trim();
  const apiKey = document.getElementById('cm-key').value.trim();

  if (!id) {
    alert('请输入模型 ID');
    return;
  }

  try {
    const res = await fetch('/api/workbuddy/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        name: name || id,
        vendor: 'Custom',
        url: url || 'https://api.openai.com/v1',
        apiKey: apiKey || '',
        supportsToolCall: true,
        supportsImages: true,
        supportsReasoning: true,
        useCustomProtocol: false
      })
    });
    const data = await res.json();
    if (data.success) {
      closeCustomModelModal();
      renderWbCustomModels(data.models);
      alert('🎉 成功添加 WorkBuddy 自定义模型: ' + id);
    }
  } catch (err) {
    alert('添加失败: ' + err.message);
  }
}

async function deleteCustomModel(modelId) {
  if (!confirm(`确定要从 WorkBuddy 中移除自定义模型 "${modelId}" 吗？`)) return;

  try {
    const res = await fetch(`/api/workbuddy/models/${encodeURIComponent(modelId)}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      renderWbCustomModels(data.models);
      alert('已删除模型: ' + modelId);
    }
  } catch (err) {
    alert('删除失败: ' + err.message);
  }
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* =========================================================================
   MODEL TESTER & PLAYGROUND MODULE
   ========================================================================= */

let testModelsCatalog = [];
let modelTestResults = {};
let isBatchRunning = false;
let stopBatchRequested = false;
let currentTestFilter = 'all';

const CORE_MODEL_IDS = [
  'deepseek-v4-pro',
  'default-1.2',
  'deepseek-r1-0528',
  'deepseek-v3-0324',
  'hunyuan-2.0-instruct',
  'claude-sonnet-5',
  'grok-4.6',
  'kling-v3-t2v',
  'kling-v3-i2v'
];

// Helper: Determine vendor/family
function getModelFamily(id, ownedBy = '', modelObj = null) {
  if (modelObj && modelObj.company) {
    return {
      name: modelObj.company,
      badge: modelObj.companyShort || modelObj.company,
      badgeClass: modelObj.badgeClass || 'badge-official'
    };
  }
  const low = (id || '').toLowerCase();
  if (low.includes('deepseek')) return { name: '深度求索 DeepSeek', badge: 'DeepSeek', badgeClass: 'badge-deepseek' };
  if (low.includes('claude') || low.includes('default-1.2')) return { name: 'Anthropic Claude', badge: 'Claude', badgeClass: 'badge-anthropic' };
  if (low.includes('gpt') || low.includes('o1') || low.includes('o3') || low.includes('openai')) return { name: 'OpenAI', badge: 'OpenAI', badgeClass: 'badge-openai' };
  if (low.includes('hunyuan') || low.includes('tencent')) return { name: '腾讯混元 Tencent', badge: '腾讯混元', badgeClass: 'badge-tencent' };
  if (low.includes('kling') || low.includes('kuaishou')) return { name: '快手可灵 Kuaishou', badge: '快手可灵', badgeClass: 'badge-kuaishou' };
  if (low.includes('glm') || low.includes('zhipu')) return { name: '智谱 AI Zhipu', badge: '智谱 AI', badgeClass: 'badge-zhipu' };
  if (low.includes('kimi') || low.includes('moonshot')) return { name: '月之暗面 Kimi', badge: '月之暗面', badgeClass: 'badge-moonshot' };
  if (low.includes('minimax')) return { name: 'MiniMax 名之梦', badge: 'MiniMax', badgeClass: 'badge-minimax' };
  if (low.includes('qwen') || low.includes('alibaba')) return { name: '阿里通义 Qwen', badge: '通义千问', badgeClass: 'badge-alibaba' };
  if (low.includes('doubao') || low.includes('bytedance') || low.includes('trae')) return { name: '字节跳动 ByteDance', badge: '字节跳动', badgeClass: 'badge-bytedance' };
  if (low.includes('codewise')) return { name: '腾讯辅助引擎', badge: '腾讯辅助', badgeClass: 'badge-tencent' };
  if (ownedBy.includes('custom') || low.includes('custom')) return { name: '自定义接入', badge: '自定义', badgeClass: 'badge-custom' };
  return { name: '官方聚合', badge: '聚合官方', badgeClass: 'badge-official' };
}

function getModelContextLabel(model) {
  const tokens = Number(model.maxInputTokens);
  if (!Number.isFinite(tokens) || tokens <= 0) return '上游未提供';
  if (tokens >= 1000000) return '1M (100万字)';
  if (tokens >= 500000) return '512k 超长文';
  if (tokens >= 200000) return '200k 长文本';
  if (tokens >= 128000) return '128k 标准';
  if (tokens >= 96000) return '96k 标准';
  return Math.round(tokens / 1000) + 'k';
}

function getModelCreditLabel(model) {
  const isCustom = model.owned_by?.includes('custom') || model.id?.startsWith('custom-');
  const raw = String(model.credits || '').trim();
  if (!raw) return isCustom ? '上游自定义计费' : '官方未标注';
  const normalized = raw.replace(/\s*credits?$/i, '').trim();
  return model.isFree || /^x0(?:\.0+)?$/i.test(normalized)
    ? `当前免费 ${normalized}`
    : `积分倍率 ${normalized}`;
}

// Load Models List for Tester
async function loadModelsForTester() {
  try {
    const res = await fetch('/api/models');
    const data = await res.json();
    testModelsCatalog = data.models || [];

    // Update Counts
    const countEl = document.getElementById('tester-total-models-count');
    if (countEl) countEl.innerText = `${testModelsCatalog.length}`;
    const filterAllCount = document.getElementById('filter-count-all');
    if (filterAllCount) filterAllCount.innerText = `${testModelsCatalog.length}`;
    const badgeEl = document.getElementById('tester-badge');
    if (badgeEl) badgeEl.innerText = `${testModelsCatalog.length}`;

    // Populate Playground Select
    populatePlaygroundSelect();

    // Render Table
    renderTestModelsTable();
  } catch (err) {
    console.error('Failed to load models for tester:', err);
  }
}

function getModelCatalogId(model) {
  return model.catalogId || `${model.sourceEdition || 'workbuddy'}:${model.id}`;
}

function findCatalogModel(catalogId) {
  return testModelsCatalog.find(model => getModelCatalogId(model) === catalogId);
}

function populatePlaygroundSelect() {
  const select = document.getElementById('play-model-select');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '';

  // Group by family/company
  const groups = {};
  testModelsCatalog.forEach(m => {
    const fam = getModelFamily(m.id, m.owned_by, m);
    const groupKey = fam.name;
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push({ ...m, _fam: fam });
  });

  for (const [groupName, models] of Object.entries(groups)) {
    const optGroup = document.createElement('optgroup');
    optGroup.label = `🏢 ${groupName}`;
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = getModelCatalogId(m);
      const companyTag = m.companyShort || m._fam.badge || '官方';
      const ideOrigin = m.sourceIdeShort || (m.owned_by?.includes('custom') ? 'WB自定义' : 'WorkBuddy');
      opt.innerText = `【${companyTag}】 ${m.name || m.id} [${ideOrigin} → Trae/AGY] (${getModelContextLabel(m)} ｜ ${getModelCreditLabel(m)})`;
      if (m.id === 'deepseek-v4-pro') opt.selected = true;
      optGroup.appendChild(opt);
    });
    select.appendChild(optGroup);
  }

  if (currentVal && testModelsCatalog.some(m => getModelCatalogId(m) === currentVal)) {
    select.value = currentVal;
  }

  updatePlaygroundIdeBadge();
}

function updatePlaygroundIdeBadge() {
  const modelId = document.getElementById('play-model-select')?.value;
  const model = findCatalogModel(modelId);
  const badgeEl = document.getElementById('play-ide-badge');
  if (badgeEl && model) {
    const src = model.sourceIde || 'WorkBuddy 模型';
    badgeEl.innerHTML = `🤖 宿主提供: <strong style="color:var(--accent-cyan);">${escapeHtml(src)}</strong> ｜ 💠 ${escapeHtml(getModelCreditLabel(model))} ｜ ⚡ 适配消费端: <strong style="color:var(--accent-blue);">ByteDance Trae</strong> &amp; <strong style="color:var(--accent-purple);">Google Antigravity</strong>`;
  }
}

function renderTestModelsTable() {
  const tbody = document.getElementById('test-models-tbody');
  if (!tbody) return;

  const filterIde = document.getElementById('filter-ide-select')?.value || 'all';
  const filterVendor = document.getElementById('filter-vendor-select')?.value || 'all';
  const filterQuery = (document.getElementById('test-search-input')?.value || '').trim().toLowerCase();

  const filtered = testModelsCatalog.filter(m => {
    const isCustom = m.owned_by?.includes('custom') || m.id?.startsWith('custom-');

    // 1. IDE Name Filter
    if (filterIde === 'workbuddy-ai' && m.sourceEdition !== 'workbuddy-ai') return false;
    if (filterIde === 'workbuddy' && (isCustom || m.sourceEdition !== 'workbuddy')) return false;
    if (filterIde === 'custom' && !isCustom) return false;
    if (filterIde === 'trae' && !m.traeOptimized && !CORE_MODEL_IDS.includes(m.id)) {
      // General models can also be used, but prioritize trae-adapted
    }

    // 2. Vendor / Provider Name Filter
    if (filterVendor !== 'all') {
      const vid = m.vendorId || '';
      const id = (m.id || '').toLowerCase();
      if (filterVendor === 'deepseek' && vid !== 'deepseek' && !id.includes('deepseek')) return false;
      if (filterVendor === 'anthropic' && vid !== 'anthropic' && !id.includes('claude') && id !== 'default-1.2') return false;
      if (filterVendor === 'openai' && vid !== 'openai' && !id.includes('gpt') && !id.includes('o1') && !id.includes('o3')) return false;
      if (filterVendor === 'tencent' && vid !== 'tencent' && !id.includes('hunyuan') && !id.includes('codewise')) return false;
      if (filterVendor === 'kuaishou' && vid !== 'kuaishou' && !id.includes('kling')) return false;
      if (filterVendor === 'zhipu' && vid !== 'zhipu' && !id.includes('glm')) return false;
      if (filterVendor === 'moonshot' && vid !== 'moonshot' && !id.includes('kimi') && !id.includes('moonshot')) return false;
      if (filterVendor === 'minimax' && vid !== 'minimax' && !id.includes('minimax')) return false;
      if (filterVendor === 'alibaba' && vid !== 'alibaba' && !id.includes('qwen')) return false;
      if (filterVendor === 'bytedance' && vid !== 'bytedance' && !id.includes('doubao')) return false;
      if (filterVendor === 'custom' && vid !== 'custom' && !isCustom) return false;
    }

    // 3. Model Name / ID Search Query filter
    if (filterQuery) {
      const matchId = (m.id || '').toLowerCase().includes(filterQuery);
      const matchName = (m.name || '').toLowerCase().includes(filterQuery);
      const fam = getModelFamily(m.id, m.owned_by, m);
      const matchCompany = (fam.name || '').toLowerCase().includes(filterQuery) || (fam.badge || '').toLowerCase().includes(filterQuery);
      const matchIde = (m.sourceIde || '').toLowerCase().includes(filterQuery) ||
                       (m.sourceIdeShort || '').toLowerCase().includes(filterQuery);
      if (!matchId && !matchName && !matchCompany && !matchIde) return false;
    }

    // 4. Quick Status Pill Filter
    const res = modelTestResults[m.id];
    if (currentTestFilter === 'passed') return res && res.success;
    if (currentTestFilter === 'failed') return res && res.success === false;
    if (currentTestFilter === 'core') return CORE_MODEL_IDS.includes(m.id);
    if (currentTestFilter === 'trae') return m.traeOptimized || CORE_MODEL_IDS.includes(m.id);

    return true;
  });

  // Update Stats text
  const statsEl = document.getElementById('filter-stats-text');
  if (statsEl) {
    statsEl.innerText = `筛选匹配: ${filtered.length} / ${testModelsCatalog.length} 款模型`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2.5rem; color: var(--text-muted);">未找到符合当前筛选条件的模型，请尝试更换 IDE、服务商或清除关键词</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach(m => {
    const catalogId = getModelCatalogId(m);
    const res = modelTestResults[catalogId];
    const fam = getModelFamily(m.id, m.owned_by, m);
    const ctx = getModelContextLabel(m);
    const creditLabel = getModelCreditLabel(m);
    const isCore = CORE_MODEL_IDS.includes(m.id);
    const isCustom = m.owned_by?.includes('custom') || m.id?.startsWith('custom-');
    const creditTitle = isCustom
      ? '积分消耗由自定义模型上游决定'
      : `来自 ${m.sourceEdition === 'workbuddy-ai' ? 'WorkBuddy AI 国际版' : 'WorkBuddy 国内版'}官方模型目录的 credits 字段`;

    // Status Tag
    let statusHtml = `<span class="status-tag pending">⚪ 待测试</span>`;
    let latencyHtml = `<span class="latency-val none">--</span>`;
    let previewHtml = `<span class="text-muted" style="font-size:0.75rem; white-space: nowrap;">未进行测试</span>`;

    if (res) {
      if (res.testing) {
        statusHtml = `<span class="status-tag testing">⏳ 握手探测中...</span>`;
        latencyHtml = `<span class="latency-val none">计算中...</span>`;
        previewHtml = `<span class="text-muted" style="font-size:0.75rem; white-space: nowrap;">正在与模型建立通信...</span>`;
      } else if (res.success) {
        statusHtml = `<span class="status-tag passed">✅ 通过 (200 OK)</span>`;
        const lat = res.durationMs || 0;
        const latClass = lat < 2500 ? 'fast' : (lat < 6000 ? 'medium' : 'slow');
        latencyHtml = `<span class="latency-val ${latClass}">${lat} ms</span>`;
        previewHtml = `<span class="preview-text" title="${escapeHtml(res.preview || res.content)}">"${escapeHtml(res.preview || 'OK')}"</span>`;
      } else {
        statusHtml = `<span class="status-tag failed">❌ 异常 (${res.status || 'Error'})</span>`;
        latencyHtml = `<span class="latency-val slow">${res.durationMs || 0} ms</span>`;
        previewHtml = `<span class="preview-text" style="color:var(--accent-rose);" title="${escapeHtml(res.error)}">${escapeHtml(res.error || '请求失败')}</span>`;
      }
    }

    html += `
      <tr id="test-row-${escapeHtml(m.id)}">
        <!-- 1. 模型名称 / 标识符 -->
        <td style="vertical-align: middle;">
          <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
            <strong style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(m.name || m.id)}</strong>
            ${isCore ? '<span title="核心推荐模型" style="color:var(--accent-amber); font-size:0.82rem; background:rgba(251,191,36,0.15); padding:1px 5px; border-radius:4px;">⭐精选</span>' : ''}
            ${m.isFree ? `<span title="${escapeHtml(m.promotion?.description || '官方零倍率活动')}" style="color:var(--accent-emerald); font-size:0.78rem; background:rgba(16,185,129,0.15); padding:1px 5px; border-radius:4px;">🎁 ${escapeHtml(m.promotion?.label || '限时免费')}</span>` : ''}
          </div>
          <div style="font-size: 0.74rem; color: var(--text-muted); font-family: monospace; margin-top: 0.25rem;">${escapeHtml(m.id)}</div>
        </td>

        <!-- 2. 所属 IDE (明确标识) -->
        <td style="vertical-align: middle;">
          <div style="display: flex; flex-direction: column; gap: 0.35rem;">
            <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: nowrap;">
              <span class="ide-badge ${escapeHtml(m.sourceIdeBadge || (isCustom ? 'badge-custom' : 'ide-badge-wb'))}" style="font-weight: 600; font-size: 0.78rem; white-space: nowrap;">
                ${isCustom ? '🛠️ WorkBuddy 自定义' : (m.sourceEdition === 'workbuddy-ai' ? '🌍 WorkBuddy AI 国际版' : '🤖 WorkBuddy 国内版')}
              </span>
              <span style="font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; flex-shrink: 0;">(${isCustom ? '扩展配置' : '原生宿主'})</span>
            </div>
            <div style="display: flex; gap: 0.3rem; flex-wrap: nowrap;">
              <span class="ide-target-tag ${m.traeOptimized ? 'highlight' : ''}" style="font-size: 0.68rem; white-space: nowrap;" title="已适配提供给 ByteDance Trae 使用">⚡ 供 Trae</span>
              <span class="ide-target-tag" style="font-size: 0.68rem; white-space: nowrap;" title="已适配提供给 Google Antigravity 协同调用">🛸 供 AGY</span>
            </div>
          </div>
        </td>

        <!-- 3. 服务商 / 厂商 -->
        <td style="vertical-align: middle;">
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <span class="company-badge ${fam.badgeClass || 'badge-official'}" style="font-size: 0.78rem; width: fit-content;">
              ${escapeHtml(fam.badge || fam.name)}
            </span>
            <span style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(fam.name)}</span>
          </div>
        </td>

        <!-- 4. 上下文容量 -->
        <td style="vertical-align: middle;">
          <span style="font-size: 0.82rem; font-weight: 500; color: var(--text-secondary);">${escapeHtml(ctx)}</span>
        </td>

        <!-- 5. 积分倍率 -->
        <td style="vertical-align: middle;">
          <span class="model-credit-badge ${m.isFree ? 'free' : ''}" title="${escapeHtml(creditTitle)}">
            ${escapeHtml(creditLabel)}
          </span>
        </td>

        <!-- 6. 测试状态 -->
        <td style="vertical-align: middle;">${statusHtml}</td>

        <!-- 7. 响应耗时 -->
        <td style="vertical-align: middle;">${latencyHtml}</td>

        <!-- 8. 回复验证与操作 -->
        <td style="vertical-align: middle; white-space: nowrap; padding-right: 1.1rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: nowrap;">
            <div style="flex: 1; overflow: hidden; white-space: nowrap; margin-right: 0.3rem;">${previewHtml}</div>
            <div style="display: flex; gap: 0.35rem; flex-shrink: 0; white-space: nowrap;">
              <button class="btn btn-xs btn-outline" onclick="testSingleModel('${escapeHtml(catalogId)}')" title="重试单测">🔄 单测</button>
              <button class="btn btn-xs btn-primary" onclick="selectModelForPlayground('${escapeHtml(catalogId)}')" title="填入对话测试">💬 对话</button>
            </div>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// Filter and Search Table
function filterTestTable() {
  renderTestModelsTable();
}

// Reset all filters to default
function resetAllTestFilters() {
  const ideEl = document.getElementById('filter-ide-select');
  const vendorEl = document.getElementById('filter-vendor-select');
  const searchEl = document.getElementById('test-search-input');
  if (ideEl) ideEl.value = 'all';
  if (vendorEl) vendorEl.value = 'all';
  if (searchEl) searchEl.value = '';
  setTestFilter('all');
}

function setTestFilter(filter) {
  currentTestFilter = filter;
  document.querySelectorAll('.filter-pill').forEach(btn => {
    if (btn.getAttribute('data-filter') === filter) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  renderTestModelsTable();
}

// Update Batch Summary Metrics
function updateBatchSummaryUI() {
  const totalInCatalog = testModelsCatalog.length;
  const testedKeys = Object.keys(modelTestResults).filter(k => !modelTestResults[k].testing);
  const totalTested = testedKeys.length;
  const passedCount = testedKeys.filter(k => modelTestResults[k].success).length;
  const failedCount = totalTested - passedCount;

  // Pass rate
  const rate = totalTested > 0 ? Math.round((passedCount / totalTested) * 100) : 0;
  const passRateEl = document.getElementById('test-summary-passrate');
  if (passRateEl) passRateEl.innerText = `${rate}%`;

  const countsEl = document.getElementById('test-summary-counts');
  if (countsEl) countsEl.innerText = `已通过 ${passedCount} / ${totalTested} (异常 ${failedCount})`;

  const badgeEl = document.getElementById('test-summary-badge');
  if (badgeEl) {
    if (totalTested === 0) {
      badgeEl.className = 'badge';
      badgeEl.innerText = '待体检';
    } else if (failedCount === 0) {
      badgeEl.className = 'badge badge-success';
      badgeEl.innerText = '全部通过 100%';
    } else {
      badgeEl.className = 'badge badge-warning';
      badgeEl.innerText = `异常 ${failedCount} 款`;
    }
  }

  // Average Latency
  const sumLatency = testedKeys.reduce((acc, k) => acc + (modelTestResults[k].durationMs || 0), 0);
  const avgLat = totalTested > 0 ? Math.round(sumLatency / totalTested) : 0;
  const latEl = document.getElementById('test-summary-latency');
  if (latEl) latEl.innerText = `${avgLat} ms`;

  // Pill counts
  const pCount = document.getElementById('filter-count-passed');
  if (pCount) pCount.innerText = `${passedCount}`;
  const fCount = document.getElementById('filter-count-failed');
  if (fCount) fCount.innerText = `${failedCount}`;
  const tCount = document.getElementById('filter-count-trae');
  if (tCount) {
    const traeModels = testModelsCatalog.filter(m => m.traeOptimized || CORE_MODEL_IDS.includes(m.id));
    tCount.innerText = `${traeModels.length}`;
  }
}

// Run Single Model Test
async function testSingleModel(catalogId) {
  const model = findCatalogModel(catalogId);
  if (!model) return;
  modelTestResults[catalogId] = { testing: true };
  renderTestModelsTable();

  try {
    const res = await fetch('/api/test/single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model.id,
        sourceEdition: model.sourceEdition,
        isCustomModel: model.owned_by?.includes('custom') || model.id?.startsWith('custom-'),
        prompt: 'Say OK in one word.',
        max_tokens: 64
      })
    });
    const result = await res.json();
    modelTestResults[catalogId] = result;
  } catch (err) {
    modelTestResults[catalogId] = {
      success: false,
      model: model.id,
      durationMs: 0,
      error: err.message
    };
  }

  updateBatchSummaryUI();
  renderTestModelsTable();
}

// Run Batch Test
async function runBatchTest(targetList, label = '批量测试') {
  if (isBatchRunning) return;
  if (!targetList || targetList.length === 0) {
    alert('暂无可用模型进行体检！');
    return;
  }

  isBatchRunning = true;
  stopBatchRequested = false;

  // Toggle buttons
  document.getElementById('btn-batch-core').style.display = 'none';
  document.getElementById('btn-batch-all').style.display = 'none';
  document.getElementById('btn-batch-stop').style.display = 'inline-flex';

  const progressWrapper = document.getElementById('test-progress-wrapper');
  const progressFill = document.getElementById('test-progress-fill');
  const progressLabel = document.getElementById('test-progress-label');
  const progressPercent = document.getElementById('test-progress-percent');
  progressWrapper.style.display = 'block';

  let doneCount = 0;
  const total = targetList.length;

  for (const model of targetList) {
    if (stopBatchRequested) break;

    const percent = Math.round((doneCount / total) * 100);
    progressFill.style.width = `${percent}%`;
    progressPercent.innerText = `${percent}%`;
    progressLabel.innerText = `正在探测 [${doneCount + 1}/${total}]: ${model.id} ...`;

    // Mark current testing
    const catalogId = getModelCatalogId(model);
    modelTestResults[catalogId] = { testing: true };
    renderTestModelsTable();

    try {
      const res = await fetch('/api/test/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model.id,
          sourceEdition: model.sourceEdition,
          isCustomModel: model.owned_by?.includes('custom') || model.id?.startsWith('custom-'),
          prompt: 'Say OK in one word.',
          max_tokens: 64,
          timeout: 25000
        })
      });
      const data = await res.json();
      modelTestResults[catalogId] = data;
    } catch (e) {
      modelTestResults[catalogId] = {
        success: false,
        model: model.id,
        durationMs: 0,
        error: e.message
      };
    }

    doneCount++;
    updateBatchSummaryUI();
    renderTestModelsTable();
  }

  // Done
  progressFill.style.width = '100%';
  progressPercent.innerText = '100%';
  progressLabel.innerText = stopBatchRequested
    ? `已手动停止体检，共探测 ${doneCount} 款模型`
    : `🎉 体检完成！已成功探测全部 ${total} 款模型`;

  setTimeout(() => {
    isBatchRunning = false;
    document.getElementById('btn-batch-core').style.display = 'inline-flex';
    document.getElementById('btn-batch-all').style.display = 'inline-flex';
    document.getElementById('btn-batch-stop').style.display = 'none';
  }, 500);
}

function runCoreBatchTest() {
  const coreModels = testModelsCatalog.filter(m => CORE_MODEL_IDS.includes(m.id));
  runBatchTest(coreModels, '核心精选模型体检');
}

function runAllBatchTest() {
  runBatchTest(testModelsCatalog, '全量模型体检');
}

function stopBatchTest() {
  stopBatchRequested = true;
  document.getElementById('test-progress-label').innerText = '正在终止当前队列...';
}

function selectModelForPlayground(modelId) {
  const select = document.getElementById('play-model-select');
  if (select) {
    select.value = modelId;
  }
  const targetSection = document.getElementById('interactive-playground-section');
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth' });
  }
  const promptInput = document.getElementById('play-prompt-input');
  if (promptInput) {
    promptInput.focus();
  }
  updatePlaygroundIdeBadge();
}

function onPlaygroundModelChange() {
  // Update curl and IDE badge
  updatePlaygroundRawCurl();
  updatePlaygroundIdeBadge();
}

// Preset Prompts
const PRESET_PROMPTS = {
  ping: 'Say OK in one word.',
  intro: '你好！请用一句话告诉我你的模型版本、核心擅长领域以及所属机构。',
  code: '请用 JavaScript 写一个快速排序函数（Quick Sort），并附带关键逻辑注释。',
  logic: '烧一根粗细不均匀的香需要1个小时。现在有两根完全相同的香，如何仅通过点燃香测量出正好45分钟？请简明给出步骤。',
  context: '请仔细阅读以下标记信息：[验证密钥: K-9981-Alpha，密级: S级，交付日期: 2026-Q4]。问题：请严格只回答出验证密钥是什么？'
};

function applyPresetPrompt(type) {
  const promptInput = document.getElementById('play-prompt-input');
  if (promptInput && PRESET_PROMPTS[type]) {
    promptInput.value = PRESET_PROMPTS[type];
    promptInput.focus();
    updatePlaygroundRawCurl();
  }
}

function clearPlayground() {
  const body = document.getElementById('play-response-body');
  if (body) {
    body.innerHTML = `<div class="empty-state-text">👈 在左侧选择模型并点击「发送 API 请求测试」，实时结果将呈现在这里。</div>`;
  }
  document.getElementById('play-status-pill').innerText = '⚪ 待调用';
  document.getElementById('play-status-pill').className = 'badge';
  document.getElementById('play-latency-pill').innerText = '延迟: -- ms';
  document.getElementById('play-ttft-pill').innerText = '首字: -- ms';
  document.getElementById('play-raw-box').innerText = '等待发送请求...';
}

function handlePlaygroundKeydown(e) {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    sendPlaygroundTest();
  }
}

function updatePlaygroundRawCurl() {
  const model = document.getElementById('play-model-select')?.value || 'deepseek-v4-pro';
  const prompt = document.getElementById('play-prompt-input')?.value || 'Say OK in one word.';
  const isStream = document.getElementById('play-stream-select')?.value === 'true';

  const curl = `curl -X POST ${window.location.origin}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "messages": [
      {"role": "user", "content": ${JSON.stringify(prompt)}}
    ],
    "stream": ${isStream}
  }'`;

  const rawBox = document.getElementById('play-raw-box');
  if (rawBox && !rawBox.dataset.locked) {
    rawBox.innerText = curl;
  }
}

function copyPlaygroundCurl() {
  const model = document.getElementById('play-model-select')?.value || 'deepseek-v4-pro';
  const prompt = document.getElementById('play-prompt-input')?.value || 'Say OK in one word.';
  const isStream = document.getElementById('play-stream-select')?.value === 'true';
  const temp = parseFloat(document.getElementById('play-temp-input')?.value || '0.7');
  const maxTokens = parseInt(document.getElementById('play-tokens-select')?.value || '512', 10);
  const sys = document.getElementById('play-system-input')?.value.trim();

  const messages = [];
  if (sys) messages.push({ role: 'system', content: sys });
  messages.push({ role: 'user', content: prompt });

  const curl = `curl -X POST ${window.location.origin}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({
    model,
    messages,
    stream: isStream,
    temperature: temp,
    max_tokens: maxTokens
  }, null, 2)}'`;

  navigator.clipboard.writeText(curl).then(() => {
    alert('📋 标准 cURL 命令已复制到剪贴板！可以直接粘贴到终端中测试。');
  }).catch(() => {
    prompt('请手动复制 cURL 命令:', curl);
  });
}

function copyEndpoint() {
  const endpoint = `${window.location.origin}/v1`;
  navigator.clipboard.writeText(endpoint).then(() => {
    alert(`📋 网关根端点已复制: ${endpoint}`);
  });
}

// Send Interactive Playground Test
async function sendPlaygroundTest() {
  const catalogId = document.getElementById('play-model-select')?.value;
  const selectedModel = findCatalogModel(catalogId);
  if (!selectedModel) {
    alert('请先选择目标模型！');
    return;
  }
  const model = selectedModel.id;
  const sourceEdition = selectedModel.sourceEdition || 'workbuddy';

  const prompt = document.getElementById('play-prompt-input')?.value.trim();
  if (!prompt) {
    alert('请输入测试 Prompt 提示词！');
    return;
  }

  const isStream = document.getElementById('play-stream-select')?.value === 'true' && sourceEdition !== 'workbuddy-ai';
  const temp = parseFloat(document.getElementById('play-temp-input')?.value || '0.7');
  const maxTokens = parseInt(document.getElementById('play-tokens-select')?.value || '512', 10);
  const sys = document.getElementById('play-system-input')?.value.trim();

  const messages = [];
  if (sys) messages.push({ role: 'system', content: sys });
  messages.push({ role: 'user', content: prompt });

  const sendBtn = document.getElementById('btn-play-send');
  const statusPill = document.getElementById('play-status-pill');
  const latencyPill = document.getElementById('play-latency-pill');
  const ttftPill = document.getElementById('play-ttft-pill');
  const responseBody = document.getElementById('play-response-body');
  const rawBox = document.getElementById('play-raw-box');

  sendBtn.disabled = true;
  sendBtn.innerHTML = `<span class="icon">⏳</span> 正在呼叫模型...`;
  statusPill.className = 'badge badge-warning';
  statusPill.innerText = '⚡ 握手中...';
  latencyPill.innerText = '延迟: 计时中...';
  ttftPill.innerText = '首字: 等待中...';
  responseBody.innerHTML = `<span class="streaming-cursor"></span>`;
  rawBox.dataset.locked = 'true';

  const startTime = Date.now();
  let firstChunkTime = null;

  try {
    if (isStream) {
      // 1. Streaming Call via /v1/chat/completions
      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: temp,
          max_tokens: maxTokens
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (!firstChunkTime) {
          firstChunkTime = Date.now() - startTime;
          ttftPill.innerText = `首字: ${firstChunkTime} ms`;
          statusPill.className = 'badge badge-success';
          statusPill.innerText = '🟢 流式传输中...';
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep unfinished line

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const delta = parsed.choices?.[0]?.delta?.content || '';
              accumulatedText += delta;
              responseBody.innerHTML = escapeHtml(accumulatedText) + '<span class="streaming-cursor"></span>';
              responseBody.scrollTop = responseBody.scrollHeight;
            } catch (e) {}
          }
        }
      }

      // Finish Stream
      const totalDuration = Date.now() - startTime;
      responseBody.innerHTML = escapeHtml(accumulatedText || '(模型未返回任何正文)');
      statusPill.className = 'badge badge-success';
      statusPill.innerText = '✅ 200 OK (流式完成)';
      latencyPill.innerText = `总耗时: ${totalDuration} ms`;
      if (!firstChunkTime) ttftPill.innerText = `首字: ${totalDuration} ms`;

      rawBox.innerText = `[STREAMING COMPLETED]\nModel: ${model}\nDuration: ${totalDuration}ms\nTTFT: ${firstChunkTime || totalDuration}ms\nChars: ${accumulatedText.length}\n\n=== Response Content ===\n${accumulatedText}`;
    } else {
      // 2. Non-streaming call via /api/test/single
      const res = await fetch('/api/test/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          sourceEdition,
          isCustomModel: selectedModel.owned_by?.includes('custom') || selectedModel.id?.startsWith('custom-'),
          prompt,
          stream: false,
          temperature: temp,
          max_tokens: maxTokens,
          timeout: 40000
        })
      });

      const data = await res.json();
      const totalDuration = Date.now() - startTime;

      if (data.success) {
        statusPill.className = 'badge badge-success';
        statusPill.innerText = '✅ 200 OK';
        latencyPill.innerText = `耗时: ${data.durationMs || totalDuration} ms`;
        ttftPill.innerText = `首字: ${data.ttftMs || totalDuration} ms`;
        responseBody.innerText = data.content || data.preview || '(模型返回空)';
        rawBox.innerText = JSON.stringify(data, null, 2);
      } else {
        throw new Error(data.error || '调用失败');
      }
    }
  } catch (err) {
    const totalDuration = Date.now() - startTime;
    statusPill.className = 'badge badge-danger';
    statusPill.innerText = '❌ 调用失败';
    latencyPill.innerText = `耗时: ${totalDuration} ms`;
    ttftPill.innerText = '首字: --';
    responseBody.innerHTML = `<span style="color:var(--accent-rose);">❌ 请求发生异常:</span>\n\n${escapeHtml(err.message)}`;
    rawBox.innerText = `[ERROR]\nModel: ${model}\nError: ${err.message}\nDuration: ${totalDuration}ms`;
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = `<span class="icon">🚀</span> 发送 API 请求测试`;
    rawBox.removeAttribute('data-locked');
  }
}
