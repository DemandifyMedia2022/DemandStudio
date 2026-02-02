#!/bin/bash
set -e

# Configuration
SERVER_IP="20.244.10.206"
SERVER_USER="${SSH_USER:-dial-test}"
APP_DIR="/opt/cms"
APP_NAME="cms-app"

echo "🚀 Starting deployment to $SERVER_IP..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if SSH_USER is set
if [ -z "$SSH_USER" ]; then
    print_warning "SSH_USER not set, using 'dial-test' as default"
    print_warning "Set SSH_USER environment variable if needed: export SSH_USER=your_username"
fi

# Step 1: Create deployment package
print_status "Creating deployment package..."
tar -czf cms-deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='dev.db' \
    --exclude='*.log' \
    .

# Step 2: Copy files to server
print_status "Copying files to server..."
scp cms-deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/

# Step 3: Execute deployment on server
print_status "Executing deployment on server..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

APP_DIR="/opt/cms"
APP_NAME="cms-app"

echo "📦 Setting up application directory..."
sudo mkdir -p $APP_DIR
cd $APP_DIR

echo "📂 Extracting files..."
sudo tar -xzf /tmp/cms-deploy.tar.gz -C $APP_DIR
sudo rm /tmp/cms-deploy.tar.gz

echo "🐳 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo systemctl start docker
    sudo systemctl enable docker
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "🛑 Stopping existing containers..."
sudo docker-compose down 2>/dev/null || true

echo "🏗️  Building Docker image..."
sudo docker-compose build

echo "🚀 Starting containers..."
sudo docker-compose up -d

echo "⏳ Waiting for application to start..."
sleep 10

echo "✅ Deployment complete!"
echo "🌐 Application should be available at: http://20.244.10.206:3000"
echo "📊 Check logs with: sudo docker-compose logs -f"
ENDSSH

# Cleanup
rm cms-deploy.tar.gz

print_status "Deployment completed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Access your application at: http://${SERVER_IP}:3000"
echo "   2. Login with admin credentials (admin@example.com / admin123)"
echo "   3. Change the default password"
echo ""
echo "🔍 To check logs:"
echo "   ssh ${SERVER_USER}@${SERVER_IP} 'cd /opt/cms && sudo docker-compose logs -f'"
