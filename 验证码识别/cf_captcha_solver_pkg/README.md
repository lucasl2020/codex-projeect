# cf-captcha-solver

> Cloudflare 验证绕过 + 验证码自动识别一体化 Python 库

支持 15+ 种验证码类型，包括文字/算术/点选/滑块等本地 OCR 识别，以及 hCaptcha/reCAPTCHA/Turnstile/FunCaptcha/GeeTest/AWS WAF 等第三方验证码求解。

## 安装

```bash
# 全部功能
pip install cf-captcha-solver[all]

# 仅验证码识别
pip install cf-captcha-solver[captcha]

# hCaptcha 九宫格本地识别（ONNX 模型）
pip install cf-captcha-solver[hcaptcha]

# hCaptcha 浏览器自动化（Playwright + ONNX）
pip install cf-captcha-solver[hcaptcha-browser]

# 仅 CF 轻量绕过（TLS 指纹）
pip install cf-captcha-solver[cf-lite]

# CF + DrissionPage 浏览器自动化
pip install cf-captcha-solver[cf-browser]
```

## 快速开始

### 一行代码识别验证码

```python
from cf_captcha_solver import solve

result = solve(image_path="captcha.png")
print(result.answer)       # 识别结果
print(result.captcha_type) # 验证码类型
```

### 一行代码绕过 Cloudflare

```python
from cf_captcha_solver import bypass

result = bypass("https://example.com")
if result.success:
    import requests
    resp = requests.get("https://example.com/api",
                        cookies=result.cookies,
                        headers={"User-Agent": result.user_agent})
```

## 支持的验证码类型

### 本地识别（免费，无需 API）

| 类型 | 方案 | 依赖 |
|---|---|---|
| 文字/数字验证码 | ddddocr OCR | `[captcha]` |
| 算术验证码 | OCR + 表达式求值 | `[captcha]` |
| 目标点选验证码 | ddddocr 目标检测 | `[captcha]` |
| 顺序点选验证码 | 检测 + OCR + 排序 | `[captcha]` |
| 滑块验证码 (边缘匹配) | ddddocr 缺口检测 + 轨迹 | `[captcha]` |
| 滑块验证码 (图片差异) | ddddocr slide_comparison | `[captcha]` |
| hCaptcha 九宫格 | ONNX MoE 模型本地分类 | `[hcaptcha]` |
| hCaptcha 浏览器自动化 | Playwright + ONNX 自动点击 | `[hcaptcha-browser]` |
| reCAPTCHA 图片分类 | ONNX/ddddocr 图片分类 | `[hcaptcha]` 或 `[captcha]` |
| 通用图片分类 | CLIP/ONNX 多后端 | `[hcaptcha]` 或 `[captcha]` |

### 第三方 API 识别（付费，高成功率）

| 类型 | 方案 | 依赖 |
|---|---|---|
| reCAPTCHA v2/v3 | 2captcha / capsolver / yescaptcha | 无额外依赖 |
| hCaptcha (token 模式) | 2captcha / capsolver / yescaptcha | 无额外依赖 |
| hCaptcha (图片分类) | capsolver / yescaptcha HCaptchaClassification | 无额外依赖 |
| Cloudflare Turnstile | 2captcha / capsolver / yescaptcha | 无额外依赖 |
| FunCaptcha (Arkose Labs) | 2captcha / capsolver / yescaptcha | 无额外依赖 |
| GeeTest v3 | 2captcha / capsolver / yescaptcha | 无额外依赖 |
| GeeTest v4 | capsolver / yescaptcha | 无额外依赖 |
| AWS WAF | capsolver / yescaptcha | 无额外依赖 |

## Cloudflare 绕过策略

| 策略 | 原理 | 依赖 |
|---|---|---|
| curl_cffi | TLS 指纹伪装 | `[cf-lite]` |
| cloudscraper | 纯 Python 解析 5 秒盾 | `[cf-lite]` |
| FlareSolverr | Docker 服务 | 无额外依赖 |
| DrissionPage | CDP 协议操控 Chrome | `[cf-browser]` |
| Playwright | 浏览器自动化 | `[cf-playwright]` |

## API 参考

### `solve()` - 验证码识别

