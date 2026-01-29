#!/bin/bash
# Starter script for SPARQL Proxy (no Docker) - Unix/Linux/Mac
# Prerequisites: Python 3.10+, pip

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
echo "Starting SPARQL Proxy (No Docker)"
echo "========================================"

cd "$(dirname "$0")/../sparql-proxy"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "Failed to create virtual environment. Please ensure Python 3.10+ is installed."
        echo "You can check your Python version with: python3 --version"
        exit 1
    fi
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Failed to install dependencies"
    exit 1
fi

echo "Starting SPARQL Proxy..."
echo "SPARQL Proxy will be available at: http://localhost:8089"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"

python -m uvicorn src.main:app --host 0.0.0.0 --port 8089
