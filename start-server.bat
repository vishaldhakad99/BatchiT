@echo off
title BatchiT Backend Server
color 0A
echo ========================================================
echo               BatchiT Server Launcher
echo ========================================================
echo.
echo Checking IP Address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    echo [Local IP]: %%a
)
echo.
echo Starting MongoDB & Backend Server on port 5000...
echo Keep this window OPEN while using the mobile app or web!
echo.
cd /d "%~dp0server"
node src/server.js
pause
