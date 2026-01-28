@echo off
REM Starter script for frontend (no Docker) - Windows
REM Prerequisites: Node.js 18+, npm

echo ========================================
echo Starting Frontend (No Docker)
echo ========================================

cd /d "%~dp0..\frontend"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if .env exists, if not create it
if not exist ".env" (
    echo Creating .env file for local development...
    (
        echo # SPARQL Proxy Configuration (for local development without Docker)
        echo VITE_SPARQL_PROXY_URL=http://localhost:8089
    ) > .env
    echo .env file created successfully
)

echo Starting development server...
echo Frontend will be available at: http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo ========================================

call npm run dev

pause
