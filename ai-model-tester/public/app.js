import {
  clearRelayCaches,
  deleteRelayCache,
  readRelayCaches,
  matchesRelayCache,
  upsertRelayCache,
  writeRelayCaches,
} from './relay-cache.mjs';
import { RELAY_CLIENT_PROFILES } from './client-profiles.mjs';

const state = {
  providers: [],
  selectedProviderId: '',
  customProvider: null,
  models: [],
  selectedModels: new Set(),
  pageKeys: {},
  relayCaches: readRelayCaches(),
  schedule: {
    timerId: null,
    running: false,
    nextAt: null,
    lastAt: null,
    lastSummary: '',
  },
  testing: false,
};

const els = {
  configNote: document.querySelector('#configNote'),
  loadModels: document.querySelector('#loadModels'),
  maxTokens: document.querySelector('#maxTokens'),
  modelHint: document.querySelector('#modelHint'),
  modelRows: document.querySelector('#modelRows'),
  prompt: document.querySelector('#prompt'),
  providerList: document.querySelector('#providerList'),
  providerSearch: document.querySelector('#providerSearch'),
  providerCount: document.querySelector('#providerCount'),
  customProviderSlot: document.querySelector('#customProviderSlot'),
  keySourceHint: document.querySelector('#keySourceHint'),
  refreshProviders: document.querySelector('#refreshProviders'),
  results: document.querySelector('#results'),
  runTest: document.querySelector('#runTest'),
  selectedModel: document.querySelector('#selectedModel'),
  temperature: document.querySelector('#temperature'),
  toast: document.querySelector('#toast'),
  relayCacheLabel: document.querySelector('#relayCacheLabel'),
  relayCacheSuggestions: document.querySelector('#relayCacheSuggestions'),
  relayBaseUrl: document.querySelector('#relayBaseUrl'),
  relayApiKey: document.querySelector('#relayApiKey'),
  relayClientProfile: document.querySelector('#relayClientProfile'),
  relayClientProfileHint: document.querySelector('#relayClientProfileHint'),
  relayClientProfileDetail: document.querySelector('#relayClientProfileDetail'),
  saveRelayCache: document.querySelector('#saveRelayCache'),
  clearRelayCache: document.querySelector('#clearRelayCache'),
  relayCacheBox: document.querySelector('#relayCacheBox'),
  relayCacheCount: document.querySelector('#relayCacheCount'),
  relayCacheList: document.querySelector('#relayCacheList'),
  relayModelsPath: document.querySelector('#relayModelsPath'),
  relayChatPath: document.querySelector('#relayChatPath'),
  useRelay: document.querySelector('#useRelay'),
  selectAllModels: document.querySelector('#selectAllModels'),
  clearModels: document.querySelector('#clearModels'),
  scheduleEvery: document.querySelector('#scheduleEvery'),
  scheduleUnit: document.querySelector('#scheduleUnit'),
  scheduleAutoLoad: document.querySelector('#scheduleAutoLoad'),
  startSchedule: document.querySelector('#startSchedule'),
  stopSchedule: document.querySelector('#stopSchedule'),
  scheduleStatus: document.querySelector('#scheduleStatus'),
  scheduleHint: document.querySelector('#scheduleHint'),
  scheduleMeta: document.querySelector('#scheduleMeta'),
};

renderRelayClientProfiles();
bindEvents();
updateRelayCacheUi();
loadProviders();
updateScheduleUi();

