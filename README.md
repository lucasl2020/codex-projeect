# codex-projeect

一组高性能、开箱即用的本地工具与自动化脚本集合，涵盖 AI 开发环境与模型测试、跨平台端口管理、网络代理诊断与注入、卡网比价爬虫、全能验证码识别、数据脱敏清洗、每日自动化签到等多个场景。

---

## 📁 项目目录导航

| 子项目目录 | 功能说明 | 核心技术栈 | 默认启动方式 |
| :--- | :--- | :--- | :--- |
| **`ai-model-tester/`** | **AI 模型接口测试台**：拉取主流 AI 接口（OpenAI/Claude/Gemini/DeepSeek 等）模型列表，勾选并发测通/测速或定时巡检 | Node.js、原生 HTTP | 双击 `start.cmd` (端口 8787) |
| **`antigravity-trae-manager/`** | **AI-IDE-Manager 控制台**：集中管理 Google Antigravity、ByteDance Trae、WorkBuddy 状态、真实额度、官方签到与模型网关 | Node.js、REST API | 双击 `start.bat` (端口 19999) |
| **`check-antigravity-proxy/`** | **Antigravity 综合管理工具箱**：网络连通诊断、全界面中文化汉化 (antigravity2-cn)、免 TUN 代理注入 (antigravity-proxy) | Python、PySide6、Fluent UI | 双击 `启动工具箱.bat` |
| **`port_manager/`** | **跨平台端口监控与管理工具**：端口占用毫秒级扫描与一键终止进程，双端完全解耦独立运行 | C# WPF (70KB 单文件)、Web、CLI | 双击 `windows\exe\port_manager_gui.bat` |
| **`litiaotiao/`** | **李跳跳 APK 优化与规则库**：腾讯乐固加固深度逆向分析、177+ 常用 App 增强跳过规则库、免配置反编译与重签名工具链 | Android、Smali、Apktool | 详见 `litiaotiao\操作手册_李跳跳.md` |
| **`md5处理程序/`** | **CSV 手机号脱敏与去重**：超大 CSV 流式高性能处理：手机号规整转 32 位 MD5、删除手机号行、按 MD5/手机号去重 | Python、tkinter、多进程 | 双击 `csv_phone_to_md5_gui.pyw` |
| **`typora-to-obsidian/`** | **Typora 转 Obsidian 迁移**：Typora 排版快捷键一键无缝导入 Obsidian，智能冲突检测与版本自动备份 | Python、tkinter | 双击 `run.bat` |
| **`trae-auto-checkin/`** | **TRAE + WorkBuddy 自动签到**：复用本机已登录客户端会话，一键完成每日积分自动签到 | Python、pycryptodome | 双击 `运行TRAE每日签到.cmd` |
| **`workbuddy派遣/`** | **WorkBuddy 成长计划·派猫旅行**：轻量级调用官方后端接口完成猫咪自动派遣、状态监控与到家领奖，无需打开浏览器 | Node.js | 双击 `growth-travel.bat` |
| **`显示codex配置信息/`** | **Codex++ 配置与 Key 查看**：安全检视本地 Codex++ 官方登录态与中转供应商 (relayProfiles) 配置 | PowerShell、批处理 | 双击 `view-codex-config.cmd` |
| **`codex/`** | **自动化任务套件 (含 9 大站点签到)**：支持 All API Hub、AnyRouter、iKuuu、CHY、NodeSeek、DeepFlood、NodeBuf、禾维AI、黑白福利站每日打卡与 LinuxDO 福利抓取 | Node.js、Playwright | 双击 `codex\temp\一键执行每日签到（显示结果）.cmd` |
| **`crawler/`** | **卡网管理面板与商品比价**：管理卡网/导航站 URL，定时/手动多源爬取商品并按店铺比价（内嵌独立 Chromium） | Node.js、Playwright、SQLite | 双击 `start.bat` (端口 3780) |
| **`验证码识别/`** | **本地离线全能验证码自动化求解**：Google reCAPTCHA、hCaptcha、Turnstile、滑块拼图与算术题本地视觉大模型求解 + HTTP API 服务 | Python、ddddocr、DrissionPage | 参考 `验证码识别\README.md` |

---

## 🧰 统一桌面启动器：Codex 工具箱

为避免多工具并存时频繁打开终端与查找目录，仓库提供了统一的现代化桌面启动器：
👉 **`launcher.py`**（桌面卡片式管理中心，单文件 exe，零外部依赖）

- **双击启动**：直接运行根目录的 `launcher.py`，或打包后双击 `release\Codex工具箱.exe`。
- **功能特性**：
  - 卡片式集中管理所有工具的生命周期；
  - 自动检测 Web 服务端口状态（支持一键启动、停止与自动唤起浏览器）；
  - 图形工具与命令行脚本一键唤起，无需手动输入命令；
  - 一键直达工具所在文件目录。

---

## 📦 打包为 Windows 绿色独立便携版

一键脚本 **`build-release.ps1`** 可将常用工具打包为「无需安装 Node.js、Python 或外部浏览器即可独立运行」的绿色便携分发包：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build-release.ps1
```

执行后产物输出到 `release\`，并在 `release-packages\` 生成便携独立压缩包 **`Codex-Tools-Portable.zip`**：

| 项目 | 产物形态 | 启动方式 |
| :--- | :--- | :--- |
| **Codex 工具箱（统一启动器）** | 根目录单文件 exe | **双击 `Codex工具箱.exe`** |
| `ai-model-tester/` | 便携目录（自带 node.exe） | 双击 `start.cmd` 或工具箱内一键启动 |
| `antigravity-trae-manager/` | 便携目录（自带 node.exe） | 双击 `start.cmd` 或工具箱内一键启动 |
| `crawler/` | 便携目录 + 内嵌 Chromium | 双击 `start.cmd` 或工具箱内一键启动 |
| `port_manager/` | 原生 C# EXE + 便携目录 | 双击 `port_manager_win.exe` 或工具箱启动 |
| `md5处理程序/` | 单文件 exe ×2（GUI + 命令行） | 双击 `csv_phone_to_md5_gui.exe` 或工具箱启动 |
| `typora-to-obsidian/` | 单文件 exe | 双击 `typora_to_obsidian.exe` 或工具箱启动 |
| `trae-auto-checkin/` | 单文件 exe | 双击 `trae_checkin.exe` 或工具箱启动 |
| `workbuddy派遣/` | 便携目录（自带 node.exe） | 双击 `start.cmd` 或工具箱启动 |
| `显示codex配置信息/` | PowerShell / CMD 便携复制 | 双击 `view-codex-config.cmd` 或工具箱启动 |

> 💡 **说明**：
> - 默认打包已完全排除 `验证码识别/`（体积大且含重深度学习依赖）。如需打包该服务，可附带参数执行：
>   `powershell -NoProfile -ExecutionPolicy Bypass -File .\build-release.ps1 -IncludeCaptcha`
> - `显示codex配置信息/codex-plus-key-fix.md` 包含个人明文 API Key，已严格列入 `.gitignore`，严禁入库。

---

## 📜 许可声明

仅供个人学习、技术研究与本地生产力辅助使用。