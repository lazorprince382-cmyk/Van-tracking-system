@echo off
title The Ocean Ride Launcher
cd /d "%~dp0"

echo ========================================
echo       THE OCEAN RIDE - STARTING
echo ========================================
echo.

if not exist "logs" mkdir "logs"

echo [1/3] Starting backend...
start "Ocean Ride Backend" /min "%~dp0run-backend.cmd"

echo [2/3] Starting frontend...
start "Ocean Ride Frontend" /min "%~dp0run-frontend.cmd"

echo [3/3] Waiting for services...
timeout /t 10 /nobreak >nul

echo Opening http://localhost:5173
start "" "http://localhost:5173"
echo.
echo If the page is not ready, wait five seconds and reload it.
echo Keep the Backend and Frontend windows running.
echo.
pause
