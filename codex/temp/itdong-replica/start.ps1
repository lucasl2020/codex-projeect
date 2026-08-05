[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

function New-HexSecret {
    param([int]$Bytes = 24)

    $buffer = New-Object byte[] $Bytes
    $random = [Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $random.GetBytes($buffer)
    } finally {
        $random.Dispose()
    }
    return ($buffer | ForEach-Object { $_.ToString('x2') }) -join ''
}

function Read-DotEnv {
    param([string]$Path)

    $values = @{}
    foreach ($line in [IO.File]::ReadAllLines($Path)) {
        $trimmed = $line.Trim()
        if ($trimmed -eq '' -or $trimmed.StartsWith('#') -or -not $trimmed.Contains('=')) {
            continue
        }
        $parts = $trimmed -split '=', 2
        $values[$parts[0].Trim()] = $parts[1].Trim().Trim('"').Trim("'")
    }
    return $values
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw '未检测到 Docker。请先安装并启动 Docker Desktop。'
}

& docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw 'Docker 服务未运行。请启动 Docker Desktop 后重试。'
}

& docker compose version *> $null
if ($LASTEXITCODE -ne 0) {
    throw '当前 Docker 未提供 Compose v2，请更新 Docker Desktop。'
}

$envPath = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path -LiteralPath $envPath)) {
    $envContent = @"
COMPOSE_PROJECT_NAME=itdong-replica
WORDPRESS_PORT=8080
SITE_URL=http://localhost:8080
SITE_TITLE=我的个人站点
WP_ADMIN_USER=admin
WP_ADMIN_PASSWORD=$(New-HexSecret -Bytes 16)
WP_ADMIN_EMAIL=admin@example.com
WORDPRESS_DB_NAME=wordpress
WORDPRESS_DB_USER=wordpress
WORDPRESS_DB_PASSWORD=$(New-HexSecret)
MARIADB_ROOT_PASSWORD=$(New-HexSecret)
WORDPRESS_TABLE_PREFIX=wp_
WORDPRESS_DEBUG=
"@
    $utf8NoBom = New-Object Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($envPath, $envContent.TrimStart(), $utf8NoBom)
    Write-Host '已生成 .env 和随机密码。' -ForegroundColor Green
}

$settings = Read-DotEnv -Path $envPath
$required = @(
    'SITE_URL',
    'SITE_TITLE',
    'WP_ADMIN_USER',
    'WP_ADMIN_PASSWORD',
    'WP_ADMIN_EMAIL',
    'WORDPRESS_DB_NAME',
    'WORDPRESS_DB_USER',
    'WORDPRESS_DB_PASSWORD',
    'MARIADB_ROOT_PASSWORD'
)
foreach ($name in $required) {
    if (-not $settings.ContainsKey($name) -or [string]::IsNullOrWhiteSpace($settings[$name])) {
        throw ".env 缺少必填项：$name"
    }
    if ($settings[$name].StartsWith('CHANGE_ME')) {
        throw ".env 中的 $name 仍是示例值，请替换后再启动。"
    }
}

$siteUrl = $settings['SITE_URL'].TrimEnd('/')
$siteTitle = $settings['SITE_TITLE']
$adminUser = $settings['WP_ADMIN_USER']
$adminPassword = $settings['WP_ADMIN_PASSWORD']
$adminEmail = $settings['WP_ADMIN_EMAIL']

Write-Host '正在启动 MariaDB 和 WordPress……' -ForegroundColor Cyan
& docker compose up -d db wordpress
if ($LASTEXITCODE -ne 0) {
    throw '容器启动失败，请运行 docker compose logs 查看原因。'
}

Write-Host '正在等待 WordPress 文件和数据库就绪……' -ForegroundColor Cyan
$ready = $false
for ($attempt = 1; $attempt -le 60; $attempt++) {
    & docker compose exec -T wordpress sh -c 'test -f /var/www/html/wp-load.php -a -f /var/www/html/wp-config.php' *> $null
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
        break
    }
    Start-Sleep -Seconds 2
}
if (-not $ready) {
    throw '等待 WordPress 就绪超时，请运行 docker compose logs wordpress 查看日志。'
}

& docker compose run --rm cli core is-installed *> $null
$wasInstalled = $LASTEXITCODE -eq 0

if (-not $wasInstalled) {
    Write-Host '正在安装 WordPress……' -ForegroundColor Cyan
    & docker compose run --rm cli core install "--url=$siteUrl" "--title=$siteTitle" "--admin_user=$adminUser" "--admin_password=$adminPassword" "--admin_email=$adminEmail" --skip-email
    if ($LASTEXITCODE -ne 0) {
        throw 'WordPress 安装失败。'
    }

    & docker compose run --rm cli language core install zh_CN --activate
    if ($LASTEXITCODE -ne 0) {
        Write-Warning '中文语言包安装失败，站点仍可使用；联网后可在后台重新安装语言包。'
    }
}

Write-Host '正在同步站点地址、启用主题并初始化内容……' -ForegroundColor Cyan
& docker compose run --rm cli option update home "$siteUrl"
if ($LASTEXITCODE -ne 0) {
    throw '站点首页地址更新失败。'
}
& docker compose run --rm cli option update siteurl "$siteUrl"
if ($LASTEXITCODE -ne 0) {
    throw 'WordPress 地址更新失败。'
}

& docker compose run --rm cli theme activate itdong-child
if ($LASTEXITCODE -ne 0) {
    throw 'ITDong 子主题启用失败。'
}

& docker compose run --rm cli eval-file /var/www/html/wp-content/itdong-bootstrap.php
if ($LASTEXITCODE -ne 0) {
    throw '站点初始化脚本执行失败。'
}

& docker compose run --rm cli rewrite structure '/%postname%/' --hard
if ($LASTEXITCODE -ne 0) {
    throw '固定链接刷新失败。'
}

Write-Host ''
Write-Host '站点已启动：' -ForegroundColor Green
Write-Host "前台：$siteUrl"
Write-Host "后台：$siteUrl/wp-admin/"
Write-Host "管理员用户名：$adminUser"
if ($wasInstalled) {
    Write-Host '管理员密码：站点已存在，沿用数据库中的现有密码（不会被脚本重置）。'
} else {
    Write-Host "管理员密码：$adminPassword"
    Write-Host "密码也保存在：$envPath"
}