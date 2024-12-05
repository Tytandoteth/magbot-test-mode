#!/bin/bash

# Exit on error
set -e

echo "🚀 Deploying MagnifyCash Bot to Digital Ocean..."

# Check for required environment variables
required_vars=("DO_API_TOKEN" "DO_APP_ID" "TELEGRAM_BOT_TOKEN" "APP_DOMAIN")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Error: $var is required"
    exit 1
  fi
done

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check for required tools
command -v doctl >/dev/null 2>&1 || { echo "❌ doctl is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ docker is required but not installed. Aborting." >&2; exit 1; }

# Authenticate with Digital Ocean
echo "🔑 Authenticating with Digital Ocean..."
doctl auth init -t $DO_API_TOKEN

# Build Docker image
echo "🏗️ Building Docker image..."
docker build -t $DOCKER_REGISTRY/$DOCKER_IMAGE_NAME:latest .

# Push to DO registry
echo "📤 Pushing image to registry..."
doctl registry login
docker push $DOCKER_REGISTRY/$DOCKER_IMAGE_NAME:latest

# Update app specification
echo "📝 Updating app specification..."
doctl apps update $DO_APP_ID --spec app.yaml

echo "⏳ Waiting for deployment to complete..."
sleep 30

# Check deployment health with improved retry logic
echo "🏥 Checking deployment health..."
MAX_RETRIES=10
RETRY_COUNT=0
RETRY_DELAY=30

check_health() {
    local response
    local status_code
    
    response=$(curl -s -w "%{http_code}" "https://$APP_DOMAIN/health")
    status_code=${response: -3}
    response_body=${response:0:${#response}-3}
    
    if [ "$status_code" = "200" ] && echo "$response_body" | grep -q '"status":"healthy"'; then
        return 0
    fi
    return 1
}

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "📊 Health check attempt $((RETRY_COUNT + 1))..."
    
    if check_health; then
        echo "✅ Health check passed!"
        exit 0
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "⏳ Waiting ${RETRY_DELAY} seconds before next attempt..."
        sleep $RETRY_DELAY
    fi
done

echo "❌ Health check failed after $MAX_RETRIES attempts!"
exit 1