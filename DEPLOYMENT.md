# CMS Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. **SSH Access** to server 20.244.10.206
2. **MySQL Database** running on the server (or accessible from it)
3. **Docker** and **Docker Compose** installed on the server (script will install if missing)
4. **Port 3000** open on the server firewall

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Set your SSH username (default is 'root')
export SSH_USER=your_username

# Run the deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

The script will:
- Package the application
- Copy files to the server
- Install Docker if needed
- Build and start the application
- Run database migrations

### Option 2: Manual Deployment

#### Step 1: Prepare the Application

```bash
# Build the application locally (optional, to verify)
npm install
npm run build
```

#### Step 2: Copy Files to Server

```bash
# Create deployment package
tar -czf cms-deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='dev.db' \
    .

# Copy to server
scp cms-deploy.tar.gz root@20.244.10.206:/tmp/
```

#### Step 3: Deploy on Server

SSH into the server:

```bash
ssh root@20.244.10.206
```

Then run:

```bash
# Create application directory
mkdir -p /opt/cms
cd /opt/cms

# Extract files
tar -xzf /tmp/cms-deploy.tar.gz
rm /tmp/cms-deploy.tar.gz

# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker

# Install Docker Compose (if not already installed)
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Build and start the application
docker-compose build
docker-compose up -d
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check if containers are running
docker-compose ps

# Check application logs
docker-compose logs -f app

# Test the application
curl http://20.244.10.206:3000
```

### 2. Access the Application

Open your browser and navigate to:
```
http://20.244.10.206:3000
```

### 3. Login

Use the default credentials:
- **Email**: admin@example.com
- **Password**: admin123

**⚠️ IMPORTANT**: Change the default password immediately after first login!

### 4. Database Setup

If this is the first deployment, you may need to run migrations:

```bash
# SSH into the server
ssh root@20.244.10.206

# Navigate to app directory
cd /opt/cms

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Seed admin user (if needed)
docker-compose exec app npm run db:seed
```

## Firewall Configuration

Ensure port 3000 is open:

```bash
# For UFW (Ubuntu)
sudo ufw allow 3000/tcp

# For firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# For iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables-save
```

## Maintenance

### View Logs

```bash
# All logs
docker-compose logs -f

# App logs only
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app
```

### Restart Application

```bash
docker-compose restart app
```

### Stop Application

```bash
docker-compose down
```

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Database Backup

```bash
# Backup database
docker-compose exec app npx prisma db pull
```

## Troubleshooting

### Application Won't Start

1. Check logs: `docker-compose logs app`
2. Verify database connection: Check DATABASE_URL in docker-compose.yml
3. Ensure MySQL is accessible from the container

### Database Connection Issues

1. Verify MySQL is running on 20.244.10.206:3306
2. Check credentials: `root:Demandify@766`
3. Ensure database `cms` exists
4. Test connection:
   ```bash
   docker-compose exec app npx prisma db pull
   ```

### Port Already in Use

If port 3000 is already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # Use port 8080 instead
```

Then update NEXTAUTH_URL accordingly.

### Permission Issues

If you encounter permission issues:

```bash
# Fix ownership
sudo chown -R $USER:$USER /opt/cms

# Or run with sudo
sudo docker-compose up -d
```

## Security Recommendations

1. **Change Default Password**: Update admin password immediately
2. **Update NEXTAUTH_SECRET**: Generate a new secret for production
3. **Enable HTTPS**: Set up SSL/TLS with nginx or similar
4. **Firewall**: Only expose necessary ports
5. **Database Security**: Use strong passwords and limit access
6. **Regular Updates**: Keep dependencies and Docker images updated

## Environment Variables

Key environment variables in `docker-compose.yml`:

- `DATABASE_URL`: MySQL connection string
- `NEXTAUTH_URL`: Public URL of your application
- `NEXTAUTH_SECRET`: Secret key for NextAuth.js

## Support

For issues or questions:
1. Check application logs
2. Verify database connectivity
3. Review Docker container status
4. Check firewall rules
