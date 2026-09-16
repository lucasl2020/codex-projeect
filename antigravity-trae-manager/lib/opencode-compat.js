const crypto = require('crypto');

function messageText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map(part => (typeof part === 'string' ? part : (part.text || ''))).join('');
  }
  return '';
}

function parseToolCallsAndContent(rawText, allowedTools = null, options = { allowTools: true }) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      content: rawText || '',
      toolCalls: null,
      hasToolCalls: false,
      hasToolCallsWhenDisabled: false,
      hasUnknownTool: false,
      unknownToolName: null,
      isMalformed: false,
      malformedReason: null
    };
  }

  const allowTools = options.allowTools !== false;

  // 1. Remove CodeBuddy CLI retry warning
  const cliWarningPattern = /The model repeatedly wrote tool calls as plain text instead of invoking the tools[\s\S]*?(?:very long\)\.|\n|$)/gi;
  let cleaned = rawText.replace(cliWarningPattern, '').trim();

  // Check for any DSML or tool call indicators
  const hasDsml = /<[｜|]+DSML[｜|]+/i.test(cleaned) || /[｜|]+DSML[｜|]+/i.test(cleaned);
  const hasToolTag = /<(?:tool[_-]calls?|invoke\b|parameter\b|\/invoke>|\/tool[_-]calls?>|\/parameter>)/i.test(cleaned);
  const hasPossibleToolCall = hasDsml || hasToolTag;

  // If tools are disabled (tools not passed or tool_choice=none):
  // ANY tool markup produced by the model MUST trigger tools_not_enabled error.
  if (!allowTools) {
    if (hasPossibleToolCall) {
      return {
        content: null,
        toolCalls: null,
        hasToolCalls: false,
        hasToolCallsWhenDisabled: true,
        hasUnknownTool: false,
        unknownToolName: null,
        isMalformed: false,
        malformedReason: 'Model attempted tool call but tools are not enabled'
      };
    }
    return {
      content: cleaned.length > 0 ? cleaned : null,
      toolCalls: null,
      hasToolCalls: false,
      hasToolCallsWhenDisabled: false,
      hasUnknownTool: false,
      unknownToolName: null,
      isMalformed: false,
      malformedReason: null
    };
  }

  // If tools are enabled, but no tool call indicators exist:
  if (!hasPossibleToolCall) {
    return {
      content: cleaned.length > 0 ? cleaned : null,
      toolCalls: null,
      hasToolCalls: false,
      hasToolCallsWhenDisabled: false,
      hasUnknownTool: false,
      unknownToolName: null,
      isMalformed: false,
      malformedReason: null
    };
  }

  let allowedNames = null;
  if (Array.isArray(allowedTools)) {
    allowedNames = allowedTools
      .map(t => (typeof t === 'string' ? t : (t?.function?.name || t?.name)))
      .filter(Boolean);
  }

  const toolCalls = [];
  const seenCalls = new Set();
  let hasUnknownTool = false;
  let unknownToolName = null;
  let isMalformed = false;
  let malformedReason = null;

  function addToolCall(name, argsObj) {
    const normName = name.trim();
    if (!normName) {
      isMalformed = true;
      malformedReason = 'Tool call has empty tool name';
      return;
    }

    let finalName = normName;
    if (allowedNames) {
      const match = allowedNames.find(n => n.toLowerCase() === normName.toLowerCase());
      if (!match) {
        hasUnknownTool = true;
        unknownToolName = normName;
        isMalformed = true;
        malformedReason = `Model attempted to call undeclared tool: ${normName}`;
        return;
      }
      finalName = match;
    }

    let jsonArgs = '{}';
    try {
      jsonArgs = typeof argsObj === 'string' ? argsObj : JSON.stringify(argsObj || {});
    } catch {
      isMalformed = true;
      malformedReason = `Failed to serialize arguments for tool: ${finalName}`;
      return;
    }

    const key = `${finalName}:${jsonArgs}`;
    if (!seenCalls.has(key)) {
      seenCalls.add(key);
      toolCalls.push({
        id: `call_${crypto.randomBytes(9).toString('hex')}`,
        type: 'function',
        function: {
          name: finalName,
          arguments: jsonArgs
        }
      });
    }
  }

  function parseBodyArgs(body) {
    const argsObj = {};
    const trimmed = body.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        return JSON.parse(trimmed);
      } catch {}
    }

    const paramRegex = /<(?:[｜|]+DSML[｜|]+\s*)?parameter\s+name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:[｜|]+DSML[｜|]+\s*)?parameter>/gi;
    let pMatch;
    let foundParam = false;
    while ((pMatch = paramRegex.exec(body)) !== null) {
      foundParam = true;
      const pName = pMatch[1].trim();
      let pVal = pMatch[2].trim();
      if (pVal === 'true') pVal = true;
      else if (pVal === 'false') pVal = false;
      else if (/^-?\d+(?:\.\d+)?$/.test(pVal) && !Number.isNaN(Number(pVal))) {
        try {
          const num = JSON.parse(pVal);
          if (typeof num === 'number') pVal = num;
        } catch {}
      } else {
        try {
          if ((pVal.startsWith('{') && pVal.endsWith('}')) || (pVal.startsWith('[') && pVal.endsWith(']'))) {
            pVal = JSON.parse(pVal);
          }
        } catch {}
      }
      argsObj[pName] = pVal;
    }

    if (!foundParam) {
      const genericTagRegex = /<([a-zA-Z0-9_-]+)>([\s\S]*?)<\/\1>/gi;
      let gMatch;
      while ((gMatch = genericTagRegex.exec(body)) !== null) {
        const pName = gMatch[1].trim();
        if (pName.toLowerCase() === 'invoke' || pName.toLowerCase() === 'parameter') continue;
        argsObj[pName] = gMatch[2].trim();
      }
    }
    return argsObj;
  }

  let leftover = cleaned;

  // 1. Regex for <invoke name="...">...</invoke> (DSML or plain XML)
  const invokeRegex = /<(?:[｜|]+DSML[｜|]+\s*)?invoke\s+name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:[｜|]+DSML[｜|]+\s*)?invoke>/gi;
  let invMatch;
  while ((invMatch = invokeRegex.exec(cleaned)) !== null) {
    const toolName = invMatch[1].trim();
    const body = invMatch[2];
    addToolCall(toolName, parseBodyArgs(body));
    leftover = leftover.replace(invMatch[0], '');
  }

  // 2. Regex for shorthand: <tool_call><bash><parameter ...>...</invoke>
  if (toolCalls.length === 0 && !hasUnknownTool) {
    const shorthandRegex = /<tool[_-]calls?>\s*<([a-zA-Z0-9_-]+)>\s*([\s\S]*?)<\/(?:invoke|\1|tool[_-]calls?)>/gi;
    let sMatch;
    while ((sMatch = shorthandRegex.exec(cleaned)) !== null) {
      const toolName = sMatch[1].trim();
      const body = sMatch[2];
      if (toolName.toLowerCase() !== 'invoke' && toolName.toLowerCase() !== 'parameter') {
        addToolCall(toolName, parseBodyArgs(body));
        leftover = leftover.replace(sMatch[0], '');
      }
    }
  }

  // Remove valid container tags and warnings from leftover
  leftover = leftover
    .replace(/<[｜|]+DSML[｜|]+\s*(?:calls|tool_calls)>[\s\S]*?<\/[｜|]+DSML[｜|]+\s*(?:calls|tool_calls)>/gi, '')
    .replace(/<\/?(?:[｜|]+DSML[｜|]+\s*)?(?:calls|tool_calls)>/gi, '')
    .replace(/<\/?tool[_-]calls?>/gi, '')
    .replace(cliWarningPattern, '')
    .trim();

  // Check if leftover still contains broken/incomplete tool protocol markup
  const hasLeftoverToolMarkup =
    /<[｜|]+DSML/i.test(leftover) ||
    /[｜|]+DSML[｜|]+/i.test(leftover) ||
    /<(?:invoke|parameter)\b/i.test(leftover) ||
    /<\/(?:invoke|parameter)>/i.test(leftover) ||
    /<tool[_-]calls?\b/i.test(leftover) ||
    /<\/tool[_-]calls?>/i.test(leftover);

  if (hasLeftoverToolMarkup) {
    isMalformed = true;
    if (!malformedReason) {
      malformedReason = 'Model produced incomplete or malformed tool call markup';
    }
  }

  if (toolCalls.length === 0 && !hasUnknownTool) {
    isMalformed = true;
    if (!malformedReason) {
      malformedReason = 'Model produced tool call markup that could not be parsed';
    }
  }

  // 3. Clean content
  let textContent = cleaned
    .replace(/<[｜|]+DSML[｜|]+\s*(?:calls|tool_calls)>[\s\S]*?<\/[｜|]+DSML[｜|]+\s*(?:calls|tool_calls)>/gi, '')
    .replace(/<tool[_-]calls?>[\s\S]*?<\/(?:tool[_-]calls?|invoke)>/gi, '')
    .replace(/<(?:[｜|]+DSML[｜|]+\s*)?invoke\b[\s\S]*?<\/(?:[｜|]+DSML[｜|]+\s*)?invoke>/gi, '')
    .replace(/<[｜|]+DSML[｜|]+[^>]*>/gi, '')
    .replace(/<\/[｜|]+DSML[｜|]+[^>]*>/gi, '')
    .replace(/<\/?tool[_-]calls?>/gi, '')
    .replace(/<\/?invoke[^>]*>/gi, '')
    .replace(/<\/?parameter[^>]*>/gi, '')
    .trim();

  const content = textContent.length > 0 ? textContent : null;

  return {
    content: isMalformed ? null : content,
    toolCalls: (!isMalformed && toolCalls.length > 0) ? toolCalls : null,
    hasToolCalls: !isMalformed && toolCalls.length > 0,
    hasToolCallsWhenDisabled: false,
    hasUnknownTool,
    unknownToolName,
    isMalformed,
    malformedReason
  };
}

