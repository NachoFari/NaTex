@echo off
cd /d "%~dp0"
title NaTex Studio 🦊
echo ======================================================
echo                  NaTex Studio 🦊
echo ======================================================
echo.
echo [1/2] Verificando y liberando puerto 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1

echo [2/2] Iniciando NaTex y abriendo navegador...
echo.
python app.py
pause
