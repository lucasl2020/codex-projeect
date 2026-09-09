@echo off
title ·þÎñ×´Ì¬¼ì²â
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\service_daemon.ps1" -Action status
echo.
pause
