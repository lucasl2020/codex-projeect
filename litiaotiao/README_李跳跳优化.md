# 李跳跳 APK 优化 — 进展与操作手册

## 一、结论（先看这里）

你上传的 `base.apk` 是 **李跳跳 2.2**（包名 `hello.litiaotiao.app`，无障碍服务 `LttService`）。

但它被 **腾讯乐固加固** 了：真正的代码（跳过逻辑、点击速度）被加密打包在
`assets/0OO00l111l1l` 里，运行时由 `libshell-super.2019.so` 解密进内存。
反编译出来的 `classes.dex` 里只有壳，没有 `LttService` 等实际逻辑。

因此「反编译 → 改代码 → 重打包」这条路，卡在**脱壳**这一步。

## 二、立即可用：更新规则（跳过率立刻改善）

社区在持续维护李跳跳规则库（GitHub 仓库 `wtwang1998/LiTiaotiao-Custom-Rules`，
10k+ star）。最新版已放到工作目录：

- `李跳跳规则_AllRules.json`（约 177 个 App 的普通规则 + 增强规则）

### 导入步骤

1. 把 `李跳跳规则_AllRules.json` 传到手机（微信文件传输助手 / 数据线均可）。
2. 手机上用「MT 管理器」打开该文件，全选复制全部内容。
   （不建议用输入法/微信中转复制，容易截断导致格式错误）
3. 打开「李跳跳」→ 点「更多」→ 右上角三个点 → 「导入规则」。
4. **长按输入框** → 选择「粘贴」→ 「保存」。
5. 提示导入成功即可。

> 注意：一次只能导入一个 json，导入第二个会**覆盖**前一个，不会追加。

## 三、后续改代码（速度 / 图片按钮 / 解析优化）

这部分必须先把加密的明文 dex 取出来（脱壳）。方案二选一：

### 方案 A：手机脱壳（推荐，最贴合"改原版"）

1. 手机上安装 MT 管理器，并确保李跳跳已安装、已开启过一次无障碍服务。
2. 用 MT 管理器对「李跳跳」执行**脱壳**（MT 的"脱壳/Dex 修复"功能），
   得到脱壳后的 APK 或 dex。
3. 把脱壳产物发回到工作目录。
4. 我用已备好的工具链继续：定位 `LttService` 逻辑 → 改匹配/速度 → 重打包 → 重签 → 产出可安装的新 APK。

### 方案 B：本机模拟器脱壳

由我在本机安装带 root 的安卓模拟器 + Frida 自动脱壳。耗时长、下载量大，
且加固可能检测模拟器，成功率非 100%。

## 四、本机已就绪的工具链（供后续使用）

| 工具 | 路径 | 用途 |
|------|------|------|
| JDK 17 | `D:\devloop-tools\jdk-17.0.12\bin\java.exe` | 运行 apktool/signer |
| apktool 3.0.3 | `_tools\apktool.jar` | 反编译 / 重打包 |
| uber-apk-signer 1.3.0 | `_tools\uber-apk-signer.jar` | 一键签名（v1+v2+v3） |

关键命令备忘：

```powershell
# 反编译（-p 指定框架目录，避免写系统目录被沙箱拦截）
& "D:\devloop-tools\jdk-17.0.12\bin\java.exe" -jar _tools\apktool.jar d base.apk -o decode -f -p _tools\framework

# 重打包
& "D:\devloop-tools\jdk-17.0.12\bin\java.exe" -jar _tools\apktool.jar b decode -o _build\unsigned.apk -p _tools\framework

# 签名
& "D:\devloop-tools\jdk-17.0.12\bin\java.exe" -jar _tools\uber-apk-signer.jar --apks _build\unsigned.apk --out _out
```