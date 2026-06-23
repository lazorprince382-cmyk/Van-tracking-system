@echo off
title Ocean Ride Frontend - DO NOT CLOSE
cd /d "%~dp0frontend"
echo Starting Ocean Ride frontend on port 5173...
call "C:\Program Files\nodejs\npm.cmd" run dev -- --host 127.0.0.1
echo.
echo FRONTEND STOPPED OR FAILED.
pause
