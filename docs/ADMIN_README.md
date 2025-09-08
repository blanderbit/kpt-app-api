# 👨‍💼 Admin Module Documentation

## Overview

The Admin Module provides comprehensive administrative capabilities for the KPT Application, including user management, system monitoring, queue control, and analytics. It features role-based access control, audit logging, and a robust API for administrative operations.

## 🏗️ Architecture

### Core Components

- **AdminController** - REST API endpoints for administrative operations
- **AdminService** - Business logic for admin functions
- **AdminGuard** - Role-based access control middleware
- **AdminDto** - Data transfer objects for admin operations
- **AuditService** - Comprehensive logging and audit trails

### Admin Features

- **User Management** - CRUD operations for user accounts
- **System Monitoring** - Performance metrics and health checks
- **Queue Management** - Bull queue control and monitoring
- **Analytics Dashboard** - System-wide statistics and insights
- **Security Controls** - Role management and access control

## 🔐 Authentication & Authorization

### Admin Roles

```typescript
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',    // Full system access
  ADMIN = 'admin',                // Standard admin access
  MODERATOR = 'moderator',        // Limited admin access
  SUPPORT = 'support'             // User support access
}
```

### Role Permissions

| Role | Users | System | Queue | Analytics | Settings |
|------|-------|--------|-------|-----------|----------|
| **super_admin** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **admin** | ✅ Full | ✅ Read | ✅ Full | ✅ Full | ✅ Read |
| **moderator** | ✅ Limited | ✅ Read | ✅ Read | ✅ Read | ❌ None |
| **support** | ✅ Read | ❌ None | ❌ None | ❌ None | ❌ None |

### JWT Token Structure

```typescript
interface AdminJwtPayload {
  sub: number;           // User ID
  email: string;         // User email
  roles: AdminRole[];    // User roles
  permissions: string[]; // Specific permissions
  iat: number;          // Issued at
  exp: number;          // Expiration time
}
```

## 📱 API Endpoints

### Authentication

#### Admin Login

```http
POST /admin/auth/login
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": 1,
      "email": "admin@example.com",
      "firstName": "John",
      "lastName": "Admin",
      "roles": ["admin"],
      "permissions": ["users:read", "users:write", "system:read"]
    }
  },
  "message": "Login successful"
}
```

### User Management

#### Get All Users

```http
GET /admin/users
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 25, max: 100)
- `search` - Search query
- `filter` - Filter parameters
- `sortBy` - Sorting field and direction

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["user"],
      "isActive": true,
      "isVerified": true,
      "createdAt": "2024-01-15T06:00:00Z",
      "lastLoginAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "itemsPerPage": 25,
    "totalItems": 150,
    "currentPage": 1,
    "totalPages": 6
  }
}
```

#### Get User by ID

```http
GET /admin/users/:id
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["user"],
    "isActive": true,
    "isVerified": true,
    "profile": {
      "avatarUrl": "https://example.com/avatar.jpg",
      "bio": "Software developer",
      "location": "New York"
    },
    "statistics": {
      "totalActivities": 45,
      "lastActivity": "2024-01-15T10:00:00Z",
      "loginCount": 25
    }
  }
}
```

#### Update User

```http
PUT /admin/users/:id
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "firstName": "Johnny",
  "roles": ["user", "moderator"],
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "firstName": "Johnny",
    "roles": ["user", "moderator"],
    "isActive": true,
    "updatedAt": "2024-01-15T12:00:00Z"
  },
  "message": "User updated successfully"
}
```

#### Delete User

