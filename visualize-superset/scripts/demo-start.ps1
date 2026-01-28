<#
.SYNOPSIS
    Demo Starter Script for visualize-superset (Windows PowerShell)
    
.DESCRIPTION
    This script starts all services needed for a demo without Docker.
    
    Features:
    - Checks for required dependencies (Node.js, Python, pip)
    - Installs Python dependencies for sparql-proxy if needed
    - Installs npm dependencies for frontend if needed
    - Starts the SPARQL proxy service in background
    - Starts the frontend dev server
    - Opens the browser automatically
    - Handles cleanup on exit (kill background processes)
    
.EXAMPLE
    .\scripts\demo-start.ps1
    
.EXAMPLE
    PowerShell -ExecutionPolicy Bypass -File .\scripts\demo-start.ps1
#>

[CmdletBinding()]
param()

#Requires -Version 5.1

# Error action preference
$ErrorActionPreference = "Stop"

# Service configuration
$Script:SPARQL_PROXY_PORT = 8089
$Script:FRONTEND_PORT = 5173
$Script:LINDAS_ENDPOINT = "https://lindas.admin.ch/query"

# Process tracking
$Script:SPARQL_JOB = $null
$Script:FRONTEND_JOB = $null
$Script:PYTHON_CMD = $null

# Get project root
$Script:PROJECT_ROOT = Split-Path -Parent $PSScriptRoot

# ============================================
# Helper Functions
# ============================================

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Step {
    param([string]$Message)
    Write-Host "[STEP] $Message" -ForegroundColor Cyan
}

function Test-CommandExists {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Test-PortInUse {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

function Stop-ProcessOnPort {
    param([int]$Port)
    
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Info "Stopping process on port $Port (PID: $($connection.OwningProcess)..."
        Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

function Invoke-HealthCheck {
    param(
        [string]$Url,
        [int]$MaxRetries = 30,
        [int]$RetryDelaySeconds = 1
    )
    
    $retries = 0
    while ($retries -lt $MaxRetries) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                return $true
            }
        }
        catch {
            # Continue retrying
        }
        
        $retries++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds $RetryDelaySeconds
    }
    
    return $false
}

# ============================================
# Dependency Checks
# ============================================

function Test-Dependencies {
    Write-Step "Checking dependencies..."
    
    $missingDeps = @()
    
    # Check Node.js
    if (Test-CommandExists "node") {
        $nodeVersion = (node --version).Trim().Substring(1)
        Write-Success "Node.js found: v$nodeVersion"
        
        # Check version (require 18+)
        $nodeMajor = [int]($nodeVersion -split '\.')[0]
        if ($nodeMajor -lt 18) {
            Write-Error "Node.js 18+ is required. Found: v$nodeVersion"
            exit 1
        }
    }
    else {
        $missingDeps += "Node.js 18+"
        Write-Error "Node.js not found"
    }
    
    # Check npm
    if (Test-CommandExists "npm") {
        $npmVersion = (npm --version).Trim()
        Write-Success "npm found: v$npmVersion"
    }
    else {
        $missingDeps += "npm"
        Write-Error "npm not found"
    }
    
    # Check Python
    if (Test-CommandExists "python") {
        $pyVersion = (python --version 2>&1)
        if ($pyVersion -match "Python (\d+\.\d+\.\d+)") {
            $pythonVersion = $Matches[1]
            $Script:PYTHON_CMD = "python"
            Write-Success "Python found: v$pythonVersion"
            
            # Check version (require 3.10+)
            $pythonMajor = [int]($pythonVersion -split '\.')[0]
            $pythonMinor = [int]($pythonVersion -split '\.')[1]
            if ($pythonMajor -lt 3 -or ($pythonMajor -eq 3 -and $pythonMinor -lt 10)) {
                Write-Error "Python 3.10+ is required. Found: v$pythonVersion"
                exit 1
            }
        }
    }
    elseif (Test-CommandExists "python3") {
        $pyVersion = (python3 --version 2>&1)
        if ($pyVersion -match "Python (\d+\.\d+\.\d+)") {
            $pythonVersion = $Matches[1]
            $Script:PYTHON_CMD = "python3"
            Write-Success "Python found: v$pythonVersion"
            
            # Check version
            $pythonMajor = [int]($pythonVersion -split '\.')[0]
            $pythonMinor = [int]($pythonVersion -split '\.')[1]
            if ($pythonMajor -lt 3 -or ($pythonMajor -eq 3 -and $pythonMinor -lt 10)) {
                Write-Error "Python 3.10+ is required. Found: v$pythonVersion"
                exit 1
            }
        }
    }
    else {
        $missingDeps += "Python 3.10+"
        Write-Error "Python not found"
    }
    
    # Check pip
    $pipCheck = & $Script:PYTHON_CMD -m pip --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "pip found"
    }
    else {
        $missingDeps += "pip"
        Write-Error "pip not found"
    }
    
    # Report missing dependencies
    if ($missingDeps.Count -gt 0) {
        Write-Error "Missing dependencies:"
        foreach ($dep in $missingDeps) {
            Write-Host "  - $dep"
        }
        Write-Host ""
        Write-Info "Please install the missing dependencies and try again."
        Write-Info "Visit: https://nodejs.org/ (for Node.js)"
        Write-Info "Visit: https://www.python.org/ (for Python)"
        exit 1
    }
    
    Write-Success "All dependencies satisfied!"
}

