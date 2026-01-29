@echo off
REM Starter script for SPARQL Proxy (no Docker) - Windows
REM Prerequisites: Python 3.10+, pip

echo ========================================
echo Starting SPARQL Proxy (No Docker)
echo ========================================

cd /d "%~dp0..\sparql-proxy"

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo Failed to create virtual environment. Please ensure Python 3.10+ is installed.
        echo You can check your Python version with: python --version
        pause
        exit /b 1
    )
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install requirements
echo Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo Starting SPARQL Proxy...
echo SPARQL Proxy will be available at: http://localhost:8089
echo.
echo Press Ctrl+C to stop the server
echo ========================================

python -m uvicorn src.main:app --host 0.0.0.0 --port 8089

pause
