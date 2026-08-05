[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw '未检测到 Docker。'
}

& docker compose down
if ($LASTEXITCODE -ne 0) {
    throw '停止容器失败。'
}

Write-Host '站点已停止，数据库和上传文件均已保留。' -ForegroundColor Green