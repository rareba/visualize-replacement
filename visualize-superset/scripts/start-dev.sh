#!/bin/bash
# Start both frontend and SPARQL proxy on Unix/Linux/Mac
# This script starts both services in background

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
echo "Starting Development Environment (No Docker)"
echo "========================================"
echo ""
echo "This will start two services in background:"
echo "1. SPARQL Proxy (port 8089) - logs in sparql-proxy-proxy.log"
echo "2. Frontend (port 5173) - logs in frontend-dev.log"
echo ""
echo "You can stop them by running: scripts/stop-dev.sh"
echo "========================================"
echo ""

# Kill any existing processes on the ports
echo "Checking for existing processes..."
lsof -ti:8089 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start SPARQL Proxy in background
echo "Starting SPARQL Proxy..."
cd "$(dirname "$0")/sparql-proxy"
bash -c './start-sparql-proxy.sh > ../sparql-proxy-proxy.log 2>&1' &
SPARQL_PID=$!
echo "SPARQL Proxy started (PID: $SPARQL_PID)"

# Wait a moment for SPARQL Proxy to start
sleep 3

# Start Frontend in background
echo "Starting Frontend..."
cd "$(dirname "$0")/frontend"
bash -c '../scripts/start-frontend.sh > ../frontend-dev.log 2>&1' &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

cd ..

echo ""
echo "========================================"
echo "Development environment started!"
echo "SPARQL Proxy: http://localhost:8089"
echo "Frontend: http://localhost:5173"
echo ""
echo "To view logs:"
echo "  SPARQL Proxy: tail -f sparql-proxy-proxy.log"
echo "  Frontend: tail -f frontend-dev.log"
echo ""
echo "To stop: scripts/stop-dev.sh"
echo "========================================"
