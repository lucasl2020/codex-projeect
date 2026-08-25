# 每日网页任务自动化

使用 Playwright 启动已安装的 Google Chrome，并复用一个独立的浏览器会话完成六个网站的每日任务；若日常使用的正常 Chrome Profile 安装了 All API Hub，还会额外请求一次扩展快速签到：

1. 打开 AnyRouter 个人控制台；当前前端已探查到已登录页面会自动调用 `POST /api/user/sign_in`。如果用户信息接口能读到余额字段，脚本还会比较签到前后余额；没有增加且未明确显示“今日已签到”时，不会标记完成，daemon 会每小时重试。
2. 调用 iKuuu 当前页面使用的 `POST /user/checkin`，失败时再尝试点击页面上的“签到”。
3. 打开 CHY 页面并点击“领取今日5GB”。由于它使用 LinuxDO OAuth，且登录链路可能经过 Cloudflare，脚本不猜测内部接口，而是点击页面并记录点击后实际捕获到的同源请求。
4. NodeSeek 依次尝试 `POST /api/attendance`（表单体 `random=true`）和 `POST /api/attendance?random=true`（JSON 请求体）；任一方式确认成功或“今日已签到”后立即停止，不再执行后续方式。接口均不能确认成功时，回退识别 `data-rand`、签到相关 class/data-action、页面文本“试试手气”，以及 `.head-info` 等控件。仅在页面或接口能可靠解析额度时，才输出签到前/后额度及变化；解析不到则完全跳过额度字段，不会显示“未获取”。

Cloudflare：NodeSeek/DeepFlood/CHY 若落到“Just a moment / 安全验证”页，会可选调用本仓库 `cf-bypass-json.py`（内部使用 `D:\codex-projeect\6a6ff848a2c537419fd0b6cf` 的 `cf_bypass`）。成功后写回 Cookie 并重试定位“试试手气/领取”按钮；失败则给出明确错误，不继续盲点。

Cloudflare / 验证码：检测到安全验证时调用 `cf-bypass-json.py`（`D:\codex-projeect\6a6ff848a2c537419fd0b6cf`）。可用 `python cf-bypass-json.py --diagnose` 检查依赖。

可选：启动本地 `cf-captcha-server` HTTP API 服务后，脚本会优先通过同目录 `cf-solver.js` 走 HTTP 调用（更快，且支持 cf_clearance 缓存），服务不可达时自动回退到上面的 `cf-bypass-json.py`：

```powershell
cd D:\codex-projeect\验证码识别\cf_captcha_solver_pkg
python -m cf_captcha_solver.server --port 8000
```

服务地址可用环境变量 `CF_SOLVER_URL` 覆盖（默认 `http://localhost:8000`）。

额度显示策略：AnyRouter 使用只读 `GET /api/user/self`；NodeBuf 使用只读 `GET /api/account/points` 的账户总积分字段；iKuuu/CHY 仅在页面正文能解析“剩余/可用流量”时显示；NodeSeek/DeepFlood 仅在页面或签到响应能解析鸡腿/积分时显示。没有可靠来源时跳过，不猜测写接口，也不重复签到。
5. DeepFlood 使用相同的双接口回退流程。
6. NodeBuf 先调用 `GET /api/account/points` 判断今日状态；未签到时调用页面“立即签到”按钮当前使用的 `POST /api/account/points/check-in`。该请求无请求体，复用浏览器登录 Cookie。若被重定向到登录页，有界面模式会等待 Chrome 密码管理器自动填充已保存的账号密码，再点击页面原生登录按钮；脚本不会读取密码内容。
7. 可选检测正常 Chrome Profile 中的 All API Hub 扩展；存在时用该 Profile 打开扩展真实的 `options.html?runNow=true#autoCheckin` 地址，请求“快速签到”。不读取或复制 Cookie、密码或扩展配置；未安装时静默跳过，不影响其他网站任务。

## 最简单用法（推荐）

直接双击：

```text
一键执行每日签到（显示结果）.cmd
```

第一次运行会自动安装依赖，并用普通 Chrome 打开六个网站让你手动完成登录。完成 LinuxDO 验证后，请关闭这个登录 Chrome 窗口，再回到终端按 Enter；以后只需再次双击这个文件，任务会立即执行一次并显示汇总结果。

如果 Cookie 过期或网站要求重新登录，双击：

```text
重新登录全部网站.cmd
```

NodeBuf 自动登录只支持默认的有界面模式。`HEADLESS=1` 下不会尝试密码自动填充；遇到 Turnstile、二步验证或需要选择多个已保存账号时，仍需人工处理。账号密码不需要、也不应写入脚本或配置文件。

### 可选：All API Hub 快速签到

- 脚本只检查正常 Chrome User Data 下的扩展目录来判断是否安装，不读取扩展配置，也不复制 Profile。

