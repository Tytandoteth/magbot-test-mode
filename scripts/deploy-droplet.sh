#!/bin/bash

# Exit on error
set -e

echo "🚀 Deploying MagnifyCash Bot to DigitalOcean Droplet..."

# Install Node.js and other dependencies
echo "📦 Installing dependencies..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get update
sudo apt-get install -y nodejs nginx mongodb

# Create app directory
echo "📁 Setting up application directory..."
sudo mkdir -p /var/www/magnifycash
sudo chown -R $USER:$USER /var/www/magnifycash

# Setup Nginx
echo "🔧 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/magnifycash << EOF
server {
    listen 80;
    server_name your-domain.com;

    location /health {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        return 404;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/magnifycash /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Setup PM2
echo "🔄 Setting up PM2..."
sudo npm install -g pm2
pm2 startup

# Setup MongoDB
echo "🗄️ Configuring MongoDB..."
sudo systemctl enable mongod
sudo systemctl start mongod

# Create service user
echo "👤 Creating service user..."
sudo useradd -r -s /bin/false magnifycash

# Setup application
echo "🚀 Setting up application..."
cd /var/www/magnifycash
npm ci --only=production
npm run build

# Setup systemd service
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/magnifycash.service << EOF
[Unit]
Description=MagnifyCash Telegram Bot
After=network.target mongodb.service

[Service]
Type=simple
User=magnifycash
WorkingDirectory=/var/www/magnifycash
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Start service
echo "▶️ Starting service..."
sudo systemctl enable magnifycash
sudo systemctl start magnifycash

echo "✅ Deployment complete!"