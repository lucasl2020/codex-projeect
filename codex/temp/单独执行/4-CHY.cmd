@echo off
chcp 65001 >nul
cd /d "%~dp0.."
title 独立执行 - CHY
echo 正在单独执行：CHY ...
echo.
node "%~dp0..\services\chy.js"
echo.
echo 执行完成。按任意键退出...
pause >nul
