#!/bin/bash
# Initialize Superset after first deployment

set -e

echo "=== Superset Initialization Script ==="

# Wait for Superset to be ready
echo "Waiting for Superset to be ready..."
until curl -s http://localhost:8088/health > /dev/null; do
    echo "Superset not ready yet, waiting..."
    sleep 5
done

echo "Superset is ready!"

# Check if we need to create admin user
if [ -n "$ADMIN_USERNAME" ] && [ -n "$ADMIN_PASSWORD" ]; then
    echo "Creating admin user..."
    docker exec superset-app superset fab create-admin \
        --username "$ADMIN_USERNAME" \
        --firstname Admin \
        --lastname User \
        --email "${ADMIN_EMAIL:-admin@superset.local}" \
        --password "$ADMIN_PASSWORD" || echo "Admin user may already exist"
fi

# Initialize Superset
echo "Initializing Superset..."
docker exec superset-app superset init

echo "=== Superset initialization complete ==="
echo ""
echo "You can now access Superset at http://localhost:8088"
echo "Default credentials: admin / admin"