```python
from cf_captcha_solver import solve, CaptchaType

# 图片识别（自动检测类型）
result = solve(image_path="captcha.png")

# 指定类型
result = solve(image_path="math.png", captcha_type=CaptchaType.MATH)

# 滑块验证码（边缘匹配模式）
result = solve(image_bytes=bg, bg_image=bg, slider_image=slider)

# 从 HTML 检测
result = solve(html=page_html, page_url="https://example.com",
               platform="capsolver", api_key="YOUR_KEY")

# GeeTest 验证码
result = solve(html=html, page_url="https://example.com",
               platform="capsolver", api_key="YOUR_KEY",
               challenge="xxx")
```

### `bypass()` - Cloudflare 绕过

```python
from cf_captcha_solver import bypass

result = bypass("https://example.com", proxy="socks5://127.0.0.1:7890")
```

### `CaptchaSolver` - 验证码识别器

```python
from cf_captcha_solver import CaptchaSolver, CaptchaType

solver = CaptchaSolver(use_gpu=True, third_party_platform="capsolver", third_party_api_key="xxx")
result = solver.solve_image(image_bytes)
result = solver.solve_from_html(html, page_url="https://example.com")
```

### 高级求解器

#### hCaptcha 九宫格本地识别

```python
from cf_captcha_solver import HCaptchaGridSolver

# 使用 ONNX MoE 模型本地分类（免费）
solver = HCaptchaGridSolver(use_gpu=False)

# 对九宫格图片进行分类
result = solver.classify_images(
    prompt="请点击每张包含火车的图片",
    images=[img1_bytes, img2_bytes, ...],  # 9 张图片
)
# result.answer = [True, False, True, ...]  # 每张图是否匹配
```

#### hCaptcha 浏览器自动化

```python
from cf_captcha_solver import HCaptchaBrowserSolver

# 启动浏览器自动解决 hCaptcha
solver = HCaptchaBrowserSolver(
    use_gpu=False,
    headless=True,
    proxy="socks5://127.0.0.1:7890",  # 可选
)

result = solver.solve(
    page_url="https://example.com/page_with_hcaptcha",
    max_retries=3,
)
# result.answer = "P0_eyJ..."  # h-captcha-response token
```

#### hCaptcha 九宫格 API 分类

```python
from cf_captcha_solver import HCaptchaGridAPISolver

# 通过第三方 API 分类九宫格图片
solver = HCaptchaGridAPISolver(platform="yescaptcha", api_key="YOUR_KEY")

result = solver.classify_grid(
    prompt="请点击每张包含火车的图片",
    images=[img1_bytes, img2_bytes, ...],
)
```

#### GeeTest 极验验证码

```python
from cf_captcha_solver import GeeTestSolver, GeeTestV4Solver

# GeeTest v3 - 滑块/点选本地识别
solver = GeeTestSolver()
result = solver.solve_slide(bg_image=bg_bytes, slider_image=slider_bytes)
result = solver.solve_click(bg_image=bg_bytes, target_text="星空 大海 草原")

# GeeTest v3 - API 模式
result = solver.solve_via_api(
    gt="0192a3b4c5d6e7f8a9b0c1d2e3f4a5b6",
    challenge="xxx",
    page_url="https://example.com",
    api_key="YOUR_KEY",
    platform="capsolver",
)

# GeeTest v4 - API 模式
v4_solver = GeeTestV4Solver()
result = v4_solver.solve_via_api(
    captcha_id="e392e1d7fd421dc63325744d5a2b9c73",
    page_url="https://example.com",
    lot_number="xxx",
    api_key="YOUR_KEY",
    platform="capsolver",
)
```

#### FunCaptcha (Arkose Labs)

```python
from cf_captcha_solver import FunCaptchaSolver

solver = FunCaptchaSolver()

# 从 HTML 提取 public key
public_key = FunCaptchaSolver.extract_public_key(html)

# 通过 API 解决
result = solver.solve_via_api(
    public_key="A2A14B1D-1AF3-4DE0-A6F3-E5B1C5C8E5E9",
    page_url="https://example.com",
    service_url="client-api.arkoselabs.com",
    api_key="YOUR_KEY",
    platform="capsolver",
)
# result.answer = "token_string..."
```

#### AWS WAF 验证码

```python
from cf_captcha_solver import AWSWAFCaptchaSolver

solver = AWSWAFCaptchaSolver()
result = solver.solve_via_api(
    site_key="xxx",
    page_url="https://example.com",
    iv="xxx",          # 可选
    context="xxx",     # 可选
    api_key="YOUR_KEY",
    platform="capsolver",
)
```

#### reCAPTCHA 图片分类

