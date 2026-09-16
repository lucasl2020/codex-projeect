# =============================================================================
#  build-release.ps1 —— 一键打包所有项目为「Windows 独立运行」产物
# =============================================================================
#  用法：在项目根目录打开 PowerShell 执行：
#      powershell -NoProfile -ExecutionPolicy Bypass -File .\build-release.ps1
#
#  参数：
#      -IncludeCaptcha  是否打包「验证码识别」重依赖服务（默认排除）
#      -CreateZip       是否生成 release-packages\Codex-Tools-Portable.zip（默认开启）
#
#  产物输出到：.\release\
#
#  说明：
#   - 统一启动器   -> Codex工具箱.exe（桌面卡片式管理中心，单文件 exe，零外部依赖）
#   - Python 项目  -> PyInstaller 打成单文件 exe（md5/typora/trae 签到）。
#   - Node 项目    -> 便携式目录：自带 node.exe，双击 start.cmd 即运行。
#                    crawler 额外内嵌 Chromium 浏览器，完全零依赖。
#   - PowerShell   -> 直接复制（Windows 自带运行时）。
# =============================================================================

[CmdletBinding()]
param(
    [switch]$IncludeCaptcha = $false,
    [switch]$CreateZip = $true
)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Out  = Join-Path $Root 'release'

Write-Host "==> 清理旧产物" -ForegroundColor Cyan
if (Test-Path $Out) {
    # 尝试安全清理，如果锁定了则清理非锁定项
    try {
        Remove-Item $Out -Recurse -Force
    } catch {
        Write-Warning "部分文件被占用，尝试逐项清理：$_"
        Get-ChildItem $Out | ForEach-Object {
            try { Remove-Item $_.FullName -Recurse -Force } catch {}
        }
    }
}
New-Item -ItemType Directory -Force -Path $Out | Out-Null

# =============================================================================
# 0. 准备：检查打包工具与依赖
# =============================================================================
Write-Host "==> 检查 PyInstaller 与 pycryptodome 依赖" -ForegroundColor Cyan
python -c "import PyInstaller" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "    安装 PyInstaller ..." -ForegroundColor DarkGray
    python -m pip install --no-cache-dir pyinstaller
}
python -c "import Crypto" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "    安装 pycryptodome ..." -ForegroundColor DarkGray
    python -m pip install --no-cache-dir pycryptodome
}

if ($IncludeCaptcha) {
    Write-Host "==> 安装 验证码识别 所需重依赖（含 ddddocr / onnxruntime / FastAPI / CF 绕过库）" -ForegroundColor Cyan
    python -m pip install --no-cache-dir ddddocr fastapi "uvicorn[standard]" python-multipart curl_cffi cloudscraper DrissionPage cf-clearance
}

# =============================================================================
# 1. 统一启动器 —— Codex 工具箱
# =============================================================================
Write-Host "==> 打包 Codex 工具箱（统一桌面启动器）" -ForegroundColor Cyan
Push-Location "$Root"
python -m PyInstaller --onefile --windowed --noconfirm --name "Codex工具箱" `
  --distpath "$Out" --workpath "$Out\_pybuild\launcher" --specpath "$Out\_pybuild\launcher" `
  launcher.py
Pop-Location

# 写入一键启动便捷批处理
@'
@echo off
start "" "%~dp0Codex工具箱.exe"
'@ | Set-Content -Encoding ASCII "$Out\一键启动工具箱.cmd"

# =============================================================================
# 2. Python 项目 —— PyInstaller 打包
# =============================================================================

# ---- 2.1 md5处理程序：GUI（无控制台）+ 命令行 两个 exe ----
Write-Host "==> 打包 md5处理程序" -ForegroundColor Cyan
Push-Location "$Root\md5处理程序"
python -m PyInstaller --onefile --windowed --noconfirm --name csv_phone_to_md5_gui `
  --distpath "$Out\md5处理程序" --workpath "$Out\_pybuild\md5" --specpath "$Out\_pybuild\md5" `
  csv_phone_to_md5_gui.pyw
python -m PyInstaller --onefile --console --noconfirm --name csv_phone_to_md5 `
  --distpath "$Out\md5处理程序" --workpath "$Out\_pybuild\md5_cli" --specpath "$Out\_pybuild\md5_cli" `
  csv_phone_to_md5.py
Pop-Location

