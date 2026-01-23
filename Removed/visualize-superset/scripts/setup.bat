@echo off
REM Setup script for visualize-superset (Windows)

echo === Visualize Superset Setup ===
echo.

REM Check if .env file exists
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo .env file created. Please update SUPERSET_SECRET_KEY with a secure value.
) else (
    echo .env file already exists, skipping...
)

echo.
echo Building Docker images...
docker-compose build

echo.
echo Starting services...
docker-compose up -d

echo.
echo Waiting for services to be healthy...
timeout /t 30 /nobreak > nul

echo.
echo === Setup Complete ===
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