- 未安装扩展：仅写一条跳过日志，不出现在失败汇总中。
- 已安装扩展：使用原 Chrome 用户数据目录和对应 `--profile-directory` 打开扩展的自动签到地址。Chrome 已在运行时会将请求转交给现有浏览器；脚本不会设置 `--user-data-dir`。
- 成功启动 Chrome 仅表示“已触发快速签到”，不是已确认所有站点签到成功；同一天触发后不重复请求。请在扩展页面或通知中查看实际结果。
- Chrome 启动失败：只把 All API Hub 标记为失败，不中断其他网站任务。

## 安装

```powershell
npm install
```

项目使用本机 Google Chrome，不会下载 Playwright 自带浏览器。

## 首次登录

不要把密码写进脚本。第一次运行：

```powershell
npm run daily-setup
```

脚本会启动一个不带 Playwright 自动化标记的普通 Chrome，并打开六个站点的标签页。请在这个 Chrome 中手动完成登录和验证码/OAuth；尤其是 LinuxDO 验证通过后，先关闭这个 Chrome 窗口，再回到终端按 Enter。登录 Cookie 只保存在本目录的 `browser-profile`，不会写入脚本。重新登录前请先停止正在运行的每日任务。

## 执行

只执行一次：

```powershell
npm run daily-once
```

持续运行每日任务，并在 AnyRouter 未确认成功时每小时重试：

```powershell
npm run daily-daemon
```

默认每天本机时间 `09:00` 执行；可修改：

```powershell
$env:DAILY_AT='08:30'
npm run daily-daemon
```

任务状态保存在 `state.json`，同一天已确认完成的任务会跳过。不要同时启动多个实例，否则可能占用同一 Chrome 会话目录。

需要无头运行时：

```powershell
$env:HEADLESS='1'
npm run daily-daemon
```

如果 LinuxDO 人机验证反复出现，请先关闭每日任务，双击 `重新登录全部网站.cmd`，在脚本打开的普通 Chrome 中完成验证，关闭该 Chrome 后按 Enter，再重新启动每日任务。不要使用无头模式。

## Windows 任务计划程序

如果不想让终端常驻，可用 Windows 任务计划程序每天启动一次：

- 程序：`node`
- 参数：`D:\codex-projeect\codex\temp\daily-rewards-v2.js --once`
- 起始位置：`D:\codex-projeect\codex\temp`

不过，AnyRouter“每小时重试”要求进程持续运行；要严格使用该逻辑，请让 `npm run daily-daemon` 常驻，或由外部计划程序每小时启动 `--once`。

## 注意事项

- 只对自己的账号使用，并遵守站点规则；脚本不会读取、输出或保存密码，只会等待 Chrome 密码管理器自动填充后点击页面原生登录按钮；不会绕过验证码、Turnstile 或二步验证。
- `browser-profile` 包含登录 Cookie，已加入 `.gitignore`，不要上传或提交。
- All API Hub 的站点配置保存在正常 Chrome Profile；脚本不读取、复制或导出这些配置。
- 站点页面和接口可能变化。脚本日志会打印 AnyRouter、iKuuu、NodeSeek、DeepFlood 和 NodeBuf 的接口响应；CHY 成功点击后会打印捕获到的实际同源请求，便于后续确认接口。
---

# LinuxDO 最近 48 小时福利抓取

## 推荐方案：复用已登录的普通浏览器

此方案读取你的 LinuxDO 账号当前可见内容。它复用你平时已经登录的普通 Chrome/Edge 标签页，不启动 Playwright，也不复制或导出 Cookie。

首次安装或升级：

1. 在平时登录 LinuxDO 的 Chrome/Edge 中安装 Violentmonkey 或 Tampermonkey。
2. 新建用户脚本，把 `linuxdo-benefits.user.js` 的**完整内容**粘贴进去并保存；已有旧脚本时必须完整覆盖。
3. 确认脚本顶部显示 `@version 1.9.1`，并确认脚本已启用。
4. 在同一个浏览器中正常登录 LinuxDO。

之后直接双击：

```text
运行LinuxDO福利.cmd
```

CMD 会让系统默认浏览器打开带登录态启动标记的福利分类页：

- 如果出现 Cloudflare，请只在这个普通浏览器中人工完成验证；论坛页面加载后会自动开始或从断点继续。
- 脚本在当前标签页中低频跳转，每 5 秒读取一个页面，每读取 20 个主题暂停一次，点击“继续读取下一批”后再继续。
- 只读取最近 48 小时内、当前账号有权查看的主题首帖，总数最多 200 条；不要在运行中关闭该标签页。
- 完成后页面会生成节点、账号地址和公益站三类 Markdown，可逐个下载或复制。

页面右下角有三个按钮：

- 绿色“已登录当前标签页抓取（推荐）”：复用当前账号和当前标签页读取内容。
- 灰色“公开RSS（备用）”：只读未登录公开源，数据可能较少或失效较快。
- 蓝色“站内RSS/接口（备用）”：访问 LinuxDO RSS/接口，遇到验证时不一定稳定。

正常加载后，页面还会出现“LinuxDO 福利脚本 v1.9.1 已加载”的状态提示。若页面打开后既没有状态提示也没有三个按钮，说明用户脚本根本没有运行，而不是抓取正在后台执行。请依次检查：

