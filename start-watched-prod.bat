@echo off
setlocal
title Watched Production

echo Starting Watched production via WSL Ubuntu...
wsl.exe --distribution Ubuntu --cd "%~dp0." --exec bash scripts/production.sh start
set "EXIT_CODE=%ERRORLEVEL%"

if "%EXIT_CODE%"=="130" set "EXIT_CODE=0"
if not "%EXIT_CODE%"=="0" echo Watched production exited with code %EXIT_CODE%.

pause
exit /b %EXIT_CODE%
