#!/bin/bash

# Exit on error
set -e

# Configuration
DROPLET_NAME="magnifycash-bot"
REGION="nyc1"
SIZE="s-1vcpu-1gb"
IMAGE="ubuntu-22.04-x64"

echo "🚀 Creating DigitalOcean Droplet..."

# Create droplet
doctl compute droplet create \
    $DROPLET_NAME \
    --region $REGION \
    --size $SIZE \
    --image $IMAGE \
    --ssh-keys $DO_SSH_KEY_ID \
    --wait

# Get droplet IP
IP=$(doctl compute droplet get $DROPLET_NAME --format PublicIPv4 --no-header)

echo "📝 Droplet IP: $IP"

# Wait for SSH to be available
echo "⏳ Waiting for SSH to be available..."
until ssh -o StrictHostKeyChecking=no -o ConnectTimeout=2 root@$IP echo ready &>/dev/null; do
    sleep 2
done

echo "🔧 Setting up Droplet..."

# Copy deployment files
scp -r ./ root@$IP:/root/magnifycash-bot

# Run setup script
ssh root@$IP "cd /root/magnifycash-bot && bash scripts/setup-server.sh"

echo "
✨ Setup complete! ✨

Your bot is now running at $IP

Monitor your bot:
- Logs: journalctl -u magnifycash-bot
- Status: systemctl status magnifycash-bot
- MongoDB: systemctl status mongod
"