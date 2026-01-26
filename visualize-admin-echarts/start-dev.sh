#!/bin/bash
# Quick Start Script for Visualize Development
# Usage: ./start-dev.sh

set -e

echo "🚀 Starting Visualize Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if pg_hba.conf exists, create if not
if [ ! -f "pg_hba.conf" ]; then
    echo "📝 Creating pg_hba.conf..."
    cat > pg_hba.conf << 'EOF'
# PostgreSQL Client Authentication Configuration File
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
host    all             all             0.0.0.0/0               trust
EOF
fi

# Start services
echo "🐳 Starting Docker containers..."
docker-compose -f docker-compose.dev.yml up --build -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if services are running
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo ""
    echo "✅ Visualize is running!"
    echo ""
    echo "📊 Access the application at: http://localhost:3000"
    echo "🗄️  Database is available at: localhost:5433"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs:     docker-compose -f docker-compose.dev.yml logs -f"
    echo "   Stop:          docker-compose -f docker-compose.dev.yml down"
    echo "   Restart:       docker-compose -f docker-compose.dev.yml restart"
    echo ""
else
    echo "❌ Failed to start services. Check logs with:"
    echo "   docker-compose -f docker-compose.dev.yml logs"
    exit 1
fi
