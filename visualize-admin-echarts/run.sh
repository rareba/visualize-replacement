#!/usr/bin/env bash
#
# Cross-platform run script for Linux and macOS
#
# Usage:
#   ./run.sh                  - Setup and run development server
#   ./run.sh setup            - Run setup only
#   ./run.sh dev              - Start development server (assumes setup done)
#   ./run.sh docker           - Run with Docker (full stack)
#   ./run.sh docker:build     - Build and run with Docker
#   ./run.sh prod             - Build and run production
#   ./run.sh help             - Show help
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════╗"
    echo "║   Visualize Admin                      ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_help() {
    print_header
    echo "Usage: ./run.sh [command]"
    echo ""
    echo "Commands:"
    echo "  (none)          Setup (if needed) and start development server"
    echo "  setup           Run full setup (install deps, setup db, compile)"
    echo "  dev             Start development server (skip setup)"
    echo "  docker          Run complete stack with Docker Compose"
    echo "  docker:build    Build and run with Docker Compose"
    echo "  docker:down     Stop Docker containers"
    echo "  prod            Build and run production server"
    echo "  test            Run unit tests"
    echo "  e2e             Run end-to-end tests"
    echo "  help            Show this help"
    echo ""
    echo "Examples:"
    echo "  ./run.sh                 # Quick start for development"
    echo "  ./run.sh docker          # Run everything in Docker"
    echo "  ./run.sh docker:build    # Rebuild and run in Docker"
}

check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed${NC}"
        echo "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
}

check_yarn() {
    if ! command -v yarn &> /dev/null; then
        echo -e "${RED}Error: Yarn is not installed${NC}"
        echo "Install with: npm install -g yarn"
        exit 1
    fi
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        echo "Please install Docker from https://docker.com/"
        exit 1
    fi
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        exit 1
    fi
}

run_setup() {
    check_node
    echo -e "${BLUE}Running setup...${NC}"
    node scripts/setup.mjs "$@"
}

run_dev() {
    check_node
    check_yarn
    echo -e "${GREEN}Starting development server...${NC}"
    yarn dev
}

run_docker() {
    check_docker
    echo -e "${GREEN}Starting with Docker Compose...${NC}"
    docker-compose -f docker-compose.full.yml up
}

run_docker_build() {
    check_docker
    echo -e "${GREEN}Building and starting with Docker Compose...${NC}"
    docker-compose -f docker-compose.full.yml up --build
}

run_docker_down() {
    check_docker
    echo -e "${YELLOW}Stopping Docker containers...${NC}"
    docker-compose -f docker-compose.full.yml down
}

run_prod() {
    check_node
    check_yarn
    echo -e "${BLUE}Building for production...${NC}"
    yarn build
    echo -e "${GREEN}Starting production server...${NC}"
    yarn start
}

run_test() {
    check_node
    check_yarn
    echo -e "${BLUE}Running tests...${NC}"
    yarn test
}

run_e2e() {
    check_node
    check_yarn
    echo -e "${BLUE}Running e2e tests...${NC}"
    yarn e2e:dev
}

# Main
print_header

case "${1:-}" in
    setup)
        run_setup "${@:2}"
        ;;
    dev)
        run_dev
        ;;
    docker)
        run_docker
        ;;
    docker:build)
        run_docker_build
        ;;
    docker:down)
        run_docker_down
        ;;
    prod)
        run_prod
        ;;
    test)
        run_test
        ;;
    e2e)
        run_e2e
        ;;
    help|--help|-h)
        print_help
        ;;
    "")
        # Default: setup if needed, then dev
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}First run detected. Running setup...${NC}"
            run_setup
        fi
        run_dev
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        print_help
        exit 1
        ;;
esac
