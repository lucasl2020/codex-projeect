import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  DEFAULT_PROMPT,
  buildChatRequest,
  buildModelRequest,
  createApp,
  envProxyOptions,
  loadConfig,
  normalizeWindowsProxy,
  normalizeModels,
  applyProviderOverrides,
  providerFromBody,
  publicProvider,
  sanitizeError,
} from '../server.mjs';

test('默认问题是今天的日期', () => {
  assert.equal(DEFAULT_PROMPT, '今天的日期');
});

test('存在代理环境变量时为 Node 网络请求启用代理并绕过本地服务', () => {
  const env = envProxyOptions({ HTTPS_PROXY: 'http://127.0.0.1:3456', NO_PROXY: 'internal.example' });
  assert.equal(env.NODE_USE_ENV_PROXY, '1');
  assert.equal(env.HTTPS_PROXY, 'http://127.0.0.1:3456');
  assert.match(env.NO_PROXY, /internal\.example/);
  assert.match(env.NO_PROXY, /127\.0\.0\.1/);
  assert.match(env.NO_PROXY, /localhost/);
  assert.equal(envProxyOptions({ HTTPS_PROXY: 'http://proxy', NODE_USE_ENV_PROXY: '1' }), null);
  assert.equal(envProxyOptions({}), null);
});

test('Windows 系统代理仅在启用时使用并支持动态端口', () => {
  assert.equal(normalizeWindowsProxy(false, '127.0.0.1:3456'), '');
  assert.equal(normalizeWindowsProxy(true, ''), '');
  assert.equal(normalizeWindowsProxy(true, '127.0.0.1:3456'), 'http://127.0.0.1:3456');
  assert.equal(
    normalizeWindowsProxy(true, 'http=127.0.0.1:3456;https=127.0.0.1:4567'),
    'http://127.0.0.1:4567'
  );
  assert.equal(normalizeWindowsProxy(true, 'socks=127.0.0.1:1080'), '');
});

test('便携版现有文件清单能够独立启动并读取厂商配置', async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'ai-model-tester-portable-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const name of ['server.mjs', 'public', 'config.example.json']) {
    await cp(new URL('../' + name, import.meta.url), path.join(dir, name), { recursive: true });
  }
  const portable = await import(pathToFileURL(path.join(dir, 'server.mjs')).href);
  const app = portable.createApp();
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => {
    app.closeAllConnections();
    app.close(resolve);
  }));
  const response = await fetch(`http://127.0.0.1:${app.address().port}/api/providers`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.usingExampleConfig, true);
  assert.ok(data.providers.some(provider => provider.id === 'anyrouter'));
});

test('首页默认展示中转站缓存搜索和客户端模式', async () => {
  const app = createApp();
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = app.address();
    const response = await fetch(`http://127.0.0.1:${port}/`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /<details class="relay-panel" open hidden>/);
    assert.match(html, /缓存标识 \/ 搜索缓存/);
    assert.match(html, /客户端标识（通常无需修改）/);
  } finally {
    await new Promise((resolve) => app.close(resolve));
  }
});

test('配置读取会解析环境变量且公开 provider 不泄漏 key', async () => {
  process.env.TEST_AI_KEY = 'sk-test-secret';
  const dir = await mkdtemp(path.join(tmpdir(), 'ai-model-tester-'));
  const configPath = path.join(dir, 'config.local.json');
  await writeFile(
    configPath,
    JSON.stringify({
      providers: [
        {
          id: 'openai',
          label: 'OpenAI',
          type: 'openai',
          baseUrl: 'https://api.openai.com',
          apiKey: '${TEST_AI_KEY}',
        },
      ],
    })
  );

  const config = await loadConfig(configPath);
  assert.equal(config.providers[0].apiKey, 'sk-test-secret');
  assert.deepEqual(publicProvider(config.providers[0]), {
    id: 'openai',
    label: 'OpenAI',
    type: 'openai',
    baseUrl: 'https://api.openai.com',
    hasKey: true,
    isLocal: false,
    supportsModels: true,
    supportsTest: true,
  });
});

test('模型列表归一化支持 openai/gemini/ollama 常见结构', () => {
  assert.deepEqual(
    normalizeModels({ type: 'openai' }, { data: [{ id: 'gpt-4.1', owned_by: 'openai' }] }),
    [{ id: 'gpt-4.1', name: 'gpt-4.1', ownedBy: 'openai', created: null, rawId: 'gpt-4.1' }]
  );
  assert.deepEqual(
    normalizeModels({ type: 'gemini' }, { models: [{ name: 'models/gemini-2.5-flash', publisher: 'Google' }] }),
    [{ id: 'gemini-2.5-flash', name: 'gemini-2.5-flash', ownedBy: 'Google', created: null, rawId: 'models/gemini-2.5-flash' }]
  );
  assert.deepEqual(
    normalizeModels({ type: 'ollama' }, { models: [{ name: 'llama3.2', modified_at: 'today' }] }),
    [{ id: 'llama3.2', name: 'llama3.2', ownedBy: 'ollama', created: 'today', rawId: 'llama3.2' }]
  );
});