function bindEvents() {
  els.refreshProviders.addEventListener('click', loadProviders);
  els.providerSearch.addEventListener('input', renderProviders);
  els.relayCacheLabel.addEventListener('input', renderRelayCacheSuggestions);
  els.relayCacheLabel.addEventListener('focus', renderRelayCacheSuggestions);
  els.relayCacheLabel.addEventListener('blur', hideRelayCacheSuggestionsLater);
  els.relayCacheLabel.addEventListener('keydown', handleRelayCacheSearchKeydown);
  els.relayCacheSuggestions.addEventListener('click', handleRelayCacheSuggestion);
  els.relayCacheSuggestions.addEventListener('keydown', handleRelayCacheSuggestionKeydown);
  els.relayClientProfile.addEventListener('change', () => updateRelayClientProfileHint(true));
  els.loadModels.addEventListener('click', () => loadModels());
  els.runTest.addEventListener('click', () => runTest({ source: 'manual' }));
  els.useRelay.addEventListener('click', useRelay);
  els.saveRelayCache.addEventListener('click', saveRelayCache);
  els.clearRelayCache.addEventListener('click', clearAllRelayCaches);
  els.relayCacheBox.addEventListener('toggle', renderRelayCacheList);
  els.relayCacheList.addEventListener('click', handleRelayCacheAction);
  els.selectAllModels.addEventListener('click', () => {
    state.selectedModels = new Set(state.models.map((m) => m.id));
    renderModels();
    updateSelection();
  });
  els.clearModels.addEventListener('click', () => {
    state.selectedModels.clear();
    renderModels();
    updateSelection();
  });
  els.startSchedule.addEventListener('click', () => startSchedule(false));
  els.stopSchedule.addEventListener('click', () => stopSchedule(false));
  els.scheduleEvery.addEventListener('change', () => {
    if (state.schedule.running) startSchedule(true);
    else updateScheduleUi();
  });
  els.scheduleUnit.addEventListener('change', () => {
    if (state.schedule.running) startSchedule(true);
    else updateScheduleUi();
  });
}

function renderRelayClientProfiles(selectedId = 'openai') {
  els.relayClientProfile.replaceChildren();
  for (const profile of RELAY_CLIENT_PROFILES) {
    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = profile.label;
    option.selected = profile.id === selectedId;
    els.relayClientProfile.append(option);
  }
  updateRelayClientProfileHint();
}

function updateRelayClientProfileHint(syncPath = false) {
  const profile = RELAY_CLIENT_PROFILES.find((item) => item.id === els.relayClientProfile.value);
  const usageMap = {
    openai: '普通中转站保持此项。',
    codex: '仅在中转站限制 Codex 客户端时选择。',
    cursor: '调用 Cursor 官方 API 时选择，请使用 Cursor 颁发的 Key。',
  };
  const usage = profile ? (usageMap[profile.id] || '为当前中转站选择匹配的客户端模式。') : '';
  els.relayClientProfileHint.textContent = profile ? usage + ' ' + profile.description : '';
  renderRelayClientProfileDetail(profile);
  if (syncPath && profile) {
    els.relayChatPath.value = profile.chatPath;
  }
}

function renderRelayClientProfileDetail(profile) {
  const box = els.relayClientProfileDetail;
  box.replaceChildren();
  if (!profile) return;

  const addRow = (label, value) => {
    const row = document.createElement('div');
    row.className = 'relay-profile-row';
    const labelEl = document.createElement('span');
    labelEl.className = 'relay-profile-label';
    labelEl.textContent = label;
    const valueEl = document.createElement('code');
    valueEl.textContent = value;
    row.append(labelEl, valueEl);
    box.append(row);
  };

  addRow('请求路径', profile.chatPath);
  addRow('请求格式', profile.requestStyle);

  const headers = Object.entries(profile.headers || {});
  const headRow = document.createElement('div');
  headRow.className = 'relay-profile-row';
  const headLabel = document.createElement('span');
  headLabel.className = 'relay-profile-label';
  headLabel.textContent = '额外请求头';
  headRow.append(headLabel);
  box.append(headRow);

  if (headers.length === 0) {
    const none = document.createElement('code');
    none.textContent = '无';
    headRow.append(none);
  } else {
    for (const [key, value] of headers) {
      const item = document.createElement('div');
      item.className = 'relay-profile-header';
      const keyEl = document.createElement('code');
      keyEl.textContent = key;
      const valueEl = document.createElement('code');
      valueEl.textContent = value;
      item.append(keyEl, document.createTextNode(': '), valueEl);
      box.append(item);
    }
  }
}

