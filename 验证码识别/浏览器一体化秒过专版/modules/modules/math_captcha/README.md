# 算术与字符计算验证码 独立识别模块

本模块专用于识别并求解各类加减乘除、带干扰线的算术计算验证码。

## 特性

- **高速 OCR 结合智能推导**：优先通过 `ddddocr` 提取字符，内置运算符模式纠错（当 OCR 漏读 `-` 号，如把 `12-7` 误读为 `127` 时自动执行减号模式推导）。
- **本地视觉大模型语义兜底**：当公式存在手写体、复杂中文字符干扰（如“五加三等于几”）时，自动唤醒本地 `qwen3-vl:4b` 模型直接计算得出整数结果。
- **自动定位与填值**：支持截取指定区域图片，并将运算结果自动输入到指定的 HTML input 标签内。

## 使用方式

### 命令行运行
```powershell
python -m modules.math_captcha.run https://example.com/form --region "#captcha-img" --input "#captcha-input" --submit "#submit-btn"
```

### 代码嵌入调用
```python
from playwright.sync_api import sync_playwright
from modules.math_captcha.solver import MathCaptchaSolver

solver = MathCaptchaSolver(model="qwen3-vl:4b")

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome", headless=False)
    page = browser.new_page()
    page.goto("https://example.com/form")

    # 执行算术识别并填充
    status = solver.solve(page, region_selector="#captcha-img", input_selector="#captcha-input")
    print("算术验证码状态:", status)
```

### 独立单元测试
```powershell
python -m unittest modules.math_captcha.test_math -v
```
