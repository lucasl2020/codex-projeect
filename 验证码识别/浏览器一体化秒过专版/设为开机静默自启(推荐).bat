@echo off
title 设置开机静默自启
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\service_daemon.ps1" -Action install_startup
echo.
pause