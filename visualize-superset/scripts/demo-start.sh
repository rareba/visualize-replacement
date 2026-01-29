#!/bin/bash
#
# Demo Starter Script for visualize-superset (Unix/Linux/Mac)
# This script starts all services needed for a demo without Docker
#
# Features:
# - Checks for required dependencies (Node.js, Python, pip)
# - Installs Python dependencies for sparql-proxy if needed
# - Installs npm dependencies for frontend if needed
# - Starts the SPARQL proxy service in background
# - Starts the frontend dev server
# - Opens the browser automatically
# - Handles cleanup on exit (kill background processes)
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the project root directory (parent of scripts directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Service ports
SPARQL_PROXY_PORT=8089
FRONTEND_PORT=5173

# Default LINDAS endpoint
LINDAS_ENDPOINT="https://lindas.admin.ch/query"

# PIDs for background processes
SPARQL_PID=""
FRONTEND_PID=""

# Track if cleanup has been performed
CLEANUP_DONE=0

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Function to detect OS
detect_os() {
    OS="$(uname)"
    if [[ "$OS" == "Darwin" ]]; then
        echo "macOS"
    elif [[ "$OS" == "Linux" ]]; then
        echo "Linux"
    else
        echo "Unix"
    fi
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
is_port_in_use() {
    local port=$1
    if lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on a port
kill_port_process() {
    local port=$1
    if is_port_in_use "$port"; then
        print_info "Killing process on port $port..."
        lsof -ti:"$port" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Function to check dependencies
check_dependencies() {
    print_step "Checking dependencies..."
    
    local missing_deps=()
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version | sed 's/v//')
        print_success "Node.js found: v${NODE_VERSION}"
        
        # Check version (require 18+)
        NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
        if [[ "$NODE_MAJOR" -lt 18 ]]; then
            print_error "Node.js 18+ is required. Found: v${NODE_VERSION}"
            exit 1
        fi
    else
        missing_deps+=("Node.js 18+")
        print_error "Node.js not found"
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm found: v${NPM_VERSION}"
    else
        missing_deps+=("npm")
        print_error "npm not found"
    fi
    
    # Check Python
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
        print_success "Python found: v${PYTHON_VERSION}"
        
        # Check version (require 3.10+)
        PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
        PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)
        if [[ "$PYTHON_MAJOR" -lt 3 ]] || ([[ "$PYTHON_MAJOR" -eq 3 ]] && [[ "$PYTHON_MINOR" -lt 10 ]]); then
            print_error "Python 3.10+ is required. Found: v${PYTHON_VERSION}"
            exit 1
        fi
        PYTHON_CMD="python3"
    elif command_exists python; then
        PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
        print_success "Python found: v${PYTHON_VERSION}"
        
        # Check version
        PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
        PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)
        if [[ "$PYTHON_MAJOR" -lt 3 ]] || ([[ "$PYTHON_MAJOR" -eq 3 ]] && [[ "$PYTHON_MINOR" -lt 10 ]]); then
            print_error "Python 3.10+ is required. Found: v${PYTHON_VERSION}"
            exit 1
        fi
        PYTHON_CMD="python"
    else
        missing_deps+=("Python 3.10+")
        print_error "Python not found"
    fi
    
    # Check pip
    if command_exists pip3 || command_exists pip; then
        print_success "pip found"
    else
        missing_deps+=("pip")
        print_error "pip not found"
    fi
    
    # Report missing dependencies
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        print_error "Missing dependencies:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo ""
        print_info "Please install the missing dependencies and try again."
        print_info "Visit: https://nodejs.org/ (for Node.js)"
        print_info "Visit: https://www.python.org/ (for Python)"
        exit 1
    fi
    
    print_success "All dependencies satisfied!"
}

# Function to setup SPARQL proxy
setup_sparql_proxy() {
    print_step "Setting up SPARQL Proxy..."
    
    cd "${PROJECT_ROOT}/sparql-proxy"
    
    # Create virtual environment if it doesn't exist
    if [[ ! -d "venv" ]]; then
        print_info "Creating Python virtual environment..."
        $PYTHON_CMD -m venv venv
        print_success "Virtual environment created"
    fi
    
    # Activate virtual environment
    print_info "Activating virtual environment..."
    source venv/bin/activate
    
    # Install dependencies
    print_info "Installing Python dependencies..."
    pip install -q -r requirements.txt
    print_success "Python dependencies installed"
    
    cd "$PROJECT_ROOT"
}

# Function to setup frontend
setup_frontend() {
    print_step "Setting up Frontend..."
    
    cd "${PROJECT_ROOT}/frontend"
    
    # Install npm dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        print_info "Installing npm dependencies (this may take a while)..."
        npm install
        print_success "npm dependencies installed"
    else
        print_info "npm dependencies already installed"
    fi
    
    # Create .env file if it doesn't exist
    if [[ ! -f ".env" ]]; then
        print_info "Creating .env file..."
        cat > .env << EOF
# SPARQL Proxy Configuration (auto-generated by demo-start.sh)
VITE_SPARQL_PROXY_URL=http://localhost:${SPARQL_PROXY_PORT}
EOF
        print_success ".env file created"
    else
        print_info ".env file already exists"
    fi
    
    cd "$PROJECT_ROOT"
}

# Function to start SPARQL proxy
start_sparql_proxy() {
    print_step "Starting SPARQL Proxy..."
    
    # Kill any existing process on the port
    kill_port_process $SPARQL_PROXY_PORT
    
    cd "${PROJECT_ROOT}/sparql-proxy"
    source venv/bin/activate
    
    # Set environment variables
    export LINDAS_ENDPOINT_URL="${LINDAS_ENDPOINT}"
    export LOG_LEVEL="INFO"
    
    # Start the proxy in background
    print_info "Starting SPARQL Proxy on port ${SPARQL_PROXY_PORT}..."
    python -m uvicorn src.main:app --host 0.0.0.0 --port ${SPARQL_PROXY_PORT} > "${PROJECT_ROOT}/sparql-proxy.log" 2>&1 &
    SPARQL_PID=$!
    cd "$PROJECT_ROOT"
    
    print_success "SPARQL Proxy started (PID: $SPARQL_PID)"
    
    # Wait for the service to be ready
    print_info "Waiting for SPARQL Proxy to be ready..."
    local retries=0
    local max_retries=30
    
    while [[ $retries -lt $max_retries ]]; do
        if curl -s "http://localhost:${SPARQL_PROXY_PORT}/api/v1/health" > /dev/null 2>&1; then
            print_success "SPARQL Proxy is ready!"
            return 0
        fi
        sleep 1
        ((retries++))
        echo -n "."
    done
    echo ""
    
    print_warning "SPARQL Proxy may not be fully ready yet, continuing anyway..."
    return 0
}

# Function to start frontend
start_frontend() {
    print_step "Starting Frontend..."
    
    # Kill any existing process on the port
    kill_port_process $FRONTEND_PORT
    
    cd "${PROJECT_ROOT}/frontend"
    
    print_info "Starting Frontend dev server on port ${FRONTEND_PORT}..."
    npm run dev > "${PROJECT_ROOT}/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    cd "$PROJECT_ROOT"
    
    print_success "Frontend started (PID: $FRONTEND_PID)"
    
    # Wait for the service to be ready
    print_info "Waiting for Frontend to be ready..."
    local retries=0
    local max_retries=30
    
    while [[ $retries -lt $max_retries ]]; do
        if curl -s "http://localhost:${FRONTEND_PORT}" > /dev/null 2>&1; then
            print_success "Frontend is ready!"
            return 0
        fi
        sleep 1
        ((retries++))
        echo -n "."
    done
    echo ""
    
    print_warning "Frontend may not be fully ready yet, continuing anyway..."
    return 0
}

# Function to open browser
open_browser() {
    print_step "Opening browser..."
    
    local url="http://localhost:${FRONTEND_PORT}"
    
    sleep 2
    
    case "$(detect_os)" in
        "macOS")
            open "$url"
            ;;
        "Linux")
            if command_exists xdg-open; then
                xdg-open "$url"
            elif command_exists gnome-open; then
                gnome-open "$url"
            else
                print_warning "Could not open browser automatically. Please open: $url"
            fi
            ;;
        *)
            print_warning "Could not open browser automatically. Please open: $url"
            ;;
    esac
    
    print_success "Browser opened (or attempted to open)"
}

