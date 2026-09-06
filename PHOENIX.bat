@echo off
set "SYS=%SystemRoot%\System32"
set "PHOENIX_SERVICE=%~dp0service"
set "PHOENIX_SHELL=%~dp0service\tauri\src-tauri\target\release\phoenix-shell.exe"
set "PHOENIX_SHELL_WD=%~dp0service\tauri"

:: Check if already running
"%SYS%\netstat.exe" -ano | "%SYS%\findstr.exe" ":7777 " | "%SYS%\findstr.exe" "LISTENING" >NUL 2>&1
if %ERRORLEVEL% EQU 0 goto ALREADY_RUNNING

:: ── Fresh start ─────────────────────────────────────────────
echo [Phoenix] Starting server...
cd /d "%PHOENIX_SERVICE%"
start "Phoenix Server" cmd /c phoenix-loop.bat

echo [Phoenix] Waiting for Carrier...
set ATTEMPTS=0
:CARRIERLOOP
set /a ATTEMPTS+=1
if %ATTEMPTS% GTR 40 goto FAILED
"%SYS%\ping.exe" -n 2 127.0.0.1 >NUL 2>&1
"%SYS%\curl.exe" -s --max-time 2 "http://127.0.0.1:7777/health" >NUL 2>&1
if %ERRORLEVEL% NEQ 0 goto CARRIERLOOP
goto WAITCRAFT

:: ── Already running ─────────────────────────────────────────
:: PHOENIX.bat is invoked to OPEN the dashboard. If you actually want to shut
:: down the whole server, do it from the dashboard's Settings panel or stop
:: the Phoenix Windows service from services.msc — don't accidentally Q-quit
:: here and kill the Carrier mid-task.
:ALREADY_RUNNING
goto WAITCRAFT

:: ── Wait for Craft to be ready ───────────────────────────────
:WAITCRAFT
echo [Phoenix] Waiting for Craft...
set ATTEMPTS=0
:CRAFTLOOP
set /a ATTEMPTS+=1
if %ATTEMPTS% GTR 60 goto FAILED
"%SYS%\ping.exe" -n 2 127.0.0.1 >NUL 2>&1
"%SYS%\curl.exe" -s --max-time 2 "http://127.0.0.1:7777/api/carrier/ready" >NUL 2>&1
if %ERRORLEVEL% NEQ 0 goto CRAFTLOOP

echo [Phoenix] UP - opening dashboard...
start "" /D "%PHOENIX_SHELL_WD%" "%PHOENIX_SHELL%"
exit /b 0

:FAILED
echo [Phoenix] Server failed to start. Check the "Phoenix Server" window for errors.
"%SYS%\timeout.exe" /t 15 /nobreak
exit /b 1
