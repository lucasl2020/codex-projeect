@echo off
chcp 65001 >nul
title 本地验证码助手 - 一键安装与启动器
echo ================================================================
echo           本地验证码自动化识别系统 - 一键启动器
echo ================================================================
echo.

cd /d "%~dp0"

echo [1/4] 正在检测 Python 环境...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python，请先安装 Python 3.10+ 并添加到环境变量。
    pause
    exit /b 1
)
echo [✓] Python 环境检测正常。
echo.

echo [2/4] 正在确保后台离线大模型服务就绪 (Ollama + Qwen3-VL:4b)...
powershell -ExecutionPolicy Bypass -File ".\启动本地模型.ps1"
echo.

echo [3/4] 正在启动扩展专属本地桥接服务 (127.0.0.1:8765)...
powershell -Command "if (-not (Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*local_bridge.py*' })) { Start-Process python -ArgumentList 'local_bridge.py' -WindowStyle Hidden }"
timeout /t 2 /nobreak >nul
echo [✓] 本地桥接服务已在后台静默运行。
echo.

echo [4/4] 正在拉起 Google Chrome 并自动装载扩展程序...
set "EXT_PATH=%~dp0chrome_extension"
set "CHROME_EXE="

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_EXE if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_EXE if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if defined CHROME_EXE (
    echo [✓] 找到 Chrome: "%CHROME_EXE%"
    echo [✓] 自动注入加载扩展: "%EXT_PATH%"
    start "" "%CHROME_EXE%" --load-extension="%EXT_PATH%" "chrome://extensions"
    echo.
    echo ================================================================
    echo  [成功] 浏览器已自动打开并装载【本地离线验证码自动通过】扩展！
    echo  右上角已出现扩展图标，日常上网浏览时遇到验证码将自动识别并通过。
    echo ================================================================
) else (
    echo [提示] 未能自动定位 Chrome 默认路径。
    echo 请打开 Chrome/Edge 访问 chrome://extensions/，开启【开发者模式】，
    echo 点击【加载已解压的扩展程序】，选择本项目下的 chrome_extension 文件夹即可。
)

echo.
pause
