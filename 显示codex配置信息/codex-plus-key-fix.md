# Codex++ 供应商配置 Key 显示为明文

> 问题：管理器中「供应商配置 / 中转 Key」显示为圆点（非明文），看不到真实 Key。
> 结论：Key 并未被加密，只是 UI 用 `type="password"` 把输入框做了掩码；真实 Key 明文保存在本机。

## 1. 当前真实 Key（直接可用）

来自 `~/.codex-session-delete/settings.json` 的 `relayApiKey`（与 `~/.codex/auth.json` 的 `OPENAI_API_KEY` 相同）：

```
sk-1e91c2a202bce8015994d68e7a23169e982294c10e4c778bad89b7f5438aa744
```

> 注意：这是你的私密凭证，请勿截图发到公开 issue / 日志（项目文档也明确警告过）。

## 2. 根本原因

文件：`apps/codex-plus-manager/src/App.tsx` 约 **5843–5849 行**，供应商 Key 输入框：

```jsx
<Field className="relay-field-key" label="Key">
  <Input
    type="password"            // ← 这一行导致显示为圆点
    value={profile.apiKey}
    onChange={(event) => updateDraft({ apiKey: event.currentTarget.value })}
    placeholder={t("输入中转服务的 API Key")}
  />
</Field>
```

`profile.apiKey` 加载时来自 `settings.relayApiKey`（App.tsx 约 7894 行），保存时写回同一字段（约 8601 行）。

## 3. 最小修复（让 UI 直接显示明文）

把上面那处的 `type="password"` 改成 `type="text"`（只改 `value={profile.apiKey}` 那一个 Input，另外两处 password 是 Stepwise Key 和 VLM Key，按需处理）：

```diff
- <Input
-   type="password"
-   value={profile.apiKey}
+ <Input
+   type="text"
+   value={profile.apiKey}
```

### 更优雅的做法（带显示/隐藏眼睛按钮）

在 `provider` 状态里加一个 `showKey` 布尔，输入框外加一个切换按钮：

```jsx
{showApiFields ? (
  <Field className="relay-field-key" label="Key">
    <div style={{ display: "flex", gap: 8 }}>
      <Input
        type={showKey ? "text" : "password"}
        value={profile.apiKey}
        onChange={(e) => updateDraft({ apiKey: e.currentTarget.value })}
        placeholder={t("输入中转服务的 API Key")}
      />
      <button type="button" onClick={() => setShowKey((v) => !v)}>
        {showKey ? "隐藏" : "显示"}
      </button>
    </div>
  </Field>
) : null}
```

## 4. 重新构建（让修改生效）

管理器是 Tauri 桌面应用（Rust 后端 + React 前端），发布版 exe 已把前端打包进二进制，所以**改源码必须重新构建**才能生效。本机当前环境**没有 cargo / Rust**，且 Tauri Windows 构建还需要：

- Rust (rustup, stable-x86_64-pc-windows-msvc)
- Node 22（已具备）
- Tauri 前置：WebView2 运行时、Visual Studio 生成工具（MSVC）
- 之后：`cd apps/codex-plus-manager && npm ci && npm run tauri:build`

需要我帮你安装工具链并出 patched 版 exe 的话，告诉我即可（耗时较长且会改动环境）。

## 5. 其它供应商的 Key 也在本机明文

`~/.codex-session-delete/settings.json` 的 `providerSyncSavedProviders[]` 里每个保存的供应商，`configContents` 是其 TOML 配置，部分含 `experimental_bearer_token = "..."`，同样是明文。要查看某个具体供应商的 Key，直接在该文件里搜对应 base_url 所在条目的 `experimental_bearer_token` 即可。
