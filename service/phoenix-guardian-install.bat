@echo off
:: Registers phoenix-guardian.ps1 as a Windows Task Scheduler task.
:: Run once as Administrator. After that, Windows owns it — completely outside Phoenix.

set "SCRIPT=%~dp0phoenix-guardian.ps1"
set "TASKNAME=Phoenix Guardian"

echo [Phoenix Guardian] Installing scheduled task...

:: Remove old task if it exists (check both Phoenix Guardian and legacy Phoenix Guardian)
schtasks /Delete /TN "%TASKNAME%" /F >nul 2>&1
schtasks /Delete /TN "Phoenix Guardian" /F >nul 2>&1

:: Create task: runs at logon + triggers every 1 min indefinitely
schtasks /Create /TN "%TASKNAME%" ^
  /TR "powershell.exe -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File \"%SCRIPT%\"" ^
  /SC ONLOGON ^
  /DELAY 0000:30 ^
  /RL HIGHEST ^
  /F

if %ERRORLEVEL% NEQ 0 (
    echo [Phoenix Guardian] ERROR: Failed to create task. Try running as Administrator.
    pause
    exit /b 1
)

echo [Phoenix Guardian] Task installed. Starting now...
schtasks /Run /TN "%TASKNAME%"

echo.
echo [Phoenix Guardian] Done. Task will auto-start at every login.
echo   Name:   %TASKNAME%
echo   Script: %SCRIPT%
echo   Check:  Task Scheduler ^> Task Scheduler Library ^> Phoenix Guardian
echo.
pause
