# 🚀 Quick Start Guide

## Overview

This guide will help you get the KPT Application up and running quickly. Follow these steps to set up the development environment and run the application.

## 📋 Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **MySQL** (v8.0 or higher)
- **Redis** (v6.0 or higher)
- **Git**

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: Minimum 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux

## 🔧 Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-username/kpt-app.git
cd kpt-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy example configuration files:

```bash
# Copy environment configuration
cp config/third-party/firebase.example.json config/third-party/firebase.json
cp config/third-party/google-drive.example.json config/third-party/google-drive.json
cp config/third-party/openai.example.json config/third-party/openai.json
cp config/third-party/redis.example.json config/third-party/redis.json
cp config/third-party/sendgrid.example.json config/third-party/sendgrid.json
cp config/third-party/users-pagination.example.json config/third-party/users-pagination.json

# Copy deployment configuration
cp .deploy/env.dev.example .deploy/env.dev
cp .deploy/env.stg.example .deploy/env.stg
```

### 4. Configure Environment Variables

Edit the configuration files with your actual values:

#### Firebase Configuration (`config/third-party/firebase.json`)
```json
{
  "FIREBASE_PROJECT_ID": "your-project-id",
  "FIREBASE_PRIVATE_KEY": "your-private-key",
  "FIREBASE_CLIENT_EMAIL": "your-client-email"
}
```

#### OpenAI Configuration (`config/third-party/openai.json`)
```json
{
  "OPENAI_API_KEY": "your-openai-api-key",
  "OPENAI_MODEL": "gpt-3.5-turbo",
  "OPENAI_MAX_TOKENS": 1000,
  "OPENAI_TEMPERATURE": 0.7
}
```

#### Redis Configuration (`config/third-party/redis.json`)
```json
{
  "REDIS_HOST": "localhost",
  "REDIS_PORT": 6379,
  "REDIS_PASSWORD": "",
  "REDIS_DB": 0,
  "REDIS_PREFIX": "bull:suggested-activity"
}
```

## 🗄️ Database Setup

### 1. Create MySQL Database

```sql
CREATE DATABASE kpt_app_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kpt_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON kpt_app_dev.* TO 'kpt_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Run Database Migrations

```bash
# Run initial database setup
npm run db:init

# Run suggested activities setup
npm run db:suggested-activities

# Run languages setup
npm run db:languages
```

## 🚀 Running the Application

### 1. Start Redis Server

```bash
# On macOS with Homebrew
brew services start redis

# On Ubuntu/Debian
sudo systemctl start redis-server

# On Windows
redis-server
```

### 2. Start Development Server

```bash
npm run start:dev
```

The application will be available at:
- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api-docs

### 3. Verify Installation

Check if the application is running:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

## 🧪 Testing

### 1. Run Unit Tests

```bash
npm run test
```

### 2. Run Integration Tests

```bash
npm run test:e2e
```

### 3. Run Tests with Coverage

```bash
npm run test:cov
```

## 📱 API Testing

### 1. Swagger UI

Open http://localhost:3000/api-docs in your browser to explore the API interactively.

### 2. Postman Collection

Import the provided Postman collection for API testing:
- **Collection File**: `postman/KPT_App_API.postman_collection.json`
- **Environment File**: `postman/KPT_App_Dev.postman_environment.json`

### 3. cURL Examples

#### Health Check
```bash
curl http://localhost:3000/health
```

#### User Registration
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

## 🔧 Development Tools

### 1. CLI Commands

```bash
# Create admin user
npm run cli create-admin --email=admin@example.com --password=admin123

# List admin users
npm run cli list-admins

# Remove admin user
npm run cli remove-admin --email=user@example.com

# Test cron jobs
npm run cli test-cron

# Test queue processing
npm run cli test-queue
```

### 2. Database Management

```bash
# Reset database
npm run db:reset

# Seed test data
npm run db:seed

# Backup database
npm run db:backup

# Restore database
npm run db:restore
```

### 3. Queue Management

```bash
# Check queue status
curl -H "Authorization: Bearer <admin-token>" http://localhost:3000/admin/queue/status

# Get queue statistics
curl -H "Authorization: Bearer <admin-token>" http://localhost:3000/admin/queue/stats
```

## 🐳 Docker Setup

### 1. Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 2. Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: kpt_app_dev
      MYSQL_USER: kpt_user
      MYSQL_PASSWORD: kpt_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### 2. Database Connection Error

```bash
# Check MySQL status
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql

# Check connection
mysql -u kpt_user -p kpt_app_dev
```

#### 3. Redis Connection Error

```bash
# Check Redis status
redis-cli ping

# Restart Redis
sudo systemctl restart redis-server
```

#### 4. Permission Denied

```bash
# Fix file permissions
chmod +x scripts/*.sh
chmod 644 config/third-party/*.json
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
export DEBUG=kpt-app:*

# Start application
npm run start:dev
```

### Log Files

Check application logs:

```bash
# View application logs
tail -f logs/application.log

# View error logs
tail -f logs/error.log

# View access logs
tail -f logs/access.log
```

## 📚 Next Steps

### 1. Explore the API

- Review the [API Endpoints Documentation](./API_ENDPOINTS.md)
- Test endpoints using Swagger UI
- Import Postman collection for comprehensive testing

### 2. Understand the Architecture

- Read the [Main README](./README.md)
- Review [Activity Types Documentation](./ACTIVITY_TYPES_README.md)
- Check [Admin Module Documentation](./ADMIN_README.md)

### 3. Customize Configuration

- Modify environment variables for your needs
- Adjust database settings
- Configure external service integrations

### 4. Development Workflow

- Set up your IDE with recommended extensions
- Configure linting and formatting
- Set up pre-commit hooks

## 🆘 Getting Help

### Documentation

- **Main Documentation**: [./README.md](./README.md)
- **API Reference**: [./API_ENDPOINTS.md](./API_ENDPOINTS.md)
- **Changelog**: [./CHANGELOG.md](./CHANGELOG.md)

### Community

- **GitHub Issues**: [https://github.com/your-username/kpt-app/issues](https://github.com/your-username/kpt-app/issues)
- **Discord**: [https://discord.gg/kpt-app](https://discord.gg/kpt-app)
- **Email**: support@kpt-app.com

### Support

If you encounter issues:

1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information
4. Join the Discord community for real-time help

## 🎯 Success Checklist

- [ ] Repository cloned successfully
- [ ] Dependencies installed
- [ ] Environment configured
- [ ] Database created and migrated
- [ ] Redis server running
- [ ] Application starts without errors
- [ ] Health check endpoint responds
- [ ] Swagger UI accessible
- [ ] Tests passing
- [ ] Admin user created

Congratulations! You've successfully set up the KPT Application development environment. 🎉

## 🚀 Production Deployment

For production deployment, refer to:
- [Docker Deployment Guide](./DOCKER_README.md)
- [Environment Configuration](./ENVIRONMENT_README.md)
- [Security Best Practices](./SECURITY_README.md)
