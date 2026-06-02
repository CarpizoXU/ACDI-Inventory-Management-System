@echo off
title ACDI Inventory System - Automated Defense Setup
echo ===================================================
echo   ACDI INVENTORY SYSTEM - PROFESSOR DEPLOYMENT
echo ===================================================
echo.

:: 1. Check if Node.js is installed
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [!] Node.js is missing on this computer.
    echo [*] Downloading and installing Node.js automatically...
    winget install OpenJS.NodeJS -e --silent --accept-source-agreements --accept-package-agreements
    echo.
    echo [!] Node.js installed! PLEASE CLOSE THIS WINDOW AND DOUBLE CLICK THIS FILE AGAIN.
    pause
    exit
) ELSE (
    echo [OK] Node.js is installed.
)

:: 2. Check and Install Backend Dependencies
echo.
echo [*] Checking Backend Dependencies...
cd backend
:: Ensure backend .env exists (do not overwrite existing)
IF NOT EXIST "\.env" (
    echo REM Backend .env created by install.bat. Fill in real values.> .env
    echo REM See .env.example for required variables.>> .env
    echo [*] Created backend\.env - please update it with real values. 
) ELSE (
    echo [OK] backend\.env already exists.
)
IF EXIST "node_modules\" (
    echo [OK] Backend modules already installed! Skipping...
) ELSE (
    echo [*] Installing Backend Node Modules (this might take a minute)...
    call npm install
)
cd ..

:: 3. Check and Install Frontend Dependencies
echo.
echo [*] Checking Frontend Dependencies...
cd frontend
:: Ensure frontend .env exists (do not overwrite existing)
IF NOT EXIST "\.env" (
    echo REM Frontend .env created by install.bat. Fill in real values.> .env
    echo REM Example: VITE_API_BASE_URL=http://localhost:5000 >> .env
    echo [*] Created frontend\.env - please update it with real values. 
) ELSE (
    echo [OK] frontend\.env already exists.
)
IF EXIST "node_modules\" (
    echo [OK] Frontend modules already installed! Skipping...
) ELSE (
    echo [*] Installing Frontend Node Modules (this might take a minute)...
    call npm install
)
cd ..

:: 4. Start the Application
echo.
echo [*] All dependencies are ready! Starting the servers...

:: Start Backend in background
start "ACDI Backend" /b cmd /c "cd backend && npm run dev"

:: Wait 3 seconds for database connection
timeout /t 3 /nobreak >nul

:: Start Frontend in background
start "ACDI Frontend" /b cmd /c "cd frontend && npm run dev"

:: Wait 2 seconds for Vite
timeout /t 2 /nobreak >nul

:: Open Professor's Browser automatically
start http://localhost:5173/

echo.
echo ===================================================
echo   SUCCESS! The application is now running.
echo   You can minimize this window during the defense.
echo ===================================================
pause
localhost