async function loadProviders() {
  setBusy(els.refreshProviders, true);
  try {
    const data = await api('/api/providers');
    state.providers = data.providers || [];
    if (data.defaultPrompt && !els.prompt.value.trim()) {
      els.prompt.value = data.defaultPrompt;
    }
    if (!state.selectedProviderId && state.providers[0]) {
      state.selectedProviderId = state.providers[0].id;
    }
    els.configNote.textContent = data.usingExampleConfig
      ? '当前使用 config.example.json。选中厂商后可填写本次使用的明文 Key，留空则回退配置文件。'
      : '已读取 config.local.json。选中厂商后填写的明文 Key 优先；留空则使用配置文件。';
    renderProviders();
    updateSelection();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setBusy(els.refreshProviders, false);
  }
}

function renderProviders() {
  const query = els.providerSearch.value.trim().toLowerCase();
  const providers = state.providers.filter((provider) => {
    const haystack = [provider.label, provider.type, provider.baseUrl].join(' ').toLowerCase();
    return !query || haystack.includes(query);
  });

  els.customProviderSlot.innerHTML = '';
  els.customProviderSlot.hidden = !state.customProvider;
  if (state.customProvider) {
    els.customProviderSlot.append(providerCard(state.customProvider, true));
  }

  els.providerCount.textContent = providers.length === state.providers.length
    ? state.providers.length + ' 个'
    : providers.length + ' / ' + state.providers.length;
  els.providerList.innerHTML = '';
  for (const provider of providers) {
    els.providerList.append(providerCard(provider, false));
  }
  if (providers.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'provider-empty';
    empty.textContent = '没有找到匹配的厂商';
    els.providerList.append(empty);
  }
  updateKeyHint();
}

function providerCard(provider, isCustom) {
  const active = provider.id === state.selectedProviderId;
  const pageKey = !isCustom ? (state.pageKeys[provider.id] || '') : '';
  const status = providerStatus(provider, isCustom, pageKey);
  const card = document.createElement('div');
  card.className = 'provider-card' + (active ? ' active' : '') + (isCustom ? ' custom' : '');
  card.style.setProperty('--provider-hue', providerHue(provider.id));

  const top = document.createElement('button');
  top.type = 'button';
  top.className = 'provider-top';
  top.setAttribute('aria-pressed', String(active));
  top.innerHTML =
    '<span class="provider-mark" aria-hidden="true">' + escapeHtml(providerInitials(provider.label)) + '</span>' +
    '<span class="provider-copy">' +
      '<span class="provider-title">' +
        '<strong>' + escapeHtml(provider.label) + '</strong>' +
        '<span class="status ' + status.className + '">' + status.text + '</span>' +
      '</span>' +
      '<span class="provider-meta">' + escapeHtml(providerHost(provider.baseUrl) || provider.type) + '</span>' +
    '</span>' +
    '<span class="provider-chevron" aria-hidden="true">›</span>';
  top.addEventListener('click', () => {
    state.selectedProviderId = provider.id;
    state.models = [];
    state.selectedModels.clear();
    renderProviders();
    renderModels();
    updateSelection();
    requestAnimationFrame(() => {
      const activeCard = els.providerList.querySelector('.provider-card.active');
      activeCard?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  });
  card.append(top);

  if (active && !isCustom && !provider.isLocal) {
    const keyWrap = document.createElement('label');
    keyWrap.className = 'provider-key';
    const keyHead = document.createElement('span');
    keyHead.className = 'provider-key-head';
    keyHead.innerHTML = '<strong>本次使用的 Key</strong><small>明文可见 · 不写回配置</small>';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = provider.hasKey ? '留空则使用配置文件中的 Key' : '配置无 Key，请在此填写';
    input.value = pageKey;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.addEventListener('click', (event) => event.stopPropagation());
    input.addEventListener('input', () => {
      const value = input.value.trim();
      if (value) state.pageKeys[provider.id] = value;
      else delete state.pageKeys[provider.id];
      const nextStatus = providerStatus(provider, false, value);
      const statusNode = card.querySelector('.status');
      statusNode.className = 'status ' + nextStatus.className;
      statusNode.textContent = nextStatus.text;
      updateKeyHint();
    });
    keyWrap.append(keyHead, input);
    card.append(keyWrap);
  } else if (active && provider.isLocal) {
    const note = document.createElement('p');
    note.className = 'provider-note';
    note.textContent = '本地 Ollama 无需 Key，直接拉取模型即可。';
    card.append(note);
  }

  return card;
}

function providerStatus(provider, isCustom, pageKey) {
  if (isCustom) return { className: 'custom', text: '临时接口' };
  if (provider.isLocal) return { className: 'local', text: '无需 Key' };
  if (pageKey) return { className: 'page-key', text: '页面 Key' };
  if (provider.hasKey) return { className: 'ready', text: '配置 Key' };
  return { className: 'missing', text: '待填写' };
}

function providerInitials(label) {
  const words = String(label || '').replace(/[\/-]+/g, ' ').split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'AI';
}

function providerHost(baseUrl) {
  try {
    return new URL(baseUrl).host.replace(/^www\./, '');
  } catch {
    return baseUrl || '';
  }
}

function providerHue(id) {
  let hash = 0;
  for (const char of String(id || 'provider')) hash = ((hash << 5) - hash) + char.charCodeAt(0);
  return Math.abs(hash) % 360;
}

async function api(path, body) {
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || ('请求失败 (' + response.status + ')'));
  }
  return data;
}

