const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseToolCallsAndContent,
  formatChatMessages,
  buildChatCompletionResponse,
  buildChatCompletionStreamChunks
} = require('../lib/opencode-compat');

test('OpenCode 兼容: 正确解析纯 DSML 工具调用并返回标准 OpenAI tool_calls 结构', () => {
  const raw = `<｜｜DSML｜｜tool_calls>\n<｜｜DSML｜｜invoke name="Bash">\n<｜｜DSML｜｜parameter name="command" string="true">ls -la</｜｜DSML｜｜parameter>\n</｜｜DSML｜｜invoke>\n</｜｜DSML｜｜tool_calls>`;
  const res = parseToolCallsAndContent(raw, [{ name: 'Bash' }]);

  assert.equal(res.hasToolCalls, true);
  assert.equal(res.content, null);
  assert.equal(res.isMalformed, false);
  assert.ok(Array.isArray(res.toolCalls));
  assert.equal(res.toolCalls.length, 1);
  assert.equal(res.toolCalls[0].type, 'function');
  assert.equal(res.toolCalls[0].function.name, 'Bash');
  assert.deepEqual(JSON.parse(res.toolCalls[0].function.arguments), { command: 'ls -la' });
  assert.ok(res.toolCalls[0].id.startsWith('call_'));
});

test('OpenCode 兼容: 混合自然语言与 DSML 工具调用时保留前置文本且绝不泄露 DSML 标记', () => {
  const raw = `好的，我来帮你执行该命令：\n<｜DSML｜ calls><｜DSML｜ invoke name="Bash"><｜DSML｜ parameter name="command" string="true">ls -la</｜DSML｜ parameter></｜DSML｜ invoke></｜DSML｜ calls>`;
  const res = parseToolCallsAndContent(raw, [{ name: 'Bash' }]);

  assert.equal(res.hasToolCalls, true);
  assert.equal(res.content, '好的，我来帮你执行该命令：');
  assert.equal(/<[｜|]+DSML/i.test(res.content), false);
  assert.equal(res.isMalformed, false);
  assert.equal(res.toolCalls.length, 1);
  assert.equal(res.toolCalls[0].function.name, 'Bash');
  assert.deepEqual(JSON.parse(res.toolCalls[0].function.arguments), { command: 'ls -la' });
});

test('OpenCode 兼容: 清理 CodeBuddy CLI 重试警告与 XML 工具标签，提取有效 tool_calls', () => {
  const raw = `<tool-calls>\n<invoke name="Bash">\n<parameter name="command">ls -la</parameter>\n</invoke>\n</tool-calls>The model repeatedly wrote tool calls as plain text instead of invoking the tools, so nothing was executed. Please re-send your request (or start a new session if the conversation has grown very long).`;
  const res = parseToolCallsAndContent(raw, [{ name: 'Bash' }]);

  assert.equal(res.hasToolCalls, true);
  assert.equal(res.content, null);
  assert.equal(res.isMalformed, false);
  assert.equal(res.toolCalls.length, 1);
  assert.equal(res.toolCalls[0].function.name, 'Bash');
  assert.deepEqual(JSON.parse(res.toolCalls[0].function.arguments), { command: 'ls -la' });
});

test('OpenCode 兼容: 普通自然语言问答不含工具调用时完整保留回答', () => {
  const raw = '你好！我是 OpenCode 编程助手，有什么我可以帮你的？';
  const res = parseToolCallsAndContent(raw, [{ name: 'Bash' }]);

  assert.equal(res.hasToolCalls, false);
  assert.equal(res.content, raw);
  assert.equal(res.toolCalls, null);
  assert.equal(res.isMalformed, false);
});

