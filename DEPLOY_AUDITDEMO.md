# AuditDemo 发布说明

本文档描述了将打包好的前端产物发布到演示环境（AuditDemo）的标准操作流程（SOP）。

## 环境信息

- **演示服务器路径**: `\\10.0.0.29\Shared\Demo\auditdemo`
- **打包产物路径**: 项目下的 `apps/web-antd/dist` 目录
- **备份存放路径**: `\\10.0.0.29\Shared\Demo\auditdemo\backup\YYYY-MM-DD` （按日期建档）

## 发布流程

每次发布包含以下三个标准步骤：

### 1. 打包最新代码

在项目根目录下，运行打包命令生成最新产物：

```bash
pnpm run build
```

### 2. 备份旧版静态资源

为了方便回滚以及防止历史发布记录丢失，我们需要将服务器上原有的前端主文件和目录移动至对应日期的 `backup` 目录中。 **需要移动的名单**：

- `index.html`
- `css/`
- `demo/`
- `images/`
- `js/`
- `jse/`

### 3. 部署最新产物

将刚才打包生成的 `apps/web-antd/dist` 目录下的所有文件和文件夹，完整复制到网络驱动器 `\\10.0.0.29\Shared\Demo\auditdemo` 中。

---

## 自动化发布脚本 (PowerShell)

在 Windows 环境下，您可以直接在项目根目录运行以下 PowerShell 脚本一键完成**备份**与**发布**操作：

```powershell
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
```
