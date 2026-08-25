@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "NODE_CMD=node"
where node >nul 2>nul
if errorlevel 1 set "NODE_CMD=C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node.exe"
"%NODE_CMD%" growth-travel.js
echo.
pause
