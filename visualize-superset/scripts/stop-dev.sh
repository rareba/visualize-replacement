#!/bin/bash
# Stop all development services on Unix/Linux/Mac

# Detect OS
OS="$(uname)"
if [[ "$OS" == "Darwin" ]]; then
    echo "Detected macOS"
elif [[ "$OS" == "Linux" ]]; then
    echo "Detected Linux"
else
    echo "Detected Unix-like system"
fi

echo "========================================"
echo "Stopping Development Environment"
echo "========================================"

# Kill processes on port 8089 (SPARQL Proxy)
if lsof -Pi :8089 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Stopping SPARQL Proxy..."
    lsof -ti:8089 | xargs kill -9 2>/dev/null
    echo "SPARQL Proxy stopped"
else
    echo "SPARQL Proxy not running"
fi

# Kill processes on port 5173 (Frontend)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Stopping Frontend..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    echo "Frontend stopped"
else
    echo "Frontend not running"
fi

echo "========================================"
echo "Development environment stopped!"
echo "========================================"
