// Add future relay client modes to this single list. The server and browser
// both import it, so the label, path and request style stay in sync.
export const RELAY_CLIENT_PROFILES = [
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
      'user-agent': 'codex_cli_rs/0.114.0',
      originator: 'codex_cli_rs',
      'openai-beta': 'responses=experimental',
    },
  },
  {
    id: 'cursor',
    label: 'Cursor 官方',
    description: 'Cursor Chat Completions + 官方 User-Agent',
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