async function loadModels(options = {}) {
  if (!state.selectedProviderId) {
    showToast('请先选择接口。', true);
    return false;
  }
  const payload = selectedProviderPayload();
  if (!payload) return false;
  if (!options.silent) setBusy(els.loadModels, true);
  try {
    const data = await api('/api/models', payload);
    state.models = data.models || [];
    if (state.selectedModels.size === 0) {
      state.selectedModels = new Set(state.models.slice(0, 1).map((m) => m.id));
    } else {
      const valid = new Set(state.models.map((m) => m.id));
      state.selectedModels = new Set([...state.selectedModels].filter((id) => valid.has(id)));
      if (state.selectedModels.size === 0 && state.models[0]) {
        state.selectedModels.add(state.models[0].id);
      }
    }
    renderModels();
    updateSelection();
    if (!options.silent) showToast('已拉取 ' + state.models.length + ' 个模型');
    return true;
  } catch (error) {
    state.models = [];
    state.selectedModels.clear();
    renderModels();
    updateSelection();
    if (!options.silent) showToast(error.message, true);
    return false;
  } finally {
    if (!options.silent) setBusy(els.loadModels, false);
  }
}

function renderModels() {
  els.modelRows.innerHTML = '';
  if (!state.models.length) {
    els.modelRows.innerHTML = '<tr><td colspan="4" class="empty">暂无模型</td></tr>';
    els.modelHint.textContent = '先选接口，再拉取模型';
    return;
  }

  els.modelHint.textContent = state.models.length + ' 个模型 · 已选 ' + state.selectedModels.size + ' 个';
  for (const model of state.models) {
    const checked = state.selectedModels.has(model.id);
    const row = document.createElement('tr');
    row.className = 'model-row ' + (checked ? 'selected' : '');
    row.innerHTML =
      '<td class="check-col"><input type="checkbox" ' + (checked ? 'checked' : '') + '></td>' +
      '<td class="model-name">' + escapeHtml(model.name) + '</td>' +
      '<td class="muted">' + escapeHtml(String(model.ownedBy || '')) + '</td>' +
      '<td class="muted">' + escapeHtml(model.rawId || model.id) + '</td>';
    const checkbox = row.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('click', (event) => event.stopPropagation());
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) state.selectedModels.add(model.id);
      else state.selectedModels.delete(model.id);
      renderModels();
      updateSelection();
    });
    row.addEventListener('click', () => {
      if (state.selectedModels.has(model.id)) state.selectedModels.delete(model.id);
      else state.selectedModels.add(model.id);
      renderModels();
      updateSelection();
    });
    els.modelRows.append(row);
  }
}

