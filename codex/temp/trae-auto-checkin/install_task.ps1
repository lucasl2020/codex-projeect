param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^([01]\d|2[0-3]):[0-5]\d$')]
    [string]$At
)

$ErrorActionPreference = 'Stop'
$taskName = 'TRAE 每日签到'
$python = (Get-Command python -ErrorAction Stop).Source
$script = Join-Path $PSScriptRoot 'trae_checkin.py'

if (-not (Test-Path -LiteralPath $script)) {
    throw "未找到签到脚本：$script"
}

& $python -c 'import Crypto' 2>$null
if ($LASTEXITCODE -ne 0) {
    throw '缺少 pycryptodome，请先执行：python -m pip install pycryptodome'
}

$action = New-ScheduledTaskAction `
    -Execute $python `
    -Argument ('"{0}"' -f $script) `
    -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 2)

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description '每天自动领取 TRAE Work CN 签到积分' `
    -Force | Out-Null

Write-Host "已创建计划任务：$taskName，每天 $At 执行。"
