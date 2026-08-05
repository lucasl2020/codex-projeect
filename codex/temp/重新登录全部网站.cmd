@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 重新登录全部每日任务网站

where node >nul 2>nul
if errorlevel 1 goto node_missing
where npm.cmd >nul 2>nul
if errorlevel 1 goto node_missing

if not exist "node_modules\playwright-core\package.json" (
  echo 正在安装依赖...
  call npm.cmd install
  if errorlevel 1 goto failed
)

node daily-rewards-v2.js --setup
if errorlevel 1 goto failed

echo.
echo 全部网站登录会话已保存。之后可双击“ 一键执行每日签到（显示结果）.cmd ”。
goto pause_end

:node_missing
echo 未找到 Node.js 或 npm，请先安装 Node.js 18 或更高版本。
goto pause_end

:failed
echo.
echo 登录初始化失败，请查看上方错误信息。

:pause_end
pause
