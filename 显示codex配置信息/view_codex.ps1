$ErrorActionPreference = 'SilentlyContinue'
$cx  = Join-Path $env:USERPROFILE '.codex'
$mgr = Join-Path $env:USERPROFILE '.codex-session-delete\settings.json'
$sep = '=' * 64

# 取 JSON 字段：优先取引号字符串，否则取非引号标量（bool/number）
function Re1($text, $name) {
  if ($text -match "(?s)`"$name`"\s*:\s*(?:`"((?:[^`"\\]|\\.)*)`"|([^,\s\}]+))") {
    if ($Matches[1]) { return $Matches[1] } else { return $Matches[2] }
  }
  return $null
}

Write-Output $sep
Write-Output "Codex++ 配置与明文查看"
Write-Output $sep

# [1] 官方登录态 auth.json
$af = Join-Path $cx 'auth.json'
if (Test-Path $af) {
  $at = [System.IO.File]::ReadAllText($af, [System.Text.Encoding]::UTF8)
  Write-Output ""
  Write-Output "[1] 官方登录态  auth.json"
  Write-Output "    OPENAI_API_KEY = $(Re1 $at 'OPENAI_API_KEY')"
}

# [2] 管理器设置 settings.json
if (Test-Path $mgr) {
  $raw = [System.IO.File]::ReadAllText($mgr, [System.Text.Encoding]::UTF8)
  Write-Output ""
  Write-Output "[2] 管理器设置  settings.json"
  Write-Output "    relayBaseUrl        = $(Re1 $raw 'relayBaseUrl')"
  Write-Output "    relayApiKey (主Key) = $(Re1 $raw 'relayApiKey')"
  Write-Output "    providerSyncEnabled = $(Re1 $raw 'providerSyncEnabled')"
  Write-Output "    lastSelectedProvider= $(Re1 $raw 'providerSyncLastSelectedProvider')"

  # [3] 已保存供应商 (relayProfiles)
  Write-Output ""
  Write-Output "[3] 已保存供应商 (relayProfiles)"
  $blocks = $raw -split '("id"\s*:\s*"relay-)'
  $i = 1
  for ($k = 2; $k -lt $blocks.Count; $k += 2) {
    $blk = $blocks[$k]
    $name = Re1 $blk 'name'
    $ub   = Re1 $blk 'upstreamBaseUrl'
    $ac   = Re1 $blk 'authContents'
    $pk   = $null
    if ($ac) { $pk = Re1 ($ac -replace '\\"','"') 'OPENAI_API_KEY' }
    $bt   = $null
    if ($blk -match '(?m)^\s*experimental_bearer_token\s*=\s*"([^"]*)"') { $bt = $Matches[1] }
    if (-not $ub -and ($blk -match '(?m)^\s*base_url\s*=\s*"([^"]*)"')) { $ub = $Matches[1] }
    Write-Output "    --- 供应商 #$i ---"
    Write-Output "      name       : $name"
    Write-Output "      upstreamUrl: $ub"
    if ($pk) { Write-Output "      API Key    : $pk" }
    if ($bt) { Write-Output "      BearerToken: $bt" }
    $i++
  }
}

# [4] Codex 配置 config.toml
$ct = Join-Path $cx 'config.toml'
if (Test-Path $ct) {
  $t = [System.IO.File]::ReadAllText($ct, [System.Text.Encoding]::UTF8)
  Write-Output ""
  Write-Output "[4] Codex 配置  config.toml (model_providers.custom)"
  if ($t -match '(?m)^\s*base_url\s*=\s*"([^"]*)"') { Write-Output "    base_url = $($Matches[1])" }
  if ($t -match '(?m)^\s*experimental_bearer_token\s*=\s*"([^"]*)"') { Write-Output "    experimental_bearer_token = $($Matches[1])" }
}

Write-Output ""
Write-Output $sep
Write-Output "注意：以上均为本机明文，请勿外泄到日志 / 截图。"
