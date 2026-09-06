@echo off
echo [Phoenix DEBUG] --- STARTING PHOENIX IN FOREGROUND ---
echo.

set "PHOENIX_ROOT=%~dp0"
set "PHOENIX_SERVICE=%~dp0service"

echo [Phoenix DEBUG] Root: %PHOENIX_ROOT%
echo [Phoenix DEBUG] Service: %PHOENIX_SERVICE%
echo.

echo [Phoenix DEBUG] Step 1: Checking Node.js version...
node -v
if %ERRORLEVEL% NEQ 0 (
    echo [Phoenix DEBUG] ERROR: Node.js not found in PATH!
    pause
    exit /b 1
)

echo.
echo [Phoenix DEBUG] Step 2: Checking for existing port 7777...
netstat -ano | findstr ":7777 " | findstr "LISTENING"
if %ERRORLEVEL% EQU 0 (
    echo [Phoenix DEBUG] WARNING: Something is already on port 7777.
) else (
    echo [Phoenix DEBUG] Port 7777 is free.
)

echo.
echo [Phoenix DEBUG] Step 3: Checking dependencies in service/node_modules...
if not exist "%PHOENIX_SERVICE%\node_modules" (
    echo [Phoenix DEBUG] ERROR: node_modules folder is missing!
    pause
    exit /b 1
)

echo.
echo [Phoenix DEBUG] Step 4: Starting Node server (foreground)...
echo [Phoenix DEBUG] Press Ctrl+C to stop.
echo.

cd /d "%PHOENIX_SERVICE%"
node phoenix.js start

echo.
echo [Phoenix DEBUG] Server exited with code: %ERRORLEVEL%
echo.
pause
