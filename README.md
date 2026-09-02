# codex-projeect

一组本地工具与脚本的集合，涵盖 AI 接口测试、卡网比价爬虫、验证码识别、数据脱敏、每日签到等场景。

## 目录结构

| 目录 | 说明 | 技术栈 |
| --- | --- | --- |
| `ai-model-tester/` | 模型接口测试台：拉取主流 AI 接口模型列表，勾选后即时测试或按分钟/小时定时巡检 | Node.js |
| `crawler/` | 卡网管理面板：管理卡网/导航站 URL，定时/手动爬取商品并按店铺分组比价 | Node.js、Playwright、SQLite |
| `验证码识别/` | 验证码自动识别 + Cloudflare 绕过模块：文字、算术、点选、滑块、旋转等本地识别，reCAPTCHA/hCaptcha/Turnstile/FunCaptcha/GeeTest/AWS WAF 第三方求解，GeeTest v4 浏览器内自动化，并提供 HTTP API 服务 | Python、ddddocr、DrissionPage |
| `md5处理程序/` | CSV 流式处理：手机号转 MD5、删除手机号行、按 MD5 或手机号去重（含图形界面） | Python、tkinter |
| `typora-to-obsidian/` | Typora 笔记迁移到 Obsidian 库的图形化工具 | Python、tkinter |
| `trae-auto-checkin/` | TRAE Work CN 与 WorkBuddy 每日积分自动签到 | Python |
| `workbuddy派遣/` | WorkBuddy 成长计划·派猫旅行自动脚本 | Node.js |
| `显示codex配置信息/` | 查看 Codex++ 供应商配置（含明文 Key 显示问题分析与修复脚本） | PowerShell、批处理 |
| `codex/` | 自动化脚本与浏览器配置临时存放区（每日签到、社区权益脚本、CF 绕过等） | Node.js、Python |

## 子项目说明

各子目录大多自带 `README.md` 或使用说明，进入对应目录即可查看详细用法。

- `ai-model-tester/`：双击 `start.cmd` 启动，默认端口 `8787`。
- `crawler/`：双击 `start.bat` 启动，默认端口 `3780`。
- `验证码识别/`：`pip install -r requirements.txt`，再参考 `example_usage.py`；或启动 HTTP API 服务供任意语言调用：`cd cf_captcha_solver_pkg && python -m cf_captcha_solver.server --port 8000`。
- `md5处理程序/`：双击 `csv_phone_to_md5_gui.pyw` 打开图形界面，或命令行运行 `csv_phone_to_md5.py`。
- `typora-to-obsidian/`：双击 `run.bat` 或运行 `python typora_to_obsidian.py`。
- `trae-auto-checkin/`：双击 `运行TRAE每日签到.cmd`。
- `workbuddy派遣/`：双击 `growth-travel.bat`。

## 打包为 Windows 独立程序

一键脚本 `build-release.ps1` 可将所有项目打包为「无需安装 Node.js / Python 即可运行」的独立产物：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build-release.ps1
```

产物输出到 `release\`：

| 项目 | 产物形态 | 启动 |
| --- | --- | --- |
| `md5处理程序/` | 单文件 exe ×2（GUI + 命令行） | 双击 `csv_phone_to_md5_gui.exe` |
| `typora-to-obsidian/` | 单文件 exe | 双击 `typora_to_obsidian.exe` |
| `trae-auto-checkin/` | 单文件 exe | 双击 `trae_checkin.exe` |
| `ai-model-tester/` | 便携目录（自带 node.exe） | 双击 `start.cmd` |
| `workbuddy派遣/` | 便携目录（自带 node.exe） | 双击 `start.cmd` |
| `crawler/` | 便携目录 + 内嵌 Chromium | 双击 `start.cmd` |
| `验证码识别/` | onedir（内嵌 ddddocr 模型） | 运行 `cf-captcha-server.exe` |
| `显示codex配置信息/` | PowerShell 原样复制 | 双击 `view-codex-config.cmd` |

> ⚠️ `显示codex配置信息/codex-plus-key-fix.md` 中包含明文 API Key，请勿提交到公开仓库，建议加入 `.gitignore`。

## 许可

仅供个人学习与本地使用。