#!/bin/bash
# Setup script for visualize-superset
# Supports both Docker and No-Docker modes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print functions
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

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Default mode
MODE="docker"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-docker)
            MODE="no-docker"
            shift
            ;;
        --docker)
            MODE="docker"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --no-docker    Setup without Docker (native mode)"
            echo "  --docker       Setup with Docker (default)"
            echo "  --help, -h     Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Setup with Docker"
            echo "  $0 --no-docker        # Setup without Docker"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo ""
echo "========================================"
echo -e "${CYAN}Visualize Superset Setup${NC}"
echo "Mode: $MODE"
echo "========================================"
echo ""

# ============================================
# Common Setup (both modes)
# ============================================

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_step "Creating .env file from .env.example..."
    cp .env.example .env
    
    # Generate a random secret key
    if command -v openssl >/dev/null 2>&1; then
        SECRET_KEY=$(openssl rand -base64 42 | tr -dc 'a-zA-Z0-9' | head -c 64)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/your-secret-key-change-in-production-minimum-42-chars/$SECRET_KEY/" .env
        else
            # Linux
            sed -i "s/your-secret-key-change-in-production-minimum-42-chars/$SECRET_KEY/" .env
        fi
        print_success ".env file created with generated secret key"
    else
        print_warning ".env file created. Please update SUPERSET_SECRET_KEY manually."
    fi
else
    print_info ".env file already exists, skipping..."
fi

# ============================================
# Docker Mode Setup
# ============================================

if [[ "$MODE" == "docker" ]]; then
    print_step "Checking Docker installation..."
    
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker not found. Please install Docker or use --no-docker mode."
        print_info "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose >/dev/null 2>&1; then
        print_error "docker-compose not found. Please install Docker Compose."
        print_info "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_success "Docker is installed"
    
    print_step "Building Docker images..."
    docker-compose build
    
    print_step "Starting services..."
    docker-compose up -d
    
    print_step "Waiting for services to be healthy..."
    sleep 30
    
    echo ""
    echo "========================================"
    print_success "Setup Complete (Docker Mode)"
    echo "========================================"
    echo ""
    echo "Services:"
    echo "  - Frontend:     http://localhost:3000"
    echo "  - Superset:     http://localhost:8088"
    echo "  - SPARQL Proxy: http://localhost:8089"
    echo "  - GraphQL:      http://localhost:8089/graphql"
    echo ""
    echo "Default Superset credentials: admin / admin"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop:      docker-compose down"
    echo "========================================"

# ============================================
# No-Docker Mode Setup
# ============================================

else
    print_step "Setting up without Docker (native mode)..."
    
    # Check dependencies
    print_step "Checking dependencies..."
    
    # Check Node.js
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version | sed 's/v//')
        NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
        if [[ "$NODE_MAJOR" -lt 18 ]]; then
            print_error "Node.js 18+ is required. Found: v${NODE_VERSION}"
            exit 1
        fi
        print_success "Node.js found: v${NODE_VERSION}"
    else
        print_error "Node.js not found. Please install Node.js 18+"
        print_info "Visit: https://nodejs.org/"
        exit 1
    fi
    
    # Check Python
    PYTHON_CMD=""
    if command -v python3 >/dev/null 2>&1; then
        PYTHON_CMD="python3"
    elif command -v python >/dev/null 2>&1; then
        PYTHON_CMD="python"
    else
        print_error "Python not found. Please install Python 3.10+"
        print_info "Visit: https://www.python.org/"
        exit 1
    fi
    
    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
    print_success "Python found: v${PYTHON_VERSION}"
    
    # Setup SPARQL Proxy
    print_step "Setting up SPARQL Proxy..."
    cd "${PROJECT_ROOT}/sparql-proxy"
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_info "Creating Python virtual environment..."
        $PYTHON_CMD -m venv venv
        print_success "Virtual environment created"
    fi
    
    # Activate and install dependencies
    source venv/bin/activate
    print_info "Installing Python dependencies..."
    pip install -q -r requirements.txt
    print_success "Python dependencies installed"
    
    cd "$PROJECT_ROOT"
    
    # Setup Frontend
    print_step "Setting up Frontend..."
    cd "${PROJECT_ROOT}/frontend"
    
    # Install npm dependencies
    if [ ! -d "node_modules" ]; then
        print_info "Installing npm dependencies (this may take a while)..."
        npm install
        print_success "npm dependencies installed"
    else
        print_info "npm dependencies already installed"
    fi
    
    # Create .env file
    if [ ! -f ".env" ]; then
        print_info "Creating frontend .env file..."
        cp .env.example .env
        echo "VITE_SPARQL_PROXY_URL=http://localhost:8089" >> .env
        print_success ".env file created"
    fi
    
    cd "$PROJECT_ROOT"
    
    # Make scripts executable
    print_step "Making scripts executable..."
    chmod +x scripts/*.sh
    print_success "Scripts are now executable"
    
    echo ""
    echo "========================================"
    print_success "Setup Complete (No-Docker Mode)"
    echo "========================================"
    echo ""
    echo "Services:"
    echo "  - Frontend:     http://localhost:5173"
    echo "  - SPARQL Proxy: http://localhost:8089"
    echo "  - GraphQL:      http://localhost:8089/graphql"
    echo ""
    echo "To start the demo:"
    echo "  scripts/demo-start.sh"
    echo ""
    echo "To start services separately:"
    echo "  scripts/start-dev.sh"
    echo ""
    echo "To stop services:"
    echo "  scripts/stop-dev.sh"
    echo ""
    echo "Documentation:"
    echo "  README-NO-DOCKER.md"
    echo "========================================"
fi

echo ""
