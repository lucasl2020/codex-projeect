import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp, buildChatRequest, buildModelRequest, providerFromBody, codexRequest, preferredRequestStyle, readResponsesStream } from '../server.mjs';

test('模型名称前缀决定 AnyRouter 首选请求格式', () => {
  const provider = { type: 'openai-compatible', requestStyle: 'auto' };
  assert.equal(preferredRequestStyle(provider, 'Claude-Fable-5-1'), 'anthropic');
  assert.equal(preferredRequestStyle(provider, 'gpt-6-astra'), 'responses');
  assert.equal(preferredRequestStyle(provider, 'gemini-3-pro'), 'chat-completions');
});

test('AnyRouter Codex 请求携带 v0.153.4 Responses Lite 参数', () => {
  const request = codexRequest('gpt-6-astra', 'hi', { authorization: 'Bearer secret' });
  const body = JSON.parse(request.body);
  assert.equal(request.headers.accept, 'text/event-stream');
  assert.equal(request.headers.originator, 'Codex Desktop');
  assert.match(request.headers['user-agent'], /^Codex Desktop\/0\.153\.4/);
  assert.equal(request.headers['x-codex-beta-features'], 'remote_compaction_v2');
  assert.equal(request.headers['x-openai-internal-codex-responses-lite'], 'true');
  assert.equal(request.headers['session-id'], request.headers['thread-id']);
  assert.equal(body.input[0].type, 'additional_tools');
  assert.deepEqual(body.input[0].tools, []);
  assert.equal(body.input[1].role, 'developer');
  assert.equal(body.input[2].role, 'user');
  assert.equal(body.input[2].content[0].text, 'hi');
  assert.equal(body.tool_choice, 'auto');
  assert.equal(body.parallel_tool_calls, false);
  assert.deepEqual(body.reasoning, { effort: 'low', context: 'all_turns' });
  assert.equal(body.store, false);
  assert.equal(body.stream, true);
  assert.deepEqual(body.include, ['reasoning.encrypted_content']);
  assert.equal(body.prompt_cache_key, request.headers['thread-id']);
  assert.deepEqual(body.text, { verbosity: 'low' });
  assert.equal(body.client_metadata.session_id, request.headers['session-id']);
  assert.equal('temperature' in body, false);
  assert.equal('max_output_tokens' in body, false);
});

test('读取 Responses SSE 的完成事件', async () => {
  const response = new Response(
    'event: response.created\ndata: {"type":"response.created","response":{"id":"r1"}}\n\n' +
    'event: response.completed\ndata: {"type":"response.completed","response":{"status":"completed","output_text":"OK"}}\n\n',
    { headers: { 'content-type': 'text/event-stream' } },
  );
  assert.equal((await readResponsesStream(response)).output_text, 'OK');
});

test('Responses SSE 没有完成事件时不判定成功', async () => {
  const response = new Response('data: {"type":"response.created","response":{"id":"r1"}}\n\n',
    { headers: { 'content-type': 'text/event-stream' } });
  await assert.rejects(readResponsesStream(response), /response.completed/);
});

test('AnyRouter 测试 API 发送 Codex 请求并读取跨字节分片的流式正文', async t => {
  const realFetch = globalThis.fetch;
  const calls = [];
  const events = [
    { type: 'response.output_text.delta', output_index: 0, content_index: 0, delta: '你好' },
    { type: 'response.output_text.delta', output_index: 0, content_index: 0, delta: '，测试成功' },
    { type: 'response.completed', response: { id: 'r1', status: 'completed', output: [], usage: { input_tokens: 5, output_tokens: 4 } } },
  ];
  const bytes = new TextEncoder().encode(': keepalive\r\n\r\n' + events.map(event => 'data: ' + JSON.stringify(event) + '\r\n\r\n').join(''));
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (new URL(url).hostname !== 'anyrouter.top') return realFetch(url, options);
    calls.push({ url, options });
    let offset = 0;
    return new Response(new ReadableStream({
      pull(controller) {
        if (offset === bytes.length) return controller.close();
        controller.enqueue(bytes.slice(offset, ++offset));
      },
    }), { headers: { 'content-type': 'text/event-stream' } });
  });
  const app = createApp();
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { app.closeAllConnections(); app.close(resolve); }));
  const response = await realFetch(`http://127.0.0.1:${app.address().port}/api/test`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ providerId: 'anyrouter', apiKey: 'fixture-secret', model: 'gpt-6-astra', prompt: 'hi' }),
  });
  const result = await response.json();
  assert.equal(response.status, 200, result.error?.message);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://anyrouter.top/v1/responses');
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.stream, true);
  assert.equal(body.store, false);
  assert.equal(body.input[2].content[0].text, 'hi');
  assert.equal(calls[0].options.headers.originator, 'Codex Desktop');
  assert.equal(calls[0].options.headers.authorization, 'Bearer fixture-secret');
  assert.equal(result.answer, '你好，测试成功');
  assert.equal(result.format, 'responses');
  assert.equal(result.attempts[0].client, 'Codex HTTP / SSE');
  assert.equal(result.usage.output_tokens, 4);
  assert.equal(JSON.stringify(result).includes('fixture-secret'), false);
});