# ============================================
# Setup Functions
# ============================================

function Install-SparqlProxy {
    Write-Step "Setting up SPARQL Proxy..."
    
    $sparqlDir = Join-Path $Script:PROJECT_ROOT "sparql-proxy"
    Set-Location $sparqlDir
    
    # Create virtual environment if it doesn't exist
    $venvPath = Join-Path $sparqlDir "venv"
    if (-not (Test-Path $venvPath)) {
        Write-Info "Creating Python virtual environment..."
        & $Script:PYTHON_CMD -m venv venv
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to create virtual environment"
            exit 1
        }
        Write-Success "Virtual environment created"
    }
    
    # Activate virtual environment
    Write-Info "Activating virtual environment..."
    $activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
    & $activateScript
    
    # Install dependencies
    Write-Info "Installing Python dependencies..."
    pip install -q -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install Python dependencies"
        exit 1
    }
    Write-Success "Python dependencies installed"
    
    Set-Location $Script:PROJECT_ROOT
}

function Install-Frontend {
    Write-Step "Setting up Frontend..."
    
    $frontendDir = Join-Path $Script:PROJECT_ROOT "frontend"
    Set-Location $frontendDir
    
    # Install npm dependencies if needed
    $nodeModulesPath = Join-Path $frontendDir "node_modules"
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Info "Installing npm dependencies (this may take a while)..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install npm dependencies"
            exit 1
        }
        Write-Success "npm dependencies installed"
    }
    else {
        Write-Info "npm dependencies already installed"
    }
    
    # Create .env file if it doesn't exist
    $envPath = Join-Path $frontendDir ".env"
    if (-not (Test-Path $envPath)) {
        Write-Info "Creating .env file..."
        @"
# SPARQL Proxy Configuration (auto-generated by demo-start.ps1)
VITE_SPARQL_PROXY_URL=http://localhost:$($Script:SPARQL_PROXY_PORT)
"@ | Out-File -FilePath $envPath -Encoding UTF8
        Write-Success ".env file created"
    }
    else {
        Write-Info ".env file already exists"
    }
    
    Set-Location $Script:PROJECT_ROOT
}

# ============================================
# Service Management
# ============================================

function Start-SparqlProxyService {
    Write-Step "Starting SPARQL Proxy..."
    
    # Kill any existing process on the port
    Stop-ProcessOnPort $Script:SPARQL_PROXY_PORT
    
    $sparqlDir = Join-Path $Script:PROJECT_ROOT "sparql-proxy"
    Set-Location $sparqlDir
    
    # Activate virtual environment
    $activateScript = Join-Path $sparqlDir "venv\Scripts\Activate.ps1"
    & $activateScript
    
    # Set environment variables
    $env:LINDAS_ENDPOINT_URL = $Script:LINDAS_ENDPOINT
    $env:LOG_LEVEL = "INFO"
    
    Write-Info "Starting SPARQL Proxy on port $($Script:SPARQL_PROXY_PORT)..."
    
    # Start the proxy as a background job
    $srcDir = Join-Path $sparqlDir "src"
    Set-Location $srcDir
    
    $logPath = Join-Path $Script:PROJECT_ROOT "sparql-proxy.log"
    $Script:SPARQL_JOB = Start-Job -ScriptBlock {
        param($SrcDir, $LogPath)
        Set-Location $SrcDir
        python main.py 2>&1 | Out-File -FilePath $LogPath -Append
    } -ArgumentList $srcDir, $logPath
    
    Set-Location $Script:PROJECT_ROOT
    
    Write-Success "SPARQL Proxy started (Job ID: $($Script:SPARQL_JOB.Id))"
    
    # Wait for the service to be ready
    Write-Info "Waiting for SPARQL Proxy to be ready..."
    $healthUrl = "http://localhost:$($Script:SPARQL_PROXY_PORT)/api/v1/health"
    if (Invoke-HealthCheck -Url $healthUrl) {
        Write-Host ""
        Write-Success "SPARQL Proxy is ready!"
    }
    else {
        Write-Host ""
        Write-Warning "SPARQL Proxy may not be fully ready yet, continuing anyway..."
    }
}

