#!/bin/bash
# Starter script for frontend (no Docker) - Unix/Linux/Mac
# Prerequisites: Node.js 18+, npm

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
echo "Starting Frontend (No Docker)"
echo "========================================"

cd "$(dirname "$0")/../frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Failed to install dependencies"
        exit 1
    fi
fi

# Check if .env exists, if not create from example
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env from .env.example"
        cp .env.example .env
        # Add SPARQL proxy URL for local development
        echo "VITE_SPARQL_PROXY_URL=http://localhost:8089" >> .env
    fi
fi

echo "Starting development server..."
echo "Frontend will be available at: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"

npm run dev
