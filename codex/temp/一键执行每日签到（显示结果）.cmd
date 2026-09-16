@echo off
chcp 65001 >nul
set "ROOT=%~dp0"
cd /d "%ROOT%"
title 每日任务签到 - 一键执行（显示结果）

set "SCRIPT=%ROOT%daily-rewards-v2.js"
if not exist "%SCRIPT%" goto script_missing

where node >nul 2>nul
if errorlevel 1 goto node_missing
where npm.cmd >nul 2>nul
if errorlevel 1 goto node_missing

if not exist "%ROOT%node_modules\playwright-core\package.json" (
  echo 正在安装运行依赖...
  call npm.cmd install
  if errorlevel 1 goto failed
)

if not exist "%ROOT%browser-profile" (
  echo 首次运行：请先登录各个站点。
  node "%SCRIPT%" --setup
  if errorlevel 1 goto failed
)

echo.
node "%SCRIPT%" --once
set "TASK_EXIT=%ERRORLEVEL%"
echo.
if not "%TASK_EXIT%"=="0" echo 一个或多个任务执行异常，详情见上方输出。
if "%TASK_EXIT%"=="0" echo 所有已启用的默认任务均执行成功或今日已完成。
echo.
echo 执行完毕，请按任意键退出或直接关闭本窗口。
pause
exit /b %TASK_EXIT%

:script_missing
echo 未找到主执行脚本: "%SCRIPT%"
goto pause_end

:node_missing
echo 未找到 Node.js 或 npm，请先安装 Node.js 18 或更高版本。
goto pause_end

:failed
echo.
echo 启动环境初始化失败。

:pause_end
pause
