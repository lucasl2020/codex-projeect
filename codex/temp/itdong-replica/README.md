# ITDong 风格 WordPress 站点

这是一个可由 WordPress 后台长期维护的复刻项目。前台基于 **Argon 1.3.5**，默认配置为桌面端三栏、移动端单栏，并预置历史时间轴、归档、留言、某些话、友情链接、站点状态和书籍页面。

项目只复刻公开可见的布局与交互风格，不包含原站数据库、私有配置或完整文章。初始化文章、页面内容和 Logo 都是可删除的占位内容。

## 1. 运行要求

- Windows 10/11
- Docker Desktop，使用 Linux 容器
- 建议至少预留 2 GB 内存

## 2. 一键启动

1. 启动 Docker Desktop，等待状态变为正在运行。
2. 双击 `启动网站.cmd`，或在本目录运行：

   ```powershell
   .\start.ps1
   ```

3. 首次启动会自动：
   - 生成 `.env` 和随机数据库、后台密码；
   - 启动 MariaDB 与 WordPress；
   - 安装并启用 Argon 子主题；
   - 创建菜单、小工具、页面、分类和 8 篇示例文章；
   - 尝试启用简体中文后台。

默认地址：

- 前台：`http://localhost:8080`
- 后台：`http://localhost:8080/wp-admin/`
- 管理员用户名：`.env` 中的 `WP_ADMIN_USER`
- 管理员密码：首次启动时显示，也保存在 `.env`

如果 8080 端口被占用，启动前修改 `.env` 中的 `WORDPRESS_PORT` 和 `SITE_URL`，两者端口必须一致。

## 3. 停止和再次启动

双击 `停止网站.cmd`，或运行：

```powershell
.\stop.ps1
```

停止不会删除数据库和上传文件。再次运行 `start.ps1` 会沿用现有内容，不会重置管理员密码，也不会重复覆盖已初始化的数据。

## 4. 后台发布内容

### 发布文章

1. 登录后台。
2. 打开“文章 → 写文章”。
3. 填写标题和正文。
4. 在右侧选择分类、标签和特色图片。
5. 点击“发布”。

新文章会自动出现在首页，不需要修改代码。

### 管理固定页面

打开“页面 → 所有页面”，可编辑以下初始化页面：

- 历史时间轴
- 归档时间轴
- 留言
- 某些话
- 友情链接
- 站点状态
- 书籍

“归档时间轴”和“留言”使用 Argon 的专用页面模板。编辑时不要随意修改它们的模板设置。

### 管理评论

文章评论与留言板内容都在“评论”中统一审核、回复或删除。

## 5. 修改外观

### 标题和站点说明

后台进入“设置 → 常规”。

### Logo 和头像

当前占位 Logo 位于：

`wordpress/wp-content/themes/itdong-child/assets/logo.png`

可以直接替换为同名 PNG，建议使用正方形透明图。替换后清除浏览器缓存。站点图标也可以在后台“外观 → 自定义 → 站点身份”中修改。

### 主题色、背景和 Banner

后台进入“Argon 主题选项”。初始化值包括：

- 主题色：`#2196f3`
- 三栏布局
- 25px 卡片圆角
- 大阴影、衬线字体、沉浸色、毛玻璃导航
- Bing 动态背景：`https://api.foreverlink.love/bing`

动态背景依赖第三方服务。正式上线时建议下载一张有授权的图片并上传到媒体库，再把背景地址改为自己的文件。

### 菜单

后台进入“外观 → 菜单”，项目预置：

- 顶部导航
- 侧栏菜单
- 作者链接

### 右侧栏

后台进入“外观 → 小工具”，可管理最新评论、站点信息、标签云和分类。

## 6. 删除示例内容

后台进入“文章 → 所有文章”，将初始化示例文章移入回收站即可。页面也可以删除或改写，但删除导航中的页面后，应同步到“外观 → 菜单”清理菜单项。

初始化脚本通过 `itdong_replica_seed_version` 标记只运行一次。不要在已经录入正式内容后手工删除该标记，否则再次启动可能更新同名示例页面和文章。

## 7. 数据保存位置

- 数据库：Docker 卷 `itdong-replica_db_data`
- WordPress 核心和 `wp-config.php`：Docker 卷 `itdong-replica_wordpress_core`
- 主题、上传图片和插件：本项目的 `wordpress/wp-content`
- 密码与本地配置：本项目的 `.env`

请勿把 `.env` 提交到公开仓库。

## 8. 备份

完整备份至少包含：

1. MariaDB 数据库导出文件；
2. 整个 `wordpress/wp-content` 目录；
3. `.env`，请加密保存。

可以使用 WordPress 备份插件，也可以使用 `mariadb-dump` 定期导出数据库。恢复前必须先验证备份文件可读取，且不要只备份 Docker 容器本身。

## 9. 正式上线建议

本项目默认配置适合本机预览和内容录入。公网部署前至少完成：

- 将 `.env` 的 `SITE_URL` 改为正式 HTTPS 域名；
- 使用 Nginx、Caddy 或云负载均衡终止 HTTPS；
- 更换管理员用户名、邮箱和强密码；
- 配置 SMTP、反垃圾评论、缓存和定时异地备份；
- 限制数据库端口，不要把 MariaDB 直接暴露到公网；
- 更新前先在副本环境测试 WordPress、PHP、主题和插件兼容性；
- 对通过媒体库上传的图片进行压缩和 WebP 转换。

Argon 1.3.5 是较老的主题版本。为了复刻外观，本项目保留该版本；正式站点升级 WordPress、PHP 或安装插件前，应先做完整备份和回归测试。

## 10. 项目检查

运行：

```powershell
.\verify.ps1
```

脚本会检查必需文件、UTF-8 BOM、Argon 版本和关键初始化配置；如果本机安装了 PHP 或 Docker，还会附加执行 PHP 语法和 Compose 配置检查。

## 11. 常用排查命令

```powershell
docker compose ps
docker compose logs --tail=200 wordpress
docker compose logs --tail=200 db
```

如需查看 WordPress 信息：

```powershell
docker compose run --rm cli core version
docker compose run --rm cli option get siteurl
docker compose run --rm cli theme status
```