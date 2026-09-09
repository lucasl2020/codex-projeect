# 一键打包发布 Chrome 扩展
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$extDir = Join-Path $root "chrome_extension"
$outDir = Join-Path $root "output"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}
$zipPath = Join-Path $outDir "local_captcha_extension.zip"
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

Write-Host "正在打包 Chrome 扩展目录: $extDir ..." -ForegroundColor Cyan
Compress-Archive -Path "$extDir\*" -DestinationPath $zipPath -Force

Write-Host "====================================================" -ForegroundColor Green
Write-Host " 打包完成！已生成分发包：" -ForegroundColor Green
Write-Host " $zipPath" -ForegroundColor Yellow
Write-Host " 体积仅约: $([math]::Round((Get-Item $zipPath).Length / 1KB, 1)) KB" -ForegroundColor Green
Write-Host " 可直接发给他人或在任何 Chrome 浏览器解压后导入安装。" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
