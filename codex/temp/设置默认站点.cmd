@echo off
chcp 65001 >nul
set "ROOT=%~dp0"
cd /d "%ROOT%"
title 设置默认签到站点
echo.
node "%ROOT%daily-rewards-v2.js" --list-tasks
echo.
set "INPUT="
set /p "INPUT=请输入要默认执行的编号（逗号分开，可多选；留空或 0 = 恢复全部）："
set "INPUT=%INPUT: =%"
if not defined INPUT goto clear
if "%INPUT%"=="0" goto clear
node "%ROOT%daily-rewards-v2.js" --set-default-tasks "%INPUT%"
goto end
:clear
node "%ROOT%daily-rewards-v2.js" --clear-default-tasks
:end
echo.
pause

