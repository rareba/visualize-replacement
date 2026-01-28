@echo off
REM Start both frontend and SPARQL proxy on Windows
REM This script opens both services in separate terminal windows

echo ========================================
echo Starting Development Environment (No Docker)
echo ========================================
echo.
echo This will open two terminal windows:
echo 1. SPARQL Proxy (port 8089)
echo 2. Frontend (port 5173)
echo.
echo You can close individual windows to stop specific services.
echo ========================================

REM Start SPARQL Proxy in new window
start "SPARQL Proxy" cmd /k "start-sparql-proxy.bat"

REM Wait a moment for SPARQL Proxy to start
timeout /t 3 /nobreak >nul

REM Start Frontend in new window
start "Frontend" cmd /k "start-frontend.bat"

echo.
echo Development environment started!
echo SPARQL Proxy: http://localhost:8089
echo Frontend: http://localhost:5173
echo.
