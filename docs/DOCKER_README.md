# 🐳 Docker Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the KPT Application using Docker and Docker Compose. It covers development, staging, and production environments with best practices for containerization.

## 🏗️ Architecture

### Container Structure

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   KPT App      │    │   MySQL        │
│   (Port 80/443) │◄──►│   (Port 3000)  │◄──►│   (Port 3306)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Redis        │
                       │   (Port 6379)  │
                       └─────────────────┘
```

### Service Components

- **Nginx** - Reverse proxy and load balancer
- **KPT App** - Main NestJS application
- **MySQL** - Primary database
- **Redis** - Cache and queue storage
- **Adminer** - Database management interface (optional)

## 🔧 Prerequisites

### Required Software

- **Docker** (v20.10 or higher)
- **Docker Compose** (v2.0 or higher)
- **Make** (optional, for simplified commands)

### System Requirements

- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: Minimum 10GB free space
- **OS**: Linux, macOS, or Windows with Docker Desktop

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-username/kpt-app.git
cd kpt-app
```

### 2. Environment Configuration

```bash
# Copy environment files
cp .deploy/env.dev.example .deploy/env.dev
cp .deploy/env.stg.example .deploy/env.stg
cp .deploy/env.prod.example .deploy/env.prod

# Edit environment variables
nano .deploy/env.dev
```

### 3. Start Services

```bash
# Development environment
docker-compose -f docker-compose.dev.yml up -d

# Staging environment
docker-compose -f docker-compose.stg.yml up -d

# Production environment
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 Docker Configuration Files

### Development Environment

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - mysql
      - redis
    command: npm run start:dev

  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: kpt_app_dev
      MYSQL_USER: kpt_user
      MYSQL_PASSWORD: kpt_password
    volumes:
      - mysql_dev_data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d
    command: --default-authentication-plugin=mysql_native_password

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data
    command: redis-server --appendonly yes

  adminer:
    image: adminer:latest
    ports:
      - "8080:8080"
    depends_on:
      - mysql

volumes:
  mysql_dev_data:
  redis_dev_data:
```

### Staging Environment

```yaml
# docker-compose.stg.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.stg
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=staging
    env_file:
      - .deploy/env.stg
    depends_on:
      - mysql
      - redis
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_stg_data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_stg_data:/data
    restart: unless-stopped

volumes:
  mysql_stg_data:
  redis_stg_data:
```

### Production Environment

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - app
    restart: unless-stopped

  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .deploy/env.prod
    depends_on:
      - mysql
      - redis
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  mysql:
    image: mysql:8.0
    expose:
      - "3306"
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_prod_data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d
      - ./mysql/backup:/backup
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G

  redis:
    image: redis:6-alpine
    expose:
      - "6379"
    volumes:
      - redis_prod_data:/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

volumes:
  mysql_prod_data:
  redis_prod_data:
```

## 🐳 Dockerfile Configurations

### Development Dockerfile

```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "start:dev"]
```

### Staging Dockerfile

```dockerfile
# Dockerfile.stg
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main"]
```

### Production Dockerfile

```dockerfile
# Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Set ownership
RUN chown -R nestjs:nodejs /app
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main"]
```

## 🌐 Nginx Configuration

### Main Configuration

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app_backend {
        server app:3000;
        keepalive 32;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=admin:10m rate=5r/s;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    server {
        listen 80;
        server_name localhost;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name localhost;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://app_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Admin endpoints (stricter rate limiting)
        location /api/admin/ {
            limit_req zone=admin burst=10 nodelay;
            
            proxy_pass http://app_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health {
            proxy_pass http://app_backend;
            access_log off;
        }

        # Static files
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }
    }
}
```

## 🔧 Environment Configuration

### Development Environment

```bash
# .deploy/env.dev
NODE_ENV=development
PORT=3000

# Database
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=kpt_user
DB_PASSWORD=kpt_password
DB_DATABASE=kpt_app_dev

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=dev-secret-key
JWT_EXPIRES_IN=15m

# External Services
OPENAI_API_KEY=your-openai-key
FIREBASE_PROJECT_ID=your-firebase-project
```

### Staging Environment

```bash
# .deploy/env.stg
NODE_ENV=staging
PORT=3000

# Database
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=${MYSQL_USER}
DB_PASSWORD=${MYSQL_PASSWORD}
DB_DATABASE=${MYSQL_DATABASE}

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_DB=0

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=15m

# External Services
OPENAI_API_KEY=${OPENAI_API_KEY}
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
```

