@echo off
:: Phoenix Respawn Loop
:: Uses full System32 paths to bypass git bash PATH shadowing of timeout
set "SYS=%SystemRoot%\System32"
cd /d "%~dp0"

:RESPAWN
echo.
echo [Phoenix Server] --- Starting Node.js Server ---
echo.
node phoenix.js start
if %ERRORLEVEL% EQU 0 (
    echo [Phoenix Server] Clean exit.
    "%SYS%\timeout.exe" /t 5 /nobreak
    exit /b 0
)
echo.
echo [Phoenix Server] !!! SERVER CRASHED - Exit code: %ERRORLEVEL% !!!
echo [Phoenix Server] Restarting in 5s... (close this window to stop)
echo.
"%SYS%\timeout.exe" /t 5 /nobreak >NUL
goto RESPAWN
