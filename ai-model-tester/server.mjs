import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getRelayClientProfile } from './public/client-profiles.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');
const CONFIG_PATH = path.join(__dirname, 'config.local.json');
const EXAMPLE_CONFIG_PATH = path.join(__dirname, 'config.example.json');
const DEFAULT_PROMPT = '今天的日期';
const MAX_BODY_BYTES = 64 * 1024;
const DEFAULT_TIMEOUT_MS = 30000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
};

export {
  DEFAULT_PROMPT,
  DEFAULT_TIMEOUT_MS,
  buildChatRequest,
  buildModelRequest,
  codexRequest,
  createApp,
  filterConfiguredProviders,
  loadConfig,
  normalizeWindowsProxy,
  normalizeModels,
  envProxyOptions,
  preferredRequestStyle,
  providerFromBody,
  applyProviderOverrides,
  publicProvider,
  readResponsesStream,
  sanitizeError,
};

function json(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(text);
}

function text(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'content-type': contentType,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(body);
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const err = new Error('请求体过大');
      err.status = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const err = new Error('请求体不是有效 JSON');
    err.status = 400;
    throw err;
  }
}

async function loadConfig(configPath = CONFIG_PATH) {
  const fallbackPath = existsSync(configPath) ? configPath : EXAMPLE_CONFIG_PATH;
  const raw = await readFile(fallbackPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.providers)) {
    throw new Error('配置文件必须包含 providers 数组');
  }
  return {
    providers: parsed.providers.map((provider) => ({
      ...provider,
      apiKey: resolveSecret(provider.apiKey),
      headers: resolveHeaders(provider.headers || {}),
    })),
    isExample: fallbackPath === EXAMPLE_CONFIG_PATH,
  };
}

function resolveSecret(value) {
  if (typeof value !== 'string') return '';
  const envMatch = value.match(/^\$\{([A-Z0-9_]+)\}$/i);
  if (envMatch) return process.env[envMatch[1]] || '';
  return value;
}

function resolveHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, resolveSecret(value)])
  );
}

function envProxyOptions(env = process.env, fallbackProxy = '') {
  const hasProxy = Boolean(fallbackProxy || env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy || env.ALL_PROXY || env.all_proxy);
  if (!hasProxy || env.NODE_USE_ENV_PROXY === '1') return null;
  const noProxy = env.NO_PROXY || env.no_proxy || '';
  const entries = noProxy.split(',').map(value => value.trim()).filter(Boolean);
  for (const host of ['127.0.0.1', 'localhost']) {
    if (!entries.includes(host)) entries.push(host);
  }
  return {
    ...env,
    ...(fallbackProxy && !env.HTTPS_PROXY && !env.https_proxy ? { HTTPS_PROXY: fallbackProxy } : {}),
    ...(fallbackProxy && !env.HTTP_PROXY && !env.http_proxy ? { HTTP_PROXY: fallbackProxy } : {}),
    NODE_USE_ENV_PROXY: '1',
    NO_PROXY: entries.join(','),
  };
}

function normalizeWindowsProxy(enabled, proxyServer) {
  if (!enabled || typeof proxyServer !== 'string' || !proxyServer.trim()) return '';
  const value = proxyServer.trim();
  const entries = Object.fromEntries(value.split(';').map((entry) => {
    const separator = entry.indexOf('=');
    return separator > 0
      ? [entry.slice(0, separator).trim().toLowerCase(), entry.slice(separator + 1).trim()]
      : ['', entry.trim()];
  }));
  const proxy = entries.https || entries.http || entries[''];
  if (!proxy) return '';
  return /^[a-z][a-z\d+.-]*:\/\//i.test(proxy) ? proxy : `http://${proxy}`;
}

function windowsSystemProxy() {
  if (process.platform !== 'win32') return '';
  const key = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings';
  try {
    const options = { encoding: 'utf8', windowsHide: true };
    const enabledOutput = execFileSync('reg.exe', ['query', key, '/v', 'ProxyEnable'], options);
    const serverOutput = execFileSync('reg.exe', ['query', key, '/v', 'ProxyServer'], options);
    const enabled = /ProxyEnable\s+REG_DWORD\s+0x1\b/i.test(enabledOutput);
    const match = serverOutput.match(/ProxyServer\s+REG_\w+\s+(.+)$/im);
    return normalizeWindowsProxy(enabled, match?.[1]);
  } catch {
    return '';
  }
}

