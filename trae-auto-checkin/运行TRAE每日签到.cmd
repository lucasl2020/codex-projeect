@echo off
chcp 65001 >nul
setlocal
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
title TRAE Work CN Daily Check-in

cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python was not found. Install Python and add it to PATH.
    echo.
    pause
    exit /b 1
)

python "%~dp0trae_checkin.py"
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" (
    python -c "print('[\u5931\u8d25] \u7b7e\u5230\u811a\u672c\u6267\u884c\u5931\u8d25\uff0c\u8bf7\u67e5\u770b\u4e0a\u65b9\u9519\u8bef\u4fe1\u606f\u3002')"
) else (
    python -c "print('[\u5b8c\u6210] \u6267\u884c\u7ed3\u675f\u3002')"
)
echo.
pause
exit /b %EXIT_CODE%