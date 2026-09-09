# 腾讯滑块与通用滑块 独立识别模块

本模块专用于识别与通过 **腾讯防水墙滑块** 及各类通用拼图滑块验证码。

## 特性

- **毫秒级 OpenCV 缺口匹配**：利用局部中值平滑滤波与连通域特征快速计算缺口像素偏移量，无需等待大模型。
- **本地大模型语义兜底**：当背景复杂或 OpenCV 无法定位时，自动切换至本地 `qwen3-vl:4b` 视觉大模型执行语义空间推理。
- **三次贝塞尔拟人拖动轨迹**：模拟真实人类手指在滑块上的加速、匀速、减速过程，并加入微小的 Y 轴微抖动与释放延时，有效防止被风控系统识别为自动化脚本。

## 使用方式

### 命令行运行
```powershell
python -m modules.tencent_slider.run https://example.com/login --wait 180
```

### 代码嵌入调用
```python
from playwright.sync_api import sync_playwright
from modules.tencent_slider.solver import TencentSliderSolver

solver = TencentSliderSolver(model="qwen3-vl:4b")

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome", headless=False)
    page = browser.new_page()
    page.goto("https://example.com/login")

    # 执行滑块匹配与拖动
    status = solver.solve(page)
    print("滑块状态:", status)
```

### 独立单元测试
```powershell
python -m unittest modules.tencent_slider.test_slider -v
```
