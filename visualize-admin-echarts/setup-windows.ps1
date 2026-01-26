# Visualize Admin Setup Script for Windows
# Run this script in PowerShell as Administrator

param(
    [switch]$SkipPostgres,
    [switch]$SkipDeps,
    [string]$DbPassword = "password",
    [string]$DbName = "visualization_tool",
    [string]$DbUser = "postgres",
    [int]$DbPort = 5432
)

$ErrorActionPreference = "Continue"

# Colors for output
function Write-Step { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-OK { param($msg) Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "    [WARN] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "    [ERROR] $msg" -ForegroundColor Red }

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
    Write-Warn "Not running as Administrator. PostgreSQL installation may require admin rights."
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
    if ($nodeVersion) {
        Write-OK "Node.js found: $nodeVersion"
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Err "Node.js is not installed!"
    Write-Host "    Please install Node.js from https://nodejs.org/ (v18+ recommended)"
    exit 1
}

# Check Yarn
$yarnVersion = $null
try {
    $yarnVersion = (yarn --version 2>$null)
    if ($yarnVersion) {
        Write-OK "Yarn found: $yarnVersion"
    } else {
        throw "Yarn not found"
    }
} catch {
    Write-Warn "Yarn not found. Installing via npm..."
    npm install -g yarn
    Write-OK "Yarn installed"
}

# ============================================================================
# PostgreSQL Installation
# ============================================================================
if (-not $SkipPostgres) {
    Write-Step "Checking PostgreSQL..."

    $pgInstalled = $false
    $pgPath = $null

    # Check common PostgreSQL installation paths (newest versions first)
    $pgPaths = @(
        "C:\Program Files\PostgreSQL\18\bin",
        "C:\Program Files\PostgreSQL\17\bin",
        "C:\Program Files\PostgreSQL\16\bin",
        "C:\Program Files\PostgreSQL\15\bin",
        "C:\Program Files\PostgreSQL\14\bin",
        "$env:ProgramFiles\PostgreSQL\18\bin",
        "$env:ProgramFiles\PostgreSQL\17\bin",
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
        $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
        if ($psqlCmd) {
            $pgPath = Split-Path $psqlCmd.Source
            $pgInstalled = $true
        }
    } catch {}

    if ($pgInstalled) {
        Write-OK "PostgreSQL found at: $pgPath"

        # Add to PATH for this session if needed
        if ($env:Path -notlike "*$pgPath*") {
            $env:Path = "$pgPath;$env:Path"
        }
    } else {
        Write-Warn "PostgreSQL not found. Attempting to install via winget..."

        # Try winget first
        try {
            $wingetCmd = Get-Command winget -ErrorAction SilentlyContinue
            if ($wingetCmd) {
                Write-Host "    Installing PostgreSQL 16 via winget..."
                $installResult = winget install -e --id PostgreSQL.PostgreSQL.16 --accept-source-agreements --accept-package-agreements 2>&1

                if ($LASTEXITCODE -ne 0) {
                    Write-Warn "winget install returned exit code $LASTEXITCODE"
                    Write-Host "    $installResult"
                }

                # Check if PostgreSQL was actually installed
                $pgPath = "C:\Program Files\PostgreSQL\16\bin"
                if (Test-Path "$pgPath\psql.exe") {
                    $env:Path = "$pgPath;$env:Path"
                    Write-OK "PostgreSQL installed"
                } else {
                    throw "PostgreSQL installation failed - psql.exe not found"
                }
            } else {
                throw "winget not available"
            }
        } catch {
            Write-Err "Could not install PostgreSQL automatically."
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
        Write-Warn "PostgreSQL service not running. Attempting to start..."
        $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($pgService) {
            try {
                Start-Service $pgService.Name -ErrorAction Stop
                Start-Sleep -Seconds 3
                Write-OK "PostgreSQL service started"
            } catch {
                Write-Err "Could not start PostgreSQL service. Please start it manually."
                Write-Host "    Run: Start-Service $($pgService.Name)"
            }
        } else {
            Write-Warn "Could not find PostgreSQL service. It may be running as a process instead."
        }
    } else {
        Write-OK "PostgreSQL service is running: $($pgService.Name)"
    }

    # Create database if it doesn't exist
    Write-Host "    Checking database..."

    $env:PGPASSWORD = $DbPassword

    try {
        # Test connection first
        $testConnection = & psql -U $DbUser -h localhost -p $DbPort -c "SELECT 1;" 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Connection failed"
        }

        $dbList = & psql -U $DbUser -h localhost -p $DbPort -lqt 2>&1
        $dbExists = $dbList | Select-String -Pattern "\s$DbName\s"

        if ($dbExists) {
            Write-OK "Database '$DbName' already exists"
        } else {
            Write-Host "    Creating database '$DbName'..."
            & psql -U $DbUser -h localhost -p $DbPort -c "CREATE DATABASE $DbName;" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-OK "Database '$DbName' created"
            } else {
                throw "Failed to create database"
            }
        }
    } catch {
        Write-Warn "Could not connect to PostgreSQL. You may need to:"
        Write-Host "    1. Ensure PostgreSQL is running on port $DbPort"
        Write-Host "    2. Set the postgres user password to: $DbPassword"
        Write-Host "    3. Create database manually: CREATE DATABASE $DbName;"
        Write-Host ""
        Write-Host "    To set password, run in psql: ALTER USER postgres PASSWORD '$DbPassword';"
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
        & yarn install
        if ($LASTEXITCODE -eq 0) {
            Write-OK "Dependencies installed"
        } else {
            throw "yarn install failed"
        }
    } catch {
        Write-Err "Failed to install dependencies: $_"
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
    & yarn locales:compile 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-OK "Locales compiled"
    } else {
        Write-Warn "Failed to compile locales (may not be critical)"
    }
} catch {
    Write-Warn "Failed to compile locales (may not be critical)"
}

Pop-Location

# ============================================================================
# Run Database Migrations
# ============================================================================
Write-Step "Running database migrations..."

Push-Location $PSScriptRoot

# Set DATABASE_URL for migrations
$env:DATABASE_URL = "postgres://${DbUser}:${DbPassword}@localhost:${DbPort}/${DbName}"

Write-Host "    Using DATABASE_URL: postgres://${DbUser}:****@localhost:${DbPort}/${DbName}"

try {
    # Use npx to ensure drizzle-kit is found
    $migrationOutput = & npx drizzle-kit push 2>&1 | Tee-Object -Variable migrationLog
    $migrationExitCode = $LASTEXITCODE

    # Check for error patterns in output (drizzle-kit may not set exit code properly)
    $hasError = $migrationLog | Select-String -Pattern "error:|FATAL|authentication failed|connection refused" -Quiet

    if ($migrationExitCode -eq 0 -and -not $hasError) {
        Write-OK "Database migrations complete"
    } else {
        throw "Migration failed"
    }
} catch {
    Write-Err "Failed to run migrations"
    Write-Host ""
    Write-Host "    Troubleshooting steps:"
    Write-Host "    1. Verify PostgreSQL is running: Get-Service postgresql*"
    Write-Host "    2. Test connection: psql -U $DbUser -h localhost -p $DbPort -d $DbName"
    Write-Host "    3. Check postgres password matches: $DbPassword"
    Write-Host "    4. Run manually: `$env:DATABASE_URL=`"postgres://${DbUser}:${DbPassword}@localhost:${DbPort}/${DbName}`"; npx drizzle-kit push"
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

    $envContent = @"
# Database
DATABASE_URL=postgres://${DbUser}:${DbPassword}@localhost:${DbPort}/${DbName}

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
"@

    $envContent | Out-File -FilePath $envLocalFile -Encoding utf8 -NoNewline
    Write-OK ".env.local file created"
} else {
    Write-OK "Environment file already exists"
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
Write-Host "PostgreSQL management:" -ForegroundColor Yellow
Write-Host "    Get-Service postgresql*           - Check PostgreSQL service status"
Write-Host "    Start-Service postgresql-x64-16   - Start PostgreSQL"
Write-Host "    Stop-Service postgresql-x64-16    - Stop PostgreSQL"
Write-Host ""
