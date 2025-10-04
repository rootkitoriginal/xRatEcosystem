# Deployment Guide - xRat Ecosystem

This guide covers deploying the xRat Ecosystem in various environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Deployment](#local-deployment)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment-future)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software

- **Docker:** 20.10+
- **Docker Compose:** 2.0+
- **Git:** Any recent version

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4 GB
- Disk: 20 GB
- OS: Linux, macOS, or Windows with WSL2

**Recommended:**
- CPU: 4 cores
- RAM: 8 GB
- Disk: 50 GB
- OS: Linux (Ubuntu 22.04 LTS)

---

## 🌍 Environment Variables

### Creating Environment File

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
nano .env
```

### Required Variables

```bash
# Node Environment
NODE_ENV=production

# Backend Configuration
PORT=3000
FRONTEND_URL=https://your-domain.com

# MongoDB Configuration
MONGODB_URI=mongodb://mongo:27017/xrat
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your_secure_password_here

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# Security
JWT_SECRET=your_jwt_secret_here  # future
SESSION_SECRET=your_session_secret  # future
```

### Optional Variables

```bash
# Logging
LOG_LEVEL=info  # debug, info, warn, error

# Database
MONGODB_MAX_POOL_SIZE=10

# Redis
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=1000

# API
RATE_LIMIT_WINDOW=60000  # future
RATE_LIMIT_MAX=100  # future
```

### Environment-Specific Configuration

**Development:**
```bash
NODE_ENV=development
LOG_LEVEL=debug
FRONTEND_URL=http://localhost:5173
```

**Staging:**
```bash
NODE_ENV=staging
LOG_LEVEL=info
FRONTEND_URL=https://staging.your-domain.com
```

**Production:**
```bash
NODE_ENV=production
LOG_LEVEL=warn
FRONTEND_URL=https://your-domain.com
```

---

## 🏠 Local Deployment

### Quick Start

```bash
# Clone repository
git clone https://github.com/xLabInternet/xRatEcosystem.git
cd xRatEcosystem

# Setup environment
cp .env.example .env

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Access Services

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

### Stopping Services

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove everything (including volumes)
docker-compose down -v
```

---

## 🚀 Production Deployment

### 1. Server Setup

#### Update System

```bash
sudo apt update
sudo apt upgrade -y
```

#### Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (if using reverse proxy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### 2. Application Deployment

#### Clone Repository

```bash
cd /opt
sudo git clone https://github.com/xLabInternet/xRatEcosystem.git
cd xRatEcosystem
```

#### Configure Environment

```bash
# Copy and edit environment file
sudo cp .env.example .env
sudo nano .env

# Set secure passwords
# Set NODE_ENV=production
# Configure frontend URL
```

#### Start Services

```bash
# Pull latest images
sudo docker-compose pull

# Start in detached mode
sudo docker-compose up -d

# Check status
sudo docker-compose ps

# View logs
sudo docker-compose logs -f
```

### 3. Reverse Proxy Setup (Nginx)

#### Install Nginx

```bash
sudo apt install nginx -y
```

#### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/xrat
```

```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/xrat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL/TLS Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificates
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### 5. Systemd Service (Optional)

Create a systemd service to manage the application:

```bash
sudo nano /etc/systemd/system/xrat.service
```

```ini
[Unit]
Description=xRat Ecosystem
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/xRatEcosystem
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable xrat
sudo systemctl start xrat

# Check status
sudo systemctl status xrat
```

---

## 🐳 Docker Deployment

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - mongo
      - redis
    networks:
      - xrat-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=${BACKEND_URL}
    restart: always
    networks:
      - xrat-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  mongo:
    image: mongo:7.0
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_INITDB_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_INITDB_ROOT_PASSWORD}
    volumes:
      - mongo_data:/data/db
    networks:
      - xrat-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  redis:
    image: redis:7.2-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - xrat-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

volumes:
  mongo_data:
  redis_data:

networks:
  xrat-network:
    driver: bridge
```

### Deploy with Production Config

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## ☸️ Kubernetes Deployment (Future)

### Prerequisites

- Kubernetes cluster (v1.25+)
- kubectl configured
- Helm 3.x (optional)

### Deployment Files

**Namespace:**
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: xrat-ecosystem
```

**ConfigMap:**
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: xrat-config
  namespace: xrat-ecosystem
data:
  NODE_ENV: "production"
  MONGODB_URI: "mongodb://mongo-service:27017/xrat"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
```

**Secrets:**
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: xrat-secrets
  namespace: xrat-ecosystem
type: Opaque
stringData:
  mongodb-password: "your-password"
  redis-password: "your-password"
```

**Deployments, Services, and Ingress** would be created similarly.

### Deploy

```bash
kubectl apply -f k8s/
```

---

## 📊 Monitoring

### Health Checks

```bash
# Check backend health
curl http://localhost:3000/health

# Check all services
docker-compose ps
```

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Resource Usage

```bash
# Container stats
docker stats

# Specific container
docker stats xrat-backend
```

### Monitoring Tools (Future)

- **Prometheus:** Metrics collection
- **Grafana:** Visualization
- **Loki:** Log aggregation
- **Alert Manager:** Alerting

---

## 🔧 Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check port conflicts
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5173

# Restart services
docker-compose restart
```

#### Database Connection Issues

```bash
# Check MongoDB is running
docker-compose ps mongo

# Check MongoDB logs
docker-compose logs mongo

# Test connection
docker-compose exec backend mongo mongodb://mongo:27017
```

#### Permission Issues

```bash
# Fix volume permissions
sudo chown -R $USER:$USER .

# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker
```

### Backup and Restore

#### Backup MongoDB

```bash
# Create backup
docker-compose exec mongo mongodump --out=/backup

# Copy to host
docker cp xrat-mongo:/backup ./mongodb-backup-$(date +%Y%m%d)
```

#### Restore MongoDB

```bash
# Copy backup to container
docker cp ./mongodb-backup xrat-mongo:/backup

# Restore
docker-compose exec mongo mongorestore /backup
```

#### Backup Redis

```bash
# Create snapshot
docker-compose exec redis redis-cli BGSAVE

# Copy snapshot
docker cp xrat-redis:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

### Performance Tuning

#### Node.js

```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=2048"
```

#### MongoDB

```bash
# Create indexes
db.collection.createIndex({ field: 1 })
```

#### Redis

```bash
# Configure max memory
maxmemory 256mb
maxmemory-policy allkeys-lru
```

---

## 🔄 Updates and Maintenance

### Updating Application

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose build

# Restart services
docker-compose up -d

# Clean up old images
docker image prune -a
```

### Database Migrations

```bash
# Future: Run migrations
npm run migrate
```

---

## 📞 Support

- **Documentation:** Check docs/ directory
- **Issues:** GitHub Issues
- **Community:** GitHub Discussions

---

**Last Updated:** 2025-01-03  
**Version:** 1.0.0
