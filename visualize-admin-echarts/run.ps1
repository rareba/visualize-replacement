#
# Cross-platform run script for Windows PowerShell
#
# Usage:
#   .\run.ps1                  - Setup and run development server
#   .\run.ps1 setup            - Run setup only
#   .\run.ps1 dev              - Start development server (assumes setup done)
#   .\run.ps1 docker           - Run with Docker (full stack)
#   .\run.ps1 docker:build     - Build and run with Docker
#   .\run.ps1 prod             - Build and run production
#   .\run.ps1 help             - Show help
#

param(
    [Parameter(Position=0)]
    [string]$Command = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Print-Header {
    Write-ColorOutput ""
    Write-ColorOutput "╔════════════════════════════════════════╗" "Cyan"
    Write-ColorOutput "║   Visualize Admin                      ║" "Cyan"
    Write-ColorOutput "╚════════════════════════════════════════╝" "Cyan"
    Write-ColorOutput ""
}

function Print-Help {
    Print-Header
    Write-Host "Usage: .\run.ps1 [command]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  (none)          Setup (if needed) and start development server"
    Write-Host "  setup           Run full setup (install deps, setup db, compile)"
    Write-Host "  dev             Start development server (skip setup)"
    Write-Host "  docker          Run complete stack with Docker Compose"
    Write-Host "  docker:build    Build and run with Docker Compose"
    Write-Host "  docker:down     Stop Docker containers"
    Write-Host "  prod            Build and run production server"
    Write-Host "  test            Run unit tests"
    Write-Host "  e2e             Run end-to-end tests"
    Write-Host "  help            Show this help"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\run.ps1                 # Quick start for development"
    Write-Host "  .\run.ps1 docker          # Run everything in Docker"
    Write-Host "  .\run.ps1 docker:build    # Rebuild and run in Docker"
}

function Test-Command {
    param([string]$Name)
    $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Check-Node {
    if (-not (Test-Command "node")) {
        Write-ColorOutput "Error: Node.js is not installed" "Red"
        Write-Host "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    }
}

function Check-Yarn {
    if (-not (Test-Command "yarn")) {
        Write-ColorOutput "Error: Yarn is not installed" "Red"
        Write-Host "Install with: npm install -g yarn"
        exit 1
    }
}

function Check-Docker {
    if (-not (Test-Command "docker")) {
        Write-ColorOutput "Error: Docker is not installed" "Red"
        Write-Host "Please install Docker Desktop from https://docker.com/"
        exit 1
    }
    if (-not (Test-Command "docker-compose")) {
        Write-ColorOutput "Error: Docker Compose is not installed" "Red"
        exit 1
    }
}

function Run-Setup {
    Check-Node
    Write-ColorOutput "Running setup..." "Blue"
    node scripts/setup.mjs $args
}

function Run-Dev {
    Check-Node
    Check-Yarn
    Write-ColorOutput "Starting development server..." "Green"
    yarn dev
}

function Run-Docker {
    Check-Docker
    Write-ColorOutput "Starting with Docker Compose..." "Green"
    docker-compose -f docker-compose.full.yml up
}

function Run-DockerBuild {
    Check-Docker
    Write-ColorOutput "Building and starting with Docker Compose..." "Green"
    docker-compose -f docker-compose.full.yml up --build
}

function Run-DockerDown {
    Check-Docker
    Write-ColorOutput "Stopping Docker containers..." "Yellow"
    docker-compose -f docker-compose.full.yml down
}

function Run-Prod {
    Check-Node
    Check-Yarn
    Write-ColorOutput "Building for production..." "Blue"
    yarn build
    Write-ColorOutput "Starting production server..." "Green"
    yarn start
}

function Run-Test {
    Check-Node
    Check-Yarn
    Write-ColorOutput "Running tests..." "Blue"
    yarn test
}

function Run-E2E {
    Check-Node
    Check-Yarn
    Write-ColorOutput "Running e2e tests..." "Blue"
    yarn e2e:dev
}

# Main
Print-Header

switch ($Command.ToLower()) {
    "setup" {
        Run-Setup
    }
    "dev" {
        Run-Dev
    }
    "docker" {
        Run-Docker
    }
    "docker:build" {
        Run-DockerBuild
    }
    "docker:down" {
        Run-DockerDown
    }
    "prod" {
        Run-Prod
    }
    "test" {
        Run-Test
    }
    "e2e" {
        Run-E2E
    }
    { $_ -in "help", "--help", "-h" } {
        Print-Help
    }
    "" {
        # Default: setup if needed, then dev
        if (-not (Test-Path "node_modules")) {
            Write-ColorOutput "First run detected. Running setup..." "Yellow"
            Run-Setup
        }
        Run-Dev
    }
    default {
        Write-ColorOutput "Unknown command: $Command" "Red"
        Write-Host ""
        Print-Help
        exit 1
    }
}