```python
from cf_captcha_solver import ReCaptchaImageSolver

solver = ReCaptchaImageSolver(backend="hcaptcha_challenger")

# 对 reCAPTCHA 网格图片进行分类
result = solver.classify_tiles(
    prompt="Select all images with traffic lights",
    tiles=[tile1_bytes, tile2_bytes, ...],  # 9 或 16 张
)
# result.answer = [True, False, ...]
```

#### 图片差异滑块（前图+后图模式）

```python
from cf_captcha_solver import SlideComparisonSolver

solver = SlideComparisonSolver()

# 通过比较完整图和缺口图找出缺口位置
result = solver.solve(
    full_image=full_bg_bytes,   # 完整无缺口背景图
    gap_image=gap_bg_bytes,     # 有缺口的背景图
)
# result.answer = 150  # 缺口 X 坐标
# result.details["track"]  # 滑动轨迹
```

#### 通用图像分类器

```python
from cf_captcha_solver import ImageClassifier

# 多后端图像分类
clf = ImageClassifier(backend="hcaptcha_challenger")  # 或 "ddddocr"
results = clf.classify(
    prompt="包含火车的图片",
    images=[img1, img2, ...],
)
# results = [True, False, ...]

# 目标检测
bboxes = clf.detect_objects(image_bytes)
# bboxes = [(x1, y1, x2, y2), ...]
```

### `CloudflareBypasser` - CF 绕过器

```python
from cf_captcha_solver import CloudflareBypasser

bypasser = CloudflareBypasser(
    proxy="socks5://127.0.0.1:7890",
    headless=False,
    captcha_platform="capsolver",
    captcha_api_key="xxx",
)
result = bypasser.bypass("https://example.com", strategies=["drissionpage"])
```

## 命令行工具

```bash
# 验证码识别
captcha-solver text --image captcha.png
captcha-solver math --image math.png
captcha-solver slide --bg bg.png --slider slider.png
captcha-solver click --image click.png --text "星空大海"

# Cloudflare 绕过
cf-bypass https://example.com
cf-bypass https://example.com --proxy socks5://127.0.0.1:7890 --no-headless

# 检测验证码类型
captcha-solver detect --html page.html
```

## 合规提醒

仅供技术研究和学习使用。绕过安全机制可能违反目标网站服务条款，请在合法合规的前提下使用。

## 非 Python 程序调用（HTTP API）

对于 Node.js / Go / Java / PHP / C# / Shell 等非 Python 程序，
启动 HTTP API 服务后，通过 HTTP 调用即可使用全部功能。

### 启动 HTTP API 服务

```bash
# 方式一：命令行
pip install "cf-captcha-solver[server]"
cf-captcha-server --port 8000

# 方式二：Docker
docker build -t cf-captcha-solver .
docker run -d -p 8000:8000 cf-captcha-solver

# 方式三：Python 模块
python -m cf_captcha_solver.server --port 8000
```

启动后访问 `http://localhost:8000/docs` 查看自动生成的 Swagger API 文档。

### API 端点

| 方法 | 路径 | 功能 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| POST | `/api/captcha/solve` | 识别验证码（上传文件） |
| POST | `/api/captcha/solve/json` | 识别验证码（Base64 JSON） |
| POST | `/api/captcha/detect` | 检测验证码类型 |
| POST | `/api/cloudflare/bypass` | 绕过 Cloudflare |

### 调用示例

**curl（任何语言通用）**
```bash
# 识别验证码（上传图片）
curl -X POST http://localhost:8000/api/captcha/solve \
  -F "image=@captcha.png" -F "captcha_type=text"

# 绕过 Cloudflare
curl -X POST http://localhost:8000/api/cloudflare/bypass \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","headless":true}'
```

**Node.js**
```javascript
const result = await fetch('http://localhost:8000/api/cloudflare/bypass', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com', headless: true }),
}).then(r => r.json());
```

**Go**
```go
resp, _ := http.Post("http://localhost:8000/api/cloudflare/bypass",
    "application/json",
    bytes.NewBuffer([]byte(`{"url":"https://example.com"}`)))
```

**PHP**
```php
$ch = curl_init('http://localhost:8000/api/cloudflare/bypass');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['url' => 'https://example.com']),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
]);
$resp = curl_exec($ch);
```

完整多语言示例见 `examples/non_python/` 目录。

## 项目结构

