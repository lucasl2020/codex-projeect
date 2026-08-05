@echo off
cd /d "%~dp0"
title Re-login daily reward websites

where node >nul 2>nul
if errorlevel 1 goto node_missing
where npm.cmd >nul 2>nul
if errorlevel 1 goto node_missing

if not exist "node_modules\playwright-core\package.json" (
  echo Installing dependencies...
  call npm.cmd install
  if errorlevel 1 goto failed
)

node daily-rewards.js --setup
if errorlevel 1 goto failed

echo.
echo Login session saved. Double-click the daily launcher next time.
goto pause_end

:node_missing
echo Node.js or npm was not found. Install Node.js 18 or newer first.
goto pause_end

:failed
echo.
echo Login setup failed. Review the error above.

:pause_end
pause