@echo off
chcp 936 >nul
set PYTHONIOENCODING=gbk
cd /d "%~dp0"
title WorkBuddy 猫猫旅行自动托管
echo ============================================
echo   WorkBuddy 猫猫旅行 - 自动托管(接管已登录Edge)
echo ============================================
echo.
echo 模式: 接管你已登录的 Edge，无需重复登录。
echo 将自动关闭并以调试端口重启 Edge(标签页会自动恢复)。
echo 托管在后台标签页运行，你可最小化窗口；按 Ctrl+C 停止。
echo.
python cat_bot.py --connect
echo.
echo 脚本已退出。按任意键关闭窗口...
pause >nul