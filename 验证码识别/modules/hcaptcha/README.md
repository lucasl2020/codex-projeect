# hCaptcha 独立识别模块

本模块专用于自动化识别与攻破 **hCaptcha** 复杂验证码（包括 3D WebGL 画布、多目标点击与九宫格选图）。

## 特性

- **3D 拼图拖拽**：提取拼图缺口与起始滑块，使用平滑贝塞尔曲线执行带有轻微抖动和按住/释放时延的拟人化拖拽。
- **智能防误触**：右下角按钮若处于“跳过”状态，坚决不点击，防止被 hCaptcha 强制重置题型；直到识别成功变为“检查”/“验证”/“下一个”才点击提交。
- **多轮挑战连续提交**：自动应对 hCaptcha 连续 2~3 轮随机切换的复杂挑战。
- **100% 本地模型驱动**：基于本地 `qwen3-vl:4b` 视觉大模型，离线运行。

## 使用方式

### 命令行运行
```powershell
# 针对福利站升级验证执行（自动复用 output/local-session.json）
python -m modules.hcaptcha.run https://checkin.new-api.abrdns.com/level --submit "#level-verify-submit" --wait 300
```

### 代码嵌入调用
```python
from playwright.sync_api import sync_playwright
from modules.hcaptcha.solver import HcaptchaSolver

solver = HcaptchaSolver(model="qwen3-vl:4b")

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome", headless=False)
    page = browser.new_page()
    page.goto("https://checkin.new-api.abrdns.com/level")

    # 执行求解
    status = solver.solve(page)
    print("hCaptcha 状态:", status)
```

### 独立单元测试
```powershell
python -m unittest modules.hcaptcha.test_hcaptcha -v
```
