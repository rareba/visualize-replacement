@echo off
REM Stop all development services on Windows

echo ========================================
echo Stopping Development Environment
echo ========================================

REM Find and kill processes on port 8089 (SPARQL Proxy)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8089"') do (
    echo Killing SPARQL Proxy (PID: %%a)...
    taskkill /F /PID %%a 2>nul
)

REM Find and kill processes on port 5173 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173"') do (
    echo Killing Frontend (PID: %%a)...
    taskkill /F /PID %%a 2>nul
)

echo ========================================
echo Development environment stopped!
echo ========================================
