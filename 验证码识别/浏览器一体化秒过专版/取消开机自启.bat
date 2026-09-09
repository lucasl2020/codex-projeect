@echo off
title 取消开机自启
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\service_daemon.ps1" -Action remove_startup
echo.
pause