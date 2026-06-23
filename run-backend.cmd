@echo off
title Ocean Ride Backend - DO NOT CLOSE
cd /d "%~dp0backend"
set "DATABASE_URL=postgresql://postgres:pri372%%23nce@localhost:5432/van_tracker"
echo Starting Ocean Ride backend on port 4000...
"C:\Program Files\nodejs\node.exe" dist\server.js
echo.
echo BACKEND STOPPED OR FAILED.
echo Check that PostgreSQL is running on port 5432.
pause