function filterConfiguredProviders(config) {
  return config.providers.filter((provider) => {
    if (provider.type === 'ollama') return Boolean(provider.baseUrl);
    return Boolean(provider.baseUrl && provider.apiKey);
  });
}

function publicProvider(provider) {
  return {
    id: String(provider.id || ''),
    label: String(provider.label || provider.id || ''),
    type: String(provider.type || ''),
    baseUrl: String(provider.baseUrl || ''),
    hasKey: Boolean(provider.apiKey),
    isLocal: provider.type === 'ollama',
    supportsModels: true,
    supportsTest: !isCursor(provider),
  };
}

function findProvider(config, providerId) {
  const id = cleanId(providerId);
  return config.providers.find((provider) => provider.id === id);
}

function providerFromBody(config, body) {
  if (body?.customProvider) {
    return normalizeCustomProvider(body.customProvider);
  }
  const provider = findProvider(config, body.providerId);
  return applyProviderOverrides(provider, body);
}

function applyProviderOverrides(provider, body = {}) {
  if (!provider) return provider;
  const next = {
    ...provider,
    headers: { ...(provider.headers || {}) },
  };
  if (typeof body.apiKey === 'string' && body.apiKey.trim()) {
    next.apiKey = body.apiKey.trim();
  }
  return next;
}

function normalizeCustomProvider(input) {
  const clientProfile = getRelayClientProfile(input.clientProfile);
  const provider = {
    id: '__relay__',
    label: String(input.label || '临时中转站').slice(0, 80),
    type: input.type || 'openai-compatible',
    baseUrl: cleanBaseUrl(input.baseUrl),
    apiKey: typeof input.apiKey === 'string' ? input.apiKey.trim() : '',
    clientProfile: clientProfile.id,
    requestStyle: clientProfile.requestStyle,
    headers: {
      ...clientProfile.headers,
      ...resolveHeaders(input.headers || {}),
    },
    modelsPath: cleanPath(input.modelsPath || clientProfile.modelsPath || ''),
    chatPath: cleanPath(input.chatPath || clientProfile.chatPath || ''),
  };
  if (!new URL(provider.baseUrl).pathname.replace(/\/+$/, '')) {
    for (const key of ['modelsPath', 'chatPath']) {
      if (/^\/(models|chat\/completions|responses|messages)$/.test(provider[key])) provider[key] = '/v1' + provider[key];
    }
  }
  ensureProviderReady(provider);
  return provider;
}

function cleanBaseUrl(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    const err = new Error('中转站地址不能为空');
    err.status = 400;
    throw err;
  }
  let parsed;
  try {
    parsed = new URL(value.trim());
  } catch {
    const err = new Error('中转站地址不是有效 URL');
    err.status = 400;
    throw err;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    const err = new Error('中转站地址只支持 http 或 https');
    err.status = 400;
    throw err;
  }
  parsed.search = '';
  parsed.hash = '';
  parsed.pathname = parsed.pathname.replace(/\/(?:console|dashboard)(?:\/.*)?$/, '')
    .replace(/\/(?:chat\/completions|responses|messages|models)\/?$/, '');
  return parsed.toString().replace(/\/+$/, '');
}

function cleanPath(value) {
  if (!value) return '';
  if (typeof value !== 'string' || value.length > 180 || !value.startsWith('/')) {
    const err = new Error('接口路径必须以 / 开头');
    err.status = 400;
    throw err;
  }
  return value;
}

function cleanId(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_.:-]{1,80}$/.test(value)) {
    const err = new Error('providerId 无效');
    err.status = 400;
    throw err;
  }
  return value;
}

function cleanModel(value) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 200) {
    const err = new Error('model 无效');
    err.status = 400;
    throw err;
  }
  return value.trim();
}

function cleanPrompt(value) {
  const prompt = typeof value === 'string' ? value.trim() : DEFAULT_PROMPT;
  if (!prompt || prompt.length > 12000) {
    const err = new Error('prompt 无效或过长');
    err.status = 400;
    throw err;
  }
  return prompt;
}

function cleanNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function ensureProviderReady(provider) {
  if (!provider) {
    const err = new Error('未找到 provider');
    err.status = 404;
    throw err;
  }
  if (provider.type !== 'ollama' && !provider.apiKey) {
    const err = new Error('该 provider 尚未配置 API key');
    err.status = 400;
    throw err;
  }
}

