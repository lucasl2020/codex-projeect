# codex-projeect

一组本地工具与脚本的集合，涵盖 AI 接口测试、卡网比价爬虫、验证码识别、数据脱敏等场景。

## 目录结构

| 目录 | 说明 | 技术栈 |
| --- | --- | --- |
| `ai-model-tester/` | 模型接口测试台：拉取主流 AI 接口模型列表，勾选后即时测试或按分钟/小时定时巡检 | Node.js |
| `crawler/` | 卡网管理面板：管理卡网/导航站 URL，定时/手动爬取商品并按店铺分组比价 | Node.js、Playwright、SQLite |
| `验证码识别/` | 验证码自动识别模块，支持文字、算术、点选、滑块及 reCAPTCHA/hCaptcha/Turnstile/FunCaptcha | Python、ddddocr |
| `md5处理程序/` | CSV 流式处理：手机号转 MD5、删除手机号行、按 MD5 或手机号去重（含图形界面） | Python、tkinter |
| `显示codex配置信息/` | 查看 Codex++ 供应商配置（含明文 Key 显示问题分析与修复脚本） | PowerShell、批处理 |
| `codex/` | 自动化脚本与浏览器配置临时存放区（每日签到、社区权益脚本、CF 绕过等） | Node.js、Python |

## 子项目说明

各子目录大多自带 `README.md` 或使用说明，进入对应目录即可查看详细用法。

- `ai-model-tester/`：双击 `start.cmd` 启动，默认端口 `8787`。
- `crawler/`：双击 `start.bat` 启动，默认端口 `3780`。
- `验证码识别/`：`pip install -r requirements.txt`，再参考 `example_usage.py`。
- `md5处理程序/`：双击 `csv_phone_to_md5_gui.pyw` 打开图形界面，或命令行运行 `csv_phone_to_md5.py`。

> ⚠️ `显示codex配置信息/codex-plus-key-fix.md` 中包含明文 API Key，请勿提交到公开仓库，建议加入 `.gitignore`。

## 许可

仅供个人学习与本地使用。
