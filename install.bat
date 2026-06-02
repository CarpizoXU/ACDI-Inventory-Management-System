@echo off
setlocal EnableDelayedExpansion

title ACDI Inventory System - Automated Defense Setup

echo ===================================================
echo   ACDI INVENTORY SYSTEM - PROFESSOR DEPLOYMENT
echo ===================================================
echo.

:: Check Node.js
node -v >nul 2>&1

if errorlevel 1 (
    echo [ERROR] Node.js is not installed.
    echo.
    echo Please install Node.js:
    echo https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js is installed.
echo.

:: Backend
echo [*] Checking Backend Dependencies...
cd backend
IF EXIST "node_modules\" (
    echo [OK] Backend modules already installed! Skipping...
) ELSE (
    echo [*] Installing Backend Node Modules (this might take a minute)...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Backend installation failed.
        pause
        exit /b 1
    )
    cd ..
)

echo.

:: Frontend
echo [*] Checking Frontend Dependencies...
cd frontend
IF EXIST "node_modules\" (
    echo [OK] Frontend modules already installed! Skipping...
) ELSE (
    echo [*] Installing Frontend Node Modules (this might take a minute)...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Frontend installation failed.
        pause
        exit /b 1
    )
    cd ..
)

echo.
echo [*] Starting Backend...

start "ACDI Backend" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo [*] Starting Frontend...

start "ACDI Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo [*] Opening Browser...

start http://localhost:5173

echo.
echo ===================================================
echo ACDI Inventory System is now running.
echo ===================================================
echo.
pause
localhost
