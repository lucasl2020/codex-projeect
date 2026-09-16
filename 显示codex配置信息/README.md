# Codex++ 配置信息与凭据查看工具

用于快速查看本机 **Codex++ / VSLLM** 的登录态文件、中转供应商配置、模型映射与 API Key 状态的便捷工具。

---

## 🌟 核心功能

1. **官方登录态检视**：快速查看 `%USERPROFILE%\.codex\auth.json` 中配置的官方 API Key 状态。
2. **管理器设置检视**：读取 `%USERPROFILE%\.codex-session-delete\settings.json`：
   - 提取 `relayBaseUrl`（中转服务地址）
   - 提取 `relayApiKey`（主中转 API Key）
   - 提取各供应商配置信息（Profile 名称、upstreamBaseUrl、OPENAI_API_KEY 等）
3. **安全透明**：纯本地只读分析，绝不向任何外部网络发送或上传凭证。

---

## 🚀 使用方法

### 方式 1：双击运行
直接双击运行：
👉 **`view-codex-config.cmd`**

### 方式 2：PowerShell 运行
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\view_codex.ps1
```

---

## ⚠️ 安全与隐私重要声明

- 本工具仅用于本地排查配置不生效或中转服务不可达问题。
- 本目录下的 `codex-plus-key-fix.md` 包含个人真实密钥与调试信息，已在根目录 `.gitignore` 中进行强制排除。
- **严禁**将包含明文 API Key 的任何文件提交到公开代码仓库。
