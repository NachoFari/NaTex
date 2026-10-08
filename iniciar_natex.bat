@echo off
cd /d "%~dp0"
taskkill /F /IM cloudflared.exe >nul 2>&1

if exist "NaTex.exe" (
    start "" "NaTex.exe"
) else (
    start "" pythonw app.py
)
exit