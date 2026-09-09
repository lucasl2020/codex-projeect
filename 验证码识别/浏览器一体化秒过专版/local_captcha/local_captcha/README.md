# 本地免费验证码识别

这是现有项目旁新增的运行入口，不调用旧项目中的打码平台或免费云端 API。浏览器仍然需要联网访问目标网站；图片识别只发送到本机 `127.0.0.1:11434`。首次安装需要下载免费模型。

## 当前范围

| 类型 | 实现 | 实测范围 |
| --- | --- | --- |
| hCaptcha | 静态九宫格及整张画布点选/单次拖动，本地模型识别后操作并提交 | 已读取福利站实际画布点选题；浏览器流程测试通过，真实通过率待验证 |
| 腾讯滑块（Hvoy） | 本地模型定位拼图与缺口、操作实际滑块、检查成功状态 | 已读取该站腾讯组件 DOM；浏览器模拟题拖动测试 |
| 算术 | 本地 ddddocr + 已有算术识别器、填写答案 | 依赖检查及项目原有算术样例测试另见执行记录 |
| 通用点选/拖动 | 指定图片区域和题意，模型输出受限坐标，在区域内操作 | 浏览器模拟题流程测试 |
| Cloudflare / Turnstile | 检测并等待浏览器正常验证，检查响应是否生成 | **没有实现稳定自动通过 CF 风控**，超时返回 unsupported |

hCaptcha 的多轮拖放、动态换图、视频等题型没有专门适配。模型会判断错误或耗时过长，实际通过率尚未测得。这里的浏览器模拟测试使用固定视觉答案，只能证明操作流程和结果判断，不能证明模型识别能力。

## 安装

本机已在 `output/runtime` 下载 Ollama 0.33.3 便携版与 qwen3-vl:4b，启动根目录的 `启动本地模型.ps1` 即可启动服务。下面是迁移到另一台机器时的安装方式。

在项目根目录的 PowerShell 中执行：

```powershell
python -m pip install -r local_captcha/requirements.txt
```

默认使用已安装的 Chrome；如果没有 Chrome，可以执行 `python -m playwright install chromium`，运行时添加 `--channel chromium`。也支持 `--channel msedge`。

从 [Ollama 官方网站](https://ollama.com/download/windows) 安装 Windows 版。退出其已有后台进程，在一个 PowerShell 窗口启动本地服务：

```powershell
$env:OLLAMA_NO_CLOUD = "1"
ollama serve
```

保持该窗口运行，在另一个窗口下载模型并检查环境：

```powershell
ollama pull qwen3-vl:4b
python -m local_captcha --doctor
```

[qwen3-vl:4b](https://ollama.com/library/qwen3-vl:4b) 的模型下载约 3.3 GB，推理还需要额外内存。CPU 可以运行但可能赶不上验证码过期时间。程序拒绝 cloud 名称及返回远程模型元数据的模型，不会自动切换到云端。依据：[Ollama 本地模式](https://docs.ollama.com/faq)、[视觉聊天接口](https://docs.ollama.com/api/chat)。

## 运行两个目标网站

```powershell
python -m local_captcha https://www.hvoy.ai/user/login --pause
python -m local_captcha https://checkin.new-api.abrdns.com/level --pause
```

也可以右键运行根目录的 `启动本地识别.ps1`。程序打开独立 Chrome，在其中自行登录、打开验证码，再回终端按回车，程序开始识别、操作并提交验证码组件。不需要将账号密码写进代码。

登录状态保存在 `output/local-captcha-profile`，不要同时启动两个程序占用此目录。结果出来后程序关闭浏览器，保留会话目录。默认不会点击网站的“签到”“兑换”等业务按钮；要自动点击指定按钮，必须同时配置成功标志：

本次已登录测试浏览器的会话已保存到本地 `output/local-session.json`。使用 `--storage-state output/local-session.json` 可在新测试窗口复用，无需再次登录；会话文件包含登录凭据，不要分享或提交到版本库。

```powershell
python -m local_captcha https://example.com --pause --submit '#verify-submit' --success-selector '#verified-result'
```

示例选择器仅为说明，必须换成目标网站的实际元素。成功标志应只在服务端确认验证成功后显示；单纯“弹窗消失”不可靠。

## 其他验证码

```powershell
# 算术图片、答案框、提交按钮、成功提示需要按实际页面指定
python -m local_captcha https://example.com --kind math --region '#captcha-image' --answer-input '#answer' --submit '#verify' --success-selector '#verified'

# 普通文字点选、图形点选或拖动：region 应只包围验证码图片
python -m local_captcha https://example.com --region '#captcha-image' --prompt '按顺序点击：星、空、海' --submit '#verify' --success-selector '#verified'
```

通用 region 当前只定位顶层页面；第三方 iframe 内的非 hCaptcha/腾讯验证码需要增加适配。没有页面结构或样本时，不能自动猜出所有验证码的图片区域、输入框、提交按钮。

## 查看结果

每次运行生成 `output/local-captcha/时间/result.json`，不会保存验证码 token、Cookie 或整页截图。状态含义：

- `site_confirmed`：指定的站点成功标志出现。
- `widget_passed`：验证码组件返回通过，**尚未确认业务请求成功**。
- `already_satisfied`：操作前成功标志就已存在，不算本次验证成果。
- `answer_entered`：已填写/操作，尚未提交确认。
- `submitted_unconfirmed` / `site_unconfirmed`：未看到站点成功标志。
- `unsupported` / `not_found` / `failed` / `error`：不支持、未找到、失败或运行错误。

退出码 0 表示组件通过或站点确认；其他状态返回 2。自动化调用应进一步检查 status，不能只检查退出码。`--attempts` 限制尝试次数；`--wait` 限制轮询等待，但单次模型推理还可能占用最多 120 秒。

环境检查必须导入 OCR 的原生库，不能仅凭“已安装”判定可用。如果提示 DLL 错误，应检查 Python/ONNX Runtime 兼容性与本机运行权限。

## 测试

```powershell
python -m unittest local_captcha.test_local -v
```

测试包含模型远程模式拒绝、无效坐标、真实浏览器操作、题目变化后丢弃答案、提交失败不误报、腾讯拖动和 hCaptcha iframe 内提交。无需安装或调用视觉模型，不产生模型服务费用。
