# 📚 KPT Application Documentation

## Overview

Welcome to the comprehensive documentation for the KPT Application. This documentation covers all aspects of the application, from setup and configuration to advanced features and deployment.

## 🏗️ Architecture

### Core Components

- **NestJS Framework** - Modern Node.js framework for building scalable applications
- **TypeORM** - Object-Relational Mapping for database operations
- **Firebase Integration** - Authentication and real-time database
- **Bull Queue System** - Asynchronous job processing with Redis
- **AI Integration** - ChatGPT-powered content generation
- **Email System** - Responsive email templates with SendGrid

### Application Structure

```
kpt-app/
├── src/                    # Source code
│   ├── admin/             # Admin module and controls
│   ├── auth/              # Authentication and authorization
│   ├── profile/           # User profiles and activities
│   ├── suggested-activity/ # AI-powered activity suggestions
│   ├── users/             # User management
│   └── common/            # Shared utilities and services
├── config/                 # Configuration files
├── docs/                   # Documentation
├── mysql/                  # Database initialization scripts
└── test/                   # Test files
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **MySQL** (v8.0 or higher)
- **Redis** (v6.0 or higher)
- **Git**

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/kpt-app.git
cd kpt-app

# Install dependencies
npm install

# Configure environment
cp config/third-party/*.example.json config/third-party/
cp .deploy/env.dev.example .deploy/env.dev

# Setup database
npm run db:init

# Start development server
npm run start:dev
```

### Environment Configuration

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=kpt_user
DB_PASSWORD=your_password
DB_DATABASE=kpt_app_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo

# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@kpt-app.com
```

## 📖 Documentation Sections

### 1. [Quick Start Guide](./QUICK_START.md)
Complete setup instructions for getting the application running quickly.

**Topics Covered:**
- Installation and configuration
- Environment setup
- Database initialization
- Running the application
- Testing and verification

### 2. [API Endpoints](./API_ENDPOINTS.md)
Comprehensive API documentation with examples and response formats.

**Topics Covered:**
- Authentication endpoints
- User management APIs
- Activity management
- Admin functions
- Error handling and responses

### 3. [Admin Module](./ADMIN_README.md)
Administrative features and system management capabilities.

**Topics Covered:**
- User management
- System monitoring
- Queue management
- Analytics dashboard
- Security controls

### 4. [Activity Types](./ACTIVITY_TYPES_README.md)
System for categorizing and managing different types of activities.

**Topics Covered:**
- Predefined activity types
- Dynamic type generation
- AI-powered recommendations
- Category management
- Search and discovery

### 5. [Pagination Systems](./ACTIVITY_PAGINATION_README.md)
Implementation of pagination for efficient data loading.

**Topics Covered:**
- Activity pagination
- Admin pagination
- User pagination
- Performance optimization
- Best practices

### 6. [Docker Deployment](./DOCKER_README.md)
Containerized deployment using Docker and Docker Compose.

**Topics Covered:**
- Development environment
- Staging environment
- Production deployment
- Nginx configuration
- Security considerations

### 7. [Email Templates](./EMAIL_TEMPLATES_README.md)
HTML email templates for transactional communications.

**Topics Covered:**
- Responsive email design
- Template management
- Dynamic content generation
- Email tracking
- Security considerations

### 8. [Firebase Setup](./FIREBASE_SETUP.md)
Firebase integration for authentication and real-time features.

**Topics Covered:**
- Authentication setup
- Firestore database
- Storage configuration
- Security rules
- Integration examples

## 🔧 Core Features

### Authentication System

- **JWT-based authentication** with role-based access control
- **Firebase OAuth** integration (Google, Facebook, Apple)
- **Email verification** and password reset functionality
- **Multi-factor authentication** support

### User Management

- **User profiles** with customizable settings
- **Role-based permissions** (user, admin, moderator)
- **Activity tracking** and personal analytics
- **Privacy controls** and data management

### Activity System

- **Personal activities** with rich content support
- **AI-powered suggestions** using ChatGPT
- **Activity categorization** with intelligent type detection
- **Progress tracking** and completion management

### AI Integration

- **ChatGPT-powered content generation** for activity suggestions
- **Personalized recommendations** based on user behavior
- **Dynamic content creation** with natural language processing
- **Intelligent pattern analysis** for user preferences

### Queue System

- **Bull queue management** with Redis backend
- **Asynchronous job processing** for heavy operations
- **Job prioritization** and retry mechanisms
- **Queue monitoring** and administrative controls

### Email System

- **Responsive HTML templates** for all email types
- **SendGrid integration** for reliable delivery
- **Email tracking** and analytics
- **Template customization** and management

## 🗄️ Database Schema

### Core Tables

```sql
-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  roles JSON DEFAULT '["user"]',
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Activities table
CREATE TABLE activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  activityName VARCHAR(255) NOT NULL,
  activityType VARCHAR(100) NOT NULL,
  content JSON,
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Suggested activities table
CREATE TABLE suggested_activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  activityName VARCHAR(255) NOT NULL,
  content TEXT,
  reasoning TEXT,
  isUsed BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Database Initialization

