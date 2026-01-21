#!/bin/bash
# Setup script for visualize-superset

set -e

echo "=== Visualize Superset Setup ==="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env

    # Generate a random secret key
    SECRET_KEY=$(openssl rand -base64 42 | tr -dc 'a-zA-Z0-9' | head -c 64)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-secret-key-change-in-production-minimum-42-chars/$SECRET_KEY/" .env
    else
        # Linux
        sed -i "s/your-secret-key-change-in-production-minimum-42-chars/$SECRET_KEY/" .env
    fi

    echo ".env file created with generated secret key"
else
    echo ".env file already exists, skipping..."
fi

echo ""
echo "Building Docker images..."
docker-compose build

echo ""
echo "Starting services..."
docker-compose up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 30

echo ""
echo "=== Setup Complete ==="
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
