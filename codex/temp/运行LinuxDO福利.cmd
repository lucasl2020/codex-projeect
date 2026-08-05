@echo off
setlocal
cd /d "%~dp0"

if /i "%~1"=="--check" (
  echo [OK] Batch file parsed successfully.
  exit /b 0
)

if not exist "linuxdo-benefits.user.js" (
  echo [ERROR] linuxdo-benefits.user.js was not found.
  goto end
)

echo [INFO] Opening LinuxDO in the normal default browser...
echo [INFO] Tampermonkey or Violentmonkey must contain and enable linuxdo-benefits.user.js v1.9.1.
echo [INFO] The extension must be installed in this same default browser and LinuxDO must already be logged in.
start "" "https://linux.do/c/welfare/36/l/latest?linuxdo_benefits_authenticated=1#linuxdo-benefits-authenticated"
echo [INFO] Complete Cloudflare manually if it appears. The scan starts or resumes after the forum page loads.
echo [INFO] The scan uses the current logged-in tab, waits 5 seconds per page, pauses every 20 topics, and reads at most 200 topics.
echo [CHECK] A green scan button and a visible status containing "v1.9.1" must appear on the page.
echo [CHECK] If neither appears, update or enable the userscript in Tampermonkey/Violentmonkey; this CMD cannot inject JavaScript by itself.

:end
echo.
pause
endlocal