test('OpenCode 兼容 (审查项2): 调用 allowedTools 中未声明的工具标记为未知工具并判定为 malformed', () => {
  const raw = `<tool-calls>\n<invoke name="DangerousExecute">\n<parameter name="cmd">rm -rf /</parameter>\n</invoke>\n</tool-calls>`;
  const res = parseToolCallsAndContent(raw, [{ name: 'Bash' }], { allowTools: true });

  assert.equal(res.hasUnknownTool, true);
  assert.equal(res.unknownToolName, 'DangerousExecute');
  assert.equal(res.isMalformed, true);
  assert.equal(res.hasToolCalls, false);
  assert.equal(res.toolCalls, null);
  assert.match(res.malformedReason, /undeclared tool/i);
});

test('OpenCode 兼容 (审查项3): 带自然语言前缀但含有残缺/未闭合 DSML 时判定为 malformed 而非静默清洗', () => {
  const rawTruncated = `好的，我来帮你执行：\n<｜DSML｜ calls><｜DSML｜ invoke name="Bash"><｜DSML｜ parameter name="command" string="true">ls -la`;
  const res = parseToolCallsAndContent(rawTruncated, [{ name: 'Bash' }], { allowTools: true });

  assert.equal(res.isMalformed, true);
  assert.equal(res.hasToolCalls, false);
  assert.equal(res.toolCalls, null);
  assert.equal(res.content, null);
  assert.ok(res.malformedReason);
});

test('OpenCode 兼容 (审查项4): 未启用 tools 时模型生成纯 DSML 标记为 tools_not_enabled', () => {
  const pureDsml = `<｜DSML｜ calls><｜DSML｜ invoke name="Bash"><｜DSML｜ parameter name="command">echo 1</｜DSML｜ parameter></｜DSML｜ invoke></｜DSML｜ calls>`;
  const res = parseToolCallsAndContent(pureDsml, null, { allowTools: false });

  assert.equal(res.hasToolCallsWhenDisabled, true);
  assert.equal(res.hasToolCalls, false);
  assert.equal(res.toolCalls, null);
});

test('OpenCode 兼容 (审查项4): 未启用 tools 时模型生成混合文本与 DSML 也标记为 tools_not_enabled 而非静默返回 200', () => {
  const mixedDsml = `这里是解答：<｜DSML｜ calls><｜DSML｜ invoke name="Bash"><｜DSML｜ parameter name="command">echo 1</｜DSML｜ parameter></｜DSML｜ invoke></｜DSML｜ calls>完成。`;
  const res = parseToolCallsAndContent(mixedDsml, null, { allowTools: false });

  assert.equal(res.hasToolCallsWhenDisabled, true);
  assert.equal(res.hasToolCalls, false);
  assert.equal(res.toolCalls, null);
});

test('OpenCode 兼容: 完整保留多轮对话历史（用户、助手、工具调用与工具返回）', () => {
  const messages = [
    { role: 'system', content: 'You are OpenCode assistant.' },
    { role: 'user', content: '请记住我的代号是 998877。' },
    { role: 'assistant', content: '好的，我已经记住了你的代号是 998877。' },
    { role: 'user', content: '查看当前目录' },
    {
      role: 'assistant',
      content: null,
      tool_calls: [
        { id: 'call_1', type: 'function', function: { name: 'Bash', arguments: '{"command":"ls"}' } }
      ]
    },
    { role: 'tool', tool_call_id: 'call_1', content: 'package.json server.js' },
    { role: 'user', content: '刚才目录下有什么文件？' }
  ];

  const tools = [
    { type: 'function', function: { name: 'Bash', description: 'Run command' } }
  ];

  const { prompt, systemPrompt } = formatChatMessages(messages, tools, 'auto');

  assert.ok(systemPrompt.includes('You are OpenCode assistant.'));
  assert.ok(systemPrompt.includes('Bash'));
  assert.ok(prompt.includes('998877'));
  assert.ok(prompt.includes('查看当前目录'));
  assert.ok(prompt.includes('Bash'));
  assert.ok(prompt.includes('package.json server.js'));
  assert.ok(prompt.includes('刚才目录下有什么文件？'));
});

