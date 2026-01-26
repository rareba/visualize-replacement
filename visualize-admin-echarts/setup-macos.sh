#!/bin/bash
# Visualize Admin Setup Script for macOS
# Run with: ./setup-macos.sh

set -e

# Configuration
DB_PASSWORD="${DB_PASSWORD:-password}"
DB_NAME="${DB_NAME:-visualization_tool}"
DB_USER="${DB_USER:-postgres}"
DB_PORT="${DB_PORT:-5432}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

step() { echo -e "\n${CYAN}==> $1${NC}"; }
success() { echo -e "    ${GREEN}[OK]${NC} $1"; }
warn() { echo -e "    ${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "    ${RED}[ERROR]${NC} $1"; }

echo -e "${MAGENTA}"
cat << "EOF"

  _    ___                  ___             ___      __          _
 | |  / (_)______  ______ _/ (_)___  ___   /   | ___/ /___ ___  (_)___
 | | / / / ___/ / / / __ `/ / /_  / / _ \ / /| |/ __  / __ `__ \/ / __ \
 | |/ / (__  ) /_/ / /_/ / / / / /_/  __// ___ / /_/ / / / / / / / / / /
 |___/_/____/\__,_/\__,_/_/_/ /___/\___//_/  |_\__,_/_/ /_/ /_/_/_/ /_/

  macOS Setup Script

EOF
echo -e "${NC}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ============================================================================
# Check Prerequisites
# ============================================================================
step "Checking prerequisites..."

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    warn "Homebrew not found. Installing..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ -f /opt/homebrew/bin/brew ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    success "Homebrew installed"
else
    success "Homebrew found: $(brew --version | head -n1)"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    warn "Node.js not found. Installing via Homebrew..."
    brew install node
    success "Node.js installed"
else
    success "Node.js found: $(node --version)"
fi

# Check Yarn
if ! command -v yarn &> /dev/null; then
    warn "Yarn not found. Installing via npm..."
    npm install -g yarn
    success "Yarn installed"
else
    success "Yarn found: $(yarn --version)"
fi

# ============================================================================
# PostgreSQL Installation
# ============================================================================
step "Checking PostgreSQL..."

if ! command -v psql &> /dev/null; then
    warn "PostgreSQL not found. Installing via Homebrew..."
    brew install postgresql@16

    # Add PostgreSQL to PATH
    if [[ -d /opt/homebrew/opt/postgresql@16/bin ]]; then
        export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
    elif [[ -d /usr/local/opt/postgresql@16/bin ]]; then
        export PATH="/usr/local/opt/postgresql@16/bin:$PATH"
    fi

    success "PostgreSQL installed"
else
    success "PostgreSQL found: $(psql --version)"
fi

# ============================================================================
# Start PostgreSQL
# ============================================================================
step "Starting PostgreSQL service..."

# Check if PostgreSQL is running
pg_running=false

# Try brew services first
if brew services list 2>/dev/null | grep -q "postgresql.*started"; then
    pg_running=true
    success "PostgreSQL is already running (via Homebrew)"
fi

# Check for postgresql@16 specifically
if ! $pg_running && brew services list 2>/dev/null | grep -q "postgresql@16.*started"; then
    pg_running=true
    success "PostgreSQL@16 is already running (via Homebrew)"
fi

# Try to start if not running
if ! $pg_running; then
    # Try postgresql@16 first, then generic postgresql
    if brew list postgresql@16 &>/dev/null; then
        brew services start postgresql@16
        success "Started PostgreSQL@16 service"
    elif brew list postgresql &>/dev/null; then
        brew services start postgresql
        success "Started PostgreSQL service"
    else
        error "PostgreSQL installation not found in Homebrew"
        exit 1
    fi

    # Wait for PostgreSQL to start
    echo "    Waiting for PostgreSQL to start..."
    sleep 3
fi

# Verify PostgreSQL is accepting connections
max_attempts=10
attempt=1
while ! pg_isready -q 2>/dev/null; do
    if [ $attempt -ge $max_attempts ]; then
        error "PostgreSQL failed to start after $max_attempts attempts"
        echo "    Try running: brew services restart postgresql@16"
        exit 1
    fi
    echo "    Waiting for PostgreSQL... (attempt $attempt/$max_attempts)"
    sleep 2
    ((attempt++))
done
success "PostgreSQL is accepting connections"

# ============================================================================
# Configure PostgreSQL
# ============================================================================
step "Configuring PostgreSQL..."

# On macOS with Homebrew, the default superuser is the current user
CURRENT_USER=$(whoami)

# Check if database exists
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    success "Database '$DB_NAME' already exists"
else
    echo "    Creating database '$DB_NAME'..."
    createdb "$DB_NAME" 2>/dev/null || psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null
    success "Database '$DB_NAME' created"
fi

# Create postgres role if it doesn't exist (for compatibility with scripts)
if ! psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='postgres'" 2>/dev/null | grep -q 1; then
    echo "    Creating 'postgres' role..."
    psql -c "CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
    success "Role 'postgres' created"
else
    # Update password for postgres role
    psql -c "ALTER ROLE postgres WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
    success "Role 'postgres' already exists"
fi

# ============================================================================
# Install Dependencies
# ============================================================================
step "Installing Node.js dependencies..."

yarn install
success "Dependencies installed"

# ============================================================================
# Compile Locales
# ============================================================================
step "Compiling locales..."

if yarn locales:compile; then
    success "Locales compiled"
else
    warn "Failed to compile locales (may not be critical)"
fi

# ============================================================================
# Run Database Migrations
# ============================================================================
step "Running database migrations..."

# On macOS with Homebrew, the default superuser is the current user (no password needed)
# Try current user first (most common), then fall back to postgres user with password

run_migration() {
    # Use npx to ensure drizzle-kit is found even if not in PATH
    npx drizzle-kit push 2>&1
}

export DATABASE_URL="postgres://${CURRENT_USER}@localhost:${DB_PORT}/${DB_NAME}"
echo "    Trying connection as ${CURRENT_USER}..."

if run_migration; then
    success "Database migrations complete"
else
    warn "Connection as ${CURRENT_USER} failed, trying postgres user..."
    export DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}"

    if run_migration; then
        success "Database migrations complete"
    else
        error "Database migration failed. Check your PostgreSQL connection."
        echo ""
        echo "    Troubleshooting steps:"
        echo "    1. Verify PostgreSQL is running: brew services list"
        echo "    2. Check you can connect: psql -d ${DB_NAME} -c '\\dt'"
        echo "    3. Try manual migration: DATABASE_URL=\"postgres://${CURRENT_USER}@localhost:${DB_PORT}/${DB_NAME}\" npx drizzle-kit push"
        exit 1
    fi
