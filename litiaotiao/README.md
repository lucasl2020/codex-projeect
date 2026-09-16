# 李跳跳 APK 优化与自定义规则集

针对 Android 开屏广告跳过神器 **李跳跳 2.2**（包名 `hello.litiaotiao.app`）的加固逆向分析、规则强化与反编译工具链。

---

## 🌟 项目概览

1. **最新 177+ 常用 App 聚合规则库** (`李跳跳规则_AllRules.json`)：
   - 包含普通跳过规则与增强防误触规则。
   - 适配抖音、微信、网易云音乐、知乎、微博、Bilibili 等主流应用最新开屏广告样式。
2. **腾讯乐固加固深度逆向分析**：
   - 原版 `base.apk` 受腾讯乐固加固保护，核心业务逻辑被加密存储在 `assets/0OO00l111l1l`，运行时由 `libshell-super.2019.so` 动态解密映射至内存。
   - 提供手机端 MT 管理器一键脱壳与 PC 模拟器 Frida 内存 Dump 两种技术路线。
3. **免配置反编译与重打包工具链** (`_tools/`)：
   - 内置 `apktool 3.0.3`、`uber-apk-signer 1.3.0` 与独立 framework 环境，开箱即用。

---

## 🚀 快速上手：一键导入最新规则（无需脱壳）

最快提升广告跳过率的方法是直接导入工作目录下的最新规则：

1. 将本目录的 **`李跳跳规则_AllRules.json`** 发送至手机（微信文件传输或数据线）。
2. 在手机上用文本查看器或「MT 管理器」打开该 JSON 文件，**全选并复制全部内容**。
3. 打开手机上的「李跳跳」App → 点击「更多」→ 点击右上角菜单（三个点）→ 选择「导入规则」。
4. 长按输入框粘贴并保存，提示导入成功即可！

> 💡 **提示**：导入新规则将整体覆盖旧规则。完整图文教程请参考 [操作手册_李跳跳.md](file:///d:/codex-projeect/litiaotiao/操作手册_李跳跳.md)。

---

## 🛠️ 代码修改与重打包工作流（针对脱壳后）

| 步骤 | 阶段 | 说明与命令 |
| :---: | :--- | :--- |
| 1 | **脱壳** | 手机端 MT 管理器提取脱壳后 dex 并替换 |
| 2 | **反编译** | `java -jar _tools\apktool.jar d base.apk -o decode -f -p _tools\framework` |
| 3 | **修改** | 修改 `decode\smali\` 下 `LttService` 控件遍历算法与响应延时 |
| 4 | **重打包** | `java -jar _tools\apktool.jar b decode -o _build\unsigned.apk -p _tools\framework` |
| 5 | **签名** | `java -jar _tools\uber-apk-signer.jar --apks _build\unsigned.apk --out _out` |
