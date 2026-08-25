import { createServer } from 'node:http';
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
  createApp,
  filterConfiguredProviders,
  loadConfig,
  normalizeModels,
  providerFromBody,
  applyProviderOverrides,
  publicProvider,
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
    supportsTest: true,
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
    chatPath: cleanPath(input.chatPath || clientProfile.chatPath),
  };
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
  const suffix = String(requestPath || '').replace(/^\/+/, '');
  return `${base}/${suffix}`;
}

function buildModelRequest(provider) {
  const type = provider.type;
  const pathByType = {
    openai: '/v1/models',
    anthropic: '/v1/models',
    gemini: '/v1beta/models',
    'openai-compatible': '/models',
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
  const model = cleanModel(input.model);
  const prompt = cleanPrompt(input.prompt);
  const temperature = cleanNumber(input.temperature, 0.2, 0, 2);
  const maxTokens = cleanNumber(input.maxTokens, 512, 1, 8192);

  if (provider.type === 'anthropic') {
    return {
      url: urlJoin(provider.baseUrl, provider.chatPath || '/v1/messages'),
      options: {
        method: 'POST',
        headers: {
          ...baseHeaders(provider),
          'anthropic-version': provider.anthropicVersion || '2023-06-01',
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
    return {
      url: urlJoin(provider.baseUrl, provider.chatPath || '/responses'),
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
    url: urlJoin(provider.baseUrl, provider.chatPath || '/v1/chat/completions'),
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

function baseHeaders(provider) {
  const headers = {
    accept: 'application/json',
    'content-type': 'application/json',
    ...provider.headers,
  };
  if (provider.type === 'anthropic') {
    headers['x-api-key'] = provider.apiKey;
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
      const id = item.id || item.name || item.model;
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
  const timer = timeoutSignal();
  try {
    const response = await fetch(url, { ...options, signal: timer.signal });
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
      const detail = payload?.error?.message || payload?.message || response.statusText;
      const err = new Error(`上游接口返回 ${response.status}: ${detail}`);
      err.status = response.status >= 500 ? 502 : 400;
      throw err;
    }
    return payload;
  } finally {
    timer.cancel();
  }
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
      return json(res, 200, { models: normalizeModels(provider, payload) });
    }

    if (req.method === 'POST' && pathname === '/api/test') {
      const body = await readJson(req);
      const provider = providerFromBody(config, body);
      ensureProviderReady(provider);
      const started = performance.now();
      const request = buildChatRequest(provider, body);
      const payload = await fetchJson(request.url, request.options);
      return json(res, 200, {
        answer: extractAnswer(provider, payload),
        elapsedMs: Math.round(performance.now() - started),
        usage: payload.usage || payload.usageMetadata || null,
      });
    }

    return json(res, 404, { error: { message: '接口不存在' } });
  } catch (error) {
    return json(res, error.status || 500, {
      error: { message: sanitizeError(error) },
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
