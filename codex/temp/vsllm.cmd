@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
set "HEADLESS="
set "RUN_ARG="

for /f "tokens=3" %%a in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable 2^>nul ^| findstr /I "ProxyEnable"') do set "VSLLM_PE=%%a"
for /f "tokens=2,*" %%a in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer 2^>nul ^| findstr /I "ProxyServer"') do set "VSLLM_PS=%%b"
if /I "!VSLLM_PE!"=="0x1" if defined VSLLM_PS (
  set "VSLLM_PS=!VSLLM_PS: =!"
  set "HTTPS_PROXY=http://!VSLLM_PS!"
  set "HTTP_PROXY=http://!VSLLM_PS!"
  set "NODE_USE_ENV_PROXY=1"
  echo [vsllm] using system proxy: http://!VSLLM_PS!
)

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