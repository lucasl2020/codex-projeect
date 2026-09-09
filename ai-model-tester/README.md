# 模型接口测试台

零依赖本地网页工具：拉取主流 AI 接口模型列表，勾选模型后立即测试，也可按分钟/小时定时巡检。

## 一键启动

推荐直接双击或运行：

```powershell
.\start.cmd
```

或：

```powershell
.\start.ps1
```

行为：

- 默认使用 `8787`
- 若端口被占用，自动尝试后续端口
- 启动成功后自动打开浏览器
- 如不想打开浏览器：`.\start.ps1 -NoBrowser`
- 指定起始端口：`.\start.ps1 -Port 8790`

## 启动

```powershell
cd outputs\ai-model-tester
node server.mjs
```

打开 `http://127.0.0.1:8787`。

检测到 `HTTP_PROXY`、`HTTPS_PROXY` 或 `ALL_PROXY` 时，服务会自动让 Node 使用该代理，并绕过 `127.0.0.1` 与 `localhost`。Windows 下如果没有代理环境变量，会读取当前已启用的系统代理地址；两者都没有时直接连接。可通过 `AI_MODEL_TESTER_PROXY` 显式覆盖。这可避免部分中转站在 Node/OpenSSL 直连时出现 TLS 握手失败。

## 配置与 Key

1. 配置文件默认：复制 `config.example.json` 为 `config.local.json`。
2. 页面每个厂商卡片旁边可直接填明文 key。
3. 优先级：**页面厂商旁 key > 配置文件 key**。
4. 页面 key 明文显示，只随请求发给本地服务，不写回文件。
5. 临时中转站 key 也是明文输入。

## 自动识别与请求结果

- 模型名以 `claude` 开头时优先使用 Claude Code / Messages，以 `gpt` 开头时优先使用 Codex / Responses Lite；其他兼容模型优先使用 Chat Completions。厂商原生 Gemini / Ollama 使用各自格式。
- 模型名称只影响尝试顺序，实际成功响应才决定结果格式。成功即停止，不逐个探测全部支持格式。
- 每项结果显示实际格式，并可展开查看请求地址、失败状态和尝试记录。401 / 403 / 429 或服务器故障会停止，避免重复发送。
- 地址自动避免重复 `/v1`，保留 `/api/v3` 等厂商前缀；临时中转可粘贴控制台或完整标准端点地址。
- 模型列表不可用时，可直接手动添加模型 ID；不会把 HTML 页面或空返回算作成功。
- 上游明确拒绝温度或旧 token 参数时会调整后重试，实际重试会出现在请求记录中。

## 官方 Key 与 AnyRouter / Cursor

- GPT 官方使用 [OpenAI 平台 API Key](https://developers.openai.com/api/docs/quickstart)，在 OpenAI 卡片填写，或设置 `OPENAI_API_KEY`。示例文件不包含真实 Key。
- [AnyRouter 使用指南](https://docs.anyrouter.top/) 使用 `ANTHROPIC_BASE_URL=https://anyrouter.top` 与 `ANTHROPIC_AUTH_TOKEN`。选择 AnyRouter 卡片填写其令牌即可；Claude 模型优先测试 `/v1/messages`，其他模型也会自动尝试 Chat / Responses / Messages。`/console` 是管理页面，不是 API 前缀。
- [Cursor 官方 API](https://cursor.com/docs/cloud-agent/api/endpoints) 是 Cloud Agents API。其 Key 可以用于 `/v1/models`，本工具不执行云端 Agent 任务，因此不支持用官方 Key 进行普通对话测试；不会伪造 `/v1/chat/completions` 并将 404 解释成 Key 无效。第三方中转需使用该中转的地址和 Key。
- 本地回归测试使用模拟上游，不代表真实账户、额度或站点已经测试通过。
- AnyRouter 控制台内的“使用指南”另明确配置 Codex：`base_url = "https://anyrouter.top/v1"`、`wire_api = "responses"`。模型名以 GPT 开头时按此使用 Responses；模型名以 Claude 开头时使用 Messages。
- AnyRouter 的 GPT 请求使用本机 Codex 0.153.4 Responses Lite 结构和客户端标识。请求不发送温度与输出上限；遇到 5xx 最多重试两次。
- AnyRouter 的 Messages 请求附带 Claude Code 客户端标识及 `context-1m-2025-08-07`，用于该站要求的 1M 上下文模式。
- 这是一轮文字测试的 Codex 请求适配，不执行工具，不加载用户项目或复制官方客户端完整系统提示词。流式解析支持分片文本和完成事件；请求记录标明 `Codex HTTP / SSE`。本地模拟成功不代表该站已接受真实请求。

## 中转站客户端标识

- `自动识别`：通常使用此项，无需指定 Chat 或 Responses。
- `通用 OpenAI`：带入 Chat 路径，测试仍会自动尝试其他格式。
- `Codex 客户端`：优先 Responses，附带 Codex 的 `User-Agent`、`originator` 和 `openai-beta` 标识。
- `Cursor 中转标识`：仅供第三方中转按需使用，不能使 Cursor 官方 API 变成聊天接口。
- 缓存标识支持中文、拼音首字母和非连续模糊匹配，点击建议会回填地址、Key、路径及客户端模式。

新增第二或更多客户端模式时，只需编辑 `public/client-profiles.mjs`，在 `RELAY_CLIENT_PROFILES` 中追加一项。若新模式使用现有的 `chat-completions` 或 `responses` 请求格式，无需修改其他代码；只需在 `profile` 中给出 `chatPath`、`modelsPath`（可选）和 `headers` 等字段，UI 与服务端会自动继承这些默认值。

## 使用流程

1. 左侧选择接口，或使用临时中转站。
2. 在对应厂商旁填写 key（可空）。
3. 拉取模型并勾选要测的模型。
4. 输入问题（默认“今天的日期”），点“立即测试”。
5. 如需定时：设置“每隔 N 分钟/小时”，点“启动定时”。
6. 定时任务在当前页面运行，关闭页面会停止。

## 测试

```powershell
node --test
```

## 打包为独立程序

在仓库根目录运行 `build-release.ps1`，会在 `release\ai-model-tester\` 生成便携版（自带 `node.exe` 与 `public/` 静态资源），双击其中的 `start.cmd` 即可在未安装 Node.js 的 Windows 机器上运行。
