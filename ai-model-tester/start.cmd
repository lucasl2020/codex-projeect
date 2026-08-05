@echo off
setlocal EnableExtensions
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] node not found. Install Node.js and add it to PATH.
  pause
  exit /b 1
)

if not defined PORT set PORT=8787

echo Starting AI model tester...
echo Default port: %PORT%  (auto switch if busy)

REM One-click via PowerShell wrapper (opens browser + keeps console)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
set EXITCODE=%ERRORLEVEL%
if not "%EXITCODE%"=="0" (
  echo.
  echo Start failed. You can also run:
  echo   set PORT=%PORT%
  echo   node server.mjs
  pause
)
exit /b %EXITCODE%