# Function to cleanup processes on exit
cleanup() {
    if [[ $CLEANUP_DONE -eq 1 ]]; then
        return
    fi
    CLEANUP_DONE=1
    
    echo ""
    print_step "Cleaning up..."
    
    # Kill frontend process
    if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        print_info "Stopping Frontend (PID: $FRONTEND_PID)..."
        kill -9 "$FRONTEND_PID" 2>/dev/null || true
    fi
    
    # Kill SPARQL proxy process
    if [[ -n "$SPARQL_PID" ]] && kill -0 "$SPARQL_PID" 2>/dev/null; then
        print_info "Stopping SPARQL Proxy (PID: $SPARQL_PID)..."
        kill -9 "$SPARQL_PID" 2>/dev/null || true
    fi
    
    # Kill any remaining processes on the ports
    kill_port_process $SPARQL_PROXY_PORT 2>/dev/null || true
    kill_port_process $FRONTEND_PORT 2>/dev/null || true
    
    print_success "Cleanup complete!"
    echo ""
    print_info "Thank you for using visualize-superset!"
}

# Function to print status
print_status() {
    echo ""
    echo "========================================"
    echo -e "${GREEN}🚀 Demo Environment Ready!${NC}"
    echo "========================================"
    echo ""
    echo -e "${CYAN}Services:${NC}"
    echo "  📊 Frontend:     http://localhost:${FRONTEND_PORT}"
    echo "  🔌 SPARQL Proxy: http://localhost:${SPARQL_PROXY_PORT}"
    echo "  📡 LINDAS:       ${LINDAS_ENDPOINT}"
    echo ""
    echo -e "${CYAN}API Endpoints:${NC}"
    echo "  Health:    http://localhost:${SPARQL_PROXY_PORT}/api/v1/health"
    echo "  Cubes:     http://localhost:${SPARQL_PROXY_PORT}/api/v1/cubes"
    echo "  GraphQL:   http://localhost:${SPARQL_PROXY_PORT}/graphql"
    echo ""
    echo -e "${CYAN}Logs:${NC}"
    echo "  SPARQL Proxy: ${PROJECT_ROOT}/sparql-proxy.log"
    echo "  Frontend:     ${PROJECT_ROOT}/frontend.log"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo "  Stop services: Press Ctrl+C"
    echo "========================================"
    echo ""
}

# Function to handle Ctrl+C
trap_ctrlc() {
    echo ""
    print_warning "Received interrupt signal"
    cleanup
    exit 0
}

# Main function
main() {
    # Set up trap for cleanup
    trap trap_ctrlc INT TERM
    
    # Print header
    echo ""
    echo "========================================"
    echo -e "${CYAN}Visualize-Superset Demo Starter${NC}"
    echo -e "${CYAN}Platform:${NC} $(detect_os)"
    echo "========================================"
    echo ""
    
    # Check dependencies
    check_dependencies
    echo ""
    
    # Setup services
    setup_sparql_proxy
    echo ""
    
    setup_frontend
    echo ""
    
    # Start services
    start_sparql_proxy
    echo ""
    
    start_frontend
    echo ""
    
    # Open browser
    open_browser
    echo ""
    
    # Print status
    print_status
    
    # Keep script running
    print_info "Services are running. Press Ctrl+C to stop."
    echo ""
    
    # Wait for interrupt
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"
