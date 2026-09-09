param(
    [string]$Url = "https://checkin.new-api.abrdns.com/level",
    [string]$Submit = "#level-verify-submit",
    [string]$SuccessSelector = "#level-verify-submit:not([disabled])",
    [int]$Wait = 300
)
$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot
$env:PYTHONUTF8 = "1"
& (Join-Path $PSScriptRoot '启动本地模型.ps1')
if ($Submit -and $SuccessSelector) {
    python -m local_captcha $Url --submit $Submit --success-selector $SuccessSelector --wait $Wait
} else {
    python -m local_captcha $Url --wait $Wait
}
Write-Host "运行结果保存在 output/local-captcha 目录中。"
Read-Host "按回车键退出"