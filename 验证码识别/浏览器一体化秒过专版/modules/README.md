# 独立验证码识别模块集 (Independent Captcha Solvers)

本项目已将各类验证码的识别与求解能力拆解为 5 个**完全独立、零耦合、自包含**的子模块。每个模块均包含独立的核心求解逻辑、命令行入口、专属单元测试及说明文档。

## 目录结构

```
modules/
├── google_recaptcha/        # 1. Google reCAPTCHA (复选框 No-CAPTCHA 自动跳过 / 九宫格图片识别)
├── hcaptcha/                # 2. hCaptcha (3D WebGL 画布拖拽补全 / 多点目标点击 / 九宫格 / 连续多轮提交)
├── cloudflare_turnstile/    # 3. Cloudflare Turnstile (反爬检测抹除 / 自动穿透与模拟点击确认)
├── tencent_slider/          # 4. 腾讯滑块与通用滑块 (OpenCV 快速缺口识别 / 模型语义兜底 / 贝塞尔拟人拖动)
└── math_captcha/            # 5. 算术计算验证码 (ddddocr 字符提取 / 减号推导 / 本地模型计算兜底)
```

---

## 模块运行与测试一览表

| 模块目录 | 适用场景 | 命令行运行示例 | 单元测试指令 |
| :--- | :--- | :--- | :--- |
| `modules/google_recaptcha` | Google reCAPTCHA v2 / v3 | `python -m modules.google_recaptcha.run https://example.com/login --submit "#submit"` | `python -m unittest modules.google_recaptcha.test_recaptcha -v` |
| `modules/hcaptcha` | hCaptcha 画布/3D/点击 | `python -m modules.hcaptcha.run https://checkin.new-api.abrdns.com/level --submit "#level-verify-submit"` | `python -m unittest modules.hcaptcha.test_hcaptcha -v` |
| `modules/cloudflare_turnstile` | Cloudflare 5秒盾 / Turnstile | `python -m modules.cloudflare_turnstile.run https://www.hvoy.ai/ --wait 180` | `python -m unittest modules.cloudflare_turnstile.test_turnstile -v` |
| `modules/tencent_slider` | 腾讯滑块 / 各类拼图滑块 | `python -m modules.tencent_slider.run https://example.com/login --wait 180` | `python -m unittest modules.tencent_slider.test_slider -v` |
| `modules/math_captcha` | 算术计算验证码 | `python -m modules.math_captcha.run https://example.com/form --region "#captcha" --input "#ans"` | `python -m unittest modules.math_captcha.test_math -v` |

---

## 运行所有独立模块的单元测试

```powershell
python -m unittest discover -s modules -p "test_*.py" -v
```
