# 自动化重新生成【浏览器一体化秒过专版】及绿色压缩包
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$dist = Join-Path $root "浏览器一体化秒过专版"
$outZip = Join-Path $root "output\浏览器一体化秒过专版_绿色免安装.zip"

Write-Host ">>> 正在准备构建目录: $dist ..." -ForegroundColor Cyan
if (-not (Test-Path $dist)) { New-Item -ItemType Directory -Path $dist | Out-Null }

Write-Host ">>> 正在同步 Chrome 扩展与核心模块..." -ForegroundColor Cyan
Copy-Item -Recurse -Force "$root\chrome_extension" "$dist\chrome_extension"
Copy-Item -Recurse -Force "$root\modules" "$dist\modules"
Copy-Item -Recurse -Force "$root\local_captcha" "$dist\local_captcha"
Copy-Item -Force "$root\local_bridge.py" "$dist\local_bridge.py"

Write-Host ">>> 正在打包生成独立 ZIP 分发包..." -ForegroundColor Cyan
if (Test-Path $outZip) { Remove-Item -Force $outZip }
Compress-Archive -Path "$dist\*" -DestinationPath $outZip -Force

$len = (Get-Item $outZip).Length
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " [完成] 浏览器一体化秒过专版已就绪！" -ForegroundColor Green
Write-Host " 目录: $dist" -ForegroundColor Yellow
Write-Host " 压缩包: $outZip ($([math]::Round($len / 1KB, 1)) KB)" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green