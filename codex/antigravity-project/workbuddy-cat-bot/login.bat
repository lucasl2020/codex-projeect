@echo off
chcp 936 >nul
set PYTHONIOENCODING=gbk
cd /d "%~dp0"
title WorkBuddy 一次性登录(仅无头模式需要)
echo ============================================
echo   WorkBuddy 猫猫旅行 - 一次性登录
echo ============================================
echo.
echo 仅当你要用"无头后台模式(--run)"时才需要本步。
echo 将打开 Edge 窗口，请登录 WorkBuddy 账号。
echo 登录完成后关闭该窗口即保存登录态。
echo.
python cat_bot.py --login
echo.
echo 登录已保存。按任意键关闭窗口...
pause >nul