# Codex 自动化任务与脚本套件

本目录汇集了用于日常生产力加速的自动化脚本与工具链，重点覆盖 **多站点每日签到**、**LinuxDO 福利资讯抓取** 以及 **Cloudflare 人机验证自动化桥接**。

---

## 📁 目录导览

```text
codex/
└── temp/                         # 每日任务执行与调试专区
    ├── services/                 # 模块化独立站点签到服务
    │   ├── allapihub.js          # All API Hub 快速扩展签到
    │   ├── anyrouter.js          # AnyRouter 控制台自动化签到
    │   ├── chy.js                # CHY 站点每日流量领取
    │   ├── cf-exclusive.js       # Cloudflare 挑战穿透专项服务
    │   ├── deepflood.js          # DeepFlood 每日签到
    │   ├── hvoy.js               # 禾维 AI 签到与大转盘
    │   ├── hybgzs.js             # 黑白福利站每日签到
    │   ├── ikuuu.js              # iKuuu 流量签到
    │   ├── nodebuf.js            # NodeBuf 积分打卡
    │   └── nodeseek.js           # NodeSeek 社区试试手气/打卡
    ├── 单独执行/                 # 针对各站点的快捷独立执行脚本 (.cmd)
    ├── daily-rewards-v2.js       # 9 大站点统一调度入口引擎
    ├── linuxdo-benefits.user.js  # LinuxDO 最近 48 小时福利羊毛抓取脚本 (油猴)
    ├── cf-solver.js              # 验证码识别 HTTP API 桥接适配器
    └── 一键执行每日签到...cmd    # 桌面一键启动快捷方式
```

---

## 🌟 核心功能系统

### 1. 9 大主流站点每日任务自动签到
- 支持的站点：
  1. **All API Hub**（Chrome 扩展快速签到）
  2. **AnyRouter**（API 路由控制台，带余额前后对比）
  3. **iKuuu**（流量签到，自动解析可用流量）
  4. **CHY**（每日 5GB 流量领取）
  5. **NodeSeek**（社区鸡腿试试手气）
  6. **DeepFlood**（每日打卡与额度更新）
  7. **NodeBuf**（积分打卡与余额变动监控）
  8. **禾维 AI**（每日签到）
  9. **黑白福利站**（每日自动打卡与福利轮盘）
- 模块化设计：所有站点逻辑均拆分至 `services/` 独立解耦，维护极其方便。
- 单独与全量执行：既可在 `单独执行/` 目录下针对单一站点测试，也可通过统一调度器一键执行全部。

### 2. LinuxDO 48 小时福利羊毛抓取
- 使用 `linuxdo-benefits.user.js` 用户脚本在登录态浏览器中运行，低频、安全地抓取福利区最新节点、账号与公益站资源，自动整理为 Markdown 文档。

### 3. Cloudflare 人机验证自动化回退
- 优先对接本地 `验证码识别` 服务的 HTTP API 接口；在本地服务不可用时，自动优雅降级使用 Playwright / 本地浏览器求解器。

---

## 🚀 快速启动

详见 [codex/temp/README.md](file:///d:/codex-projeect/codex/temp/README.md)。
直接双击 `codex/temp/一键执行每日签到（显示结果）.cmd` 即可开始执行。
