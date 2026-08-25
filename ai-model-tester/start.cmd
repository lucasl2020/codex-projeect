@echo off
:: 强制设置控制台编码为 UTF-8，解决中文乱码
chcp 65001 >nul

setlocal EnableExtensions
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] 未找到 node。请安装 Node.js 并将其添加到 PATH 环境变量中。
  pause
  exit /b 1
)

if not defined PORT set PORT=8787

echo 正在启动 AI 模型测试器...
echo 默认端口: %PORT% (如果被占用将自动切换)

REM 通过 PowerShell 脚本一键启动（打开浏览器并保持控制台运行）
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
set EXITCODE=%ERRORLEVEL%
if not "%EXITCODE%"=="0" (
  echo.
  echo 启动失败。您也可以手动运行以下命令：
  echo   set PORT=%PORT%
  echo   node server.mjs
  pause
)
exit /b %EXITCODE%
