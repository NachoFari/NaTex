@echo off
cd /d "%~dp0"
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1

if exist "NaTex.exe" (
    start "" "NaTex.exe"
) else (
    start "" pythonw app.py
)
exit