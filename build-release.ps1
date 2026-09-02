# =============================================================================
#  build-release.ps1 —— 一键打包所有项目为「Windows 独立运行」产物
# =============================================================================
#  用法：在项目根目录打开 PowerShell 执行：
#      powershell -NoProfile -ExecutionPolicy Bypass -File .\build-release.ps1
#  产物输出到：.\release\
#
#  说明：
#   - Python 项目  -> PyInstaller 打成单文件 exe（md5/typora/trae 签到），
#                    验证码识别打成 onedir 目录（含 ddddocr 模型，体积大）。
#   - Node 项目    -> 便携式目录：自带 node.exe，双击 start.cmd 即运行。
#                    crawler 额外内嵌 Chromium 浏览器，完全零依赖。
#   - PowerShell   -> 直接复制（Windows 自带运行时）。
#
#  首次执行需先安装打包工具与依赖（见下方「0. 准备」），
#  之后重复执行可注释掉该段以加速。
# =============================================================================

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Out  = Join-Path $Root 'release'

Write-Host "==> 清理旧产物" -ForegroundColor Cyan
if (Test-Path $Out) { Remove-Item $Out -Recurse -Force }
New-Item -ItemType Directory -Force -Path $Out | Out-Null

# =============================================================================
# 0. 准备：安装打包工具与依赖（仅首次需要）
# =============================================================================
Write-Host "==> 安装 PyInstaller 与依赖" -ForegroundColor Cyan
python -m pip install --no-cache-dir pyinstaller
python -m pip install --no-cache-dir pycryptodome
# 验证码识别所需（含 ddddocr / onnxruntime / FastAPI / CF 绕过库）
python -m pip install --no-cache-dir ddddocr fastapi "uvicorn[standard]" python-multipart curl_cffi cloudscraper DrissionPage cf-clearance

# =============================================================================
# 1. Python 项目 —— PyInstaller 打包
# =============================================================================

# ---- 1.1 md5处理程序：GUI（无控制台）+ 命令行 两个 exe ----
Write-Host "==> 打包 md5处理程序" -ForegroundColor Cyan
Push-Location "$Root\md5处理程序"
python -m PyInstaller --onefile --windowed --noconfirm --name csv_phone_to_md5_gui `
  --distpath "$Out\md5处理程序" --workpath "$Out\_pybuild\md5" --specpath "$Out\_pybuild\md5" `
  csv_phone_to_md5_gui.pyw
python -m PyInstaller --onefile --console --noconfirm --name csv_phone_to_md5 `
  --distpath "$Out\md5处理程序" --workpath "$Out\_pybuild\md5_cli" --specpath "$Out\_pybuild\md5_cli" `
  csv_phone_to_md5.py
Pop-Location

# ---- 1.2 typora-to-obsidian：GUI ----
Write-Host "==> 打包 typora-to-obsidian" -ForegroundColor Cyan
Push-Location "$Root\typora-to-obsidian"
python -m PyInstaller --onefile --windowed --noconfirm --name typora_to_obsidian `
  --distpath "$Out\typora-to-obsidian" --workpath "$Out\_pybuild\typora" --specpath "$Out\_pybuild\typora" `
  typora_to_obsidian.py
Pop-Location

# ---- 1.3 trae-auto-checkin：命令行 ----
Write-Host "==> 打包 trae-auto-checkin" -ForegroundColor Cyan
Push-Location "$Root\trae-auto-checkin"
python -m PyInstaller --onefile --console --noconfirm --name trae_checkin `
  --distpath "$Out\trae-auto-checkin" --workpath "$Out\_pybuild\trae" --specpath "$Out\_pybuild\trae" `
  trae_checkin.py
Pop-Location

# ---- 1.4 验证码识别：HTTP 服务（onedir，collect 全部重依赖）----
Write-Host "==> 打包 验证码识别 (HTTP 服务)" -ForegroundColor Cyan
$entryDir = Join-Path $Out '_pybuild'
New-Item -ItemType Directory -Force -Path $entryDir | Out-Null
$entry = Join-Path $entryDir 'captcha_server_entry.py'
@'
from cf_captcha_solver.server import server_main

if __name__ == "__main__":
    server_main()