test('AnyRouter Responses 返回 500 时最多重试两次', async t => {
  const realFetch = globalThis.fetch;
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (new URL(url).hostname !== 'anyrouter.top') return realFetch(url, options);
    calls += 1;
    if (calls < 3) {
      return new Response('{"error":{"message":"Internal Server Error"}}', {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('data: {"type":"response.completed","response":{"status":"completed","output_text":"OK"}}\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });
  });
  const app = createApp();
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { app.closeAllConnections(); app.close(resolve); }));
  const response = await realFetch(`http://127.0.0.1:${app.address().port}/api/test`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ providerId: 'anyrouter', apiKey: 'fixture-secret', model: 'gpt-6-astra', prompt: 'hi' }),
  });
  const result = await response.json();
  assert.equal(response.status, 200, result.error?.message);
  assert.equal(calls, 3);
  assert.equal(result.attempts.length, 3);
  assert.equal(result.attempts[0].status, 500);
  assert.equal(result.attempts[1].status, 500);
  assert.equal(result.attempts[2].ok, true);
});

test('Responses 流有正文但最终失败时仍然判定失败', async () => {
  const response = new Response([
    { type: 'response.output_text.delta', output_index: 0, content_index: 0, delta: 'partial' },
    { type: 'response.failed', response: { error: { message: 'upstream failed' } } },
  ].map(event => 'data: ' + JSON.stringify(event) + '\n\n').join(''));
  await assert.rejects(readResponsesStream(response), /upstream failed/);
});

test('完成事件携带正文时不会与流式增量重复拼接', async () => {
  const response = new Response([
    { type: 'response.output_text.delta', output_index: 0, content_index: 0, delta: 'OK' },
    { type: 'response.completed', response: { status: 'completed', output_text: 'OK' } },
  ].map(event => 'data: ' + JSON.stringify(event) + '\n\n').join(''));
  assert.equal((await readResponsesStream(response)).output_text, 'OK');
});

test('地址处理避免重复版本，保留厂商自定义前缀，兼容控制台与完整端点', () => {
  for (const baseUrl of ['https://example.com/v1', 'https://example.com/api/v3', 'https://example.com/compatible-mode/v1']) {
    const provider = { baseUrl, type: 'openai-compatible', apiKey: 'test' };
    assert.equal(buildChatRequest(provider, { model: 'demo', prompt: 'hi' }).url, baseUrl + '/chat/completions');
    assert.equal(buildModelRequest(provider).url, baseUrl + '/models');
  }
  for (const baseUrl of ['https://anyrouter.top/console', 'https://anyrouter.top/v1/messages']) {
    const provider = providerFromBody({}, { customProvider: { baseUrl, apiKey: 'test' } });
    assert.equal(buildModelRequest(provider).url, 'https://anyrouter.top/v1/models');
    const request = buildChatRequest({ ...provider, type: 'anthropic' }, { model: 'claude-demo', prompt: 'hi' });
    assert.equal(request.url, 'https://anyrouter.top/v1/messages');
    assert.equal(request.options.headers.authorization, 'Bearer test');
    assert.equal(request.options.headers['anthropic-version'], '2023-06-01');
    assert.equal(request.options.headers['anthropic-beta'], 'context-1m-2025-08-07');
    assert.match(request.options.headers['user-agent'], /claude-cli/);
  }
});

async function fixture(t, handler) {
  const calls = [];
  const upstream = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const call = { url: req.url, headers: req.headers, body: JSON.parse(Buffer.concat(chunks).toString() || '{}') };
    calls.push(call);
    const [status, payload] = handler(call);
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(typeof payload === 'string' ? payload : JSON.stringify(payload));
  });
  const app = createApp();
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  t.after(() => Promise.all([app, upstream].map(server => new Promise(resolve => {
    server.closeAllConnections();
    server.close(resolve);
  }))));
  return {
    calls,
    async request(endpoint = '/api/test', model = 'demo') {
      const response = await fetch(`http://127.0.0.1:${app.address().port}${endpoint}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model, prompt: 'hi', customProvider: {
          baseUrl: `http://127.0.0.1:${upstream.address().port}/v1`, apiKey: 'fixture-secret',
        } }),
      });
      return { status: response.status, data: await response.json() };
    },
  };
}

