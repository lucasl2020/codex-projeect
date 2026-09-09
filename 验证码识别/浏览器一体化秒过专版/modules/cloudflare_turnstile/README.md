# Cloudflare Turnstile 独立穿透与识别模块

本模块专用于自动化识别与通过 **Cloudflare Turnstile** 5 秒盾与交互式验证。

## 特性

- **反爬特征抹除**：内置经过实战验证的 Chromium 规避参数及 `navigator.webdriver` 原生注入抹除，可直接无感访问受 CF 保护的站点（如 `www.hvoy.ai`）。
- **智能勾选与 Token 嗅探**：自动探测 `challenges.cloudflare.com` frame 中的勾选框并执行模拟点击，自动监听并提取 `cf-turnstile-response`。
- **纯本地运行**：无需借助第三方打码或反代中继。

## 使用方式

### 命令行运行
```powershell
# 针对 Hvoy 网站进行穿透测试与会话复用
python -m modules.cloudflare_turnstile.run https://www.hvoy.ai/ --wait 180
```

### 代码嵌入调用
```python
from playwright.sync_api import sync_playwright
from modules.cloudflare_turnstile.solver import TurnstileSolver

solver = TurnstileSolver()

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome", headless=False, args=solver.get_browser_args())
    context = browser.new_context()
    solver.patch_context(context)

    page = context.new_page()
    page.goto("https://www.hvoy.ai/")

    # 执行检测与通过
    status = solver.solve(page)
    print("Turnstile 状态:", status)
```

### 独立单元测试
```powershell
python -m unittest modules.cloudflare_turnstile.test_turnstile -v
```
