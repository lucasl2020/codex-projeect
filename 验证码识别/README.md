# 本地离线全能验证码自动化识别系统 (Local Captcha Solver)

这是一个**纯本地、完全免费、零外部打码 API 依赖**的多类型验证码识别与自动化求解系统。

系统基于本地便携式 **Ollama 运行时** 与开源端侧视觉大模型 **Qwen3-VL:4b**，结合 **OpenCV 机器视觉** 与 **ddddocr**，实现了对各类主流复杂验证码（包括 Google reCAPTCHA、hCaptcha、Cloudflare Turnstile、腾讯/通用滑块拼图、算术计算题等）的高精度自动化识别与求解。

---

## 🌟 核心特性

- **100% 本地离线与免费**：绝不调用任何第三方商业打码平台或云端 API，图片与会话数据仅在本地 `127.0.0.1` 闭环传输，安全无泄露风险。
- **全题型深度覆盖**：
  - **Google reCAPTCHA v2 / v3**：优先自动模拟点击复选框实现 **No-CAPTCHA 免挑战直接跳过**；弹窗时自动切图并由大模型完成九宫格/十六宫格图片语义识别并提交。
  - **hCaptcha**：支持 3D WebGL 空间画布拖拽补全、多目标点击与九宫格选图；内置三次贝塞尔曲线拟人平滑拖拽与自然停顿；智能回避未就绪时的“跳过”误触，自动衔接多轮挑战连续通关。
  - **Cloudflare Turnstile (5秒盾)**：底层注入反自动化特征抹除（覆写 `navigator.webdriver` 与屏蔽自动化 Blink 特征），自动穿透并模拟点击 Turnstile 确认框。
  - **腾讯防水墙与通用滑块**：集成毫秒级 OpenCV 差分连通域缺口检测算法，并支持视觉大模型语义定位兜底；带有真实微抖动的人工拖动轨迹模拟。
  - **算术计算验证码**：OCR 高速识别结合缺省运算符智能模式推导（自动纠正减号遗漏问题），并提供本地大模型语义计算兜底。
- **双重架构支持**：
  - **模块化解耦 (`modules/`)**：每种题型均有完全独立的文件夹，包含独立求解器、独立运行入口、独立单测与文档，支持零依赖单体移植。
  - **统一调度引擎 (`local_captcha/`)**：统一入口，自动嗅探当前页面所有验证码类型并调度对应的求解管线。

---

## 📁 目录结构

```text
├── modules/                               # 【独立分拆模块集】各模块互不依赖，自包含
│   ├── google_recaptcha/                  # 1. 谷歌 reCAPTCHA (复选框自动跳过 / 九宫格图片识别)
│   │   ├── solver.py                      # 专属求解器
│   │   ├── run.py                         # 独立运行命令行入口
│   │   ├── test_recaptcha.py              # 专属单元测试
│   │   └── README.md                      # 独立说明文档
│   ├── hcaptcha/                          # 2. hCaptcha (3D 画布拖拽 / 多目标点击 / 连续多轮提交)
│   │   ├── solver.py                      # 专属求解器与贝塞尔拖拽
│   │   ├── run.py                         # 独立运行命令行入口
│   │   ├── test_hcaptcha.py               # 专属单元测试
│   │   └── README.md                      # 独立说明文档
│   ├── cloudflare_turnstile/              # 3. Cloudflare Turnstile (反爬抹除 / 自动穿透与确认)
│   │   ├── solver.py                      # 专属穿透与勾选逻辑
│   │   ├── run.py                         # 独立运行命令行入口
│   │   ├── test_turnstile.py              # 专属单元测试
│   │   └── README.md                      # 独立说明文档
│   ├── tencent_slider/                    # 4. 腾讯与通用滑块 (OpenCV缺口识别 / 模型兜底 / 贝塞尔拟人轨迹)
│   │   ├── solver.py                      # 专属缺口识别与拖拽
│   │   ├── run.py                         # 独立运行命令行入口
│   │   ├── test_slider.py                 # 专属单元测试
│   │   └── README.md                      # 独立说明文档
│   └── math_captcha/                      # 5. 算术计算验证码 (ddddocr提取 / 缺省推导 / 模型语义计算兜底)
│       ├── solver.py                      # 专属算式求解与自动填值
│       ├── run.py                         # 独立运行命令行入口
│       ├── test_math.py                   # 专属单元测试
│       └── README.md                      # 独立说明文档
├── local_captcha/                         # 【统一调度引擎】自动嗅探识别多题型
│   ├── __main__.py                        # 统一主程序入口
│   ├── browser.py                         # 浏览器底层控制与调度器
│   ├── vision.py                          # 本地大模型通信与数据结构转换
│   └── test_local.py                      # 综合回归测试套件 (16/16 全部通过)
├── output/                                # 运行输出与运行时目录
│   ├── local-session.json                 # 预置已登录测试会话凭据（福利站/Hvoy）
│   └── runtime/                           # 便携式离线 Ollama 及模型文件
├── 启动本地模型.ps1                        # 一键拉起后台离线大模型服务
├── 启动本地识别.ps1                        # 一键拉起浏览器并执行全自动验证
└── README.md                              # 项目完整主文档
```