function urlJoin(baseUrl, requestPath) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  let suffix = String(requestPath || '').replace(/^\/+/, '');
  if (/\/v\d+(?:beta)?$/.test(base)) suffix = suffix.replace(/^v\d+(?:beta)?\//, '');
  return `${base}/${suffix}`;
}

function isCursor(provider) {
  return new URL(provider.baseUrl).hostname === 'api.cursor.com';
}

function apiPath(provider, endpoint) {
  return new URL(provider.baseUrl).pathname.replace(/\/+$/, '') ? `/${endpoint}` : `/v1/${endpoint}`;
}

function buildModelRequest(provider) {
  const type = provider.type;
  const pathByType = {
    openai: '/v1/models',
    anthropic: '/v1/models',
    gemini: '/v1beta/models',
    'openai-compatible': apiPath(provider, 'models'),
    ollama: '/api/tags',
  };
  const headers = baseHeaders(provider);
  if (type === 'anthropic') {
    headers['anthropic-version'] = provider.anthropicVersion || '2023-06-01';
  }
  if (type === 'gemini') {
    const url = new URL(urlJoin(provider.baseUrl, provider.modelsPath || pathByType[type]));
    url.searchParams.set('key', provider.apiKey);
    return {
      url: url.toString(),
      options: { method: 'GET', headers },
    };
  }
  return {
    url: urlJoin(provider.baseUrl, provider.modelsPath || pathByType[type] || '/models'),
    options: { method: 'GET', headers },
  };
}