'@ | Set-Content -Encoding UTF8 $entry

python -m PyInstaller --onedir --console --noconfirm --name cf-captcha-server `
  --paths "$Root\验证码识别\cf_captcha_solver_pkg" `
  --collect-all ddddocr --collect-all onnxruntime --collect-all curl_cffi `
  --collect-all cloudscraper --collect-all uvicorn --collect-all fastapi `
  --collect-all DrissionPage --collect-all cf_clearance `
  --hidden-import uvicorn.loops.auto --hidden-import uvicorn.protocols.http.auto `
  --hidden-import uvicorn.protocols.websockets.auto --hidden-import uvicorn.lifespan.on `
  --distpath "$Out\验证码识别" --workpath "$Out\_pybuild\captcha" --specpath "$Out\_pybuild\captcha" `
  $entry

# =============================================================================
# 2. Node 项目 —— 便携式目录（自带 node.exe）
# =============================================================================
$nodeExe = (Get-Command node -ErrorAction Stop).Source

# ---- 2.1 ai-model-tester ----
Write-Host "==> 装配 ai-model-tester（便携式）" -ForegroundColor Cyan
$dst = "$Out\ai-model-tester"; New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item $nodeExe "$dst\node.exe" -Force
Copy-Item "$Root\ai-model-tester\server.mjs" $dst -Force
Copy-Item "$Root\ai-model-tester\public" $dst -Recurse -Force
Copy-Item "$Root\ai-model-tester\config.example.json" $dst -Force
@'
@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist "%~dp0node.exe" ( echo [ERROR] node.exe missing. & pause & exit /b 1 )
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
exit /b %ERRORLEVEL%
'@ | Set-Content -Encoding ASCII "$dst\start.cmd"