---

## 🚀 快速上手

### 1. 环境准备

确保本机已安装 Python 3.10+ 及 Google Chrome 浏览器。在项目根目录下安装基础依赖：

```powershell
pip install playwright Pillow ddddocr opencv-python numpy
```

### 2. 启动本地视觉模型服务

运行根目录提供的一键脚本拉起离线 Ollama 服务（基于 `127.0.0.1:11434`）：

```powershell
.\启动本地模型.ps1
```

> 服务启动后会在后台静默运行，无需保持窗口开启。

### 3. 环境健康自检

在命令行执行自检命令，确认所有组件可用：

```powershell
python -m local_captcha --doctor
```

输出如下即表示环境完全就绪：
```json
{
  "playwright.sync_api": "可用",
  "PIL.Image": "可用",
  "ddddocr": "可用",
  "本地视觉模型": "可用"
}
```

---

## 🛠️ 运行方式与实战示例

### 方式 A：使用独立专用子模块运行（推荐）

各个模块位于 `modules/` 目录下，完全解耦自包含：

#### ① Google reCAPTCHA 自动跳过与识别
```powershell
python -m modules.google_recaptcha.run https://example.com/login --submit "#submit-btn"
```

#### ② hCaptcha 3D 画布拖拽与多轮挑战（已在福利站实测验证）
```powershell
# 自动复用 output/local-session.json 会话并自动提交
python -m modules.hcaptcha.run https://checkin.new-api.abrdns.com/level --submit "#level-verify-submit" --wait 300
```

#### ③ Cloudflare Turnstile 5秒盾穿透（已在 Hvoy 实测验证）
```powershell
python -m modules.cloudflare_turnstile.run https://www.hvoy.ai/ --wait 180
```

#### ④ 腾讯滑块与通用拼图滑块
```powershell
python -m modules.tencent_slider.run https://example.com/login --wait 180
```

#### ⑤ 算术计算验证码自动计算与填入
```powershell
python -m modules.math_captcha.run https://example.com/form --region "#captcha-img" --input "#captcha-input" --submit "#submit-btn"
```

---

### 方式 B：使用统一自动嗅探引擎

统一引擎会自动扫描页面中存在哪种验证码，并无缝路由至对应的求解管线：

```powershell
# 1. 简易自动运行
python -m local_captcha https://checkin.new-api.abrdns.com/level --submit "#level-verify-submit" --success-selector "#level-verify-submit:not([disabled])" --wait 300

# 2. 人工辅助会话模式（开启可见浏览器，登录后按回车自动接管）
python -m local_captcha https://example.com/login --pause
```

---

## 🧪 自动化测试验证

系统配备了严密的端到端与单元测试体系：

### 1. 独立模块全量测试（8 项全部通过）
```powershell
python -m unittest discover -s modules -p "test_*.py" -v
```

### 2. 统一调度综合回归测试（16 项全部通过）
```powershell
python -m unittest local_captcha.test_local -v
```

测试覆盖范围包括：
- Google reCAPTCHA 复选框无感跳过及网格图切片识别
- hCaptcha 3D 画布拖动、多点坐标点击与网格识别
- Cloudflare 反爬特征注入抹除与勾选交互
- 腾讯滑块 OpenCV 匹配与贝塞尔平滑轨迹
- 算术验证码缺省符号补全推导与模型语义计算
- 模型安全边界过滤与结构化 JSON 思考过程兼容性

---

## ⚙️ 常见问题与说明

1. **为什么不需要向第三方平台充值？**  
   本套方案的所有图像分析由本机私有化部署的 `qwen3-vl:4b` 视觉语言大模型和本地算法（OpenCV / ddddocr）完成，所有推理直接在本地显卡/CPU 上运行。
2. **多轮 hCaptcha 通过率说明**：  
   hCaptcha 采用 2~3 轮随机切换题型。本地 4B 参数小模型在常规拖拽、拼块和常见物体辨识上表现稳定；面对极个别超高难度的抽象动态题型，单轮可能存在识别抖动，系统内置了异常重试与防点跳过机制，会自动等待并推进下一轮尝试。
3. **已保存会话说明**：  
   `output/local-session.json` 包含了预置站点的有效登录 Cookie，运行时会自动加载复用；如需测试新站点，可使用 `--pause` 参数在打开的浏览器中登录并自动保存状态。
