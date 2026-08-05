@echo off
cd /d "%~dp0"
title Daily reward tasks

where node >nul 2>nul
if errorlevel 1 goto node_missing
where npm.cmd >nul 2>nul
if errorlevel 1 goto node_missing

if not exist "node_modules\playwright-core\package.json" (
  echo First run: installing dependencies...
  call npm.cmd install
  if errorlevel 1 goto failed
)

if not exist "browser-profile" (
  echo First run: please log in to all three websites.
  node daily-rewards.js --setup
  if errorlevel 1 goto failed
)

echo.
echo Starting daily tasks. Keep this window open.
echo.
node daily-rewards.js --daemon
if errorlevel 1 goto failed
goto end

:node_missing
echo Node.js or npm was not found. Install Node.js 18 or newer first.
goto pause_end

:failed
echo.
echo Startup failed. Review the error above.

:pause_end
pause

:end