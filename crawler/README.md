# Card Shop Manager（卡网管理）

本地 Node 面板：管理卡网 / 导航站 URL，启动 / 手动 / 定时爬取商品，按店铺分组展示，组内 **价格升序、质保越长越前**。

## 一键启动（推荐）

Windows 双击：

```text
start.bat
```

或命令行：

```bash
npm run start:open
```

行为：
1. 没有 `node_modules` 时自动 `npm install`
2. 没有数据库时自动导入 `data/seed-urls.txt`
3. 启动服务；**默认端口 3780 被占用时自动 +1 尝试**（最多 50 次）
4. 自动打开浏览器到实际端口

## 普通启动

```bash
npm install
npm start
```

端口占用同样会自动切换。默认起始端口可用环境变量覆盖：

```bash
set PORT=3780
npm start
```

## 功能

- 店铺 / 导航 / 未识别 分区，可手改类型、启用/禁用
- 商品：名称、价格、图片、质保
- 启动时自动爬取（可关）
- 默认每 6 小时定时爬取（可关/可改，**保存设置后热重载**）
- 手动全量或单店刷新；进行中再次触发返回 409
- 混合解析：`pay.ldxp.cn` 等发卡模板专用 + Playwright 通用启发式
- **共享 Browser 池**（不每个站点重启 Chromium）
- URL 自动清洗追踪参数并去重
- 失败不覆盖该站上次成功商品；连续失败可自动禁用
- 跨店搜索（名称 / 价格区间）
- **端口占用自动换端口**

## 测试

```bash
npm test
```

## 数据

SQLite：`data/app.db`（已 gitignore）

## 浏览器说明

爬虫优先使用 Playwright 自带 Chromium；若未安装，会自动尝试系统 **Chrome** 或本机已有的 ms-playwright Chromium。

仍失败时执行：

```bash
npm run install-browser
```

## 说明

仅供个人本机比价整理；站点结构差异大，通用解析可能部分失败，失败不会清空该站上次成功商品。
