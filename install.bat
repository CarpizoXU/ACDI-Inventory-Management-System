@echo off
setlocal

REM ACDI Inventory Management System dependency installer
REM Run this file from the project root on another computer.

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js is not installed or not on PATH.
    echo Install Node.js from https://nodejs.org/ and try again.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo npm is not installed or not on PATH.
    echo Install Node.js from https://nodejs.org/ and try again.
    pause
    exit /b 1
)

echo Installing backend dependencies...
cd /d "%~dp0backend"
call npm install
if errorlevel 1 (
    echo Backend dependency installation failed.
    pause
    exit /b 1
)

echo Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (
    echo Frontend dependency installation failed.
    pause
    exit /b 1
)

echo.
echo Dependency setup complete.
echo Next steps:
if exist "%~dp0backend\.env" (
    echo - Backend .env already exists.
) else (
    echo - Copy backend/.env.example to backend/.env and update values.
)

if exist "%~dp0frontend\.env" (
    echo - Frontend .env already exists.
) else (
    echo - Copy frontend/.env.example to frontend/.env if needed.
)

echo - Start MongoDB.

echo - Run backend with: npm --prefix backend run dev

echo - Run frontend with: npm --prefix frontend run dev

echo.
pause
endlocal
