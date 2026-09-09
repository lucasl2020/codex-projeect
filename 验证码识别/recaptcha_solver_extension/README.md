# recaptcha_solver_extension

Chrome MV3 扩展：调用本地 `recaptcha_vlm` 服务，自动求解 Google reCAPTCHA 图片挑战
（"Select all images with taxis" 这类 3x3 语义题）。

## 架构

```
Chrome 挑战 iframe (bframe)
   │  content.js 提取题目 + 9 张 tile 图 URL
   ▼
background.js（service worker）
   │  ① 抓取跨域 tile 图片 → base64（扩展上下文，绕过 CORS/混合内容限制）
   │  ② POST http://127.0.0.1:8765/recaptcha/solve
   ▼
recaptcha_vlm/server.py（本地 FastAPI-兼容 HTTP 服务）
   │  拼接 3x3 大图 → 调智谱 glm-4.6v-flash（VLM）→ 返回 0-based 格子索引
   ▼
content.js 模拟点击目标格子 → 点 Verify → 提交
```

## 安装

1. 确保本地已启动识别服务：
   ```bash
   cd 验证码识别
   python -m recaptcha_vlm.server --port 8765
   ```
2. Chrome 打开 `chrome://extensions` → 右上角开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择本目录 `recaptcha_solver_extension`
4. 点击扩展图标 → 填本地服务地址（默认 `http://127.0.0.1:8765`）→「探测服务」验证连通
5. 在 `config.json` 填好智谱 API Key（见 recaptcha_vlm/README）

## 使用

- **手动**：遇到图片挑战 → 点扩展图标 →「立即求解当前挑战」
- **自动**：popup 打开「自动模式」，之后检测到图片挑战自动连解（最多 5 轮，防死循环）

## 工作原理与 DOM 假设

reCAPTCHA v2 挑战运行在跨域 iframe（`https://www.google.com/recaptcha/api2/bframe`），
扩展以 `all_frames` 注入其中，依据以下 DOM 结构提取（reCAPTCHA 改版时需要相应调整）:

- 题目文本: `#rc-imageselect .rc-imageselect-desc-no-canonical-text`（多选择器回退）
- 格子: `#rc-imageselect table td`（内嵌 `img[src]` 或 background-image）
- 确认按钮: `#recaptcha-verify-button`（多选择器回退）

content script 不直连本地 http 服务（https 页面会被混合内容拦截），统一经 background 中转。

## 已知边界

- 仅处理 v2 图片语义题；音频题/滑块题不支持（对应 Google 已禁用或本方案不覆盖的场景）
- Google 频繁调整 reCAPTCHA DOM 结构，若失效先检查 content.js 选择器是否仍命中
- 自动化解题违反 Google ToS，仅限个人研究/低频使用，存在风控风险
- 与 Buster 等扩展同开可能冲突，建议二选一
