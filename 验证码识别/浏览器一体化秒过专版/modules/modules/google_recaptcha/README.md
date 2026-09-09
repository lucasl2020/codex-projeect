# Google reCAPTCHA 独立识别模块

本模块专用于自动化识别与通过 **Google reCAPTCHA v2 / v3** 验证码。

## 特性

- **自动跳过 (No-CAPTCHA)**：检测到 Google 绿色复选框时自动点击并模拟人工交互，低风控下直接打勾通过并获取 Token。
- **图片多选识别**：面对九宫格或十六宫格图片选择题，自动将切片合并送入本地离线大模型 `qwen3-vl:4b` 识别并完成多选点击与提交。
- **100% 本地运行**：不调用任何外部付费 API。

## 使用方式

### 命令行运行
```powershell
python -m modules.google_recaptcha.run https://example.com/login --submit "#login-button"
```

### 代码嵌入调用
```python
from playwright.sync_api import sync_playwright
from modules.google_recaptcha.solver import RecaptchaSolver

solver = RecaptchaSolver(model="qwen3-vl:4b")

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto("https://example.com/target")

    # 执行识别与解决
    status = solver.solve(page)
    print("reCAPTCHA 状态:", status)
```

### 独立单元测试
```powershell
python -m unittest modules.google_recaptcha.test_recaptcha -v
```
