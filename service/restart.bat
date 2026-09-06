@echo off
echo [Phoenix] Stopping server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7777 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 /noq >nul
echo [Phoenix] Starting server...
cd /d "%~dp0"
start /b node phoenix.js start
timeout /t 3 /noq >nul
curl -s http://localhost:7777/health
echo.
echo [Phoenix] Restart complete.
