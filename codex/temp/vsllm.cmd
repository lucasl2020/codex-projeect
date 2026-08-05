@echo off
setlocal
cd /d "%~dp0"
set "HEADLESS="
set "RUN_ARG="

if not exist "node_modules\playwright-core\package.json" (
  echo Installing dependency...
  call npm.cmd install
  if errorlevel 1 exit /b 1
)

if /I "%~1"=="login" goto login
if /I "%~2"=="login" goto login
if /I "%~1"=="headless" set "HEADLESS=1"
if /I "%~2"=="headless" set "HEADLESS=1"
if /I "%~1"=="once" set "RUN_ARG=--once"
if /I "%~2"=="once" set "RUN_ARG=--once"

node "vsllm-rewards.cjs" %RUN_ARG%
exit /b

:login
set "HEADLESS="
node "vsllm-rewards.cjs" --login
exit /b
