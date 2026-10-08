@echo off
title Instalador NaTex Studio 🦊
echo ======================================================
echo          Instalador de Acceso Directo - NaTex 🦊
echo ======================================================
echo.
echo Creando acceso directo en el Escritorio...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'NaTex Studio.lnk')); $s.TargetPath = [System.IO.Path]::Combine('%~dp0', 'NaTex.exe'); $s.WorkingDirectory = '%~dp0'; $s.Description = 'NaTex Studio - Editor LaTeX Cientifico y Colaborativo'; $s.Save()"
echo.
echo [LISTO] Acceso directo 'NaTex Studio' creado en tu Escritorio!
echo Ya puedes abrir NaTex directamente desde tu Escritorio.
echo.
pause