@echo off
cd /d "%~dp0"
if exist "%LocalAppData%\Programs\Python\Python312\python.exe" (
    "%LocalAppData%\Programs\Python\Python312\python.exe" app.py
) else (
    where python >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        python app.py
    ) else (
        py app.py
    )
)
pause
