@echo off
chcp 65001 >nul
cd /d "%~dp0.."
title 独立执行 - 禾维AI
echo 正在单独执行：禾维AI ...
echo.
node "%~dp0..\services\hvoy.js"
echo.
echo 执行完成。按任意键退出...
pause >nul
