@echo off
setlocal

cd /d "%~dp0"

start "ACDI Backend" cmd /k "cd backend && npm run dev"
start "ACDI Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 5 >nul
start "" http://localhost:5173

endlocal