fi

unset DATABASE_URL

# ============================================================================
# Create .env file if it doesn't exist
# ============================================================================
step "Checking environment configuration..."

if [[ ! -f ".env" && ! -f ".env.local" ]]; then
    echo "    Creating .env.local file..."

    cat > .env.local << EOF
# Database
# Use postgres user with password, or your macOS username without password
DATABASE_URL=postgres://${CURRENT_USER}@localhost:${DB_PORT}/${DB_NAME}

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
EOF

    success ".env.local file created"
else
    success "Environment file already exists"
fi

# ============================================================================
# Add PostgreSQL to shell profile
# ============================================================================
step "Checking shell configuration..."

SHELL_RC=""
if [[ "$SHELL" == *"zsh"* ]]; then
    SHELL_RC="$HOME/.zshrc"
elif [[ "$SHELL" == *"bash"* ]]; then
    SHELL_RC="$HOME/.bash_profile"
fi

if [[ -n "$SHELL_RC" ]]; then
    PG_PATH_EXPORT='export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"'
    if [[ -d /usr/local/opt/postgresql@16/bin ]]; then
        PG_PATH_EXPORT='export PATH="/usr/local/opt/postgresql@16/bin:$PATH"'
    fi

    if ! grep -q "postgresql@16" "$SHELL_RC" 2>/dev/null; then
        echo "" >> "$SHELL_RC"
        echo "# PostgreSQL 16" >> "$SHELL_RC"
        echo "$PG_PATH_EXPORT" >> "$SHELL_RC"
        success "Added PostgreSQL to $SHELL_RC"
    else
        success "PostgreSQL already in shell config"
    fi
fi

# ============================================================================
# Done!
# ============================================================================
echo -e "
${GREEN}================================================================================
                            Setup Complete!
================================================================================${NC}

To start the development server, run:
    ${YELLOW}yarn dev${NC}

The application will be available at:
    ${YELLOW}http://localhost:3000${NC}

Other useful commands:
    ${YELLOW}yarn test${NC}          - Run tests
    ${YELLOW}yarn build${NC}         - Build for production
    ${YELLOW}yarn db:studio${NC}     - Open Drizzle Studio (database UI)
    ${YELLOW}yarn storybook${NC}     - Open Storybook

PostgreSQL management:
    ${YELLOW}brew services start postgresql@16${NC}   - Start PostgreSQL
    ${YELLOW}brew services stop postgresql@16${NC}    - Stop PostgreSQL
    ${YELLOW}brew services restart postgresql@16${NC} - Restart PostgreSQL
"
