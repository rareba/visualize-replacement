@echo off
REM Setup script for visualize-superset (Windows)
REM Supports both Docker and No-Docker modes

setlocal EnableDelayedExpansion

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
cd /d "%PROJECT_ROOT%"
set "PROJECT_ROOT=%CD%"

REM Default mode
set "MODE=docker"

REM Parse arguments
:parse_args
if "%~1"=="" goto :done_parse
if "%~1"=="--no-docker" (
    set "MODE=no-docker"
    shift
    goto :parse_args
)
if "%~1"=="--docker" (
    set "MODE=docker"
    shift
    goto :parse_args
)
if "%~1"=="--help" goto :show_help
if "%~1"=="-h" goto :show_help
echo [ERROR] Unknown option: %~1
echo Use --help for usage information
exit /b 1

:show_help
echo Usage: %~nx0 [OPTIONS]
echo.
echo Options:
echo   --no-docker    Setup without Docker (native mode)
echo   --docker       Setup with Docker (default)
echo   --help, -h     Show this help message
echo.
echo Examples:
echo   %~nx0                    # Setup with Docker
echo   %~nx0 --no-docker        # Setup without Docker
exit /b 0

:done_parse

echo.
echo ========================================
echo Visualize Superset Setup
echo Mode: %MODE%
echo ========================================
echo.

REM ============================================
REM Common Setup (both modes)
REM ============================================

REM Check if .env file exists
if not exist ".env" (
    echo [STEP] Creating .env file from .env.example...
    copy .env.example .env >nul
    echo [SUCCESS] .env file created.
    echo [INFO] Please update SUPERSET_SECRET_KEY with a secure value in production.
) else (
    echo [INFO] .env file already exists, skipping...
)

REM ============================================
REM Docker Mode Setup
REM ============================================

if "%MODE%"=="docker" (
    echo [STEP] Checking Docker installation...
    
    docker --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Docker not found. Please install Docker or use --no-docker mode.
        echo [INFO] Visit: https://docs.docker.com/get-docker/
        pause
        exit /b 1
    )
    
    docker-compose --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] docker-compose not found. Please install Docker Compose.
        echo [INFO] Visit: https://docs.docker.com/compose/install/
        pause
        exit /b 1
    )
    
    echo [SUCCESS] Docker is installed
    
    echo [STEP] Building Docker images...
    docker-compose build
    if errorlevel 1 (
        echo [ERROR] Failed to build Docker images
        pause
        exit /b 1
    )
    
    echo [STEP] Starting services...
    docker-compose up -d
    if errorlevel 1 (
        echo [ERROR] Failed to start services
        pause
        exit /b 1
    )
    
    echo [STEP] Waiting for services to be healthy...
    timeout /t 30 /nobreak > nul
    
    echo.
    echo ========================================
    echo [SUCCESS] Setup Complete (Docker Mode)
    echo ========================================
    echo.
    echo Services:
    echo   - Frontend:     http://localhost:3000
    echo   - Superset:     http://localhost:8088
    echo   - SPARQL Proxy: http://localhost:8089
    echo   - GraphQL:      http://localhost:8089/graphql
    echo.
    echo Default Superset credentials: admin / admin
    echo.
    echo To view logs: docker-compose logs -f
    echo To stop:      docker-compose down
    echo ========================================
    
    goto :end
)

REM ============================================
REM No-Docker Mode Setup
REM ============================================

if "%MODE%"=="no-docker" (
    echo [STEP] Setting up without Docker (native mode)...
    
    REM Check dependencies
    echo [STEP] Checking dependencies...
    
    REM Check Node.js
    node --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Node.js not found. Please install Node.js 18+
        echo [INFO] Visit: https://nodejs.org/
        pause
        exit /b 1
    )
    for /f "tokens=*" %%a in ('node --version') do set "NODE_VERSION=%%a"
    echo [SUCCESS] Node.js found: !NODE_VERSION!
    
    REM Check Python
    set "PYTHON_CMD="
    python --version >nul 2>&1
    if errorlevel 1 (
        python3 --version >nul 2>&1
        if errorlevel 1 (
            echo [ERROR] Python not found. Please install Python 3.10+
            echo [INFO] Visit: https://www.python.org/
            pause
            exit /b 1
        ) else (
            set "PYTHON_CMD=python3"
            for /f "tokens=*" %%a in ('python3 --version') do set "PYTHON_VERSION=%%a"
        )
    ) else (
        set "PYTHON_CMD=python"
        for /f "tokens=*" %%a in ('python --version') do set "PYTHON_VERSION=%%a"
    )
    echo [SUCCESS] !PYTHON_VERSION! found
    
    REM Setup SPARQL Proxy
    echo [STEP] Setting up SPARQL Proxy...
    cd /d "%PROJECT_ROOT%\sparql-proxy"
    
    REM Create virtual environment if it doesn't exist
    if not exist "venv" (
        echo [INFO] Creating Python virtual environment...
        !PYTHON_CMD! -m venv venv
        if errorlevel 1 (
            echo [ERROR] Failed to create virtual environment
            pause
            exit /b 1
        )
        echo [SUCCESS] Virtual environment created
    )
    
    REM Activate and install dependencies
    call venv\Scripts\activate.bat
    echo [INFO] Installing Python dependencies...
    pip install -q -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install Python dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Python dependencies installed
    
    cd /d "%PROJECT_ROOT%"
    
    REM Setup Frontend
    echo [STEP] Setting up Frontend...
    cd /d "%PROJECT_ROOT%\frontend"
    
    REM Install npm dependencies
    if not exist "node_modules" (
        echo [INFO] Installing npm dependencies (this may take a while)...
        call npm install
        if errorlevel 1 (
            echo [ERROR] Failed to install npm dependencies
            pause
            exit /b 1
        )
        echo [SUCCESS] npm dependencies installed
    ) else (
        echo [INFO] npm dependencies already installed
    )
    
    REM Create .env file
    if not exist ".env" (
        echo [INFO] Creating frontend .env file...
        (
            echo # SPARQL Proxy Configuration (auto-generated by setup.bat --no-docker)
            echo VITE_SPARQL_PROXY_URL=http://localhost:8089
        ) > .env
        echo [SUCCESS] .env file created
    )
    
    cd /d "%PROJECT_ROOT%"
    
    echo.
    echo ========================================
    echo [SUCCESS] Setup Complete (No-Docker Mode)
    echo ========================================
    echo.
    echo Services:
    echo   - Frontend:     http://localhost:5173
    echo   - SPARQL Proxy: http://localhost:8089
    echo   - GraphQL:      http://localhost:8089/graphql
    echo.
    echo To start the demo:
    echo   scripts\demo-start.bat
    echo   - or -
    echo   PowerShell -ExecutionPolicy Bypass -File scripts\demo-start.ps1
    echo.
    echo To start services separately:
    echo   scripts\start-dev.bat
    echo.
    echo To stop services:
    echo   scripts\stop-dev.bat
    echo.
    echo Documentation:
    echo   README-NO-DOCKER.md
    echo ========================================
    
    goto :end
)

:end
echo.
pause
