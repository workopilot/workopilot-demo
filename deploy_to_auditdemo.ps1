$directory = & node (Join-Path $PSScriptRoot 'scripts/demo-deployment.mjs') --directory
if ($LASTEXITCODE -ne 0) { throw '无法读取本地部署配置 .env' }
$targetRoot = "\\10.0.0.29\Shared\Demo"
$targetDir = if ([string]::IsNullOrWhiteSpace($directory)) { $targetRoot } else { Join-Path $targetRoot $directory.Trim() }
$backupBase = Join-Path $targetDir "backup"
$dateStr = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupDir = Join-Path $backupBase $dateStr

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    Write-Host "Created Backup Dir: $backupDir"
}

$itemsToMove = @("index.html", "css", "demo", "images", "js", "jse")
foreach ($item in $itemsToMove) {
    $itemPath = Join-Path $targetDir $item
    if (Test-Path $itemPath) {
        Move-Item -Path $itemPath -Destination $backupDir -Force
        Write-Host "Backed up: $item"
    }
}

$distDir = "apps\web-antd\dist"
if (Test-Path $distDir) {
    Copy-Item -Path "$distDir\*" -Destination $targetDir -Recurse -Force
    Write-Host "Deploy Success! Target: $targetDir"
} else {
    Write-Error "Error: dist directory not found"
}