function Start-FrontendService {
    Write-Step "Starting Frontend..."
    
    # Kill any existing process on the port
    Stop-ProcessOnPort $Script:FRONTEND_PORT
    
    $frontendDir = Join-Path $Script:PROJECT_ROOT "frontend"
    Set-Location $frontendDir
    
    Write-Info "Starting Frontend dev server on port $($Script:FRONTEND_PORT)..."
    
    # Start the frontend as a background job
    $logPath = Join-Path $Script:PROJECT_ROOT "frontend.log"
    $Script:FRONTEND_JOB = Start-Job -ScriptBlock {
        param($FrontendDir, $LogPath)
        Set-Location $FrontendDir
        npm run dev 2>&1 | Out-File -FilePath $LogPath -Append
    } -ArgumentList $frontendDir, $logPath
    
    Set-Location $Script:PROJECT_ROOT
    
    Write-Success "Frontend started (Job ID: $($Script:FRONTEND_JOB.Id))"
    
    # Wait for the service to be ready
    Write-Info "Waiting for Frontend to be ready..."
    $healthUrl = "http://localhost:$($Script:FRONTEND_PORT)"
    if (Invoke-HealthCheck -Url $healthUrl) {
        Write-Host ""
        Write-Success "Frontend is ready!"
    }
    else {
        Write-Host ""
        Write-Warning "Frontend may not be fully ready yet, continuing anyway..."
    }
}

function Open-Browser {
    Write-Step "Opening browser..."
    
    $url = "http://localhost:$($Script:FRONTEND_PORT)"
    
    Start-Sleep -Seconds 2
    
    try {
        Start-Process $url
        Write-Success "Browser opened"
    }
    catch {
        Write-Warning "Could not open browser automatically. Please open: $url"
    }
}

# ============================================
# Cleanup
# ============================================

function Stop-DemoServices {
    Write-Step "Stopping services..."
    
    # Stop frontend job
    if ($Script:FRONTEND_JOB -and $Script:FRONTEND_JOB.State -eq "Running") {
        Write-Info "Stopping Frontend (Job ID: $($Script:FRONTEND_JOB.Id))..."
        Stop-Job $Script:FRONTEND_JOB -ErrorAction SilentlyContinue
        Remove-Job $Script:FRONTEND_JOB -ErrorAction SilentlyContinue
    }
    
    # Stop SPARQL proxy job
    if ($Script:SPARQL_JOB -and $Script:SPARQL_JOB.State -eq "Running") {
        Write-Info "Stopping SPARQL Proxy (Job ID: $($Script:SPARQL_JOB.Id))..."
        Stop-Job $Script:SPARQL_JOB -ErrorAction SilentlyContinue
        Remove-Job $Script:SPARQL_JOB -ErrorAction SilentlyContinue
    }
    
    # Kill any remaining processes on the ports
    Stop-ProcessOnPort $Script:SPARQL_PROXY_PORT
    Stop-ProcessOnPort $Script:FRONTEND_PORT
    
    Write-Success "Services stopped!"
}

function Show-Status {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "    Demo Environment Ready!    " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services:" -ForegroundColor Cyan
    Write-Host "  Frontend:     http://localhost:$($Script:FRONTEND_PORT)"
    Write-Host "  SPARQL Proxy: http://localhost:$($Script:SPARQL_PROXY_PORT)"
    Write-Host "  LINDAS:       $($Script:LINDAS_ENDPOINT)"
    Write-Host ""
    Write-Host "API Endpoints:" -ForegroundColor Cyan
    Write-Host "  Health:    http://localhost:$($Script:SPARQL_PROXY_PORT)/api/v1/health"
    Write-Host "  Cubes:     http://localhost:$($Script:SPARQL_PROXY_PORT)/api/v1/cubes"
    Write-Host "  GraphQL:   http://localhost:$($Script:SPARQL_PROXY_PORT)/graphql"
    Write-Host ""
    Write-Host "Logs:" -ForegroundColor Cyan
    Write-Host "  SPARQL Proxy: $($Script:PROJECT_ROOT)\sparql-proxy.log"
    Write-Host "  Frontend:     $($Script:PROJECT_ROOT)\frontend.log"
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Cyan
    Write-Host "  Stop services: Press Ctrl+C"
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
}

# ============================================
# Main
# ============================================

function Main {
    # Print header
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " Visualize-Superset Demo Starter" -ForegroundColor Cyan
    Write-Host " Platform: Windows PowerShell" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        # Check dependencies
        Test-Dependencies
        Write-Host ""
        
        # Setup services
        Install-SparqlProxy
        Write-Host ""
        
        Install-Frontend
        Write-Host ""
        
        # Start services
        Start-SparqlProxyService
        Write-Host ""
        
        Start-FrontendService
        Write-Host ""
        
        # Open browser
        Open-Browser
        Write-Host ""
        
        # Show status
        Show-Status
        
        # Keep script running
        Write-Info "Services are running. Press Ctrl+C to stop."
        Write-Host ""
        
        # Wait for interrupt
        while ($true) {
            Start-Sleep -Seconds 1
            
            # Check if jobs are still running
            if ($Script:SPARQL_JOB -and $Script:SPARQL_JOB.State -ne "Running" -and 
                $Script:FRONTEND_JOB -and $Script:FRONTEND_JOB.State -ne "Running") {
                Write-Warning "Services have stopped unexpectedly."
                break
            }
        }
    }
    catch {
        Write-Error "An error occurred: $_"
    }
    finally {
        # Cleanup
        Stop-DemoServices
        Write-Host ""
        Write-Info "Thank you for using visualize-superset!"
    }
}

# Handle Ctrl+C
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Stop-DemoServices
}

# Run main function
Main
