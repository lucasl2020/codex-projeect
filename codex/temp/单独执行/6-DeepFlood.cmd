@echo off
chcp 65001 >nul
cd /d "%~dp0.."
title 独立执行 - DeepFlood
echo 正在单独执行：DeepFlood ...
echo.
node "%~dp0..\services\deepflood.js"
echo.
echo 执行完成。按任意键退出...
pause >nul