```http
DELETE /admin/users/:id
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### System Monitoring

#### System Health

```http
GET /admin/system/health
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "uptime": "2 hours 15 minutes",
    "version": "1.0.0",
    "services": {
      "database": {
        "status": "connected",
        "responseTime": "5ms",
        "connections": 15,
        "maxConnections": 100
      },
      "redis": {
        "status": "connected",
        "responseTime": "2ms",
        "memory": "256MB",
        "keys": 1250
      },
      "email": {
        "status": "connected",
        "queueSize": 5
      }
    }
  }
}
```

#### System Statistics

```http
GET /admin/system/stats
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1500,
      "active": 1200,
      "newThisWeek": 45,
      "growthRate": "+12%"
    },
    "activities": {
      "total": 15000,
      "thisWeek": 2500,
      "completionRate": 78.5
    },
    "system": {
      "uptime": "99.9%",
      "responseTime": "120ms",
      "errorRate": "0.1%",
      "throughput": "1000 req/min"
    }
  }
}
```

### Queue Management

#### Queue Status

```http
GET /admin/queue/status
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isActive": true,
    "isProcessing": true,
    "isPaused": false,
    "workerCount": 2,
    "lastActivity": "2024-01-15T10:30:00Z",
    "health": "healthy",
    "redisConnection": "connected",
    "uptime": "2 hours 15 minutes"
  }
}
```

#### Queue Statistics

```http
GET /admin/queue/stats
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "waiting": 0,
    "active": 5,
    "completed": 100,
    "failed": 2,
    "delayed": 0,
    "paused": false,
    "totalJobs": 107,
    "processingRate": "25 jobs/minute",
    "successRate": "98.1%",
    "averageProcessingTime": "2.3 seconds"
  }
}
```

#### Queue Control

```http
POST /admin/queue/pause
POST /admin/queue/resume
DELETE /admin/queue/clear
Authorization: Bearer <jwt-token>
```

**Response Examples:**
```json
{
  "success": true,
  "data": {
    "message": "Queue paused successfully",
    "timestamp": "2024-01-15T10:30:00Z",
    "previousStatus": "active"
  }
}
```

### Analytics Dashboard

#### User Analytics

```http
GET /admin/analytics/users
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `period` - Time period (day, week, month, year)
- `startDate` - Start date
- `endDate` - End date

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "week",
    "startDate": "2024-01-08",
    "endDate": "2024-01-15",
    "registrations": {
      "total": 45,
      "daily": [5, 8, 12, 6, 9, 3, 2],
      "growth": "+15%"
    },
    "activity": {
      "total": 2500,
      "averagePerUser": 16.7,
      "mostActiveUsers": [
        {
          "id": 123,
          "email": "user@example.com",
          "activityCount": 45
        }
      ]
    },
    "engagement": {
      "activeUsers": 1200,
      "retentionRate": 85.2,
      "churnRate": 2.1
    }
  }
}
```

#### System Performance

```http
GET /admin/analytics/performance
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "responseTimes": {
      "average": "120ms",
      "p95": "250ms",
      "p99": "500ms"
    },
    "throughput": {
      "requestsPerMinute": 1000,
      "peakLoad": 1500,
      "averageLoad": 800
    },
    "errors": {
      "total": 15,
      "rate": "0.1%",
      "byEndpoint": {
        "/api/users": 5,
        "/api/activities": 8,
        "/api/admin": 2
      }
    },
    "resources": {
      "cpu": "45%",
      "memory": "2.1GB",
      "disk": "15GB"
    }
  }
}
```

## 🔒 Security Features

### Rate Limiting

```typescript
// Admin endpoints have stricter rate limiting
@UseGuards(ThrottlerGuard)
@Throttle(50, 60) // 50 requests per minute for admin
@Get('users')
async getUsers(@Paginate() query: PaginateQuery) {
  return this.adminService.getUsers(query);
}
```

### Input Validation

```typescript
// Comprehensive input validation
@Put('users/:id')
async updateUser(
  @Param('id', ParseIntPipe) id: number,
  @Body() updateUserDto: UpdateUserDto
) {
  // Validate input
  const validationResult = await this.validateUpdateUser(updateUserDto);
  if (!validationResult.isValid) {
    throw new BadRequestException(validationResult.errors);
  }

  return this.adminService.updateUser(id, updateUserDto);
}
```

### Audit Logging

```typescript
// Log all admin actions
@Put('users/:id')
async updateUser(
  @Param('id', ParseIntPipe) id: number,
  @Body() updateUserDto: UpdateUserDto,
  @CurrentUser() admin: AdminUser
) {
  // Log admin action
  await this.auditService.log('admin_user_updated', {
    adminId: admin.id,
    adminEmail: admin.email,
    targetUserId: id,
    changes: updateUserDto,
    timestamp: new Date(),
    ipAddress: this.request.ip,
    userAgent: this.request.headers['user-agent']
  });

  return this.adminService.updateUser(id, updateUserDto);
}
```

## 📊 Monitoring & Alerting

### Health Checks

```typescript
// Comprehensive health monitoring
@Get('system/health')
async getSystemHealth() {
  const healthChecks = await Promise.allSettled([
    this.databaseHealthCheck(),
    this.redisHealthCheck(),
    this.emailHealthCheck(),
    this.queueHealthCheck()
  ]);

  const overallStatus = this.calculateOverallHealth(healthChecks);
  
  // Send alerts for critical issues
  if (overallStatus === 'critical') {
    await this.alertService.sendCriticalAlert('System health critical');
  }

  return {
    status: overallStatus,
    checks: healthChecks,
    timestamp: new Date()
  };
}
```

### Performance Monitoring

```typescript
// Track API performance
@UseInterceptors(PerformanceInterceptor)
@Get('users')
async getUsers(@Paginate() query: PaginateQuery) {
  const startTime = Date.now();
  
  try {
    const result = await this.adminService.getUsers(query);
    
    // Log performance metrics
    const duration = Date.now() - startTime;
    this.metricsService.recordApiCall('admin_get_users', duration, true);
    
    return result;
  } catch (error) {
    // Log error metrics
    const duration = Date.now() - startTime;
    this.metricsService.recordApiCall('admin_get_users', duration, false);
    throw error;
  }
}
```

## 🧪 Testing

### Unit Tests

```typescript
describe('AdminService', () => {
  it('should return paginated users', async () => {
    const query = {
      page: 1,
      limit: 25,
      sortBy: [['createdAt', 'DESC']],
    };

    const result = await service.getUsers(query);
    
    expect(result.data).toBeDefined();
    expect(result.meta.currentPage).toBe(1);
    expect(result.meta.itemsPerPage).toBe(25);
  });

  it('should filter users by role', async () => {
    const query = {
      page: 1,
      limit: 25,
      filter: { roles: 'admin' },
    };

    const result = await service.getUsers(query);
    
    expect(result.data.every(user => 
      user.roles.includes('admin')
    )).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('AdminController (e2e)', () => {
  it('should return users for admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.meta).toBeDefined();
  });

  it('should deny access for non-admin users', async () => {
    await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('should validate pagination parameters', async () => {
    await request(app.getHttpServer())
      .get('/admin/users?limit=1000')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
  });
});
```

## 🔧 Configuration

### Environment Variables

```bash
# Admin Configuration
ADMIN_JWT_SECRET=your-jwt-secret
ADMIN_JWT_EXPIRES_IN=15m
ADMIN_REFRESH_TOKEN_EXPIRES_IN=7d

# Rate Limiting
ADMIN_RATE_LIMIT=50
ADMIN_RATE_LIMIT_WINDOW=60

# Audit Logging
ADMIN_ENABLE_AUDIT_LOGGING=true
ADMIN_AUDIT_LOG_RETENTION_DAYS=90

# Monitoring
ADMIN_ENABLE_MONITORING=true
ADMIN_HEALTH_CHECK_INTERVAL=30000
ADMIN_ALERT_EMAIL=admin@example.com
```

### Configuration Service

```typescript
// admin.config.ts
export const adminConfig = {
  jwt: {
    secret: process.env.ADMIN_JWT_SECRET,
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.ADMIN_REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  rateLimit: {
    limit: parseInt(process.env.ADMIN_RATE_LIMIT || '50', 10),
    window: parseInt(process.env.ADMIN_RATE_LIMIT_WINDOW || '60', 10),
  },
  audit: {
    enabled: process.env.ADMIN_ENABLE_AUDIT_LOGGING === 'true',
    retentionDays: parseInt(process.env.ADMIN_AUDIT_LOG_RETENTION_DAYS || '90', 10),
  },
  monitoring: {
    enabled: process.env.ADMIN_ENABLE_MONITORING === 'true',
    healthCheckInterval: parseInt(process.env.ADMIN_HEALTH_CHECK_INTERVAL || '30000', 10),
    alertEmail: process.env.ADMIN_ALERT_EMAIL,
  },
};
```

## 🚀 Best Practices

### 1. Security First
- Always implement proper role-based access control
- Validate all input parameters
- Log all administrative actions
- Use HTTPS in production

### 2. Performance Optimization
- Implement proper caching strategies
- Use database indexes for queries
- Monitor API response times
- Implement rate limiting

### 3. Error Handling
- Provide clear error messages
- Log errors with context
- Implement graceful degradation
- Set up proper alerting

### 4. Monitoring
- Track all API calls and performance
- Monitor system health continuously
- Set up automated alerting
- Maintain audit trails

### 5. Testing
- Write comprehensive unit tests
- Implement integration tests
- Test security scenarios
- Validate error handling

## 🎯 Conclusion

The Admin Module provides a robust, secure, and scalable administrative solution for the KPT Application. Key benefits include:

- **Security**: Comprehensive role-based access control and audit logging
- **Performance**: Optimized queries and caching strategies
- **Monitoring**: Real-time system health and performance tracking
- **Scalability**: Efficient handling of large user bases
- **Compliance**: Complete audit trails and security controls

The implementation follows NestJS best practices and provides a solid foundation for building secure administrative interfaces.

## 📚 Additional Resources

- [API Endpoints Documentation](./API_ENDPOINTS.md)
- [Quick Start Guide](./QUICK_START.md)
- [Docker Deployment Guide](./DOCKER_README.md)
- [Security Best Practices](./SECURITY_README.md)
