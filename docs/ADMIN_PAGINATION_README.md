# 🚀 Admin Module with nestjs-paginate

## Overview

This document describes the implementation of pagination in the Admin Module using the `nestjs-paginate` library. The module provides comprehensive administrative capabilities with efficient data loading, advanced filtering, and robust security features.

## 🏗️ Architecture

### Core Components

- **AdminController** - REST API endpoints with pagination and admin controls
- **AdminService** - Business logic for administrative operations
- **UserEntity** - User management with TypeORM
- **AdminDto** - Data transfer objects for admin operations
- **AdminGuard** - Role-based access control

### Admin Features

- **User Management** - CRUD operations for user accounts
- **Activity Monitoring** - Track user activities and statistics
- **System Analytics** - Performance metrics and usage statistics
- **Queue Management** - Monitor and control background job queues
- **Security Controls** - Role management and access control

## 🔧 Installation and Configuration

### 1. Install Dependencies

```bash
npm install nestjs-paginate
npm install @nestjs/typeorm typeorm
npm install @nestjs/guards
```

### 2. Module Configuration

```typescript
// admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService],
})
export class AdminModule {}
```

### 3. Entity Definition

```typescript
// entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column('simple-array')
  roles: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLoginAt: Date;
}
```

## 📊 Pagination Implementation

### Controller with Admin Pagination

```typescript
// admin.controller.ts
import { Controller, Get, Query, UseGuards, Post, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { AdminGuard } from './guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get paginated users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<User>> {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async getUserById(@Param('id') id: number): Promise<User> {
    return this.adminService.getUserById(id);
  }

  @Post('users/:id/activate')
  @ApiOperation({ summary: 'Activate user account (Admin only)' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  async activateUser(@Param('id') id: number): Promise<User> {
    return this.adminService.activateUser(id);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user account (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('id') id: number): Promise<void> {
    return this.adminService.deleteUser(id);
  }
}
```

### Service Implementation

```typescript
// admin.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginateQuery, Paginated, paginate } from 'nestjs-paginate';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUsers(query: PaginateQuery): Promise<Paginated<User>> {
    return paginate(query, this.userRepository, {
      sortableColumns: ['id', 'email', 'firstName', 'lastName', 'createdAt', 'lastLoginAt'],
      searchableColumns: ['email', 'firstName', 'lastName'],
      filterableColumns: {
        id: true,
        email: true,
        roles: true,
        isActive: true,
        isVerified: true,
        createdAt: [true, 'gte', 'lte'],
        lastLoginAt: [true, 'gte', 'lte', 'null', 'not'],
      },
      defaultSortBy: [['createdAt', 'DESC']],
      defaultLimit: 25,
      maxLimit: 100,
      select: ['id', 'email', 'firstName', 'lastName', 'roles', 'isActive', 'isVerified', 'createdAt', 'lastLoginAt'],
    });
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async activateUser(id: number): Promise<User> {
    const user = await this.getUserById(id);
    user.isActive = true;
    return this.userRepository.save(user);
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.getUserById(id);
    
    // Prevent deletion of admin users
    if (user.roles.includes('admin')) {
      throw new ForbiddenException('Cannot delete admin users');
    }
    
    await this.userRepository.remove(user);
  }
}
```

## 🎯 Pagination Configuration

### Sortable Columns

```typescript
sortableColumns: ['id', 'email', 'firstName', 'lastName', 'createdAt', 'lastLoginAt']
```

**Available sorting:**
- `sortBy=email:ASC` - Sort by email ascending
- `sortBy=createdAt:DESC` - Sort by creation date descending
- `sortBy=lastName:ASC,firstName:ASC` - Multi-field sorting

### Searchable Columns

```typescript
searchableColumns: ['email', 'firstName', 'lastName']
```

**Search usage:**
- `search=john` - Search across email, firstName, lastName
- `search=admin@example.com` - Find specific email

### Filterable Columns

```typescript
filterableColumns: {
  id: true,                    // Exact match
  email: true,                 // Exact match
  roles: true,                 // Exact match
  isActive: true,              // Boolean filter
  isVerified: true,            // Boolean filter
  createdAt: [true, 'gte', 'lte'], // Date range filters
  lastLoginAt: [true, 'gte', 'lte', 'null', 'not'], // Date filters with null handling
}
```