function buildChatRequest(provider, input) {
  if (isCursor(provider)) {
    const error = new Error('Cursor 官方 Key 用于 Cloud Agents API，可拉取模型，但不能调用 Chat Completions / Responses。本工具尚不执行云端 Agent 任务；如使用第三方 Cursor 中转，请填写该中转的 API 地址和 Key。');
    error.status = 400;
    throw error;
  }
  const model = cleanModel(input.model);
  const prompt = cleanPrompt(input.prompt);
  const temperature = cleanNumber(input.temperature, 0.2, 0, 2);
  const maxTokens = cleanNumber(input.maxTokens, 512, 1, 8192);

  if (provider.type === 'anthropic') {
    const anyRouter = new URL(provider.baseUrl).hostname === 'anyrouter.top';
    return {
      url: urlJoin(provider.baseUrl, provider.chatPath || apiPath(provider, 'messages')),
      options: {
        method: 'POST',
        headers: {
          ...baseHeaders(provider),
          'anthropic-version': provider.anthropicVersion || '2023-06-01',
          ...(anyRouter ? {
            'anthropic-beta': 'context-1m-2025-08-07',
            'user-agent': 'claude-cli/2.1.161',
            'x-app': 'cli',
          } : {}),
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: 'user', content: prompt }],
        }),
      },
    };
  }

  if (provider.type === 'gemini') {
    const chatPath = provider.chatPath || `/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const url = new URL(urlJoin(provider.baseUrl, chatPath));
    url.searchParams.set('key', provider.apiKey);
    return {
      url: url.toString(),
      options: {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      },
    };
  }

  if (provider.type === 'ollama') {
    return {
      url: urlJoin(provider.baseUrl, provider.chatPath || '/api/generate'),
      options: {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...provider.headers },
        body: JSON.stringify({ model, prompt, stream: false, options: { temperature } }),
      },
    };
  }

  if (provider.requestStyle === 'responses') {
    if (new URL(provider.baseUrl).hostname === 'anyrouter.top') {
      return {
        url: urlJoin(provider.baseUrl, provider.chatPath || apiPath(provider, 'responses')),
        options: { method: 'POST', ...codexRequest(model, prompt, baseHeaders(provider)) },
      };
    }
    return {
      url: urlJoin(provider.baseUrl, provider.chatPath || apiPath(provider, 'responses')),
      options: {
        method: 'POST',
        headers: baseHeaders(provider),
        body: JSON.stringify({
          model,
          input: prompt,
          temperature,
          max_output_tokens: maxTokens,
          stream: false,
        }),
      },
    };
  }

  return {
    url: urlJoin(provider.baseUrl, provider.chatPath || apiPath(provider, 'chat/completions')),
    options: {
      method: 'POST',
      headers: baseHeaders(provider),
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    },
  };
}

// Captured from the locally installed Codex 0.153.4 Responses Lite client.
function codexRequest(model, prompt, headers) {
  const installation = randomUUID();
  const session = randomUUID();
  const turn = randomUUID();
  const contextWindow = randomUUID();
  const windowId = `${session}:0`;
  const turnMetadata = {
    installation_id: installation,
    session_id: session,
    thread_id: session,
    agent_name: '/root',
    turn_id: turn,
    window_id: windowId,
    window_number: 0,
    context_window_id: contextWindow,
    request_kind: 'turn',
    root_turn_id: turn,
    thread_source: 'user',
    sandbox: 'none',
    sandbox_mode: 'read-only',
    auto_review_enabled: false,
    node_repl_auto_review_required: true,
    node_repl_disabled: false,
    turn_started_at_unix_ms: Date.now(),
  };
  const clientMetadata = {
    thread_id: session,
    turn_id: turn,
    root_turn_id: turn,
    session_id: session,
    'x-codex-turn-metadata': JSON.stringify(turnMetadata),
    'x-codex-installation-id': installation,
    'x-codex-window-id': windowId,
  };
  return {
    headers: { ...headers, accept: 'text/event-stream',
      'user-agent': 'Codex Desktop/0.153.4 (Windows; x86_64) (codex_exec; 0.153.4)',
      originator: 'Codex Desktop',
      'x-codex-beta-features': 'remote_compaction_v2',
      'x-openai-internal-codex-responses-lite': 'true',
      'x-client-request-id': session,
      'x-codex-window-id': windowId,
      'x-codex-turn-metadata': JSON.stringify(turnMetadata),
      'session-id': session,
      'thread-id': session },
    body: JSON.stringify({
      model,
      input: [
        { type: 'additional_tools', id: `at_${randomUUID()}`, role: 'developer', tools: [] },
        { type: 'message', id: `msg_${randomUUID()}`, role: 'developer',
          content: [{ type: 'input_text', text: 'You are Codex, a coding assistant. Answer briefly without using tools.' }] },
        { type: 'message', id: `msg_${randomUUID()}`, role: 'user',
          content: [{ type: 'input_text', text: prompt }] },
      ],
      tool_choice: 'auto', parallel_tool_calls: false,
      reasoning: { effort: 'low', context: 'all_turns' },
      store: false, stream: true, include: ['reasoning.encrypted_content'],
      prompt_cache_key: session, text: { verbosity: 'low' },
      client_metadata: clientMetadata,
    }),
  };
}

async function readResponsesStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let size = 0;
  const textParts = new Map();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8 * 1024 * 1024) throw new Error('Responses 流超出 8 MiB 限制');
      pending += decoder.decode(value, { stream: true });
      let separator;
      while ((separator = /\r?\n\r?\n/.exec(pending))) {
        const block = pending.slice(0, separator.index);
        pending = pending.slice(separator.index + separator[0].length);
        const data = block.split(/\r?\n/).filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trimStart()).join('\n');
        if (!data || data === '[DONE]') continue;
        let event;
        try { event = JSON.parse(data); } catch { throw new Error('Responses 流包含无效 JSON'); }
        if (event.type === 'response.output_text.delta' || event.type === 'response.output_text.done') {
          const key = `${event.output_index ?? 0}:${event.content_index ?? 0}`;
          if (event.type.endsWith('.delta') && typeof event.delta === 'string') {
            textParts.set(key, (textParts.get(key) || '') + event.delta);
          } else if (typeof event.text === 'string') {
            textParts.set(key, event.text);
          }
        }
        if (event.type === 'error' || event.type === 'response.failed' || event.type === 'response.incomplete') {
          throw new Error(event.error?.message || event.response?.error?.message || event.message || 'Responses 流未成功完成');
        }
        if (event.type === 'response.completed') {
          if (!event.response || event.response.status !== 'completed' || event.response.error) {
            throw new Error('Responses 完成事件未包含成功响应');
          }
          const payload = event.response;
          const outputText = payload.output?.flatMap(item => item.content || []).map(part => part.text || '').join('');
          if (!payload.output_text && !outputText && textParts.size) {
            payload.output_text = [...textParts].sort(([a], [b]) => {
              const [ai, ac] = a.split(':').map(Number);
              const [bi, bc] = b.split(':').map(Number);
              return ai - bi || ac - bc;
            }).map(([, text]) => text).join('');
          }
          return payload;
        }
      }
    }
    throw new Error('Responses 流提前结束，未收到 response.completed，不能判定成功');
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

function baseHeaders(provider) {
  const headers = {
    accept: 'application/json',
    'content-type': 'application/json',
    ...provider.headers,
  };
  if (provider.type === 'anthropic') {
    headers['x-api-key'] = provider.apiKey;
    if (new URL(provider.baseUrl).hostname === 'anyrouter.top') headers.authorization = `Bearer ${provider.apiKey}`;
  } else if (provider.type !== 'ollama' && provider.type !== 'gemini') {
    headers.authorization = `Bearer ${provider.apiKey}`;
  }
  return headers;
}

function normalizeModels(provider, payload) {
  const type = provider.type;
  let rawModels = [];
  if (Array.isArray(payload?.data)) rawModels = payload.data;
  else if (Array.isArray(payload?.models)) rawModels = payload.models;

  return rawModels
    .map((item) => {
      const id = typeof item === 'string' ? item : item?.id || item?.name || item?.model;
      if (!id) return null;
      const cleanName = String(id).replace(/^models\//, '');
      return {
        id: cleanName,
        name: cleanName,
        ownedBy: item.owned_by || item.ownedBy || item.publisher || type,
        created: item.created || item.modified_at || item.modifiedAt || null,
        rawId: String(id),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function extractAnswer(provider, payload) {
  if (provider.type === 'anthropic') {
    const part = payload?.content?.find((item) => item?.type === 'text' && item.text);
    return part?.text || '';
  }
  if (provider.type === 'gemini') {
    return payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim() || '';
  }
  if (provider.type === 'ollama') {
    return payload?.response || payload?.message?.content || '';
  }
  if (provider.requestStyle === 'responses') {
    if (typeof payload?.output_text === 'string') return payload.output_text;
    return payload?.output
      ?.flatMap((item) => item?.content || [])
      ?.map((part) => part?.text || '')
      ?.join('')
      ?.trim() || '';
  }
  return payload?.choices?.[0]?.message?.content || payload?.choices?.[0]?.text || '';
}

function sanitizeError(error) {
  const message = String(error?.message || error || '请求失败');
  return message
    .replace(/Bearer\s+[A-Za-z0-9._\-+/=]+/gi, 'Bearer [redacted]')
    .replace(/sk-[A-Za-z0-9._\-]+/g, 'sk-[redacted]')
    .replace(/AIza[0-9A-Za-z_\-]+/g, 'AIza[redacted]')
    .replace(/x-api-key:\s*[^,\s]+/gi, 'x-api-key: [redacted]');
}

function timeoutSignal(ms = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

async function fetchJson(url, options) {
  const streaming = options.headers?.accept === 'text/event-stream';
  const timer = timeoutSignal(streaming ? 120000 : DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, redirect: 'error', signal: timer.signal });
    if (streaming && response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
      return await readResponsesStream(response);
    }
    const textBody = await response.text();
    let payload = {};
    if (textBody) {
      try {
        payload = JSON.parse(textBody);
      } catch {
        payload = { text: textBody.slice(0, 2000) };
      }
    }
    if (!response.ok) {
      const plainText = typeof payload.text === 'string' && !/^\s*</.test(payload.text) ? payload.text : '';
      const detail = payload?.error?.message || payload?.message ||
        (typeof payload.error === 'string' ? payload.error : '') || plainText || response.statusText;
      const err = new Error(`上游接口返回 ${response.status}: ${detail}`);
      err.status = response.status >= 500 ? 502 : 400;
      err.upstreamStatus = response.status;
      throw err;
    }
    return payload;
  } finally {
    timer.cancel();
  }
}

function preferredRequestStyle(provider, model) {
  const name = String(model || '').trim().toLowerCase();
  if (name.startsWith('claude')) return 'anthropic';
  if (name.startsWith('gpt')) return 'responses';
  if (provider.type === 'openai' || provider.requestStyle === 'responses') return 'responses';
  return 'chat-completions';
}

async function testModel(provider, input) {
  const native = ['anthropic', 'gemini', 'ollama'].includes(provider.type);
  const anyRouter = new URL(provider.baseUrl).hostname === 'anyrouter.top';
  const preferred = preferredRequestStyle(provider, input.model);
  const styles = native ? [provider.type] : [...new Set([preferred, 'chat-completions', 'responses', 'anthropic'])];
  const attempts = [];
  const started = performance.now();
  let lastError;
  for (const style of styles) {
    const candidate = { ...provider, type: style === 'anthropic' ? 'anthropic' : provider.type, requestStyle: style };
    const originalStyle = /messages$/.test(provider.chatPath || '') ? 'anthropic'
      : /responses$/.test(provider.chatPath || '') ? 'responses' : 'chat-completions';
    if (!native && style !== originalStyle) candidate.chatPath = '';
    const request = buildChatRequest(candidate, input);
    for (let retry = 0; retry < 3; retry += 1) {
      const format = { anthropic: 'messages', gemini: 'generateContent', ollama: 'generate' }[style] || style;
      const attempt = { format, endpoint: new URL(request.url).origin + new URL(request.url).pathname,
        ...(anyRouter && style === 'responses' ? { client: 'Codex HTTP / SSE',
          parameterNote: 'Codex 0.153.4 Responses Lite；温度与输出上限不发送' } : {}),
        ...(anyRouter && style === 'anthropic' ? { client: 'Claude Code / Messages',
          parameterNote: '已启用 context-1m-2025-08-07' } : {}) };
      try {
        const payload = await fetchJson(request.url, request.options);
        const answer = extractAnswer(candidate, payload);
        if (payload.error || payload.status === 'failed' || typeof answer !== 'string' || !answer.trim()) {
          const error = new Error(payload.error?.message || '上游未返回有效文本（可能是网页、错误结构或输出额度不足），不能判定测试通过');
          error.status = 502;
          throw error;
        }
        attempts.push({ ...attempt, ok: true });
        return { answer, format, endpoint: attempt.endpoint, attempts,
          elapsedMs: Math.round(performance.now() - started), usage: payload.usage || payload.usageMetadata || null };
      } catch (error) {
        const safeMessage = sanitizeError(String(error.message).split(provider.apiKey).join('[redacted]'));
        attempts.push({ ...attempt, ok: false, status: error.upstreamStatus || null, message: safeMessage });
        lastError = error;
        const body = JSON.parse(request.options.body);
        if (error.upstreamStatus === 400 && /temperature/i.test(error.message) && 'temperature' in body) {
          delete body.temperature;
        } else if (error.upstreamStatus === 400 && /max_tokens|max_completion_tokens/i.test(error.message) && 'max_tokens' in body && style === 'chat-completions') {
          body.max_completion_tokens = body.max_tokens;
          delete body.max_tokens;
        } else if (anyRouter && retry < 2 && [500, 502, 503, 504].includes(error.upstreamStatus)) {
          await new Promise(resolve => setTimeout(resolve, 300 * (retry + 1)));
          continue;
        } else {
          break;
        }
        request.options.body = JSON.stringify(body);
      }
    }
    if (![400, 404, 405, 415, 422, 501].includes(lastError.upstreamStatus)) break;
  }
  // A missing fallback route must not hide an earlier request rejection.
  const relevant = attempts.findLast(attempt => ![404, 405, 501].includes(attempt.status)) || attempts.at(-1);
  const error = new Error(`${relevant.format} · ${relevant.endpoint}\n${relevant.message}`);
  error.status = relevant.status ? (relevant.status >= 500 ? 502 : 400) : lastError.status;
  error.attempts = attempts;
  if (/invalid codex request/i.test(relevant.message)) {
    error.message += anyRouter
      ? '\n已使用 Codex HTTP / SSE 请求参数，但上游仍拒绝。具体被拒字段需根据 request id 查询站点日志；这不等于已完整复刻官方客户端。'
      : '\n该请求被上游判定为无效 Codex 请求。通用 Responses 请求与 Codex 客户端协议可能不兼容。';
  } else if (anyRouter && relevant.status === 503) {
    error.message += '\n请求格式已被 AnyRouter 接受，但所选模型的上游通道连续返回 503。请换用同类模型或稍后重试。';
  }
  throw error;
}

async function handleApi(req, res, pathname, configPath) {
  try {
    const config = await loadConfig(configPath);
    if (req.method === 'GET' && pathname === '/api/providers') {
      return json(res, 200, {
        providers: config.providers.map(publicProvider),
        usingExampleConfig: config.isExample,
        defaultPrompt: DEFAULT_PROMPT,
      });
    }

    if (req.method === 'POST' && pathname === '/api/models') {
      const body = await readJson(req);
      const provider = providerFromBody(config, body);
      ensureProviderReady(provider);
      const request = buildModelRequest(provider);
      const payload = await fetchJson(request.url, request.options);
      if (!Array.isArray(payload?.data) && !Array.isArray(payload?.models)) {
        const error = new Error('模型接口未返回模型列表。请核对 API 地址；也可手动输入模型名称进行测试。');
        error.status = 502;
        throw error;
      }
      return json(res, 200, { models: normalizeModels(provider, payload) });
    }

    if (req.method === 'POST' && pathname === '/api/test') {
      const body = await readJson(req);
      const provider = providerFromBody(config, body);
      ensureProviderReady(provider);
      return json(res, 200, await testModel(provider, body));
    }

    return json(res, 404, { error: { message: '接口不存在' } });
  } catch (error) {
    return json(res, error.status || 500, {
      error: { message: sanitizeError(error) },
      attempts: error.attempts || [],
    });
  }
}

async function serveStatic(req, res, pathname) {
  const staticPath = pathname === '/' ? '/index.html' : pathname;
  const fullPath = path.normalize(path.join(PUBLIC_DIR, staticPath));
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    return text(res, 403, 'Forbidden');
  }
  try {
    const body = await readFile(fullPath);
    const contentType = MIME_TYPES[path.extname(fullPath)] || 'application/octet-stream';
    res.writeHead(200, {
      'content-type': contentType,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    res.end(body);
  } catch {
    text(res, 404, 'Not found');
  }
}

function createApp(options = {}) {
  const configPath = options.configPath || CONFIG_PATH;
  return createServer(async (req, res) => {
    const origin = `http://${req.headers.host || '127.0.0.1'}`;
    const url = new URL(req.url || '/', origin);
    if (url.pathname.startsWith('/api/')) {
      return handleApi(req, res, url.pathname, configPath);
    }
    return serveStatic(req, res, url.pathname);
  });
}

