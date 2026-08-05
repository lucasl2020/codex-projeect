@echo off
chcp 65001 >nul
set "ROOT=%~dp0"
cd /d "%ROOT%"
title Daily Rewards - Results

set "SCRIPT=%ROOT%daily-rewards-v2.js"
echo Using script: "%SCRIPT%"
if not exist "%SCRIPT%" goto script_missing

where node >nul 2>nul
if errorlevel 1 goto node_missing
where npm.cmd >nul 2>nul
if errorlevel 1 goto node_missing

if not exist "%ROOT%node_modules\playwright-core\package.json" (
  echo Installing dependencies...
  call npm.cmd install
  if errorlevel 1 goto failed
)

if not exist "%ROOT%browser-profile" (
  echo First run: please log in to all six websites.
  node "%SCRIPT%" --setup
  if errorlevel 1 goto failed
)

echo.
echo Running daily rewards once with daily-rewards-v2.js...
echo.
node "%SCRIPT%" --once
set "TASK_EXIT=%ERRORLEVEL%"
echo.
if not "%TASK_EXIT%"=="0" echo One or more tasks failed. See the result above.
if "%TASK_EXIT%"=="0" echo All tasks succeeded or were already completed today.
echo.
echo Finished. Review the result above, then close this window manually.
pause
exit /b %TASK_EXIT%

:script_missing
echo The updated script was not found: "%SCRIPT%"
goto pause_end

:node_missing
echo Node.js or npm was not found. Install Node.js 18 or newer first.
goto pause_end

:failed
echo.
echo Startup failed. See the error above.

:pause_end
pause