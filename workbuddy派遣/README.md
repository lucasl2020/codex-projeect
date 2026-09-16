# WorkBuddy 成长计划 · 派猫旅行自动助手

直接调用腾讯 **WorkBuddy** 后端接口完成「猫咪派遣旅行 → 倒计时监测 → 到家自动领奖」全流程的轻量级自动化脚本。无需长时间开启 Chromium 浏览器，内存占用趋近于 0。

---

## 🌟 功能与优势

- **接口级轻量自动化**：通过直接调用 `https://copilot.tencent.com` 官方接口完成操作，不需要开浏览器、不吃 CPU/GPU 资源。
- **免手动维护 Token**：自动从本机 WorkBuddy 客户端登录凭据文件中读取会话，只要客户端登录过即可开箱即用。
- **智能状态流转**：
  - 若处于**空闲**：自动挑选可用猫猫并执行派遣；
  - 若处于**旅行中**：输出剩余预计到达时间；
  - 若处于**已到家**：自动发起领奖请求，获取经验与道具。
- **支持守护与定时**：单次执行适配 Windows 任务计划程序；`--watch` 模式适合挂机。

---

## 🚀 使用方法

### 方式 1：双击运行
直接双击运行：
👉 **`growth-travel.bat`**

### 方式 2：命令行调用
```bash
# 单次检查并执行（能领就领、能派就派、旅行中汇报时间）
node growth-travel.js

# 仅查询当前猫猫旅行状态与剩余倒计时
node growth-travel.js --status

# 持续监控守护模式（到时间自动领奖并接着派）
node growth-travel.js --watch
```

---

## ⚙️ 凭证读取与前置条件

1. **登录态位置**：
   ```text
   %LOCALAPPDATA%\CodeBuddyExtension\Data\Public\auth\workbuddy-desktop.info
   ```
2. **注意事项**：
   - 首次使用前需先在本机登录过 **WorkBuddy（国内版）** 客户端。
   - 若出现 `登录态已失效` 提示，只需打开 WorkBuddy 重新登录一次即可自动刷新。

---

## ⏰ Windows 任务计划程序配置建议

若希望完全静默在后台全天自动派猫，可在 Windows 任务计划程序中添加：
- **操作**：启动程序
- **程序或脚本**：`node.exe`（或直接指向便携目录下的 node.exe）
- **添加参数**：`growth-travel.js`
- **起始于**：`D:\codex-projeect\workbuddy派遣`
- **触发器**：每天重复，每 30 分钟或 1 小时触发一次。