async function runTest(options = {}) {
  if (state.testing) {
    if (options.source !== 'schedule') showToast('已有测试在进行中。', true);
    return;
  }

  if (options.source === 'schedule' && els.scheduleAutoLoad.checked) {
    const ok = await loadModels({ silent: true });
    if (!ok) {
      state.schedule.lastSummary = '定时拉取模型失败';
      updateScheduleUi();
      return;
    }
  }

  const models = [...state.selectedModels];
  if (!state.selectedProviderId || models.length === 0) {
    showToast('请先选择接口，并勾选至少一个模型。', true);
    return;
  }
  const payloadBase = selectedProviderPayload();
  if (!payloadBase) return;

  state.testing = true;
  setBusy(els.runTest, true);
  els.startSchedule.disabled = true;
  els.results.innerHTML = '';
  let success = 0;
  let failed = 0;
  const startedLabel = options.source === 'schedule' ? '定时' : '手动';

  for (let i = 0; i < models.length; i += 1) {
    const model = models[i];
    const item = document.createElement('div');
    item.className = 'result-item';
    item.innerHTML =
      '<div class="result-head">' +
      '<strong>' + escapeHtml(model) + '</strong>' +
      '<span>' + startedLabel + '测试中... (' + (i + 1) + '/' + models.length + ')</span>' +
      '</div>' +
      '<pre class="result-body">请求中...</pre>';
    els.results.append(item);
    const body = item.querySelector('.result-body');
    const head = item.querySelector('.result-head span');
    try {
      const data = await api('/api/test', {
        ...payloadBase,
        model,
        prompt: els.prompt.value,
        temperature: els.temperature.value,
        maxTokens: els.maxTokens.value,
      });
      success += 1;
      head.className = 'status-ok';
      head.textContent = '完成 · ' + data.elapsedMs + 'ms' + (data.usage ? ' · ' + formatUsage(data.usage) : '');
      body.textContent = data.answer || '模型没有返回文本。';
    } catch (error) {
      failed += 1;
      head.className = 'status-err';
      head.textContent = '失败';
      body.textContent = error.message;
    }
  }

  const summary = startedLabel + '测试结束：成功 ' + success + '，失败 ' + failed;
  state.schedule.lastAt = new Date();
  state.schedule.lastSummary = summary;
  showToast(summary, failed > 0);
  setBusy(els.runTest, false);
  state.testing = false;
  updateScheduleUi();
}

function updateSelection() {
  const provider = selectedProvider();
  const count = state.selectedModels.size;
  els.loadModels.disabled = !provider;
  els.runTest.disabled = !provider || count === 0 || state.testing;
  els.selectAllModels.disabled = state.models.length === 0;
  els.clearModels.disabled = count === 0;
  if (!provider) {
    els.selectedModel.textContent = '尚未选择接口';
  } else if (count === 0) {
    els.selectedModel.textContent = provider.label + ' · 尚未勾选模型';
  } else if (count === 1) {
    els.selectedModel.textContent = provider.label + ' · 将测试 1 个模型：' + [...state.selectedModels][0];
  } else {
    els.selectedModel.textContent = provider.label + ' · 将依次测试 ' + count + ' 个已选模型';
  }
  updateKeyHint();
  updateScheduleUi();
}

function saveRelayCache() {
  const entry = {
    identifier: els.relayCacheLabel.value.trim(),
    baseUrl: els.relayBaseUrl.value.trim(),
    apiKey: els.relayApiKey.value.trim(),
    clientProfile: els.relayClientProfile.value,
    modelsPath: els.relayModelsPath.value.trim(),
    chatPath: els.relayChatPath.value.trim(),
  };
  try {
    const next = upsertRelayCache(state.relayCaches, entry);
    writeRelayCaches(next);
    state.relayCaches = next;
    updateRelayCacheUi();
    renderRelayCacheSuggestions();
    showToast('已保存缓存“' + entry.identifier + '”。');
  } catch (error) {
    showToast(error.message || '无法写入浏览器本地缓存。', true);
  }
}

function updateRelayCacheUi() {
  els.relayCacheCount.textContent = String(state.relayCaches.length);
  els.clearRelayCache.disabled = state.relayCaches.length === 0;
  renderRelayCacheList();
  renderRelayCacheSuggestions();
}