test('Chat 404 后自动切换 Responses，返回实际格式与所有尝试', async t => {
  const f = await fixture(t, call => call.url === '/v1/responses'
    ? [200, { output: [{ content: [{ type: 'output_text', text: 'OK' }] }] }]
    : [404, { error: { message: 'route missing' } }]);
  const { status, data } = await f.request();
  assert.equal(status, 200);
  assert.equal(data.answer, 'OK');
  assert.equal(data.format, 'responses');
  assert.equal(data.attempts.length, 2);
  assert.equal(data.attempts[0].status, 404);
  assert.equal(f.calls[1].body.input, 'hi');
});

test('普通模型也能回退到 Messages，不依赖名称猜测', async t => {
  const f = await fixture(t, call => call.url === '/v1/messages'
    ? [200, { content: [{ type: 'text', text: 'OK' }] }]
    : [404, { error: { message: 'route missing' } }]);
  const { data } = await f.request();
  assert.equal(data.format, 'messages');
  assert.equal(data.attempts.length, 3);
  assert.equal(f.calls[2].headers['x-api-key'], 'fixture-secret');
});

test('Claude 优先 Messages，但可回退 Chat', async t => {
  const f = await fixture(t, call => call.url === '/v1/chat/completions'
    ? [200, { choices: [{ message: { content: 'OK' } }] }]
    : [404, { error: { message: 'route missing' } }]);
  const { data } = await f.request('/api/test', 'claude-demo');
  assert.equal(f.calls[0].url, '/v1/messages');
  assert.equal(data.format, 'chat-completions');
});

test('按上游错误调整温度和 token 参数', async t => {
  const f = await fixture(t, ({ body }) => {
    if ('temperature' in body) return [400, { error: { message: 'unsupported temperature' } }];
    if ('max_tokens' in body) return [400, { error: { message: 'use max_completion_tokens instead of max_tokens' } }];
    return [200, { choices: [{ message: { content: 'OK' } }] }];
  });
  const { data } = await f.request();
  assert.equal(data.answer, 'OK');
  assert.equal(data.attempts.length, 3);
  assert.equal(f.calls[2].body.max_completion_tokens, 512);
});

for (const status of [401, 403, 429, 500]) {
  test(`上游 ${status} 不继续发送其他格式，记录错误且隐藏密钥`, async t => {
    const f = await fixture(t, () => [status, { error: { message: 'bad fixture-secret' } }]);
    const { data } = await f.request();
    assert.equal(f.calls.length, 1);
    assert.equal(data.attempts[0].status, status);
    assert.equal(JSON.stringify(data).includes('fixture-secret'), false);
  });
}

for (const payload of ['<html>Login</html>', {}, { status: 'failed', error: { message: 'failed' } }]) {
  test('网页、空响应和业务错误均不算成功', async t => {
    const f = await fixture(t, () => [200, payload]);
    const { status, data } = await f.request();
    assert.notEqual(status, 200);
    assert.equal(data.attempts[0].ok, false);
  });
}

test('模型列表返回 HTML 时给出手动测试提示', async t => {
  const f = await fixture(t, () => [200, '<html>console</html>']);
  const { status, data } = await f.request('/api/models');
  assert.notEqual(status, 200);
  assert.match(data.error.message, /手动输入/);
});

test('Responses 的 invalid codex request 不被后续 404 覆盖', async t => {
  const f = await fixture(t, call => call.url === '/v1/responses'
    ? [400, { error: { message: 'invalid codex request (request id: example)' } }]
    : [404, { error: { message: 'Not Found' } }]);
  const { data } = await f.request();
  assert.match(data.error.message, /invalid codex request/);
  assert.match(data.error.message, /responses/);
  assert.match(data.error.message, /客户端/);
  assert.equal(data.attempts.length, 3);
});

test('Claude Messages 的 400 不被其他格式的 404 覆盖', async t => {
  const f = await fixture(t, call => call.url === '/v1/messages'
    ? [400, { error: { message: 'Bad Request' } }]
    : [404, { error: { message: 'Not Found' } }]);
  const { data } = await f.request('/api/test', 'claude-demo');
  assert.match(data.error.message, /messages/);
  assert.match(data.error.message, /400: Bad Request/);
});

test('保留上游纯文本错误详情并脱敏', async t => {
  const f = await fixture(t, () => [400, 'invalid codex request: fixture-secret']);
  const { data } = await f.request();
  assert.match(data.error.message, /invalid codex request/);
  assert.equal(JSON.stringify(data).includes('fixture-secret'), false);
});
