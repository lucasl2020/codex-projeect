@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title Card Shop Manager
echo ========================================
echo   Card Shop Manager - One Click Start
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] node not found. Please install Node.js 20+
  echo Download: https://nodejs.org/
  pause
  exit /b 1
)

echo Starting service...
echo If the default port is busy, a free port will be used.
echo.

set CARD_SHOP_OPEN=1
node "%~dp0scripts\one-click.mjs"
set ERR=%ERRORLEVEL%
if not "%ERR%"=="0" (
  echo.
  echo [ERROR] Start failed, exit code %ERR%
  pause
)
exit /b %ERR%