test('OpenCode 兼容: 构建非流式与流式标准 OpenAI 响应', () => {
  const parsedWithTools = {
    hasToolCalls: true,
    toolCalls: [
      { id: 'call_abc123', type: 'function', function: { name: 'Bash', arguments: '{"command":"ls"}' } }
    ],
    content: '开始执行'
  };

  // 非流式
  const jsonResp = buildChatCompletionResponse('chatcmpl-1', 'deepseek-v4-pro', parsedWithTools);
  assert.equal(jsonResp.object, 'chat.completion');
  assert.equal(jsonResp.choices[0].finish_reason, 'tool_calls');
  assert.equal(jsonResp.choices[0].message.role, 'assistant');
  assert.equal(jsonResp.choices[0].message.content, '开始执行');
  assert.equal(jsonResp.choices[0].message.tool_calls.length, 1);

  // 流式
  const chunks = buildChatCompletionStreamChunks('chatcmpl-1', 'deepseek-v4-pro', parsedWithTools);
  assert.ok(chunks.length >= 2);
  const textChunk = chunks.find(c => c.choices[0].delta?.content);
  assert.ok(textChunk);
  assert.equal(textChunk.choices[0].delta.content, '开始执行');

  const tcChunk = chunks.find(c => c.choices[0].delta?.tool_calls);
  assert.ok(tcChunk);
  assert.equal(tcChunk.choices[0].delta.tool_calls[0].function.name, 'Bash');

  const finishChunk = chunks.find(c => c.choices[0].finish_reason === 'tool_calls');
  assert.ok(finishChunk);

  // 跨 IDE 兼容测试：验证首包有 role，后续包不重复发送 role
  assert.equal(textChunk.choices[0].delta.role, 'assistant');
  assert.equal(tcChunk.choices[0].delta.role, undefined);
});

test('跨 IDE 兼容 (Cursor/旧版扩展): 支持兼容 functions 与 function_call 字段', () => {
  const messages = [{ role: 'user', content: '查看项目配置' }];
  const functions = [
    { name: 'read_config', description: 'Read config file', parameters: { type: 'object' } }
  ];
  const { prompt, systemPrompt } = formatChatMessages(messages, null, null, functions, 'auto');

  assert.ok(systemPrompt.includes('read_config'));
  assert.ok(systemPrompt.includes('[Available Tools]'));
  assert.ok(prompt.includes('查看项目配置'));
});

test('跨 IDE 兼容 (Cursor/Trae/Windsurf): 支持连续多个工具调用返回并合并进当前执行轮次', () => {
  const messages = [
    { role: 'user', content: '读取文件 A 和 B' },
    {
      role: 'assistant',
      content: null,
      tool_calls: [
        { id: 'call_1', type: 'function', function: { name: 'read_file', arguments: '{"path":"A.txt"}' } },
        { id: 'call_2', type: 'function', function: { name: 'read_file', arguments: '{"path":"B.txt"}' } }
      ]
    },
    { role: 'tool', tool_call_id: 'call_1', name: 'read_file', content: '内容 A' },
    { role: 'tool', tool_call_id: 'call_2', name: 'read_file', content: '内容 B' }
  ];

  const tools = [{ type: 'function', function: { name: 'read_file' } }];
  const { prompt } = formatChatMessages(messages, tools, 'auto');

  assert.ok(prompt.includes('Tool Result (read_file): 内容 A'));
  assert.ok(prompt.includes('Tool Result (read_file): 内容 B'));
  assert.ok(prompt.includes('Please continue answering based on the tool results above.'));
});

test('跨 IDE 兼容 (Cursor/Cline): 支持结构化/多模态 messages content 数组与对象解析', () => {
  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: '请分析这行代码：' },
        { type: 'image_url', image_url: { url: 'https://example.com/img.png' } },
        { type: 'text', text: 'console.log("hello");' }
      ]
    }
  ];

  const { prompt } = formatChatMessages(messages, null, 'none');
  assert.ok(prompt.includes('请分析这行代码：'));
  assert.ok(prompt.includes('console.log("hello");'));
  assert.equal(prompt.includes('[object Object]'), false);
});

