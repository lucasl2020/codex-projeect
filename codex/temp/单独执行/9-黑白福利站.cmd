@echo off
chcp 65001 >nul
cd /d "%~dp0.."
title 独立执行 - 黑白福利站
echo 正在单独执行：黑白福利站 ...
echo.
node "%~dp0..\services\hybgzs.js"
echo.
echo 执行完成。按任意键退出...
pause >nul