**Filter operators:**
- `filter.isActive=true` - Only active users
- `filter.roles=admin` - Only admin users
- `filter.createdAt.gte=2024-01-01` - Users created after January 1, 2024
- `filter.lastLoginAt.not:$null` - Users who have logged in

## 📱 API Usage Examples

### Basic User Pagination

```http
GET /admin/users?page=1&limit=25
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "email": "admin@example.com",
      "firstName": "John",
      "lastName": "Admin",
      "roles": ["admin", "user"],
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
    "totalPages": 6,
    "sortBy": [["createdAt", "DESC"]],
    "searchBy": [],
    "filter": {},
    "search": ""
  },
  "links": {
    "first": "/admin/users?page=1&limit=25",
    "previous": "",
    "current": "/admin/users?page=1&limit=25",
    "next": "/admin/users?page=2&limit=25",
    "last": "/admin/users?page=6&limit=25"
  }
}
```

### Advanced User Filtering

```http
GET /admin/users?filter.isActive=true&filter.roles=admin&filter.createdAt.gte=2024-01-01
```

**Filters applied:**
- Active users only
- Admin role only
- Created after January 1, 2024

### Search Users

```http
GET /admin/users?search=john&sortBy=lastName:ASC&page=1&limit=20
```

**Applied:**
- Search: "john" across email, firstName, lastName
- Sort: by lastName ascending
- Page: 1 with 20 items per page

### Filter by Login Activity

```http
GET /admin/users?filter.lastLoginAt.not:$null&sortBy=lastLoginAt:DESC
```

**Applied:**
- Only users who have logged in
- Sort: by last login date descending

## 🔍 Response Structure

### Data Array
Contains the actual user records for the current page with selected fields.

### Meta Information
```json
"meta": {
  "itemsPerPage": 25,        // Items per page
  "totalItems": 150,         // Total users in database
  "currentPage": 1,          // Current page number
  "totalPages": 6,           // Total number of pages
  "sortBy": [["createdAt", "DESC"]], // Current sorting
  "searchBy": [],            // Search columns used
  "filter": {},              // Applied filters
  "search": ""               // Search query
}
```

### Navigation Links
```json
"links": {
  "first": "/admin/users?page=1&limit=25",      // First page
  "previous": "",                              // Previous page (empty if on first)
  "current": "/admin/users?page=1&limit=25",    // Current page
  "next": "/admin/users?page=2&limit=25",       // Next page
  "last": "/admin/users?page=6&limit=25"        // Last page
}
```

## 🚀 Performance Optimization

### Database Indexes

```sql
-- Create indexes for sortable and filterable columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_roles ON users(roles);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_is_verified ON users(is_verified);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login_at ON users(last_login_at);

-- Composite indexes for common queries
CREATE INDEX idx_users_active_created ON users(is_active, created_at);
CREATE INDEX idx_users_roles_active ON users(roles, is_active);
```

### Query Optimization

```typescript
// Use query builder for complex admin queries
const queryBuilder = this.userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.profile', 'profile')
  .leftJoinAndSelect('user.activities', 'activities');

// Apply pagination to query builder
return paginate(query, queryBuilder, config);
```

### Caching Strategy

```typescript
// Implement caching for admin data
@CacheKey('admin-users')
@CacheTTL(300) // 5 minutes
async getUsers(query: PaginateQuery) {
  // Implementation with caching
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

  it('should filter active users only', async () => {
    const query = {
      page: 1,
      limit: 25,
      filter: { isActive: true },
    };

    const result = await service.getUsers(query);
    
    expect(result.data.every(user => user.isActive)).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('AdminController (e2e)', () => {
  it('should return paginated users for admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(response.body.meta).toBeDefined();
    expect(response.body.links).toBeDefined();
  });

  it('should deny access for non-admin users', async () => {
    await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });
});
```

## 🔒 Security Considerations

### Role-Based Access Control

```typescript
// Admin guard implementation
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    return user && user.roles.includes('admin');
  }
}
```

### Input Validation

```typescript
// Validate admin pagination parameters
@Get('users')
async getUsers(@Paginate() query: PaginateQuery) {
  // Validate query parameters
  if (query.limit > 100) {
    throw new BadRequestException('Limit cannot exceed 100');
  }
  
  // Additional admin-specific validation
  if (query.filter && query.filter.roles === 'superadmin') {
    throw new ForbiddenException('Cannot filter by superadmin role');
  }
  
  return this.adminService.getUsers(query);
}
```

