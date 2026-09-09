# recaptcha_vlm

用**视觉大模型（VLM）**自动求解 Google reCAPTCHA v2 的 3x3 图片语义题
（"Select all images with taxis" 这类）。

本模块独立于 `captcha_solver.py` / `cf_captcha_solver_pkg`，不侵入现有代码。
识别后端为 OpenAI 兼容的视觉模型，默认对接**智谱开放平台免费档 `glm-4.6v-flash`**，
换平台只需改 `config.json`。

## 目录结构

```
recaptcha_vlm/
├── config.json          # API 配置（需自行填入 api_key）
├── config.example.json  # 配置模板
├── provider.py          # OpenAI 兼容 VLM HTTP 客户端
├── solver.py            # RecaptchaVlmSolver：题目+tiles → 需点击的格子索引
├── server.py            # 本地 FastAPI 服务（供 Chrome 扩展/脚本调用）
└── test_recaptcha_vlm.py# 离线单测 + 真实 API 冒烟
```

## 快速开始

### 1. 配置 API Key

编辑 `config.json`（已加入 .gitignore 不入库；`config.example.json` 为可入库模板）：

```json
{
  "api": {
    "base_url": "https://open.bigmodel.cn/api/paas/v4",
    "api_key": "这里粘贴你的智谱API Key",
    "model": "glm-4.6v-flash",
    "timeout": 60,
    "max_tokens": 200
  },
  "solve": {
    "mode": "grid",
    "max_retries": 2
  }
}
```

- 到 https://open.bigmodel.cn 注册 → 「API 密钥」创建 Key
- 免费视觉模型：`glm-4.6v-flash`（官方 $0 免费档，支持图片输入）
- 免费档识别率不足时可换付费 `glm-4.6v`（约 ¥1-3/百万 token，单题成本可忽略）
- 换其他 OpenAI 兼容平台（如 Agnes `apihub.agnes-ai.cn/v1`）只需改 `base_url`/`model`/`api_key`

### 2. 离线自测（无需 key）

```bash
python test_recaptcha_vlm.py --mock
```

### 3. 真实识别冒烟（需 key）

```bash
python test_recaptcha_vlm.py --real --target red
# 期望命中 0-based 索引 [2, 4]
```

### 4. 启动 HTTP 服务

```bash
# 在验证码识别/ 根目录下运行（纯标准库实现，零额外依赖）
python -m recaptcha_vlm.server --port 8765
```

## API

```
POST http://127.0.0.1:8765/recaptcha/solve
Content-Type: application/json

{
  "prompt": "Select all images with taxis",   # 题目原文
  "tiles": ["<base64 png>", ... 9张],          # 按 DOM 顺序的 tile 图
  "mode": "grid"                               # grid(默认,1次请求) / tile(逐格9次)
}
```

响应：

```json
{ "success": true, "tiles": [0, 4, 7], "details": {}, "error": "" }
```

- `tiles` 为 **0-based** 格子索引，扩展/脚本直接据此点击对应 tile
- `grid` 模式服务端自动把 9 张图拼成 3x3 大图并在每格左上角画 1-9 编号角标，交给 VLM 一次判断
- `tile` 模式逐格问 YES/NO 后聚合，更稳但慢

## 设计说明

- `solve` 的两种模式与重试策略、超时等都在 `config.json` 可调
- 题目文本会自动抽取目标名词短语（如 "taxis"），减少模型歧义
- 模型输出用宽松正则解析 `[1,3,5]`，自动去重、剔除越界编号，输出不规范也不崩
- 结果统一转 0-based，与 DOM / JS 数组天然对齐
