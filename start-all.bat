@echo off
setlocal enabledelayedexpansion

REM Starts backend and frontend in separate windows.
REM Also runs npm install if node_modules is missing.

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

echo ============================================================
echo ACDI Inventory - Starting all services
echo ROOT: %ROOT%
echo ============================================================

if not exist "%BACKEND%" (
  echo [ERROR] backend folder not found: %BACKEND%
  exit /b 1
)
if not exist "%FRONTEND%" (
  echo [ERROR] frontend folder not found: %FRONTEND%
  exit /b 1
)

call :ensure_deps "%BACKEND%"
call :ensure_deps "%FRONTEND%"

echo.
echo Launching backend: npm run dev
start "ACDI-Backend" cmd /k "cd /d "%BACKEND%" && npm run dev"

echo Launching frontend: npm run dev
start "ACDI-Frontend" cmd /k "cd /d "%FRONTEND%" && npm run dev"

echo.
echo Done. If ports are free:
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:5173
echo.

exit /b 0

:ensure_deps
set "DIR=%~1"
if exist "%DIR%\node_modules" (
  echo [OK] node_modules exists in %DIR%
  goto :eof
)

echo [INFO] node_modules missing in %DIR%
echo [INFO] Running npm install (this may take a few minutes)...
start /wait "npm install" cmd /k "cd /d "%DIR%" && npm install"
if errorlevel 1 (
  echo [ERROR] npm install failed in %DIR%
  exit /b 1
)

echo [OK] npm install completed in %DIR%
goto :eof

