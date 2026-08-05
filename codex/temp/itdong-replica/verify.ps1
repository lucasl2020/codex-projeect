[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$requiredFiles = @(
    'docker-compose.yml',
    '.env.example',
    'start.ps1',
    'stop.ps1',
    'README.md',
    'wordpress/wp-content/itdong-bootstrap.php',
    'wordpress/wp-content/themes/argon/style.css',
    'wordpress/wp-content/themes/itdong-child/style.css',
    'wordpress/wp-content/themes/itdong-child/functions.php',
    'wordpress/wp-content/themes/itdong-child/assets/logo.png'
)

$errors = New-Object System.Collections.Generic.List[string]
foreach ($file in $requiredFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot $file))) {
        $errors.Add("缺少文件：$file")
    }
}

$customTextFiles = @(
    'docker-compose.yml', '.env.example', '.gitignore', 'README.md',
    'wordpress/wp-content/itdong-bootstrap.php',
    'wordpress/wp-content/themes/itdong-child/style.css',
    'wordpress/wp-content/themes/itdong-child/functions.php'
)
foreach ($file in $customTextFiles) {
    $path = Join-Path $PSScriptRoot $file
    if (-not (Test-Path -LiteralPath $path)) {
        continue
    }
    $bytes = [IO.File]::ReadAllBytes($path)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        $errors.Add("文件带 UTF-8 BOM：$file")
    }
}

$argonStyle = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'wordpress/wp-content/themes/argon/style.css'))
if ($argonStyle -notmatch 'Version:\s*1\.3\.5') {
    $errors.Add('父主题不是 Argon 1.3.5。')
}

$childStyle = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'wordpress/wp-content/themes/itdong-child/style.css'))
if ($childStyle -notmatch 'Template:\s*argon') {
    $errors.Add('子主题未正确声明 Argon 父主题。')
}

$bootstrap = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'wordpress/wp-content/itdong-bootstrap.php'))
foreach ($needle in @("'argon_page_layout' => 'triple'", "'argon_theme_color' => '#2196f3'", "'argon_card_radius' => '25'", "'timeline.php'", "'msgboard.php'")) {
    if (-not $bootstrap.Contains($needle)) {
        $errors.Add("初始化脚本缺少关键配置：$needle")
    }
}

$compose = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'docker-compose.yml'))
foreach ($needle in @('image: mariadb:11.4', 'image: wordpress:php8.2-apache', 'image: wordpress:cli-php8.2', './wordpress/wp-content:/var/www/html/wp-content')) {
    if (-not $compose.Contains($needle)) {
        $errors.Add("Compose 缺少关键配置：$needle")
    }
}

foreach ($file in @('start.ps1', 'stop.ps1')) {
    $tokens = $null
    $parseErrors = $null
    [Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot $file), [ref]$tokens, [ref]$parseErrors) | Out-Null
    if ($parseErrors.Count -gt 0) {
        $errors.Add("PowerShell 语法检查失败：$file")
    }
}

if (Get-Command php -ErrorAction SilentlyContinue) {
    foreach ($file in @('wordpress/wp-content/itdong-bootstrap.php', 'wordpress/wp-content/themes/itdong-child/functions.php')) {
        & php -l (Join-Path $PSScriptRoot $file) *> $null
        if ($LASTEXITCODE -ne 0) {
            $errors.Add("PHP 语法检查失败：$file")
        }
    }
} else {
    Write-Warning '本机未安装 PHP，已跳过 php -l。'
}

if (Get-Command docker -ErrorAction SilentlyContinue) {
    & docker compose config --quiet *> $null
    if ($LASTEXITCODE -ne 0) {
        $errors.Add('docker compose config 检查失败。')
    }
} else {
    Write-Warning '本机未安装 Docker，已跳过 Compose 运行时解析。'
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host '项目静态检查通过。' -ForegroundColor Green