param(
    [string]$Action = "status"
)

$baseDir = $PSScriptRoot
$parentDir = Split-Path $baseDir -Parent

function Get-OllamaExe {
    $candidates = @(
        (Join-Path $baseDir "runtime\ollama\ollama.exe"),
        (Join-Path $parentDir "output\runtime\ollama\ollama.exe"),
        "D:\codex-projeect\验证码识别\output\runtime\ollama\ollama.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { return (Resolve-Path $c).Path }
    }
    $cmd = Get-Command ollama -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return $null
}

function Get-OllamaModelsDir {
    $candidates = @(
        (Join-Path $baseDir "runtime\models"),
        (Join-Path $parentDir "output\runtime\models"),
        "D:\codex-projeect\验证码识别\output\runtime\models"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { return (Resolve-Path $c).Path }
    }
    return $null
}

function Get-PythonExe {
    $cmd = Get-Command python -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return "python"
}

switch ($Action.ToLower()) {
    "start" {
        # 1. 检测并静默启动 Ollama
        $ollamaOnline = $false
        try {
            $resp = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 1 -ErrorAction Stop
            $ollamaOnline = $true
        } catch {}

        if (-not $ollamaOnline) {
            $exe = Get-OllamaExe
            $models = Get-OllamaModelsDir
            if ($exe) {
                Write-Host "正在静默启动离线视觉大模型 (Ollama: qwen3-vl:4b)..." -ForegroundColor Cyan
                $procInfo = New-Object System.Diagnostics.ProcessStartInfo
                $procInfo.FileName = $exe
                $procInfo.Arguments = "serve"
                $procInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
                $procInfo.CreateNoWindow = $true
                $procInfo.UseShellExecute = $true
                if ($models) {
                    $env:OLLAMA_MODELS = $models
                }
                $env:OLLAMA_HOST = "127.0.0.1:11434"
                $env:OLLAMA_NO_CLOUD = "1"
                [System.Diagnostics.Process]::Start($procInfo) | Out-Null
                Start-Sleep -Seconds 2
            }
        }

        # 2. 检测并静默启动 local_bridge.py
        $bridgeRunning = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*local_bridge.py*" }
        if (-not $bridgeRunning) {
            Write-Host "正在静默启动本地扩展桥接网关 (127.0.0.1:8765)..." -ForegroundColor Cyan
            $bridgeScript = Join-Path $baseDir "local_bridge.py"
            $pyExe = Get-PythonExe
            $procInfo = New-Object System.Diagnostics.ProcessStartInfo
            $procInfo.FileName = $pyExe
            $procInfo.Arguments = "`"$bridgeScript`""
            $procInfo.WorkingDirectory = $baseDir
            $procInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
            $procInfo.CreateNoWindow = $true
            $procInfo.UseShellExecute = $true
            [System.Diagnostics.Process]::Start($procInfo) | Out-Null
            Start-Sleep -Seconds 2
        }
        Write-Host "后台服务已全部静默就绪！" -ForegroundColor Green
    }

    "stop" {
        Write-Host "正在安全停止后台服务..." -ForegroundColor Yellow
        Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*local_bridge.py*" } | ForEach-Object {
            Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        }
        Write-Host "本地桥接服务已停止。" -ForegroundColor Green
    }

    "status" {
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "      本地验证码助手 - 运行状态检测" -ForegroundColor Cyan
        Write-Host "==========================================" -ForegroundColor Cyan
        
        $bridgeOk = $false
        try {
            $bResp = Invoke-RestMethod -Uri "http://127.0.0.1:8765/health" -TimeoutSec 2 -ErrorAction Stop
            Write-Host "[✓ 在线] 浏览器扩展桥接网关: 运行中 (127.0.0.1:8765)" -ForegroundColor Green
            $bridgeOk = $true
        } catch {
            Write-Host "[x 未启动] 浏览器扩展桥接网关: 未启动" -ForegroundColor Red
        }

        $ollamaOk = $false
        try {
            $oResp = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 2 -ErrorAction Stop
            $models = ($oResp.models | ForEach-Object { $_.name }) -join ", "
            Write-Host "[✓ 在线] 本地离线大模型 (Ollama): 运行中 (模型: $models)" -ForegroundColor Green
            $ollamaOk = $true
        } catch {
            Write-Host "[x 未启动] 本地离线大模型 (Ollama): 未启动" -ForegroundColor Red
        }

        Write-Host "------------------------------------------"
        if ($bridgeOk -and $ollamaOk) {
            Write-Host "整体状态: 完美在线！打开 Chrome 即可全自动秒过验证码。" -ForegroundColor Green
        } else {
            Write-Host "提示: 可运行【启动后台静默服务.vbs】或【一键安装并秒启动.bat】拉起服务。" -ForegroundColor Yellow
        }
        Write-Host "==========================================" -ForegroundColor Cyan
    }

    "install_startup" {
        $startupFolder = [Environment]::GetFolderPath("Startup")
        $shortcutPath = Join-Path $startupFolder "本地验证码助手后台服务.lnk"
        $targetVbs = Join-Path $baseDir "启动后台静默服务(无黑框).vbs"
        
        $WshShell = New-Object -ComObject WScript.Shell
        $shortcut = $WshShell.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = "wscript.exe"
        $shortcut.Arguments = "`"$targetVbs`""
        $shortcut.WorkingDirectory = $baseDir
        $shortcut.Description = "开机静默启动本地验证码助手服务"
        $shortcut.Save()
        
        Write-Host "====================================================" -ForegroundColor Green
        Write-Host " [成功] 已添加开机静默自启！" -ForegroundColor Green
        Write-Host " 快捷方式: $shortcutPath" -ForegroundColor Gray
        Write-Host " 以后每次电脑开机，后台服务将自动静默待命。" -ForegroundColor Green
        Write-Host " 你只需像往常一样打开 Chrome 上网，验证码将自动秒过！" -ForegroundColor Green
        Write-Host "====================================================" -ForegroundColor Green
    }

    "remove_startup" {
        $startupFolder = [Environment]::GetFolderPath("Startup")
        $shortcutPath = Join-Path $startupFolder "本地验证码助手后台服务.lnk"
        if (Test-Path $shortcutPath) {
            Remove-Item -Force $shortcutPath
            Write-Host "[成功] 已取消开机自启。" -ForegroundColor Green
        } else {
            Write-Host "[提示] 未发现自启动项。" -ForegroundColor Yellow
        }
    }
}