function renderRelayCacheSuggestions() {
  const query = els.relayCacheLabel.value.trim();
  const matches = state.relayCaches
    .filter((entry) => matchesRelayCache(entry, query))
    .slice(0, 8);
  els.relayCacheSuggestions.replaceChildren();
  if (document.activeElement !== els.relayCacheLabel) {
    els.relayCacheSuggestions.hidden = true;
    return;
  }
  if (matches.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'relay-cache-suggestion-empty';
    empty.textContent = state.relayCaches.length === 0
      ? '暂无缓存，请填写配置后点击“保存 / 更新缓存”。'
      : '没有匹配的缓存标识。';
    els.relayCacheSuggestions.append(empty);
  }
  for (const entry of matches) {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'relay-cache-suggestion';
    option.setAttribute('role', 'option');
    option.dataset.identifier = entry.identifier;
    option.innerHTML = '<strong>' + escapeHtml(entry.identifier) + '</strong>' +
      '<small>' + escapeHtml(entry.baseUrl) + '</small>';
    els.relayCacheSuggestions.append(option);
  }
  els.relayCacheSuggestions.hidden = false;
}

function hideRelayCacheSuggestionsLater() {
  setTimeout(() => {
    if (!els.relayCacheSuggestions.contains(document.activeElement)) {
      els.relayCacheSuggestions.hidden = true;
    }
  }, 100);
}

function handleRelayCacheSearchKeydown(event) {
  if (event.key === 'Escape') {
    els.relayCacheSuggestions.hidden = true;
    return;
  }
  if (event.key !== 'ArrowDown') return;
  renderRelayCacheSuggestions();
  const first = els.relayCacheSuggestions.querySelector('button[data-identifier]');
  if (!first) return;
  event.preventDefault();
  first.focus();
}

function handleRelayCacheSuggestionKeydown(event) {
  const options = [...els.relayCacheSuggestions.querySelectorAll('button[data-identifier]')];
  const current = options.indexOf(document.activeElement);
  if (event.key === 'Escape') {
    event.preventDefault();
    els.relayCacheSuggestions.hidden = true;
    els.relayCacheLabel.focus();
    return;
  }
  if (!['ArrowDown', 'ArrowUp'].includes(event.key) || current < 0) return;
  event.preventDefault();
  const offset = event.key === 'ArrowDown' ? 1 : -1;
  options[(current + offset + options.length) % options.length].focus();
}

function handleRelayCacheSuggestion(event) {
  const option = event.target.closest('button[data-identifier]');
  if (!option) return;
  const entry = state.relayCaches.find((item) => item.identifier === option.dataset.identifier);
  if (!entry) return;
  fillRelayCache(entry);
  els.relayCacheSuggestions.hidden = true;
}

function fillRelayCache(entry) {
  els.relayCacheLabel.value = entry.identifier;
  els.relayBaseUrl.value = entry.baseUrl;
  els.relayApiKey.value = entry.apiKey;
  renderRelayClientProfiles(entry.clientProfile || 'openai');
  els.relayModelsPath.value = entry.modelsPath || '/models';
  const profile = RELAY_CLIENT_PROFILES.find((item) => item.id === els.relayClientProfile.value);
  els.relayChatPath.value = entry.chatPath || profile?.chatPath || '';
  els.relayCacheLabel.closest('details').open = true;
}