function formatChatMessages(messages = [], tools = null, toolChoice = null, functions = null, functionCall = null) {
  const msgList = Array.isArray(messages) ? messages : [];
  const systemMessages = msgList.filter(m => m.role === 'system');
  const nonSystem = msgList.filter(m => m.role !== 'system');

  let effectiveTools = tools;
  if (!effectiveTools && Array.isArray(functions)) {
    effectiveTools = functions.map(fn => ({ type: 'function', function: fn }));
  }

  let effectiveToolChoice = toolChoice;
  if (!effectiveToolChoice && functionCall) {
    effectiveToolChoice = typeof functionCall === 'string'
      ? functionCall
      : { type: 'function', function: functionCall };
  }

  let systemPrompt = systemMessages
    .map(m => messageText(m.content))
    .filter(Boolean)
    .join('\n');

  const toolsEnabled = Array.isArray(effectiveTools) && effectiveTools.length > 0 && effectiveToolChoice !== 'none';

  if (toolsEnabled) {
    const toolDescriptions = effectiveTools.map(t => {
      const fn = t.function || t;
      const desc = fn.description ? ` (${fn.description})` : '';
      const params = fn.parameters ? ` Parameters: ${JSON.stringify(fn.parameters)}` : '';
      return `- ${fn.name}${desc}${params}`;
    }).join('\n');

    let toolPrompt = `\n\n[Available Tools]\nYou have access to the following tools:\n${toolDescriptions}\n\nWhen you need to call a tool, you MUST output the tool call in this format:\n<tool_calls>\n<invoke name="tool_name">\n<parameter name="param_name">param_value</parameter>\n</invoke>\n</tool_calls>`;

    if (effectiveToolChoice === 'required') {
      toolPrompt += `\nYou MUST invoke at least one tool from the available tools.`;
    } else if (typeof effectiveToolChoice === 'object' && effectiveToolChoice?.function?.name) {
      toolPrompt += `\nYou MUST call the tool "${effectiveToolChoice.function.name}".`;
    }

    systemPrompt = systemPrompt ? `${systemPrompt}${toolPrompt}` : toolPrompt.trim();
  } else {
    const noToolsNote = `\n\n[Instruction: Tools are NOT enabled for this request. Do NOT generate any <invoke>, <tool_calls>, or DSML tool markup. Answer directly with natural language.]`;
    systemPrompt = systemPrompt ? `${systemPrompt}${noToolsNote}` : noToolsNote.trim();
  }

  if (nonSystem.length === 0) {
    return { prompt: 'Say OK in one word.', systemPrompt };
  }

  if (nonSystem.length === 1 && nonSystem[0].role === 'user') {
    return { prompt: messageText(nonSystem[0].content), systemPrompt };
  }

  // Find where trailing tool responses start
  let trailingToolIndex = nonSystem.length;
  while (trailingToolIndex > 0) {
    const r = nonSystem[trailingToolIndex - 1].role;
    if (r === 'tool' || r === 'function') {
      trailingToolIndex--;
    } else {
      break;
    }
  }

  const historyMsgs = trailingToolIndex < nonSystem.length ? nonSystem.slice(0, trailingToolIndex) : nonSystem.slice(0, nonSystem.length - 1);
  const currentMsgs = trailingToolIndex < nonSystem.length ? nonSystem.slice(trailingToolIndex) : [nonSystem[nonSystem.length - 1]];

  const historyTurns = [];
  for (let i = 0; i < historyMsgs.length; i++) {
    const m = historyMsgs[i];
    if (m.role === 'user') {
      historyTurns.push(`User: ${messageText(m.content)}`);
    } else if (m.role === 'assistant') {
      let text = messageText(m.content);
      if (Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
        const callsStr = m.tool_calls.map(tc => {
          const fn = tc.function || tc;
          return `[Calls ${fn.name}(${fn.arguments || ''})]`;
        }).join(' ');
        text = text ? `${text} ${callsStr}` : callsStr;
      }
      historyTurns.push(`Assistant: ${text}`);
    } else if (m.role === 'tool' || m.role === 'function') {
      historyTurns.push(`Tool Result (${m.name || m.tool_call_id || 'Tool'}): ${messageText(m.content)}`);
    }
  }

  let currentTurn = '';
  if (currentMsgs.every(m => m.role === 'tool' || m.role === 'function')) {
    const results = currentMsgs.map(m => `Tool Result (${m.name || m.tool_call_id || 'Tool'}): ${messageText(m.content)}`);
    currentTurn = `${results.join('\n\n')}\nPlease continue answering based on the tool results above.`;
  } else {
    const lastMsg = currentMsgs[currentMsgs.length - 1];
    if (lastMsg.role === 'user') {
      currentTurn = `User: ${messageText(lastMsg.content)}`;
    } else if (lastMsg.role === 'assistant') {
      currentTurn = `Assistant: ${messageText(lastMsg.content)}`;
    } else {
      currentTurn = messageText(lastMsg.content);
    }
  }

  let prompt = '';
  if (historyTurns.length > 0) {
    prompt = `[Conversation History]\n${historyTurns.join('\n\n')}\n\n[Current Request]\n${currentTurn}`;
  } else {
    prompt = currentTurn;
  }

  return { prompt, systemPrompt };
}

