@echo off
setlocal
chcp 65001 >nul
title AI-IDE-Manager

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js was not found. Install Node.js 22.5 or newer.
    pause
    exit /b 1
)

if not defined OPEN_BROWSER set "OPEN_BROWSER=1"
node --disable-warning=ExperimentalWarning --use-env-proxy "%~dp0server.js"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
    echo.
    echo [ERROR] The server stopped with exit code %EXIT_CODE%.
    pause
)

exit /b %EXIT_CODE%
