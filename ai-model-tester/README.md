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

## 配置与 Key

1. 配置文件默认：复制 `config.example.json` 为 `config.local.json`。
2. 页面每个厂商卡片旁边可直接填明文 key。
3. 优先级：**页面厂商旁 key > 配置文件 key**。
4. 页面 key 明文显示，只随请求发给本地服务，不写回文件。
5. 临时中转站 key 也是明文输入。

## 中转站客户端模式

- `通用 OpenAI`：使用 `/chat/completions`。
- `Codex 客户端`：使用 `/responses`，并发送 Codex 的 `User-Agent`、`originator` 和 `openai-beta` 标识。
- `Cursor 官方`：使用 `/v1/chat/completions` 与 `/v1/models`，并附带 Cursor 客户端的 `User-Agent`，需配合 Cursor 颁发的 Key。
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
