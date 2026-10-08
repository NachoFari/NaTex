@echo off
cd /d "%~dp0"
title Subiendo NaTex a GitHub 🚀
echo ======================================================
echo              Subiendo NaTex Studio a GitHub 🚀
echo ======================================================
echo.
echo [1/2] Subiendo rama de produccion (main)...
git push -u origin main
echo.
echo [2/2] Subiendo rama de desarrollo (dev)...
git push -u origin dev
echo.
echo ======================================================
echo [LISTO] Ambas ramas subidas exitosamente a GitHub!
echo ======================================================
echo.
pause