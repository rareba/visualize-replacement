@echo off
REM Quick Start Script for Visualize Development (Windows)
REM Usage: start-dev.bat

echo 🚀 Starting Visualize Development Environment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Check if pg_hba.conf exists, create if not
if not exist "pg_hba.conf" (
    echo 📝 Creating pg_hba.conf...
    (
        echo # PostgreSQL Client Authentication Configuration File
        echo local   all             all                                     trust
        echo host    all             all             127.0.0.1/32            trust
        echo host    all             all             ::1/128                 trust
        echo host    all             all             0.0.0.0/0               trust
    ) > pg_hba.conf
)

REM Start services
echo 🐳 Starting Docker containers...
docker-compose -f docker-compose.dev.yml up --build -d

REM Wait for services
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo ✅ Visualize is running!
echo.
echo 📊 Access the application at: http://localhost:3000
echo 🗄️  Database is available at: localhost:5433
echo.
echo 📋 Useful commands:
echo    View logs:     docker-compose -f docker-compose.dev.yml logs -f
echo    Stop:          docker-compose -f docker-compose.dev.yml down
echo    Restart:       docker-compose -f docker-compose.dev.yml restart
echo.
pause