### Rate Limiting

```typescript
// Apply stricter rate limiting for admin endpoints
@UseGuards(ThrottlerGuard)
@Throttle(50, 60) // 50 requests per minute for admin
@Get('users')
async getUsers(@Paginate() query: PaginateQuery) {
  return this.adminService.getUsers(query);
}
```

### Audit Logging

```typescript
// Log all admin actions
@Get('users')
async getUsers(@Paginate() query: PaginateQuery, @CurrentUser() admin: User) {
  // Log admin action
  this.auditService.log('admin_users_viewed', {
    adminId: admin.id,
    adminEmail: admin.email,
    query: query,
    timestamp: new Date(),
  });
  
  return this.adminService.getUsers(query);
}
```

## 📊 Monitoring and Analytics

### Admin Performance Metrics

```typescript
// Track admin pagination performance
@Get('users')
async getUsers(@Paginate() query: PaginateQuery) {
  const startTime = Date.now();
  
  try {
    const result = await this.adminService.getUsers(query);
    
    // Log performance metrics
    const duration = Date.now() - startTime;
    this.logger.log(`Admin users pagination completed in ${duration}ms`, {
      adminId: this.currentUser.id,
      page: query.page,
      limit: query.limit,
      duration,
      resultCount: result.data.length,
    });
    
    return result;
  } catch (error) {
    // Log errors
    this.logger.error('Admin users pagination failed', {
      adminId: this.currentUser.id,
      error: error.message,
      query,
      duration: Date.now() - startTime,
    });
    throw error;
  }
}
```

### Admin Usage Analytics

```typescript
// Track admin usage patterns
@Get('users')
async getUsers(@Paginate() query: PaginateQuery) {
  // Track usage metrics
  this.analyticsService.track('admin_users_paginated', {
    adminId: this.currentUser.id,
    page: query.page,
    limit: query.limit,
    hasFilters: Object.keys(query.filter || {}).length > 0,
    hasSearch: !!query.search,
    sortBy: query.sortBy,
  });
  
  return this.adminService.getUsers(query);
}
```

## 🔧 Configuration Options

### Environment Variables

```bash
# .env file
ADMIN_PAGINATION_DEFAULT_LIMIT=25
ADMIN_PAGINATION_MAX_LIMIT=100
ADMIN_PAGINATION_CACHE_TTL=300
ADMIN_ENABLE_AUDIT_LOGGING=true
ADMIN_RATE_LIMIT=50
```

### Configuration Service

```typescript
// admin.config.ts
export const adminConfig = {
  pagination: {
    defaultLimit: parseInt(process.env.ADMIN_PAGINATION_DEFAULT_LIMIT || '25', 10),
    maxLimit: parseInt(process.env.ADMIN_PAGINATION_MAX_LIMIT || '100', 10),
    cacheTTL: parseInt(process.env.ADMIN_PAGINATION_CACHE_TTL || '300', 10),
  },
  security: {
    enableAuditLogging: process.env.ADMIN_ENABLE_AUDIT_LOGGING === 'true',
    rateLimit: parseInt(process.env.ADMIN_RATE_LIMIT || '50', 10),
  },
};
```

## 🚀 Best Practices

### 1. Security First
Always implement proper role-based access control and input validation.

### 2. Audit Everything
Log all admin actions for security and compliance purposes.

### 3. Performance Monitoring
Track pagination performance and optimize database queries.

### 4. Rate Limiting
Apply stricter rate limiting for admin endpoints to prevent abuse.

### 5. Data Validation
Validate all input parameters and filter values.

### 6. Error Handling
Provide clear error messages without exposing sensitive information.

## 🎯 Conclusion

The Admin Module with `nestjs-paginate` provides a secure, scalable, and efficient administrative solution. Key benefits include:

- **Security**: Role-based access control and comprehensive audit logging
- **Performance**: Optimized database queries with proper indexing
- **Flexibility**: Advanced filtering, sorting, and search capabilities
- **Scalability**: Handles large user bases efficiently
- **Compliance**: Audit trails and security controls for administrative operations

The implementation follows NestJS best practices and provides a solid foundation for building secure administrative interfaces with pagination support.
