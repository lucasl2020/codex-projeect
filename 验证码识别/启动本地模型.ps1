# 启动本地 Ollama 服务
$ErrorActionPreference = "Stop"
$runtime = Join-Path $PSScriptRoot 'output\runtime'
$executable = Join-Path $runtime 'ollama\ollama.exe'
if (-not (Test-Path -LiteralPath $executable)) {
    throw '未找到项目内的 Ollama 便携程序，请查看 output/runtime/ollama 目录。'
}
try {
    Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/version' -TimeoutSec 2 | Out-Null
    Write-Host '本机模型服务已在运行。'
    return
} catch {
    $env:OLLAMA_NO_CLOUD = '1'
    $env:OLLAMA_MODELS = Join-Path $runtime 'models'
    $env:OLLAMA_HOST = '127.0.0.1:11434'
    $modelProcess = Start-Process -FilePath $executable -ArgumentList 'serve' -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $runtime 'ollama-out.log') `
        -RedirectStandardError (Join-Path $runtime 'ollama-error.log')
    $modelProcess.Id | Set-Content -LiteralPath (Join-Path $runtime 'ollama.pid')
}
for ($attempt = 0; $attempt -lt 20; $attempt++) {
    try {
        Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/version' -TimeoutSec 2 | Out-Null
        Write-Host '本机模型服务已启动，离线运行模式已就绪。'
        return
    } catch {
        Start-Sleep -Milliseconds 500
    }
}
throw '模型服务未能成功启动，请查看 output/runtime/ollama-error.log 日志。'
