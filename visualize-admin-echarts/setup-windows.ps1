# Visualize Admin Setup Script for Windows
# Run this script in PowerShell as Administrator

param(
    [switch]$SkipPostgres,
    [switch]$SkipDeps,
    [string]$DbPassword = "password",
    [string]$DbName = "visualization_tool",
    [string]$DbUser = "postgres",
    [int]$DbPort = 5433
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Step { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "    [WARN] $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "    [ERROR] $msg" -ForegroundColor Red }

Write-Host @"

  _    ___                  ___             ___      __          _
 | |  / (_)______  ______ _/ (_)___  ___   /   | ___/ /___ ___  (_)___
 | | / / / ___/ / / / __ `/ / /_  / / _ \ / /| |/ __  / __ `__ \/ / __ \
 | |/ / (__  ) /_/ / /_/ / / / / /_/  __// ___ / /_/ / / / / / / / / / /
 |___/_/____/\__,_/\__,_/_/_/ /___/\___//_/  |_\__,_/_/ /_/ /_/_/_/ /_/

  Windows Setup Script

"@ -ForegroundColor Magenta

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin -and -not $SkipPostgres) {
    Write-Warning "Not running as Administrator. PostgreSQL installation may require admin rights."
    Write-Host "    Consider running: Start-Process powershell -Verb runAs -ArgumentList '-File', '$PSCommandPath'"
}

# ============================================================================
# Check Prerequisites
# ============================================================================
Write-Step "Checking prerequisites..."

# Check Node.js
$nodeVersion = $null
try {
    $nodeVersion = (node --version 2>$null)
    Write-Success "Node.js found: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed!"
    Write-Host "    Please install Node.js from https://nodejs.org/ (v18+ recommended)"
    exit 1
}

# Check Yarn
$yarnVersion = $null
try {
    $yarnVersion = (yarn --version 2>$null)
    Write-Success "Yarn found: $yarnVersion"
} catch {
    Write-Warning "Yarn not found. Installing via npm..."
    npm install -g yarn
    Write-Success "Yarn installed"
}

# ============================================================================
# PostgreSQL Installation
# ============================================================================
if (-not $SkipPostgres) {
    Write-Step "Checking PostgreSQL..."

    $pgInstalled = $false
    $pgPath = $null

    # Check common PostgreSQL installation paths
    $pgPaths = @(
        "C:\Program Files\PostgreSQL\16\bin",
        "C:\Program Files\PostgreSQL\15\bin",
        "C:\Program Files\PostgreSQL\14\bin",
        "$env:ProgramFiles\PostgreSQL\16\bin",
        "$env:ProgramFiles\PostgreSQL\15\bin"
    )

    foreach ($path in $pgPaths) {
        if (Test-Path "$path\psql.exe") {
            $pgPath = $path
            $pgInstalled = $true
            break
        }
    }

    # Also check if psql is in PATH
    try {
        $psqlPath = (Get-Command psql -ErrorAction SilentlyContinue).Source
        if ($psqlPath) {
            $pgPath = Split-Path $psqlPath
            $pgInstalled = $true
        }
    } catch {}

    if ($pgInstalled) {
        Write-Success "PostgreSQL found at: $pgPath"

        # Add to PATH for this session if needed
        if ($env:Path -notlike "*$pgPath*") {
            $env:Path = "$pgPath;$env:Path"
        }
    } else {
        Write-Warning "PostgreSQL not found. Attempting to install via winget..."

        # Try winget first
        try {
            $wingetAvailable = Get-Command winget -ErrorAction SilentlyContinue
            if ($wingetAvailable) {
                Write-Host "    Installing PostgreSQL 16 via winget..."
                winget install -e --id PostgreSQL.PostgreSQL.16 --accept-source-agreements --accept-package-agreements

                # Refresh PATH
                $pgPath = "C:\Program Files\PostgreSQL\16\bin"
                $env:Path = "$pgPath;$env:Path"
                Write-Success "PostgreSQL installed"
            } else {
                throw "winget not available"
            }
        } catch {
            Write-Error "Could not install PostgreSQL automatically."
            Write-Host @"

    Please install PostgreSQL manually:
    1. Download from: https://www.postgresql.org/download/windows/
    2. Run the installer (use password: $DbPassword for postgres user)
    3. Re-run this script with: .\setup-windows.ps1

    Or use Chocolatey: choco install postgresql16
    Or use Scoop: scoop install postgresql

"@
            exit 1
        }
    }

    # ============================================================================
    # Configure PostgreSQL
    # ============================================================================
    Write-Step "Configuring PostgreSQL..."

    # Check if PostgreSQL service is running
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "Running" } | Select-Object -First 1

    if (-not $pgService) {
        Write-Warning "PostgreSQL service not running. Attempting to start..."
        $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($pgService) {
            Start-Service $pgService.Name
            Start-Sleep -Seconds 3
            Write-Success "PostgreSQL service started"
        } else {
            Write-Error "Could not find PostgreSQL service. Please start PostgreSQL manually."
        }
    } else {
        Write-Success "PostgreSQL service is running"
    }

    # Create database if it doesn't exist
    Write-Host "    Checking database..."

    $env:PGPASSWORD = $DbPassword

    try {
        $dbExists = & psql -U $DbUser -h localhost -p 5432 -lqt 2>$null | Select-String -Pattern "\s$DbName\s"

        if ($dbExists) {
            Write-Success "Database '$DbName' already exists"
        } else {
            Write-Host "    Creating database '$DbName'..."
            & psql -U $DbUser -h localhost -p 5432 -c "CREATE DATABASE $DbName;" 2>$null
            Write-Success "Database '$DbName' created"
        }
    } catch {
        Write-Warning "Could not connect to PostgreSQL. You may need to:"
        Write-Host "    1. Ensure PostgreSQL is running"
        Write-Host "    2. Set the postgres user password to: $DbPassword"
        Write-Host "    3. Create database manually: CREATE DATABASE $DbName;"
    }

    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

# ============================================================================
# Install Dependencies
# ============================================================================
if (-not $SkipDeps) {
    Write-Step "Installing Node.js dependencies..."

    Push-Location $PSScriptRoot

    try {
        yarn install
        Write-Success "Dependencies installed"
    } catch {
        Write-Error "Failed to install dependencies: $_"
        Pop-Location
        exit 1
    }

    Pop-Location
}

# ============================================================================
# Compile Locales
# ============================================================================
Write-Step "Compiling locales..."

Push-Location $PSScriptRoot

try {
    yarn locales:compile
    Write-Success "Locales compiled"
} catch {
    Write-Warning "Failed to compile locales (may not be critical)"
}

Pop-Location

# ============================================================================
# Run Database Migrations
# ============================================================================
Write-Step "Running database migrations..."

Push-Location $PSScriptRoot

# Set DATABASE_URL for migrations (using port 5432 for native PostgreSQL)
$env:DATABASE_URL = "postgres://${DbUser}:${DbPassword}@localhost:5432/${DbName}"

try {
    yarn drizzle-kit push
    Write-Success "Database migrations complete"
} catch {
    Write-Error "Failed to run migrations: $_"
    Write-Host "    You can run migrations manually with: yarn db:migrate:dev"
}

Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
Pop-Location

# ============================================================================
# Create .env file if it doesn't exist
# ============================================================================
Write-Step "Checking environment configuration..."

$envFile = Join-Path $PSScriptRoot ".env"
$envLocalFile = Join-Path $PSScriptRoot ".env.local"

if (-not (Test-Path $envFile) -and -not (Test-Path $envLocalFile)) {
    Write-Host "    Creating .env.local file..."

    @"
# Database
DATABASE_URL=postgres://${DbUser}:${DbPassword}@localhost:5432/${DbName}

# SPARQL Endpoints
ENDPOINT=sparql+https://lindas-cached.cluster.ldbar.ch/query
SPARQL_GEO_ENDPOINT=https://geo.ld.admin.ch/query
GRAPHQL_ENDPOINT=/api/graphql

# Data Sources
WHITELISTED_DATA_SOURCES=["Prod", "Prod-uncached", "Int", "Int-uncached", "Test", "Test-uncached"]

# Map Configuration
NEXT_PUBLIC_VECTOR_TILE_URL=https://world.vectortiles.geo.admin.ch
NEXT_PUBLIC_MAPTILER_STYLE_KEY=

# Auth (optional - for development, these can be dummy values)
ADFS_ID=dev
ADFS_SECRET=dev
ADFS_ISSUER=https://example.com
ADFS_PROFILE_URL=https://example.com
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production
"@ | Out-File -FilePath $envLocalFile -Encoding utf8

    Write-Success ".env.local file created"
} else {
    Write-Success "Environment file already exists"
}

# ============================================================================
# Done!
# ============================================================================
Write-Host @"

================================================================================
                            Setup Complete!
================================================================================

"@ -ForegroundColor Green

Write-Host "To start the development server, run:" -ForegroundColor Yellow
Write-Host "    yarn dev" -ForegroundColor White
Write-Host ""
Write-Host "The application will be available at:" -ForegroundColor Yellow
Write-Host "    http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Other useful commands:" -ForegroundColor Yellow
Write-Host "    yarn test          - Run tests"
Write-Host "    yarn build         - Build for production"
Write-Host "    yarn db:studio     - Open Drizzle Studio (database UI)"
Write-Host "    yarn storybook     - Open Storybook"
Write-Host ""
