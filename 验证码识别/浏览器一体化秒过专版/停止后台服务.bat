@echo off
title 停止后台服务
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\service_daemon.ps1" -Action stop
echo.
pause