```bash
# Run database setup scripts
npm run db:init              # Initial database structure
npm run db:suggested-activities  # Activity types and suggestions
npm run db:languages         # Language support data
```

## 🚀 Development

### Available Scripts

```bash
# Development
npm run start:dev           # Start development server
npm run start:debug         # Start with debug logging
npm run start:prod          # Start production server

# Testing
npm run test                # Run unit tests
npm run test:e2e           # Run end-to-end tests
npm run test:cov           # Run tests with coverage

# Database
npm run db:init            # Initialize database
npm run db:reset           # Reset database
npm run db:seed            # Seed test data

# CLI Commands
npm run cli create-admin   # Create admin user
npm run cli list-admins    # List admin users
npm run cli remove-admin   # Remove admin user
```

### Code Structure

```typescript
// Example service structure
@Injectable()
export class ExampleService {
  constructor(
    private readonly repository: Repository<Example>,
    private readonly logger: Logger,
  ) {}

  async create(data: CreateExampleDto): Promise<Example> {
    try {
      const example = this.repository.create(data);
      const result = await this.repository.save(example);
      
      this.logger.log(`Example created: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to create example:', error);
      throw error;
    }
  }
}
```

### Testing Strategy

- **Unit tests** for individual services and components
- **Integration tests** for API endpoints
- **E2E tests** for complete user workflows
- **Test coverage** reporting and monitoring

## 🔒 Security Features

### Authentication & Authorization

- **JWT tokens** with configurable expiration
- **Role-based access control** (RBAC)
- **Guards and interceptors** for endpoint protection
- **Rate limiting** to prevent abuse

### Data Protection

- **Input validation** using DTOs and class-validator
- **SQL injection prevention** with TypeORM
- **XSS protection** with content sanitization
- **CSRF protection** for web forms

### API Security

- **HTTPS enforcement** in production
- **CORS configuration** for cross-origin requests
- **Request size limits** to prevent abuse
- **Audit logging** for security events

## 📊 Monitoring & Analytics

### Application Monitoring

- **Health checks** for all services
- **Performance metrics** and response times
- **Error tracking** and alerting
- **Resource usage** monitoring

### User Analytics

- **User engagement** metrics
- **Activity completion** rates
- **Feature usage** statistics
- **Performance insights**

### System Analytics

- **Database performance** monitoring
- **Queue processing** statistics
- **API usage** patterns
- **Error rate** tracking

## 🚀 Deployment

### Development Environment

```bash
# Local development
npm run start:dev

# Docker development
docker-compose -f docker-compose.dev.yml up -d
```

### Staging Environment

```bash
# Docker staging
docker-compose -f docker-compose.stg.yml up -d

# Environment configuration
cp .deploy/env.stg.example .deploy/env.stg
```

### Production Environment

```bash
# Docker production
docker-compose -f docker-compose.prod.yml up -d

# Environment configuration
cp .deploy/env.prod.example .deploy/env.prod
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup systems tested
- [ ] Security audit completed

## 🆘 Support & Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check MySQL status
sudo systemctl status mysql

# Check connection
mysql -u kpt_user -p kpt_app_dev
```

#### Redis Connection
```bash
# Check Redis status
redis-cli ping

# Check Redis info
redis-cli info
```

#### Port Conflicts
```bash
# Check port usage
lsof -i :3000
lsof -i :3306
lsof -i :6379
```

### Getting Help

- **Documentation**: Review relevant sections
- **GitHub Issues**: Search existing issues or create new ones
- **Community**: Join Discord for real-time support
- **Email**: Contact support@kpt-app.com

## 🔄 Updates & Maintenance

### Regular Maintenance

- **Security updates** for dependencies
- **Database optimization** and index maintenance
- **Log rotation** and cleanup
- **Performance monitoring** and optimization

### Version Updates

- **Semantic versioning** for releases
- **Changelog documentation** for all changes
- **Migration guides** for major updates
- **Rollback procedures** for critical issues

## 📚 Additional Resources

### External Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)

### Community Resources

- [GitHub Repository](https://github.com/your-username/kpt-app)
- [Discord Community](https://discord.gg/kpt-app)
- [Issue Tracker](https://github.com/your-username/kpt-app/issues)
- [Wiki](https://github.com/your-username/kpt-app/wiki)

## 🎯 Conclusion

The KPT Application provides a comprehensive platform for personal activity management with AI-powered suggestions, robust user management, and scalable architecture. This documentation serves as your complete guide to understanding, developing, and deploying the application.

For questions, suggestions, or contributions, please reach out through the community channels or create an issue in the GitHub repository.

---

**Happy coding! 🚀**
