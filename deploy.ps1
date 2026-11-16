# 1. 定义路径变量
$targetDir = "\\10.0.0.29\Shared\Demo\auditdemo"
$backupBase = Join-Path $targetDir "backup"
$dateStr = Get-Date -Format "yyyy-MM-dd"
$backupDir = Join-Path $backupBase $dateStr

# 2. 创建备份目录（如果不存在）
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    Write-Host "创建备份文件夹: $backupDir"
}

# 3. 移动旧版文件至备份目录
$itemsToMove = @("index.html", "css", "demo", "images", "js", "jse")
foreach ($item in $itemsToMove) {
    $itemPath = Join-Path $targetDir $item
    if (Test-Path $itemPath) {
        Move-Item -Path $itemPath -Destination $backupDir -Force
        Write-Host "已备份: $item"
    }
}

# 4. 复制新版 dist 产物至目标服务器
$distDir = "apps\web-antd\dist"
if (Test-Path $distDir) {
    Copy-Item -Path "$distDir\*" -Destination $targetDir -Recurse -Force
    Write-Host "发布成功！新版文件已覆盖至: $targetDir"
} else {
    Write-Error "错误: 找不到本地 dist 目录，请先执行 pnpm run build"
}