$nodeRoot = Split-Path $nodeExe -Parent
$aiStartPs1 = @"
`$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath `$PSScriptRoot
`$nodeExe = Join-Path `$PSScriptRoot 'node.exe'
if (-not (Test-Path -LiteralPath `$nodeExe)) { Write-Host 'node.exe not found.' -ForegroundColor Red; exit 1 }
if (-not `$env:PORT) { `$env:PORT = '8787' }
Write-Host 'Starting AI model tester (port '`$env:PORT')...' -ForegroundColor Cyan
`$psi = New-Object System.Diagnostics.ProcessStartInfo
`$psi.FileName = `$nodeExe
`$psi.Arguments = 'server.mjs'
`$psi.WorkingDirectory = `$PSScriptRoot
`$psi.UseShellExecute = `$false
`$psi.RedirectStandardOutput = `$true
`$psi.RedirectStandardError = `$true
`$proc = New-Object System.Diagnostics.Process
`$proc.StartInfo = `$psi
[void]`$proc.Start()
`$url = `$null
`$deadline = (Get-Date).AddSeconds(12)
while ((-not `$proc.HasExited) -and ((Get-Date) -lt `$deadline) -and (-not `$url)) {
  if (-not `$proc.StandardOutput.EndOfStream) { `$l = `$proc.StandardOutput.ReadLine(); if (`$l) { Write-Host `$l; if (`$l -match 'https?://127\.0\.0\.1:\d+') { `$url = `$Matches[0] } } }
  if (-not `$proc.StandardError.EndOfStream) { `$l = `$proc.StandardError.ReadLine(); if (`$l) { Write-Host `$l; if (`$l -match 'https?://127\.0\.0\.1:\d+') { `$url = `$Matches[0] } } }
  if (-not `$url) { Start-Sleep -Milliseconds 100 }
}
if (`$proc.HasExited) { Write-Host 'Start failed.' -ForegroundColor Red; exit 1 }
if (`$url) { Write-Host "Open: `$url" -ForegroundColor Green; try { Start-Process `$url | Out-Null } catch {} }
Write-Host 'Press Ctrl+C to stop.' -ForegroundColor DarkGray
try {
  while (-not `$proc.HasExited) {
    if (-not `$proc.StandardOutput.EndOfStream) { `$l = `$proc.StandardOutput.ReadLine(); if (`$l) { Write-Host `$l } }
    if (-not `$proc.StandardError.EndOfStream) { `$l = `$proc.StandardError.ReadLine(); if (`$l) { Write-Host `$l } }
    Start-Sleep -Milliseconds 120
  }
} finally { if (-not `$proc.HasExited) { try { `$proc.Kill() } catch {} } }
exit `$proc.ExitCode
"@
Set-Content -Encoding UTF8 "$dst\start.ps1" $aiStartPs1

# ---- 2.2 workbuddy派遣 ----
Write-Host "==> 装配 workbuddy派遣（便携式）" -ForegroundColor Cyan
$dst = "$Out\workbuddy派遣"; New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item $nodeExe "$dst\node.exe" -Force
Copy-Item "$Root\workbuddy派遣\growth-travel.js" $dst -Force
@'
@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist "%~dp0node.exe" ( echo [ERROR] node.exe missing. & pause & exit /b 1 )
"%~dp0node.exe" growth-travel.js %*
echo.
pause
'@ | Set-Content -Encoding ASCII "$dst\start.cmd"

# ---- 2.3 crawler：便携式 + 内嵌 Chromium ----
Write-Host "==> 装配 crawler（便携式，内嵌浏览器）" -ForegroundColor Cyan
$dst = "$Out\crawler"; New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item $nodeExe "$dst\node.exe" -Force
foreach ($it in @('src','scripts','public')) {
  if (Test-Path "$Root\crawler\$it") { Copy-Item "$Root\crawler\$it" $dst -Recurse -Force }
}
Copy-Item "$Root\crawler\package.json" $dst -Force
Copy-Item "$Root\crawler\package-lock.json" $dst -Force
New-Item -ItemType Directory -Force -Path "$dst\data" | Out-Null
if (Test-Path "$Root\crawler\data\seed-urls.txt") { Copy-Item "$Root\crawler\data\seed-urls.txt" "$dst\data" -Force }
Write-Host "    复制 node_modules ..." -ForegroundColor DarkGray
robocopy "$Root\crawler\node_modules" "$dst\node_modules" /E /NFL /NDL /NJH /NP | Out-Null
Write-Host "    复制 Playwright Chromium ..." -ForegroundColor DarkGray
$pw = Join-Path $env:USERPROFILE 'AppData\Local\ms-playwright'
New-Item -ItemType Directory -Force -Path "$dst\ms-playwright" | Out-Null
if (Test-Path $pw) {
  Get-ChildItem $pw -Directory | Where-Object { $_.Name -match '^(chromium|chromium_headless_shell|ffmpeg|winldd)-' } | ForEach-Object {
    robocopy $_.FullName "$dst\ms-playwright\$($_.Name)" /E /NFL /NDL /NJH /NP | Out-Null
  }
}
@'
@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Card Shop Manager
chcp 65001 >nul
if not exist "%~dp0node.exe" ( echo [ERROR] node.exe missing. & pause & exit /b 1 )
set "PLAYWRIGHT_BROWSERS_PATH=%~dp0ms-playwright"
set CARD_SHOP_OPEN=1
echo Starting Card Shop Manager (bundled Node.js + Chromium)...
"%~dp0node.exe" "%~dp0scripts\one-click.mjs"
set ERR=%ERRORLEVEL%
if not "%ERR%"=="0" ( echo. & echo [ERROR] Start failed, exit code %ERR% & pause )
exit /b %ERR%
'@ | Set-Content -Encoding ASCII "$dst\start.cmd"

# =============================================================================
# 3. PowerShell 项目 —— 直接复制（Windows 自带）
# =============================================================================
Write-Host "==> 复制 显示codex配置信息" -ForegroundColor Cyan
$dst = "$Out\显示codex配置信息"; New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item "$Root\显示codex配置信息\view-codex-config.cmd" $dst -Force
Copy-Item "$Root\显示codex配置信息\view_codex.ps1" $dst -Force

# =============================================================================
# 4. 清理 PyInstaller 中间产物
# =============================================================================
Write-Host "==> 清理临时构建目录" -ForegroundColor Cyan
if (Test-Path "$Out\_pybuild") { Remove-Item "$Out\_pybuild" -Recurse -Force }

Write-Host ""
Write-Host "完成！产物在：$Out" -ForegroundColor Green