function preferredPorts() {
  const preferred = Number(process.env.PORT || 8787);
  const start = Number.isFinite(preferred) && preferred > 0 ? preferred : 8787;
  const ports = [start];
  for (let p = start + 1; p <= start + 30; p += 1) ports.push(p);
  // also try a few common free fallbacks
  for (const p of [8789, 8790, 8791, 8799, 8800]) {
    if (!ports.includes(p)) ports.push(p);
  }
  return ports;
}

function listenWithFallback(server, host = '127.0.0.1') {
  const ports = preferredPorts();
  let index = 0;

  return new Promise((resolve, reject) => {
    const tryNext = () => {
      if (index >= ports.length) {
        reject(new Error('没有可用端口，请设置 PORT 环境变量后重试'));
        return;
      }
      const port = ports[index++];
      const onError = (error) => {
        server.off('listening', onListening);
        if (error && error.code === 'EADDRINUSE') {
          console.warn(`端口 ${port} 已被占用，尝试下一个...`);
          tryNext();
          return;
        }
        reject(error);
      };
      const onListening = () => {
        server.off('error', onError);
        resolve({ port, host });
      };
      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(port, host);
    };
    tryNext();
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  let proxyEnv = envProxyOptions();
  if (!proxyEnv && process.env.NODE_USE_ENV_PROXY !== '1') {
    const detectedProxy = process.env.AI_MODEL_TESTER_PROXY || windowsSystemProxy();
    if (detectedProxy) proxyEnv = envProxyOptions(process.env, detectedProxy);
  }
  if (proxyEnv) {
    const child = spawn(process.execPath, process.argv.slice(1), { env: proxyEnv, stdio: 'inherit' });
    child.on('error', (error) => {
      console.error(error.message || error);
      process.exit(1);
    });
    child.on('exit', (code) => process.exit(code ?? 1));
  } else {
    const server = createApp();
    listenWithFallback(server, '127.0.0.1')
      .then(({ port, host }) => {
        const url = `http://${host}:${port}`;
        console.log(`AI 模型测试工具已启动：${url}`);
        if (process.env.OPEN_BROWSER === '1') {
          // launcher script will open browser; keep server simple
        }
      })
      .catch((error) => {
        console.error(error.message || error);
        process.exit(1);
      });
  }
}