function renderRelayCacheList() {
  els.relayCacheList.replaceChildren();
  if (!els.relayCacheBox.open) return;

  if (state.relayCaches.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'relay-cache-empty';
    empty.textContent = '暂无缓存，填写标识、地址和 Key 后保存。';
    els.relayCacheList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const entry of state.relayCaches) {
    const item = document.createElement('article');
    item.className = 'relay-cache-item';

    const head = document.createElement('div');
    head.className = 'relay-cache-item-head';
    const title = document.createElement('strong');
    title.textContent = entry.identifier;
    const time = document.createElement('small');
    time.textContent = entry.updatedAt ? new Date(entry.updatedAt).toLocaleString('zh-CN', { hour12: false }) : '';
    head.append(title, time);

    const address = document.createElement('code');
    address.className = 'relay-cache-address';
    address.textContent = '地址：' + entry.baseUrl;
    const key = document.createElement('code');
    key.className = 'relay-cache-key';
    key.textContent = 'Key：' + entry.apiKey;
    const profile = document.createElement('code');
    profile.className = 'relay-cache-address';
    const profileConfig = RELAY_CLIENT_PROFILES.find((item) => item.id === entry.clientProfile);
    profile.textContent = '客户端：' + (profileConfig?.label || entry.clientProfile || '通用 OpenAI');

    const actions = document.createElement('div');
    actions.className = 'relay-cache-item-actions';
    const useButton = document.createElement('button');
    useButton.type = 'button';
    useButton.className = 'btn';
    useButton.dataset.cacheAction = 'use';
    useButton.dataset.identifier = entry.identifier;
    useButton.textContent = '使用';
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn danger-text';
    deleteButton.dataset.cacheAction = 'delete';
    deleteButton.dataset.identifier = entry.identifier;
    deleteButton.textContent = '删除';
    actions.append(useButton, deleteButton);

    item.append(head, address, key, profile, actions);
    fragment.append(item);
  }
  els.relayCacheList.append(fragment);
}

function handleRelayCacheAction(event) {
  const button = event.target.closest('button[data-cache-action]');
  if (!button) return;
  const identifier = button.dataset.identifier;
  if (button.dataset.cacheAction === 'use') {
    const entry = state.relayCaches.find((item) => item.identifier === identifier);
    if (!entry) return;
    fillRelayCache(entry);
    useRelay();
    return;
  }

  try {
    const next = deleteRelayCache(state.relayCaches, identifier);
    writeRelayCaches(next);
    state.relayCaches = next;
    updateRelayCacheUi();
    showToast('已删除缓存“' + identifier + '”。');
  } catch {
    showToast('无法更新浏览器本地缓存。', true);
  }
}

function clearAllRelayCaches() {
  if (state.relayCaches.length === 0) return;
  try {
    clearRelayCaches();
    state.relayCaches = [];
    updateRelayCacheUi();
    showToast('已清空全部本地缓存。');
  } catch {
    showToast('无法清空浏览器本地缓存。', true);
  }
}

function useRelay() {
  const baseUrl = els.relayBaseUrl.value.trim();
  const apiKey = els.relayApiKey.value.trim();
  if (!baseUrl || !apiKey) {
    showToast('请填写中转站地址和 key。', true);
    return;
  }
  state.customProvider = {
    id: '__relay__',
    label: els.relayCacheLabel.value.trim() || '临时中转站',
    type: 'openai-compatible',
    baseUrl,
    clientProfile: els.relayClientProfile.value,
    hasKey: true,
    isLocal: false,
    supportsModels: true,
    supportsTest: true,
  };
  state.selectedProviderId = '__relay__';
  state.models = [];
  state.selectedModels.clear();
  renderProviders();
  renderModels();
  updateSelection();
  showToast('已选择临时中转站，可以拉取模型。');
}

function selectedProvider() {
  if (state.selectedProviderId === '__relay__') return state.customProvider;
  return state.providers.find((item) => item.id === state.selectedProviderId);
}

function selectedProviderPayload() {
  if (state.selectedProviderId === '__relay__') {
    return {
      customProvider: {
        label: els.relayCacheLabel.value.trim() || '临时中转站',
        type: 'openai-compatible',
        baseUrl: els.relayBaseUrl.value.trim(),
        apiKey: els.relayApiKey.value.trim(),
        clientProfile: els.relayClientProfile.value,
        modelsPath: els.relayModelsPath.value.trim() || '/models',
        chatPath: els.relayChatPath.value.trim(),
      },
    };
  }
  if (!state.selectedProviderId) return null;
  const payload = { providerId: state.selectedProviderId };
  const pageKey = (state.pageKeys[state.selectedProviderId] || '').trim();
  if (pageKey) payload.apiKey = pageKey;
  return payload;
}

