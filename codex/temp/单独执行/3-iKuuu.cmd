@echo off
chcp 65001 >nul
cd /d "%~dp0.."
title 独立执行 - iKuuu
echo 正在单独执行：iKuuu ...
echo.
node "%~dp0..\services\ikuuu.js"
echo.
echo 执行完成。按任意键退出...
pause >nul