# ---- 2.2 typora-to-obsidian：GUI ----
Write-Host "==> 打包 typora-to-obsidian" -ForegroundColor Cyan
Push-Location "$Root\typora-to-obsidian"
python -m PyInstaller --onefile --windowed --noconfirm --name typora_to_obsidian `
  --distpath "$Out\typora-to-obsidian" --workpath "$Out\_pybuild\typora" --specpath "$Out\_pybuild\typora" `
  typora_to_obsidian.py
Pop-Location

# ---- 2.3 trae-auto-checkin：命令行 ----
Write-Host "==> 打包 trae-auto-checkin" -ForegroundColor Cyan
Push-Location "$Root\trae-auto-checkin"
python -m PyInstaller --onefile --console --noconfirm --name trae_checkin `
  --distpath "$Out\trae-auto-checkin" --workpath "$Out\_pybuild\trae" --specpath "$Out\_pybuild\trae" `
  trae_checkin.py
Pop-Location

# ---- 2.4 验证码识别：默认跳过（根据参数判断）----
if ($IncludeCaptcha) {
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
} else {
    Write-Host "==> 跳过 验证码识别 打包（已排除）" -ForegroundColor Yellow
}

# =============================================================================
# 3. Node 项目 —— 便携式目录（自带 node.exe）
# =============================================================================
# 用系统安装的 Node（Machine/User PATH），避免当前终端把错误版本打进产物
$sysDirs = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
$nodeExe = ($sysDirs -split ';' | Where-Object { $_ } | ForEach-Object { Join-Path $_.TrimEnd('\') 'node.exe' } | Where-Object { Test-Path $_ } | Select-Object -First 1)
if (-not $nodeExe) { $nodeExe = (Get-Command node -ErrorAction Stop).Source }

# ---- 3.1 ai-model-tester ----
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

$aiStartPs1 = @'
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodeExe = Join-Path $PSScriptRoot 'node.exe'
if (-not (Test-Path -LiteralPath $nodeExe)) { Write-Host 'node.exe not found.' -ForegroundColor Red; exit 1 }
if (-not $env:PORT) { $env:PORT = '8787' }
Write-Host "Starting AI model tester (port $env:PORT)..." -ForegroundColor Cyan
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $nodeExe
$psi.Arguments = 'server.mjs'
$psi.WorkingDirectory = $PSScriptRoot
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$proc = New-Object System.Diagnostics.Process
$proc.StartInfo = $psi
[void]$proc.Start()
$url = $null
$deadline = (Get-Date).AddSeconds(12)
while ((-not $proc.HasExited) -and ((Get-Date) -lt $deadline) -and (-not $url)) {
  if (-not $proc.StandardOutput.EndOfStream) { $l = $proc.StandardOutput.ReadLine(); if ($l) { Write-Host $l; if ($l -match 'https?://127\.0\.0\.1:\d+') { $url = $Matches[0] } } }
  if (-not $proc.StandardError.EndOfStream) { $l = $proc.StandardError.ReadLine(); if ($l) { Write-Host $l; if ($l -match 'https?://127\.0\.0\.1:\d+') { $url = $Matches[0] } } }
  if (-not $url) { Start-Sleep -Milliseconds 100 }
}
if ($proc.HasExited) { Write-Host 'Start failed.' -ForegroundColor Red; exit 1 }
if ($url) { Write-Host "Open: $url" -ForegroundColor Green; try { Start-Process $url | Out-Null } catch {} }
Write-Host 'Press Ctrl+C to stop.' -ForegroundColor DarkGray
try {
  while (-not $proc.HasExited) {
    if (-not $proc.StandardOutput.EndOfStream) { $l = $proc.StandardOutput.ReadLine(); if ($l) { Write-Host $l } }
    if (-not $proc.StandardError.EndOfStream) { $l = $proc.StandardError.ReadLine(); if ($l) { Write-Host $l } }
    Start-Sleep -Milliseconds 120
  }
} finally { if (-not $proc.HasExited) { try { $proc.Kill() } catch {} } }
exit $proc.ExitCode
'@
Set-Content -Encoding UTF8 "$dst\start.ps1" $aiStartPs1

# ---- 3.2 workbuddy派遣 ----
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

# ---- 3.3 crawler：便携式 + 内嵌 Chromium ----
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
  $matched = Get-ChildItem $pw -Directory | Where-Object { $_.Name -match '^(chromium|chromium_headless_shell|ffmpeg|winldd)-' }
  $crDirs = $matched | Where-Object { $_.Name -match '^chromium-\d+' } | Sort-Object Name -Descending | Select-Object -First 1
  $crHeadlessDirs = $matched | Where-Object { $_.Name -match '^chromium_headless_shell-\d+' } | Sort-Object Name -Descending | Select-Object -First 1
  $otherDirs = $matched | Where-Object { $_.Name -match '^(ffmpeg|winldd)-' }
  @($crDirs, $crHeadlessDirs, $otherDirs) | Where-Object { $_ } | ForEach-Object {
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

# ---- 3.4 antigravity-trae-manager ----
Write-Host "==> 装配 antigravity-trae-manager（便携式）" -ForegroundColor Cyan
$dst = "$Out\antigravity-trae-manager"; New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item $nodeExe "$dst\node.exe" -Force
foreach ($it in @('lib','public','data','server.js','cli.js','package.json')) {
  if (Test-Path "$Root\antigravity-trae-manager\$it") { Copy-Item "$Root\antigravity-trae-manager\$it" $dst -Recurse -Force }
}
@'
@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist "%~dp0node.exe" ( echo [ERROR] node.exe missing. & pause & exit /b 1 )
title AI-IDE-Manager 控制台 (19999)
echo 正在启动 AI-IDE-Manager (http://127.0.0.1:19999)...
start "" "http://127.0.0.1:19999"
"%~dp0node.exe" server.js
pause
'@ | Set-Content -Encoding ASCII "$dst\start.cmd"

# =============================================================================
# 4. 原生/通用工具与文档项目 —— 直接复制（Windows 自带或独立免环境）
# =============================================================================
Write-Host "==> 复制 显示codex配置信息" -ForegroundColor Cyan
$dst = "$Out\显示codex配置信息"; New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item "$Root\显示codex配置信息\view-codex-config.cmd" $dst -Force
Copy-Item "$Root\显示codex配置信息\view_codex.ps1" $dst -Force

Write-Host "==> 复制 port_manager（原生 C# WPF + 脚本）" -ForegroundColor Cyan
$dst = "$Out\port_manager"; New-Item -ItemType Directory -Force -Path $dst | Out-Null
if (Test-Path "$Root\port_manager\windows") {
  Copy-Item "$Root\port_manager\windows" $dst -Recurse -Force
}

Write-Host "==> 复制 litiaotiao（规则与说明）" -ForegroundColor Cyan
$dst = "$Out\litiaotiao"; New-Item -ItemType Directory -Force -Path $dst | Out-Null
foreach ($it in @('李跳跳规则_AllRules.json','操作手册_李跳跳.md','README.md')) {
  if (Test-Path "$Root\litiaotiao\$it") { Copy-Item "$Root\litiaotiao\$it" $dst -Force }
}

Write-Host "==> 复制 check-antigravity-proxy（Antigravity 工具箱）" -ForegroundColor Cyan
$dst = "$Out\check-antigravity-proxy"; New-Item -ItemType Directory -Force -Path $dst | Out-Null
if (Test-Path "$Root\check-antigravity-proxy\dist\AntigravityToolbox") {
  Copy-Item "$Root\check-antigravity-proxy\dist\AntigravityToolbox" "$dst\AntigravityToolbox" -Recurse -Force
  if (Test-Path "$Root\check-antigravity-proxy\启动工具箱.bat") {
    Copy-Item "$Root\check-antigravity-proxy\启动工具箱.bat" $dst -Force
  }
}

# =============================================================================
# 5. 清理 PyInstaller 中间产物
# =============================================================================
Write-Host "==> 清理临时构建目录" -ForegroundColor Cyan
if (Test-Path "$Out\_pybuild") { Remove-Item "$Out\_pybuild" -Recurse -Force }

# =============================================================================
# 6. 生成独立便携发布包 (.zip)
# =============================================================================
if ($CreateZip) {
    $pkgDir = Join-Path $Root 'release-packages'
    if (-not (Test-Path $pkgDir)) { New-Item -ItemType Directory -Force -Path $pkgDir | Out-Null }
    $zipPath = Join-Path $pkgDir "Codex-Tools-Portable.zip"
    Write-Host "==> 压缩生成独立分发包：$zipPath" -ForegroundColor Cyan
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    tar -a -cf "$zipPath" -C "$Out" .
    if (Test-Path $zipPath) {
        $sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
        Write-Host "    分发包生成完成！大小: $sizeMB MB" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " 全部打包完成！" -ForegroundColor Green
Write-Host " 产物目录：$Out" -ForegroundColor Green
Write-Host " 双击运行：$Out\Codex工具箱.exe" -ForegroundColor Green
if ($CreateZip) {
    Write-Host " 独立压缩包：$Root\release-packages\Codex-Tools-Portable.zip" -ForegroundColor Green
}
Write-Host "==========================================================" -ForegroundColor Green