# WorkBuddy 猫猫旅行全自动托管

包含两个方案：
- `workbuddy-cat-bot.user.js` — **油猴脚本**（浏览器插件 Tampermonkey 里运行），适合你日常挂着页面时用。
- `cat_bot.py` — **Python 后台脚本**（Playwright 驱动无头 Edge），不需要一直开着浏览器标签，适合挂机。

两者逻辑一致：**派遣猫猫 → 旅行 → 到期自动领取 → 再派遣**，全自动循环。

---

## 一、油猴脚本（浏览器版）

1. 浏览器安装 Tampermonkey（油猴）扩展。
2. 新建脚本，把 `workbuddy-cat-bot.user.js` 内容整段粘进去并保存。
3. 打开站点，脚本右下角会出现托管看板，自动开始跑循环。

## 二、Python 后台版（推荐挂机）

前置：已安装 Python 3 + Playwright（本机已装）。

### 第 1 步：登录一次，保存登录态
```powershell
python workbuddy-cat-bot/cat_bot.py --login
```
会打开一个可视 Edge 窗口，你手动登录自己的账号，登录完成后关闭窗口。登录态保存在 `%LOCALAPPDATA%\WorkBuddyCatBot\edge-profile`。

### 第 2 步：后台无头运行
```powershell
python workbuddy-cat-bot/cat_bot.py --run
```
无头 Edge 会按循环自动执行。窗口不弹出，但控制台会滚动日志。Ctrl+C 停止。

### 第 3 步：（可选）开机自启 / 常驻
用 Task Scheduler（任务计划程序）新建任务，触发器选"登录时"，操作填 `python` 加参数 `D:\...\cat_bot.py --run`。这样开机自动挂机。

---

## 配置说明

两个脚本顶部的文案列表（派遣入口 / 确定派出 / 领取 / 结算按钮）都写死了常见叫法。如果站点改按钮文字，改这些列表即可，**无需改逻辑**。

## 提示
- `%LOCALAPPDATA%\WorkBuddyCatBot\edge-profile` 含登录态，请勿公开或删除（删了要重新登录）。
- `edge-profile-test/ (可手动删除)` 是早期测试残留目录，可直接手动删除。
- 当前进阶版用 Cookie 直调接口的方案依赖站点 API，易随改版失效，故未采用；如有反爬/风控再考虑。


