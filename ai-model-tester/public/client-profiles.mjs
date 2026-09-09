// Add future relay client modes to this single list. The server and browser
// both import it, so the label, path and request style stay in sync.
export const RELAY_CLIENT_PROFILES = [
  {
    id: 'auto',
    label: '自动识别（推荐）',
    description: '自动尝试 Chat Completions、Responses、Messages，结果显示实际格式',
    requestStyle: 'auto',
    chatPath: '',
    headers: {},
  },
  {
    id: 'openai',
    label: '通用 OpenAI',
    description: 'Chat Completions 请求',
    requestStyle: 'chat-completions',
    chatPath: '/chat/completions',
    headers: {},
  },
  {
    id: 'codex',
    label: 'Codex 客户端',
    description: 'Responses API + Codex 标识',
    requestStyle: 'responses',
    chatPath: '/responses',
    headers: {
      'user-agent': 'Codex Desktop/0.153.4 (Windows; x86_64) (codex_exec; 0.153.4)',
      originator: 'Codex Desktop',
      'x-codex-beta-features': 'remote_compaction_v2',
      'x-openai-internal-codex-responses-lite': 'true',
    },
  },
  {
    id: 'cursor',
    label: 'Cursor 中转标识',
    description: '仅适用于第三方中转；Cursor 官方 Key 是 Cloud Agents API Key',
    requestStyle: 'chat-completions',
    chatPath: '/v1/chat/completions',
    modelsPath: '/v1/models',
    headers: {
      'user-agent': 'cursor/0.42.0',
    },
  },
];

export function getRelayClientProfile(id) {
  return RELAY_CLIENT_PROFILES.find((profile) => profile.id === id) || RELAY_CLIENT_PROFILES[0];
}