function buildChatCompletionResponse(id, model, parsedResult) {
  const created = Math.floor(Date.now() / 1000);
  const finishReason = parsedResult.hasToolCalls ? 'tool_calls' : 'stop';
  const message = {
    role: 'assistant',
    content: parsedResult.content
  };
  if (parsedResult.hasToolCalls && parsedResult.toolCalls) {
    message.tool_calls = parsedResult.toolCalls;
  }

  return {
    id,
    object: 'chat.completion',
    created,
    model,
    choices: [
      {
        index: 0,
        message,
        finish_reason: finishReason
      }
    ]
  };
}

function buildChatCompletionStreamChunks(id, model, parsedResult) {
  const created = Math.floor(Date.now() / 1000);
  const chunks = [];
  let roleSent = false;

  if (parsedResult.content) {
    chunks.push({
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [
        {
          index: 0,
          delta: {
            role: 'assistant',
            content: parsedResult.content
          },
          finish_reason: null
        }
      ]
    });
    roleSent = true;
  }

  if (parsedResult.hasToolCalls && parsedResult.toolCalls) {
    const delta = {
      tool_calls: parsedResult.toolCalls.map((tc, idx) => ({
        index: idx,
        ...tc
      }))
    };
    if (!roleSent) {
      delta.role = 'assistant';
      roleSent = true;
    }
    chunks.push({
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [
        {
          index: 0,
          delta,
          finish_reason: null
        }
      ]
    });
  }

  const finishReason = parsedResult.hasToolCalls ? 'tool_calls' : 'stop';
  chunks.push({
    id,
    object: 'chat.completion.chunk',
    created,
    model,
    choices: [
      {
        index: 0,
        delta: {},
        finish_reason: finishReason
      }
    ]
  });

  return chunks;
}

module.exports = {
  messageText,
  parseToolCallsAndContent,
  formatChatMessages,
  buildChatCompletionResponse,
  buildChatCompletionStreamChunks
};
