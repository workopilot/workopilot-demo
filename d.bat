@echo off
chcp 65001 >nul
echo ==============================================
echo          vue-vben-admin 自动打包脚本
echo ==============================================
echo.

:: ===================== 配置路径 =====================
:: 你的项目根目录（直接复制你给的路径，已处理空格问题）
set "PROJECT_PATH=D:\Myfile\My_project\vue-vben-admin"
set "PROJECT_DIST=D:\Myfile\My_project\vue-vben-admin\apps\web-antd"

:: 压缩包输出名称（可自行修改）
set "ZIP_NAME=dist.zip"
:: ====================================================

echo 正在切换到项目目录：
echo %PROJECT_PATH%
echo.

:: 进入项目目录
cd /d "%PROJECT_PATH%"
if %errorlevel% neq 0 (
    echo 错误：目录不存在或无法访问！
    pause
    exit /b 1
)

echo 正在执行 npm run build 打包...
echo.
call npm run build

:: 检查打包是否成功
if %errorlevel% neq 0 (
    echo.
    echo 错误：npm run build 打包失败！
    pause
    exit /b 1
)

echo.
echo ===================== 打包完成 =====================
echo 正在将 dist 文件夹压缩为 ZIP...
echo.
echo 正在切换到项目目录：
echo %PROJECT_DIST%
echo.
:: 进入项目目录
cd /d "%PROJECT_DIST%"
:: 使用系统自带工具压缩 dist 文件夹为 ZIP
powershell -command "Compress-Archive -Path './dist/*' -DestinationPath './%ZIP_NAME%' -Force"

if %errorlevel% equ 0 (
    echo.
    echo ? 成功！压缩包已生成：
    echo %PROJECT_DIST%\%ZIP_NAME%
) else (
    echo.
    echo ? 压缩失败！请检查 dist 文件夹是否存在
)

echo.
echo ====================================================