### Production Environment

```bash
# .deploy/env.prod
NODE_ENV=production
PORT=3000

# Database
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=${MYSQL_USER}
DB_PASSWORD=${MYSQL_PASSWORD}
DB_DATABASE=${MYSQL_DATABASE}

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_DB=0

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=15m

# External Services
OPENAI_API_KEY=${OPENAI_API_KEY}
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}

# Monitoring
ENABLE_MONITORING=true
LOG_LEVEL=info
```

## 🚀 Deployment Commands

### Using Make Commands

```bash
# Development
make dev-up
make dev-down
make dev-logs
make dev-shell

# Staging
make stg-up
make stg-down
make stg-logs
make stg-shell

# Production
make prod-up
make prod-down
make prod-logs
make prod-shell
```

### Using Docker Compose

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml logs -f

# Staging
docker-compose -f docker-compose.stg.yml up -d
docker-compose -f docker-compose.stg.yml down
docker-compose -f docker-compose.stg.yml logs -f

# Production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml logs -f
```

## 📊 Monitoring & Health Checks

### Health Check Script

```javascript
// healthcheck.js
const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', () => {
  process.exit(1);
});

request.end();
```

### Monitoring Configuration

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  grafana_data:
```

## 🔒 Security Considerations

### Container Security

```bash
# Run containers as non-root user
USER nestjs

# Use specific image tags
FROM node:18-alpine@sha256:abc123...

# Scan images for vulnerabilities
docker scan kpt-app:latest

# Use multi-stage builds
FROM node:18-alpine AS builder
# ... build stage
FROM node:18-alpine AS production
# ... production stage
```

### Network Security

```yaml
# Use internal networks
networks:
  internal:
    driver: bridge
    internal: true
  external:
    driver: bridge

services:
  app:
    networks:
      - internal
  nginx:
    networks:
      - internal
      - external
```

### Volume Security

```yaml
# Use named volumes with specific permissions
volumes:
  mysql_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /var/lib/mysql
```

## 🧪 Testing

### Container Testing

```bash
# Test container build
docker build -f Dockerfile.dev -t kpt-app:dev .

# Test container run
docker run --rm -p 3000:3000 kpt-app:dev

# Test health check
curl http://localhost:3000/health
```

### Integration Testing

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run tests
docker-compose -f docker-compose.test.yml exec app npm run test:e2e

# Cleanup
docker-compose -f docker-compose.test.yml down -v
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Container Won't Start

```bash
# Check container logs
docker-compose logs app

# Check container status
docker-compose ps

# Check resource usage
docker stats
```

#### 2. Database Connection Issues

```bash
# Check MySQL container
docker-compose exec mysql mysql -u root -p

# Check network connectivity
docker-compose exec app ping mysql

# Check environment variables
docker-compose exec app env | grep DB
```

#### 3. Port Conflicts

```bash
# Check port usage
lsof -i :3000
lsof -i :3306
lsof -i :6379

# Kill conflicting processes
kill -9 <PID>
```

### Debug Mode

```bash
# Enable debug logging
docker-compose -f docker-compose.dev.yml up -d --build

# Follow logs
docker-compose -f docker-compose.dev.yml logs -f app

# Access container shell
docker-compose -f docker-compose.dev.yml exec app sh
```

## 📚 Best Practices

### 1. Image Optimization
- Use multi-stage builds
- Minimize layer count
- Use .dockerignore files
- Remove unnecessary files

### 2. Security
- Run as non-root user
- Use specific image tags
- Scan images regularly
- Limit container capabilities

### 3. Performance
- Use appropriate base images
- Optimize layer caching
- Monitor resource usage
- Use health checks

### 4. Monitoring
- Implement health checks
- Use logging drivers
- Monitor container metrics
- Set up alerting

## 🎯 Conclusion

Docker provides a robust and scalable way to deploy the KPT Application. Key benefits include:

- **Consistency**: Same environment across development, staging, and production
- **Scalability**: Easy horizontal scaling with multiple replicas
- **Isolation**: Separate environments for different purposes
- **Portability**: Run anywhere Docker is available
- **Maintainability**: Version-controlled infrastructure as code

Follow the best practices outlined in this guide to ensure secure, performant, and maintainable deployments.

## 📚 Additional Resources

- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [MySQL Docker Guide](https://hub.docker.com/_/mysql)
- [Redis Docker Guide](https://hub.docker.com/_/redis)
