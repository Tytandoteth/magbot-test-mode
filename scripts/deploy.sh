#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run tests
echo "🧪 Running tests..."
npm test

# Build the project
echo "🔨 Building project..."
npm run build

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    npm install -g pm2
fi

# Create logs directory
mkdir -p logs/pm2

# Start/Restart the application
echo "🌟 Starting application with PM2..."
pm2 startOrRestart ecosystem.config.js --env production

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
echo "🔄 Setting up PM2 startup..."
pm2 startup

# Monitor deployment
echo "📊 Monitoring deployment..."
pm2 monit

echo "✅ Deployment complete!"