#!/bin/bash

# ============================================
# AWS EC2 Deployment Script for Resume Checker Backend
# ============================================
# This script sets up the backend on a fresh Ubuntu 22.04 EC2 instance
# Run this script as: bash deploy-aws.sh
APP_DIR="/home/ubuntu/resume-app/backend" # Update this path to your actual application directory

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Ollama
echo "🤖 Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama service
echo "🤖 Starting Ollama service..."
sudo systemctl enable ollama
sudo systemctl start ollama

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to start..."
sleep 5

# Pull the Llama3 model
echo "📥 Pulling Llama3 model (this may take several minutes)..."
ollama pull llama3

# Verify Ollama is working
echo "✅ Verifying Ollama installation..."
curl -s http://localhost:11434/api/tags | grep -q "llama3" && echo "Ollama is ready!" || echo "Warning: Ollama may not be ready"

# Navigate to application directory
echo "📂 Setting up application..."
cd "$APP_DIR" || {
    echo "❌ Application directory not found. Please clone your repository first."
    echo "Expected path: $APP_DIR"
    echo "Run: git clone <your-repo-url> $APP_DIR"
    exit 1
}

# Install dependencies
echo "📦 Installing application dependencies..."
npm install --production

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
PORT=5001
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3
NODE_ENV=production
EOF
fi

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 delete resume-checker-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Install and configure nginx (optional but recommended)
echo "🌐 Installing nginx..."
sudo apt install -y nginx

# Create nginx configuration
echo "⚙️  Configuring nginx..."
sudo tee /etc/nginx/sites-available/resume-checker << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable nginx site
sudo ln -sf /etc/nginx/sites-available/resume-checker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Your backend is running on port 80 (via nginx)"
echo "2. Check status: pm2 status"
echo "3. View logs: pm2 logs resume-checker-backend"
echo "4. Test health endpoint: curl http://localhost/health"
echo "5. Get your EC2 public IP and update your frontend's VITE_API_URL"
echo ""
echo "🔗 Useful commands:"
echo "   - Restart app: pm2 restart resume-checker-backend"
echo "   - Stop app: pm2 stop resume-checker-backend"
echo "   - View logs: pm2 logs"
echo "   - Monitor: pm2 monit"
echo ""