test('请求构造匹配 provider 类型', () => {
  const openai = {
    type: 'openai',
    baseUrl: 'https://api.openai.com',
    apiKey: 'sk-test',
    headers: {},
  };
  assert.equal(buildModelRequest(openai).url, 'https://api.openai.com/v1/models');
  const chat = buildChatRequest(openai, { model: 'gpt-4.1-mini', prompt: 'hi' });
  assert.equal(chat.url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(chat.options.headers.authorization, 'Bearer sk-test');

  const gemini = {
    type: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    apiKey: 'AIza-secret',
    headers: {},
  };
  const geminiModels = buildModelRequest(gemini);
  assert.match(geminiModels.url, /\/v1beta\/models\?key=AIza-secret/);
  const geminiChat = buildChatRequest(gemini, { model: 'gemini-2.5-flash', prompt: 'hi' });
  assert.match(geminiChat.url, /gemini-2\.5-flash%3AgenerateContent|gemini-2\.5-flash:generateContent/);
  assert.match(geminiChat.url, /key=AIza-secret/);

  const anthropic = {
    type: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    apiKey: 'sk-ant-test',
    headers: {},
  };
  const anthropicModels = buildModelRequest(anthropic);
  assert.equal(anthropicModels.options.headers['x-api-key'], 'sk-ant-test');
  assert.equal(anthropicModels.options.headers['anthropic-version'], '2023-06-01');
});

test('请求体可携带临时中转站配置', () => {
  const provider = providerFromBody({ providers: [] }, {
    customProvider: {
      baseUrl: 'https://relay.example.com/v1/',
      apiKey: 'sk-relay',
      modelsPath: '/models',
      chatPath: '/chat/completions',
    },
  });
  assert.equal(provider.id, '__relay__');
  assert.equal(provider.type, 'openai-compatible');
  assert.equal(provider.baseUrl, 'https://relay.example.com/v1');
  assert.equal(buildModelRequest(provider).url, 'https://relay.example.com/v1/models');
});

test('Codex 客户端模式使用 Responses API 和 Codex 标识', () => {
  const provider = providerFromBody({ providers: [] }, {
    customProvider: {
      baseUrl: 'https://relay.example.com/v1',
      apiKey: 'sk-relay',
      clientProfile: 'codex',
    },
  });
  const request = buildChatRequest(provider, { model: 'gpt-5-codex', prompt: 'hi' });
  const body = JSON.parse(request.options.body);
  assert.equal(request.url, 'https://relay.example.com/v1/responses');
  assert.equal(request.options.headers.originator, 'Codex Desktop');
  assert.match(request.options.headers['user-agent'], /Codex Desktop/);
  assert.equal(request.options.headers['x-openai-internal-codex-responses-lite'], 'true');
  assert.equal(body.input, 'hi');
  assert.equal(body.max_output_tokens, 512);
});

test('Cursor 官方支持模型列表，但不伪造聊天接口', () => {
  const provider = providerFromBody({ providers: [] }, { customProvider: {
    baseUrl: 'https://api.cursor.com', apiKey: 'cur-test', clientProfile: 'cursor',
  } });
  assert.equal(buildModelRequest(provider).url, 'https://api.cursor.com/v1/models');
  assert.equal(publicProvider(provider).supportsTest, false);
  assert.throws(() => buildChatRequest(provider, { model: 'gpt-5', prompt: 'hi' }), /Cloud Agents API/);
});

test('错误脱敏会隐藏常见 token', () => {
  const error = sanitizeError(new Error('Bearer sk-test-secret x-api-key: abc AIza123456789'));
  assert.equal(error.includes('sk-test-secret'), false);
  assert.equal(error.includes('x-api-key: abc'), false);
  assert.equal(error.includes('AIza123456789'), false);
});

test('接口返回 provider 列表且不包含完整密钥', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'ai-model-tester-'));
  const configPath = path.join(dir, 'config.local.json');
  await writeFile(
    configPath,
    JSON.stringify({
      providers: [
        {
          id: 'ollama',
          label: 'Ollama',
          type: 'ollama',
          baseUrl: 'http://127.0.0.1:11434',
          apiKey: '',
        },
      ],
    })
  );

  const app = createApp({ configPath });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = app.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/providers`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.defaultPrompt, '今天的日期');
    assert.equal(payload.providers[0].id, 'ollama');
    assert.equal('apiKey' in payload.providers[0], false);
  } finally {
    await new Promise((resolve) => app.close(resolve));
  }
});

test('模型与测试接口会代理到本地上游服务', async () => {
  const upstream = createServer(async (req, res) => {
    if (req.url === '/v1/models') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: [{ id: 'demo-model', owned_by: 'fixture' }] }));
      return;
    }

    if (req.url === '/v1/chat/completions' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const parsed = JSON.parse(body);
      assert.equal(parsed.messages[0].content, '今天的日期');
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        choices: [{ message: { content: '今天是测试日期。' } }],
        usage: { prompt_tokens: 4, completion_tokens: 6 },
      }));
      return;
    }

    res.writeHead(404);
    res.end();
  });
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));

  const dir = await mkdtemp(path.join(tmpdir(), 'ai-model-tester-'));
  const configPath = path.join(dir, 'config.local.json');
  const upstreamUrl = `http://127.0.0.1:${upstream.address().port}`;
  await writeFile(
    configPath,
    JSON.stringify({
      providers: [
        {
          id: 'fixture',
          label: 'Fixture',
          type: 'openai',
          baseUrl: upstreamUrl,
          apiKey: 'sk-test',
        },
      ],
    })
  );

  const app = createApp({ configPath });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  try {
    const appUrl = `http://127.0.0.1:${app.address().port}`;
    const modelsResponse = await fetch(`${appUrl}/api/models`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ providerId: 'fixture' }),
    });
    const modelsPayload = await modelsResponse.json();
    assert.equal(modelsResponse.status, 200);
    assert.equal(modelsPayload.models[0].id, 'demo-model');

    const testResponse = await fetch(`${appUrl}/api/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ providerId: 'fixture', model: 'demo-model', prompt: '今天的日期' }),
    });
    const testPayload = await testResponse.json();
    assert.equal(testResponse.status, 200);
    assert.equal(testPayload.answer, '今天是测试日期。');
    assert.equal(testPayload.usage.prompt_tokens, 4);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await new Promise((resolve) => upstream.close(resolve));
  }
});

test('模型与测试接口支持临时中转站配置', async () => {
  const upstream = createServer(async (req, res) => {
    if (req.url === '/v1/models') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: [{ id: 'relay-model', owned_by: 'relay' }] }));
      return;
    }

    if (req.url === '/v1/chat/completions' && req.method === 'POST') {
      assert.equal(req.headers.authorization, 'Bearer sk-relay');
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ message: { content: 'relay ok' } }] }));
      return;
    }

    res.writeHead(404);
    res.end();
  });
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));

  const app = createApp();
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  try {
    const appUrl = `http://127.0.0.1:${app.address().port}`;
    const customProvider = {
      baseUrl: `http://127.0.0.1:${upstream.address().port}/v1`,
      apiKey: 'sk-relay',
      modelsPath: '/models',
      chatPath: '/chat/completions',
    };
    const modelsResponse = await fetch(`${appUrl}/api/models`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ customProvider }),
    });
    const modelsPayload = await modelsResponse.json();
    assert.equal(modelsPayload.models[0].id, 'relay-model');

    const testResponse = await fetch(`${appUrl}/api/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ customProvider, model: 'relay-model', prompt: '今天的日期' }),
    });
    const testPayload = await testResponse.json();
    assert.equal(testPayload.answer, 'relay ok');
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await new Promise((resolve) => upstream.close(resolve));
  }
});


test('页面 apiKey 优先于配置文件 key', () => {
  const config = {
    providers: [
      {
        id: 'openai',
        label: 'OpenAI',
        type: 'openai',
        baseUrl: 'https://api.openai.com',
        apiKey: 'sk-config',
        headers: {},
      },
    ],
  };

  const withPageKey = providerFromBody(config, {
    providerId: 'openai',
    apiKey: 'sk-page',
  });
  assert.equal(withPageKey.apiKey, 'sk-page');

  const fallback = providerFromBody(config, {
    providerId: 'openai',
    apiKey: '   ',
  });
  assert.equal(fallback.apiKey, 'sk-config');

  const override = applyProviderOverrides(config.providers[0], { apiKey: 'sk-temp' });
  assert.equal(override.apiKey, 'sk-temp');
  assert.equal(config.providers[0].apiKey, 'sk-config');
});

test('页面 key 覆盖会真正用于上游 Authorization', async () => {
  let seenAuth = '';
  const upstream = createServer(async (req, res) => {
    if (req.url === '/v1/models') {
      seenAuth = req.headers.authorization || '';
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: [{ id: 'page-key-model', owned_by: 'fixture' }] }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));

  const dir = await mkdtemp(path.join(tmpdir(), 'ai-model-tester-'));
  const configPath = path.join(dir, 'config.local.json');
  const upstreamUrl = `http://127.0.0.1:${upstream.address().port}`;
  await writeFile(
    configPath,
    JSON.stringify({
      providers: [
        {
          id: 'fixture',
          label: 'Fixture',
          type: 'openai',
          baseUrl: upstreamUrl,
          apiKey: 'sk-config',
        },
      ],
    })
  );

  const app = createApp({ configPath });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  try {
    const appUrl = `http://127.0.0.1:${app.address().port}`;
    const modelsResponse = await fetch(`${appUrl}/api/models`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ providerId: 'fixture', apiKey: 'sk-page-priority' }),
    });
    const modelsPayload = await modelsResponse.json();
    assert.equal(modelsResponse.status, 200);
    assert.equal(modelsPayload.models[0].id, 'page-key-model');
    assert.equal(seenAuth, 'Bearer sk-page-priority');
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await new Promise((resolve) => upstream.close(resolve));
  }
});
