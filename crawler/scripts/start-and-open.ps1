# Launch node server, parse bound port from logs, open browser once.
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

$env:CARD_SHOP_OPEN = '1'
$node = (Get-Command node -ErrorAction Stop).Source

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $node
$psi.Arguments = 'src/index.js'
$psi.WorkingDirectory = $root
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $false

$proc = New-Object System.Diagnostics.Process
$proc.StartInfo = $psi

$opened = $false
$url = $null

$handler = {
  param($sender, $e)
  if (-not $e.Data) { return }
  [Console]::Out.WriteLine($e.Data)
  if (-not $script:opened -and $e.Data -match 'https?://127\.0\.0\.1:(\d+)') {
    $script:url = $Matches[0]
    if ($e.Data -match 'Card Shop Manager\s+(https?://127\.0\.0\.1:\d+)') {
      $script:url = $Matches[1]
    }
    $script:opened = $true
    try {
      Start-Process $script:url | Out-Null
      [Console]::Out.WriteLine("[open] 已打开浏览器 $script:url")
    } catch {
      [Console]::Out.WriteLine("[open] 无法自动打开浏览器，请手动访问 $script:url")
    }
  }
}

$proc.add_OutputDataReceived($handler)
$proc.add_ErrorDataReceived({
  param($sender, $e)
  if ($e.Data) { [Console]::Error.WriteLine($e.Data) }
})

[void]$proc.Start()
$proc.BeginOutputReadLine()
$proc.BeginErrorReadLine()
$proc.WaitForExit()
exit $proc.ExitCode
