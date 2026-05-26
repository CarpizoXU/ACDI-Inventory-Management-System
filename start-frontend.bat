@echo off
setlocal

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"

if not exist "%FRONTEND%" (
  echo [ERROR] frontend folder not found: %FRONTEND%
  exit /b 1
)

if not exist "%FRONTEND%\node_modules" (
  echo [INFO] node_modules missing in frontend. Running npm install...
  pushd "%FRONTEND%"
  npm install
  if errorlevel 1 (
    popd
    echo [ERROR] npm install failed.
    exit /b 1
  )
  popd
)

echo [INFO] Starting frontend: npm run dev
start "ACDI-Frontend" cmd /k "cd /d \"%FRONTEND%\" && npm run dev"