function updateKeyHint() {
  const provider = selectedProvider();
  if (!provider) {
    els.keySourceHint.textContent = '未选择接口';
    return;
  }
  if (provider.id === '__relay__') {
    els.keySourceHint.textContent = '临时中转站使用左侧填写的明文 key。';
    return;
  }
  if (provider.isLocal) {
    els.keySourceHint.textContent = '当前是本地 Ollama，无需 key。';
    return;
  }
  const pageKey = (state.pageKeys[provider.id] || '').trim();
  if (pageKey) {
    els.keySourceHint.textContent = provider.label + '：优先使用厂商旁填写的明文 key（不写回配置文件）。';
  } else if (provider.hasKey) {
    els.keySourceHint.textContent = provider.label + '：厂商旁未填 key，将回退使用配置文件中的 key。';
  } else {
    els.keySourceHint.textContent = provider.label + '：配置文件没有可用 key，请在厂商旁填写明文 key。';
  }
}

function scheduleIntervalMs() {
  const every = Math.max(1, Number(els.scheduleEvery.value) || 1);
  const unit = els.scheduleUnit.value === 'hours' ? 'hours' : 'minutes';
  return every * (unit === 'hours' ? 60 : 1) * 60 * 1000;
}

function startSchedule(restart = false) {
  if (!state.selectedProviderId || state.selectedModels.size === 0) {
    showToast('请先选择接口并勾选模型，再启动定时任务。', true);
    return;
  }
  stopSchedule(true);
  const ms = scheduleIntervalMs();
  state.schedule.running = true;
  state.schedule.nextAt = new Date(Date.now() + ms);
  state.schedule.timerId = window.setInterval(async () => {
    state.schedule.nextAt = new Date(Date.now() + ms);
    updateScheduleUi();
    await runTest({ source: 'schedule' });
  }, ms);
  updateScheduleUi();
  showToast(restart ? '定时任务已按新间隔重启。' : '定时任务已启动。');
}

function stopSchedule(silent = false) {
  if (state.schedule.timerId) {
    window.clearInterval(state.schedule.timerId);
  }
  state.schedule.timerId = null;
  state.schedule.running = false;
  state.schedule.nextAt = null;
  updateScheduleUi();
  if (!silent) showToast('定时任务已停止。');
}

function updateScheduleUi() {
  const running = state.schedule.running;
  els.scheduleStatus.textContent = running ? '运行中' : '未开启';
  els.scheduleStatus.className = 'pill ' + (running ? 'on' : 'off');
  els.startSchedule.disabled = running || state.testing;
  els.stopSchedule.disabled = !running;
  const every = Math.max(1, Number(els.scheduleEvery.value) || 1);
  const unitLabel = els.scheduleUnit.value === 'hours' ? '小时' : '分钟';
  const nextText = state.schedule.nextAt ? formatTime(state.schedule.nextAt) : '-';
  const lastText = state.schedule.lastAt ? formatTime(state.schedule.lastAt) : '-';
  const lastSummary = state.schedule.lastSummary || '暂无';
  els.scheduleHint.textContent = '按当前勾选模型，每 ' + every + ' ' + unitLabel + ' 自动测试一次；页面需保持打开。';
  els.scheduleMeta.textContent = '下次执行：' + nextText + ' · 上次：' + lastText + ' · ' + lastSummary;
}

function formatTime(date) {
  return date.toLocaleString('zh-CN', { hour12: false });
}

function setBusy(button, isBusy) {
  button.disabled = isBusy;
  button.dataset.label ||= button.textContent;
  button.textContent = isBusy ? '处理中...' : button.dataset.label;
}

function showToast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.classList.toggle('error', isError);
  els.toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove('show'), 3600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatUsage(usage) {
  const input = usage.prompt_tokens ?? usage.input_tokens ?? usage.promptTokenCount;
  const output = usage.completion_tokens ?? usage.output_tokens ?? usage.candidatesTokenCount;
  if (input || output) return '输入 ' + (input || 0) + ' / 输出 ' + (output || 0);
  return '含用量信息';
}
