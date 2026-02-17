@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

where wsl >nul 2>&1
if errorlevel 1 (
  echo [ERROR] wsl.exe not found. Install/enable WSL first.
  pause
  exit /b 1
)

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "REPO_WIN=%%~fI"

for /f "usebackq delims=" %%I in (`wsl wslpath -a "%REPO_WIN%"`) do set "REPO_WSL=%%I"
if not defined REPO_WSL (
  echo [ERROR] Failed to convert repository path to WSL path.
  pause
  exit /b 1
)

set "DEFAULT_ARCHIVE=nanokvm-cube-overlay.tar.gz"

:menu
cls
echo ==========================================
echo NanoKVM Cube Build
echo Repo: %REPO_WIN%
echo ==========================================
echo 1. Full build ^(backend + frontend + archive^)
echo 2. Frontend only ^(skip backend^)
echo 3. Package only ^(skip backend + skip frontend^)
echo 4. Exit
echo.
set "CHOICE="
set /p CHOICE=Select action [1-4]: 

if "%CHOICE%"=="4" goto end
if not "%CHOICE%"=="1" if not "%CHOICE%"=="2" if not "%CHOICE%"=="3" (
  echo Invalid choice.
  pause
  goto menu
)

set "EXTRA_ARGS="
if "%CHOICE%"=="2" set "EXTRA_ARGS=--skip-backend"
if "%CHOICE%"=="3" set "EXTRA_ARGS=--skip-backend --skip-frontend"

set "ARCHIVE_NAME="
set /p ARCHIVE_NAME=Archive file name [%DEFAULT_ARCHIVE%]: 
if not defined ARCHIVE_NAME set "ARCHIVE_NAME=%DEFAULT_ARCHIVE%"

echo.
echo Running build...
wsl bash -lc "cd '%REPO_WSL%' && chmod +x scripts/build_cube_overlay.sh && ./scripts/build_cube_overlay.sh --archive-name '%ARCHIVE_NAME%' !EXTRA_ARGS!"
if errorlevel 1 (
  echo [ERROR] Build failed.
) else (
  echo [OK] Build completed.
  echo Archive: %REPO_WIN%\build\%ARCHIVE_NAME%
)
pause
goto menu

:end
endlocal
exit /b 0
