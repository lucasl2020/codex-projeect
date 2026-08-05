param(
  [int]$Port = 0,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host 'node not found. Install Node.js and add it to PATH.' -ForegroundColor Red
  exit 1
}

if ($Port -gt 0) {
  $env:PORT = [string]$Port
}
elseif ([string]::IsNullOrWhiteSpace($env:PORT)) {
  $env:PORT = '8787'
}

Write-Host 'Starting AI model tester...' -ForegroundColor Cyan
Write-Host ("Default port: {0} (auto switch if busy)" -f $env:PORT) -ForegroundColor DarkGray

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = (Get-Command node).Source
$psi.Arguments = 'server.mjs'
$psi.WorkingDirectory = $PSScriptRoot
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $false

$proc = New-Object System.Diagnostics.Process
$proc.StartInfo = $psi
[void]$proc.Start()

$url = $null
$deadline = (Get-Date).AddSeconds(12)

while ((-not $proc.HasExited) -and ((Get-Date) -lt $deadline) -and (-not $url)) {
  if (-not $proc.StandardOutput.EndOfStream) {
    $line = $proc.StandardOutput.ReadLine()
    if ($null -ne $line) {
      Write-Host $line
      if ($line -match 'https?://127\.0\.0\.1:\d+') {
        $url = $Matches[0]
      }
    }
  }
  if (-not $proc.StandardError.EndOfStream) {
    $line = $proc.StandardError.ReadLine()
    if ($null -ne $line) {
      Write-Host $line
      if ($line -match 'https?://127\.0\.0\.1:\d+') {
        $url = $Matches[0]
      }
    }
  }
  if (-not $url) {
    Start-Sleep -Milliseconds 100
  }
}

if ($proc.HasExited) {
  $err = $proc.StandardError.ReadToEnd()
  if ($err) {
    Write-Host $err -ForegroundColor Red
  }
  Write-Host 'Start failed.' -ForegroundColor Red
  exit 1
}

if ($url) {
  Write-Host ("Open: {0}" -f $url) -ForegroundColor Green
  if (-not $NoBrowser) {
    try {
      Start-Process $url | Out-Null
    }
    catch {
      Write-Host ("Please open browser manually: {0}" -f $url) -ForegroundColor Yellow
    }
  }
}
else {
  Write-Host 'Server started, but URL was not detected. Check logs above.' -ForegroundColor Yellow
}

Write-Host 'Press Ctrl+C to stop.' -ForegroundColor DarkGray

try {
  while (-not $proc.HasExited) {
    if (-not $proc.StandardOutput.EndOfStream) {
      $line = $proc.StandardOutput.ReadLine()
      if ($null -ne $line) { Write-Host $line }
    }
    if (-not $proc.StandardError.EndOfStream) {
      $line = $proc.StandardError.ReadLine()
      if ($null -ne $line) { Write-Host $line }
    }
    Start-Sleep -Milliseconds 120
  }
}
finally {
  if (-not $proc.HasExited) {
    try { $proc.Kill() } catch {}
  }
}

exit $proc.ExitCode
