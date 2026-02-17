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

set "DEFAULT_HOST=192.168.0.36"
set "DEFAULT_USER=root"
set "DEFAULT_PORT=22"
set "DEFAULT_KEEP_BACKUPS=3"
set "DEFAULT_STAGE_DIR=/data"
set "DEFAULT_RESTART_TIMEOUT=60"
set "DEFAULT_ARCHIVE=%REPO_WIN%\build\nanokvm-cube-overlay.tar.gz"

:menu
cls
echo ==========================================
echo NanoKVM Cube Overlay Deploy
echo Repo: %REPO_WIN%
echo ==========================================
echo 1. Deploy overlay
echo 2. List backups
echo 3. Rollback
echo 4. Exit
echo.
set "CHOICE="
set /p CHOICE=Select action [1-4]: 

if "%CHOICE%"=="1" goto deploy
if "%CHOICE%"=="2" goto list_backups
if "%CHOICE%"=="3" goto rollback
if "%CHOICE%"=="4" goto end

echo Invalid choice.
pause
goto menu

:prompt_common
set "HOST="
set /p HOST=Host [%DEFAULT_HOST%]: 
if not defined HOST set "HOST=%DEFAULT_HOST%"

set "USER_NAME="
set /p USER_NAME=User [%DEFAULT_USER%]: 
if not defined USER_NAME set "USER_NAME=%DEFAULT_USER%"

set "PORT="
set /p PORT=SSH port [%DEFAULT_PORT%]: 
if not defined PORT set "PORT=%DEFAULT_PORT%"
exit /b 0

:deploy
call :prompt_common

set "ARCHIVE_WIN="
set /p ARCHIVE_WIN=Archive path [%DEFAULT_ARCHIVE%]: 
if not defined ARCHIVE_WIN set "ARCHIVE_WIN=%DEFAULT_ARCHIVE%"

if not exist "%ARCHIVE_WIN%" (
  echo [ERROR] Archive not found: %ARCHIVE_WIN%
  pause
  goto menu
)

for /f "usebackq delims=" %%I in (`wsl wslpath -a "%ARCHIVE_WIN%"`) do set "ARCHIVE_WSL=%%I"
if not defined ARCHIVE_WSL (
  echo [ERROR] Failed to convert archive path to WSL path.
  pause
  goto menu
)

set "KEEP_BACKUPS="
set /p KEEP_BACKUPS=Keep last N backups [%DEFAULT_KEEP_BACKUPS%]: 
if not defined KEEP_BACKUPS set "KEEP_BACKUPS=%DEFAULT_KEEP_BACKUPS%"

set "STAGE_DIR="
set /p STAGE_DIR=Remote stage dir [%DEFAULT_STAGE_DIR%]: 
if not defined STAGE_DIR set "STAGE_DIR=%DEFAULT_STAGE_DIR%"

set "RESTART_TIMEOUT="
set /p RESTART_TIMEOUT=Restart timeout in seconds [%DEFAULT_RESTART_TIMEOUT%]: 
if not defined RESTART_TIMEOUT set "RESTART_TIMEOUT=%DEFAULT_RESTART_TIMEOUT%"

echo.
echo Running deploy...
wsl bash -lc "cd '%REPO_WSL%' && chmod +x scripts/deploy_cube_overlay.sh && ./scripts/deploy_cube_overlay.sh deploy --host '%HOST%' --user '%USER_NAME%' --port '%PORT%' --archive '%ARCHIVE_WSL%' --keep-backups '%KEEP_BACKUPS%' --remote-stage-dir '%STAGE_DIR%' --restart-timeout '%RESTART_TIMEOUT%'"
if errorlevel 1 (
  echo [ERROR] Deploy failed.
) else (
  echo [OK] Deploy completed.
)
pause
goto menu

:list_backups
call :prompt_common

echo.
echo Listing backups...
wsl bash -lc "cd '%REPO_WSL%' && chmod +x scripts/deploy_cube_overlay.sh && ./scripts/deploy_cube_overlay.sh list-backups --host '%HOST%' --user '%USER_NAME%' --port '%PORT%'"
if errorlevel 1 (
  echo [ERROR] Failed to list backups.
) else (
  echo [OK] Done.
)
pause
goto menu

:rollback
call :prompt_common

set "BACKUP_REMOTE="
set /p BACKUP_REMOTE=Remote backup path (example: /root/kvmapp.backup.2026-02-16-230501.tar.gz): 
if not defined BACKUP_REMOTE (
  echo [ERROR] Backup path is required.
  pause
  goto menu
)

set "NO_RESTART="
set /p NO_RESTART=Skip service restart after rollback? [y/N]: 
set "NO_RESTART_ARG="
if /I "%NO_RESTART%"=="y" set "NO_RESTART_ARG=--no-restart"

set "RESTART_TIMEOUT="
set /p RESTART_TIMEOUT=Restart timeout in seconds [%DEFAULT_RESTART_TIMEOUT%]: 
if not defined RESTART_TIMEOUT set "RESTART_TIMEOUT=%DEFAULT_RESTART_TIMEOUT%"

echo.
echo Running rollback...
wsl bash -lc "cd '%REPO_WSL%' && chmod +x scripts/deploy_cube_overlay.sh && ./scripts/deploy_cube_overlay.sh rollback --host '%HOST%' --user '%USER_NAME%' --port '%PORT%' --backup '%BACKUP_REMOTE%' --restart-timeout '%RESTART_TIMEOUT%' !NO_RESTART_ARG!"
if errorlevel 1 (
  echo [ERROR] Rollback failed.
) else (
  echo [OK] Rollback completed.
)
pause
goto menu

:end
endlocal
exit /b 0
