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
set "SSH_COMMON=-o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 -o ServerAliveInterval=5 -o ServerAliveCountMax=2"

set "HOST="
set /p HOST=Host [%DEFAULT_HOST%]: 
if not defined HOST set "HOST=%DEFAULT_HOST%"

set "USER_NAME="
set /p USER_NAME=User [%DEFAULT_USER%]: 
if not defined USER_NAME set "USER_NAME=%DEFAULT_USER%"

set "PORT="
set /p PORT=SSH port [%DEFAULT_PORT%]: 
if not defined PORT set "PORT=%DEFAULT_PORT%"

echo.
echo Uploading health-check script...
wsl bash -lc "scp -P '%PORT%' %SSH_COMMON% '%REPO_WSL%/scripts/check_nanokvm_health.sh' '%USER_NAME%@%HOST%:/tmp/check_nanokvm_health.sh'"
if errorlevel 1 (
  echo [ERROR] Failed to upload script.
  pause
  exit /b 1
)

echo.
echo Running health check on %HOST% ...
wsl bash -lc "ssh -p '%PORT%' %SSH_COMMON% '%USER_NAME%@%HOST%' 'chmod +x /tmp/check_nanokvm_health.sh; LOG=/tmp/nanokvm_health_\$(date +%%F-%%H%%M%%S).log; /tmp/check_nanokvm_health.sh | tee \"\$LOG\"; echo; echo LOG_PATH=\"\$LOG\"'"
if errorlevel 1 (
  echo [ERROR] Health check command failed.
  pause
  exit /b 1
)

echo.
echo Downloading latest log to build\health ...
wsl bash -lc "set -e; mkdir -p '%REPO_WSL%/build/health'; LATEST=\$(ssh -p '%PORT%' %SSH_COMMON% '%USER_NAME%@%HOST%' 'ls -1t /tmp/nanokvm_health_*.log 2>/dev/null | head -n 1'); if [ -z \"\$LATEST\" ]; then echo 'No remote log file found'; exit 1; fi; scp -P '%PORT%' %SSH_COMMON% '%USER_NAME%@%HOST%:'\"\$LATEST\" '%REPO_WSL%/build/health/'; echo Saved: \$LATEST"
if errorlevel 1 (
  echo [WARN] Could not download log automatically.
  echo You can fetch it manually from /tmp on the device.
  pause
  exit /b 1
)

echo.
echo [OK] Completed.
echo Local logs folder: %REPO_WIN%\build\health
pause
endlocal
exit /b 0