1. Tampermonkey/Violentmonkey 中保存的是完整的 `linuxdo-benefits.user.js` v1.9.1，而不是本地旧副本。
2. 用户脚本处于启用状态，并获准在 `https://linux.do/*` 上运行。
3. 安装扩展、已登录 LinuxDO 和 CMD 打开的必须是同一个系统默认浏览器。
4. CMD 只负责打开带启动标记的网址，不能自行把本地 JavaScript 注入浏览器。

注意：修改本地 `linuxdo-benefits.user.js` **不会自动更新** Tampermonkey/Violentmonkey 中已安装的副本。每次升级都要重新复制完整脚本、覆盖保存，并确认版本号。

这不是 Cloudflare 绕过：脚本不会点击 Turnstile、伪造指纹、隐藏自动化特征或提取登录凭据。人工验证后如果页面再次重载，任务会通过 `sessionStorage` 从断点继续。

## 备用方案：本地公开 RSS 页面

只有登录态模式暂时不可用时，才直接打开同目录的 `linuxdo-benefits.html`。该页面只读取第三方公开只读 RSS，不携带 LinuxDO Cookie，也不发送当前页面 Referer，因此可见信息通常少于登录态模式。

第三方公开服务会像普通网站一样看到你的 IP、浏览器信息和请求时间。公开源保留范围可能短于 48 小时；页面会把最近主题缓存在浏览器 `localStorage` 中，并剔除 48 小时以外的数据。
## 旧版 Playwright 入口（不推荐）

以下命令仍保留用于排查，但不能保证通过 Cloudflare：

```powershell
npm.cmd run linuxdo:setup
npm.cmd run linuxdo:scan
```

## 抓取和输出规则

- 只扫描运行时刻向前滚动 48 小时内**创建**的主题，按创建时间倒序，每次最多读取 200 个唯一主题的首帖。
- 扫描 LinuxDO“福利羊毛”分类（分类 ID 36）及当前账号可见的全部子分类。
- 每个主题只读取首帖，不读取回复，不下载附件，也不会测试节点或账号。
- 普通浏览器用户脚本在页面结果窗口中生成以下文档，可逐个下载或复制；旧版 Playwright 才输出到 `outputs`：
  - `MM月DD日节点.md`：节点/订阅地址和原帖地址。
  - `MM月DD日账号地址.md`：首帖公开的 AI 账号信息和原帖地址。
  - `MM月DD日公益站.md`：公益站名称、站点地址、原帖地址、邀请码判断和处理状态。
- 某一类别无结果时不会生成该类别文档；用户脚本不会自动删除你以前下载的文件。旧版 Playwright 输出器会清理同一天的旧文件。

## 公益站登录边界

- 普通浏览器用户脚本只展示公益站名称、地址和原帖地址，并提供人工打开链接；不会自动跨站登录、填写邀请码或点击授权。
- 旧版 Playwright 扫描器才会对未发现邀请码的站点逐站询问 `[y/N]`，并将 LinuxDO OAuth 主机限制为 `connect.linux.do`。
- 如果页面需要邀请码、验证码、密码，或者 Cloudflare 持续循环，请停止自动化并人工处理；脚本不会隐藏自动化特征、伪造指纹、破解 Turnstile 或绕过站点防护。请只对自己的账号使用，并遵守 LinuxDO 和第三方站点规则。

## 可选配置

一般不用设置。确有需要时，可在运行前设置环境变量：

```powershell
# Chrome 不在默认目录时
$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'

# 修改输出目录
$env:LINUXDO_OUTPUT_DIR='D:\linuxdo-output'

# 修改专用浏览器会话目录
$env:LINUXDO_PROFILE_DIR='D:\linuxdo-profile'

# 仅抓取、不打开第三方公益站进行登录
$env:HEADLESS='1'
npm.cmd run linuxdo:scan
```

`HEADLESS=1` 要求专用会话已经登录过 LinuxDO，并会跳过所有第三方公益站登录操作。

只有在确认 LinuxDO 官方 OAuth 域名发生变化时，才扩展允许列表：

```powershell
$env:LINUXDO_OAUTH_HOSTS='connect.linux.do,新的官方域名'
```

不要把普通公益站域名放进这个变量；它只用于限制 OAuth 授权页面的主机名。

登录 Cookie 保存在 `linuxdo-browser-profile`，处理记录保存在 `linuxdo-state.json`；二者已加入 `.gitignore`，请勿上传或分享。`outputs` 可能包含首帖公开账号或订阅信息，也已加入 `.gitignore`，请妥善保管。
## 方案依据

- Discourse 官方 API 文档：分类列表使用 `/categories.json`，分类主题可使用 `/c/{slug}/{id}.json` 或同类 JSON 路由；用户脚本只在当前页面会话中读取这些同源接口。
- 普通浏览器用户脚本管理器可使用开源 Violentmonkey；也可以使用你已安装的 Tampermonkey。

