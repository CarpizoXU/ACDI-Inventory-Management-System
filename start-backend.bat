@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"

if not exist "%BACKEND%" (
  echo [ERROR] backend folder not found: %BACKEND%
  exit /b 1
)

if not exist "%BACKEND%\node_modules" (
  echo [INFO] node_modules missing in backend. Running npm install...
  pushd "%BACKEND%"
  npm install
  if errorlevel 1 (
    popd
    echo [ERROR] npm install failed.
    exit /b 1
  )
  popd
)

echo [INFO] Starting backend: npm run dev
start "ACDI-Backend" cmd /k "cd /d \"%BACKEND%\" && npm run dev"

