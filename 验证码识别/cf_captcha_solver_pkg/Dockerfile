# ============================================================
# Dockerfile - cf-captcha-solver HTTP API 服务
# ============================================================
# 构建:   docker build -t cf-captcha-solver .
# 运行:   docker run -d -p 8000:8000 cf-captcha-solver
# 访问:   http://localhost:8000/docs
# ============================================================

FROM python:3.11-slim

# 系统依赖（ddddocr 需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libglib2.0-0 libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制包文件
COPY pyproject.toml README.md ./
COPY cf_captcha_solver/ ./cf_captcha_solver/

# 安装（含验证码 + HTTP 服务）
RUN pip install --no-cache-dir ".[captcha,server]"

# 暴露端口
EXPOSE 8000

# 启动 HTTP API 服务
CMD ["uvicorn", "cf_captcha_solver.server:app", \
     "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
