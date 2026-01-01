@echo off
title Starting Watched App...

echo 🚀 Starting Watched app via WSL...

REM Check if WSL is available
wsl --version >nul 2>&1
if errorlevel 1 (
    echo ❌ WSL is not available. Please install WSL first.
    pause
    exit /b 1
)

REM Run the startup script inside WSL
echo 🔧 Starting services via WSL...
REM Use explicit distro and login shell so user profiles are loaded (nvm, etc.)
wsl -d Ubuntu -e bash -lc "cd /var/www/watched && ./start-watched.sh"

echo ✅ All services stopped.
pause
