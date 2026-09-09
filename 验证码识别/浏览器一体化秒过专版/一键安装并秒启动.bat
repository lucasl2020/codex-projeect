@echo off
title 本地验证码助手 - 浏览器一体化专版
echo ================================================================
echo       本地验证码助手 - 浏览器一体化专版 (极速启动)
echo ================================================================
echo.
cd /d "%~dp0"

echo [1/3] 正在启动后台静默服务 (无CMD黑框)...
cscript //nologo "启动后台静默服务(无黑框).vbs"
echo [OK] 后台服务已就绪 (127.0.0.1:8765 与 127.0.0.1:11434)。
echo.

echo [2/3] 正在定位 Google Chrome 浏览器...
set "EXT_PATH=%~dp0chrome_extension"
set "CHROME_EXE="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_EXE if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_EXE if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"

echo [3/3] 正在打开 Chrome 并自动挂载一体化插件...
if defined CHROME_EXE (
    start "" "%CHROME_EXE%" --load-extension="%EXT_PATH%" "chrome://extensions"
    echo.
    echo ================================================================
    echo  【一体化启动成功】
    echo  1. Chrome 已打开，右上角已显示【本地验证码助手】盾牌图标；
    echo  2. 建议点击扩展拼图图标，把【本地验证码助手】点击【固定】到工具栏；
    echo  3. 以后正常上网，遇到 Google、Cloudflare、hCaptcha 自动秒过！
    echo ================================================================
) else (
    echo [提示] 未找到 Chrome 默认路径。
    echo 请打开你的 Chrome / Edge，访问 chrome://extensions/，开启【开发者模式】，
    echo 点击【加载已解压的扩展程序】，选择本目录下的 chrome_extension 文件夹即可。
)
echo.
pause