# TRAE + WorkBuddy 每日积分自动签到

脚本复用本机登录态，不保存明文令牌，也不依赖窗口坐标。

## 双击运行

直接双击 `运行TRAE每日签到.cmd`。

窗口会依次显示：

- TRAE 签到前/后状态与总积分；
- WorkBuddy 签到前/后状态、已领天数、累计领取积分、签到额度。

## 命令行

```powershell
cd D:\codex-projeect\codex\temp\trae-auto-checkin
python -m pip install -r requirements.txt
python .\trae_checkin.py
python .\trae_checkin.py --status-only
python .\trae_checkin.py --skip-trae
python .\trae_checkin.py --skip-workbuddy
```

## 登录态来源

- TRAE：`%APPDATA%\TRAE SOLO CN\User\globalStorage\storage.json`
- WorkBuddy：`%LOCALAPPDATA%\CodeBuddyExtension\Data\Public\auth\workbuddy-desktop.info`

## 注意

- 初次使用前，请先登录 TRAE Work CN 和 WorkBuddy。
- 若令牌失效，打开对应客户端重新登录后再运行。
- WorkBuddy 真实接口为：
  - `POST https://copilot.tencent.com/v2/billing/meter/checkin-activity-status`
  - `POST https://copilot.tencent.com/v2/billing/meter/daily-checkin`