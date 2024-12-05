#!/bin/bash

# Exit on error
set -e

echo "🚀 Setting up MagnifyCash Bot server..."

# Update system
apt-get update
apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install MongoDB
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg] http://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt-get update
apt-get install -y mongodb-org

# Start MongoDB
systemctl enable mongod
systemctl start mongod

# Create app directory
mkdir -p /opt/magnifycash-bot
cp -r /root/magnifycash-bot/* /opt/magnifycash-bot/

# Create service user
useradd -r -s /bin/false magnifycash

# Set permissions
chown -R magnifycash:magnifycash /opt/magnifycash-bot
chmod -R 755 /opt/magnifycash-bot

# Install dependencies
cd /opt/magnifycash-bot
npm ci --production

# Create systemd service
cat > /etc/systemd/system/magnifycash-bot.service << EOF
[Unit]
Description=MagnifyCash Telegram Bot
After=network.target mongodb.service

[Service]
Type=simple
User=magnifycash
WorkingDirectory=/opt/magnifycash-bot
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Setup logs directory
mkdir -p /var/log/magnifycash-bot
chown magnifycash:magnifycash /var/log/magnifycash-bot

# Start service
systemctl daemon-reload
systemctl enable magnifycash-bot
systemctl start magnifycash-bot

echo "✅ Server setup complete!"