```
cf_captcha_solver_pkg/
├── pyproject.toml              # 打包配置
├── Dockerfile                  # Docker 容器化部署
├── README.md
├── cf_captcha_solver/          # 源码包
│   ├── __init__.py             # 公共 API 导出
│   ├── api.py                  # 统一入口 solve() / bypass()
│   ├── captcha.py              # 验证码识别模块 (文字/算术/点选/滑块/第三方)
│   ├── advanced_solvers.py     # 高级求解器 (hCaptcha/GeeTest/FunCaptcha/AWS WAF)
│   ├── cloudflare.py           # Cloudflare 绕过模块
│   ├── cli.py                  # 命令行工具
│   └── server.py               # HTTP API 服务（FastAPI）
├── examples/
│   ├── quickstart.py           # Python 快速上手
│   └── non_python/             # 非 Python 调用示例
│       ├── curl_examples.sh    # Shell/curl
│       ├── nodejs_example.js   # Node.js
│       ├── go_example.go       # Go
│       ├── php_example.php     # PHP
│       └── JavaExample.java    # Java
└── tests/
    └── test_imports.py         # 导入测试
```

## 作为依赖使用

### 方式一：pip 安装（推荐）

```bash
# 安装到当前环境
pip install ./cf_captcha_solver_pkg

# 开发模式（修改源码即时生效）
pip install -e ./cf_captcha_solver_pkg

# 带全部功能
pip install -e "./cf_captcha_solver_pkg[all]"
```

安装后，任何 Python 项目都可以直接导入：

```python
from cf_captcha_solver import solve, bypass, CaptchaSolver, CloudflareBypasser
```

### 方式二：构建 wheel 分发

```bash
# 安装构建工具
pip install build

# 构建 wheel 和 sdist
cd cf_captcha_solver_pkg
python -m build

# 产物在 dist/ 目录
# cf_captcha_solver-1.0.0-py3-none-any.whl
# cf_captcha_solver-1.0.0.tar.gz

# 安装 wheel
pip install dist/cf_captcha_solver-1.0.0-py3-none-any.whl

# 分发给其他项目
# 将 .whl 文件拷贝到目标机器执行 pip install 即可
```

### 方式三：发布到 PyPI

```bash
pip install twine

# 上传到 TestPyPI（测试）
twine upload --repository testpypi dist/*

# 上传到正式 PyPI
twine upload dist/*

# 发布后任何人都能安装
# pip install cf-captcha-solver[all]
```

## 验证安装

```bash
# 检查导入
python -c "import cf_captcha_solver; print(cf_captcha_solver.__version__)"

# 运行测试脚本
python tests/test_imports.py
```

## 依赖说明

| 功能模块 | 可选依赖组 | 安装命令 |
|---|---|---|
| 核心（requests） | 无 | `pip install cf-captcha-solver` |
| 验证码 OCR + 目标检测 + 滑块 | `[captcha]` | `pip install "cf-captcha-solver[captcha]"` |
| hCaptcha 九宫格 ONNX 本地识别 | `[hcaptcha]` | `pip install "cf-captcha-solver[hcaptcha]"` |
| hCaptcha 浏览器自动化 | `[hcaptcha-browser]` | `pip install "cf-captcha-solver[hcaptcha-browser]"` |
| CF TLS 指纹 | `[cf-lite]` | `pip install "cf-captcha-solver[cf-lite]"` |
| CF 浏览器自动化 | `[cf-browser]` | `pip install "cf-captcha-solver[cf-browser]"` |
| CF Playwright | `[cf-playwright]` | `pip install "cf-captcha-solver[cf-playwright]"` |
| HTTP API 服务 | `[server]` | `pip install "cf-captcha-solver[server]"` |
| 全部功能 | `[all]` | `pip install "cf-captcha-solver[all]"` |

所有依赖均为延迟加载，未安装某个库时对应功能自动跳过，不影响其他功能。

## 技术参考

| 项目 | 说明 |
|---|---|
| [ddddocr](https://github.com/sml2h3/ddddocr) | 开源 OCR + 目标检测 + 滑块缺口识别 |
| [hcaptcha-challenger](https://github.com/QIN2DIM/hcaptcha-challenger) | hCaptcha ONNX MoE 模型本地识别 |
| [cloudscraper](https://github.com/VeNoMouS/cloudscraper) | Cloudflare 5 秒盾纯 Python 解析 |
| [curl_cffi](https://github.com/lexiforest/curl_cffi) | TLS 指纹伪装 HTTP 客户端 |
| [DrissionPage](https://github.com/g1879/DrissionPage) | CDP 协议浏览器自动化 |
| [2captcha](https://2captcha.com) | 商业打码平台 |
| [capsolver](https://capsolver.com) | 商业打码平台 |
| [yescaptcha](https://yescaptcha.com) | 商业打码平台 |
