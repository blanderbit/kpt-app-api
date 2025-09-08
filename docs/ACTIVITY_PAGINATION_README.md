# 🚀 Activity Module with nestjs-paginate

## Overview

This document describes the implementation of pagination in the Activity Module using the `nestjs-paginate` library. The module provides efficient data loading with pagination, filtering, and sorting capabilities.

## 🏗️ Architecture

### Core Components

- **ActivityController** - REST API endpoints with pagination
- **ActivityService** - Business logic and data processing
- **ActivityEntity** - Database entity with TypeORM
- **ActivityDto** - Data transfer objects for requests/responses

### Pagination Features

- **Page-based pagination** - Configurable page size and navigation
- **Advanced filtering** - Multiple field filtering with operators
- **Sorting** - Multi-field sorting with direction control
- **Search** - Full-text search across multiple fields
- **Response metadata** - Complete pagination information

## 🔧 Installation and Configuration

### 1. Install Dependencies

```bash
npm install nestjs-paginate
npm install @nestjs/typeorm typeorm
```

### 2. Module Configuration

```typescript
// activity.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { Activity } from './entities/activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Activity])],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
```

### 3. Entity Definition

```typescript
// entities/activity.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  type: string;

  @Column()
  difficulty: 'easy' | 'medium' | 'hard';

  @Column()
  duration: number;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## 📊 Pagination Implementation

### Controller with Pagination

```typescript
// activity.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { ActivityService } from './activity.service';
import { Activity } from './entities/activity.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Activities')
@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated activities' })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  async getActivities(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Activity>> {
    return this.activityService.getActivities(query);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user activities with pagination' })
  @ApiResponse({ status: 200, description: 'User activities retrieved successfully' })
  async getUserActivities(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Activity>> {
    return this.activityService.getUserActivities(query, userId);
  }
}
```

### Service Implementation

```typescript
// activity.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginateQuery, Paginated, paginate } from 'nestjs-paginate';
import { Activity } from './entities/activity.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async getActivities(query: PaginateQuery): Promise<Paginated<Activity>> {
    return paginate(query, this.activityRepository, {
      sortableColumns: ['id', 'name', 'type', 'difficulty', 'createdAt'],
      searchableColumns: ['name', 'description', 'type'],
      filterableColumns: {
        type: true,
        difficulty: true,
        userId: true,
        duration: [true, 'gte', 'lte'],
        createdAt: [true, 'gte', 'lte'],
      },
      defaultSortBy: [['createdAt', 'DESC']],
      defaultLimit: 20,
      maxLimit: 100,
    });
  }

  async getUserActivities(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Activity>> {
    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId });

    return paginate(query, queryBuilder, {
      sortableColumns: ['id', 'name', 'type', 'difficulty', 'createdAt'],
      searchableColumns: ['name', 'description', 'type'],
      filterableColumns: {
        type: true,
        difficulty: true,
        duration: [true, 'gte', 'lte'],
        createdAt: [true, 'gte', 'lte'],
      },
      defaultSortBy: [['createdAt', 'DESC']],
      defaultLimit: 20,
      maxLimit: 100,
    });
  }
}
```

## 🎯 Pagination Configuration

### Sortable Columns

```typescript
sortableColumns: ['id', 'name', 'type', 'difficulty', 'createdAt']
```

**Available sorting:**
- `sortBy=name:ASC` - Sort by name ascending
- `sortBy=createdAt:DESC` - Sort by creation date descending
- `sortBy=type:ASC,difficulty:DESC` - Multi-field sorting

### Searchable Columns

```typescript
searchableColumns: ['name', 'description', 'type']
```

**Search usage:**
- `search=meditation` - Search across all searchable columns
- `search=workout` - Find activities containing "workout"

### Filterable Columns

```typescript
filterableColumns: {
  type: true,                    // Exact match
  difficulty: true,              // Exact match
  userId: true,                  // Exact match
  duration: [true, 'gte', 'lte'], // Range filters
  createdAt: [true, 'gte', 'lte'], // Date range filters
}
```

**Filter operators:**
- `filter.type=wellness` - Exact type match
- `filter.difficulty=medium` - Exact difficulty match
- `filter.duration.gte=30` - Duration >= 30 minutes
- `filter.duration.lte=120` - Duration <= 120 minutes
- `filter.createdAt.gte=2024-01-01` - Created after January 1, 2024

## 📱 API Usage Examples

### Basic Pagination

```http
GET /activities?page=1&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Morning Meditation",
      "description": "Start your day with mindfulness",
      "type": "wellness",
      "difficulty": "easy",
      "duration": 15,
      "userId": 123,
      "createdAt": "2024-01-15T06:00:00Z"
    }
  ],
  "meta": {
    "itemsPerPage": 20,
    "totalItems": 150,
    "currentPage": 1,
    "totalPages": 8,
    "sortBy": [["createdAt", "DESC"]],
    "searchBy": [],
    "filter": {},
    "search": ""
  },
  "links": {
    "first": "/activities?page=1&limit=20",
    "previous": "",
    "current": "/activities?page=1&limit=20",
    "next": "/activities?page=2&limit=20",
    "last": "/activities?page=8&limit=20"
  }
}
```

### Advanced Filtering

```http
GET /activities?filter.type=wellness&filter.difficulty=easy&filter.duration.gte=10&filter.duration.lte=60
```

**Filters applied:**
- Type: wellness
- Difficulty: easy
- Duration: 10-60 minutes

### Search with Sorting

```http
GET /activities?search=meditation&sortBy=name:ASC&page=1&limit=10
```

**Applied:**
- Search: "meditation" across name, description, type
- Sort: by name ascending
- Page: 1 with 10 items per page

### User Activities with Pagination

```http
GET /activities/user/123?page=2&limit=15&sortBy=createdAt:DESC
```

**Parameters:**
- User ID: 123
- Page: 2
- Limit: 15 items per page
- Sort: by creation date descending

## 🔍 Response Structure

### Data Array
Contains the actual activity records for the current page.

### Meta Information
```json
"meta": {
  "itemsPerPage": 20,        // Items per page
  "totalItems": 150,         // Total items in database
  "currentPage": 1,          // Current page number
  "totalPages": 8,           // Total number of pages
  "sortBy": [["createdAt", "DESC"]], // Current sorting
  "searchBy": [],            // Search columns used
  "filter": {},              // Applied filters
  "search": ""               // Search query
}
```

### Navigation Links
```json
"links": {
  "first": "/activities?page=1&limit=20",      // First page
  "previous": "",                              // Previous page (empty if on first)
  "current": "/activities?page=1&limit=20",    // Current page
  "next": "/activities?page=2&limit=20",       // Next page
  "last": "/activities?page=8&limit=20"        // Last page
}
```

## 🚀 Performance Optimization

### Database Indexes

```sql
-- Create indexes for sortable and filterable columns
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_difficulty ON activities(difficulty);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);
CREATE INDEX idx_activities_duration ON activities(duration);

-- Composite index for common queries
CREATE INDEX idx_activities_user_type ON activities(user_id, type);
CREATE INDEX idx_activities_user_created ON activities(user_id, created_at);
```

### Query Optimization

```typescript
// Use query builder for complex queries
const queryBuilder = this.activityRepository
  .createQueryBuilder('activity')
  .leftJoinAndSelect('activity.user', 'user')
  .where('activity.userId = :userId', { userId });

// Apply pagination to query builder
return paginate(query, queryBuilder, config);
```

### Caching Strategy

```typescript
// Implement caching for frequently accessed data
@CacheKey('user-activities')
@CacheTTL(300) // 5 minutes
async getUserActivities(query: PaginateQuery, userId: number) {
  // Implementation with caching
}
```

## 🧪 Testing

### Unit Tests

```typescript
describe('ActivityService', () => {
  it('should return paginated activities', async () => {
    const query = {
      page: 1,
      limit: 20,
      sortBy: [['createdAt', 'DESC']],
    };

    const result = await service.getActivities(query);
    
    expect(result.data).toBeDefined();
    expect(result.meta.currentPage).toBe(1);
    expect(result.meta.itemsPerPage).toBe(20);
  });
});
```

### Integration Tests

```typescript
describe('ActivityController (e2e)', () => {
  it('should return paginated activities', async () => {
    const response = await request(app.getHttpServer())
      .get('/activities?page=1&limit=10')
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(response.body.meta).toBeDefined();
    expect(response.body.links).toBeDefined();
  });
});
```

## 🔒 Security Considerations

### Input Validation

```typescript
// Validate pagination parameters
@Get()
async getActivities(
  @Paginate() query: PaginateQuery,
): Promise<Paginated<Activity>> {
  // Validate query parameters
  if (query.limit > 100) {
    throw new BadRequestException('Limit cannot exceed 100');
  }
  
  return this.activityService.getActivities(query);
}
```

### Rate Limiting

```typescript
// Apply rate limiting to pagination endpoints
@UseGuards(ThrottlerGuard)
@Throttle(100, 60) // 100 requests per minute
@Get()
async getActivities(@Paginate() query: PaginateQuery) {
  return this.activityService.getActivities(query);
}
```

### Access Control

```typescript
// Ensure users can only access their own activities
@Get('user/:userId')
@UseGuards(JwtAuthGuard, UserOwnershipGuard)
async getUserActivities(
  @Paginate() query: PaginateQuery,
  @Param('userId') userId: number,
  @CurrentUser() currentUser: User,
) {
  // Verify user ownership
  if (currentUser.id !== userId && !currentUser.isAdmin) {
    throw new ForbiddenException('Access denied');
  }
  
  return this.activityService.getUserActivities(query, userId);
}
```

## 📊 Monitoring and Analytics

### Performance Metrics

```typescript
// Track pagination performance
@Get()
async getActivities(@Paginate() query: PaginateQuery) {
  const startTime = Date.now();
  
  try {
    const result = await this.activityService.getActivities(query);
    
    // Log performance metrics
    const duration = Date.now() - startTime;
    this.logger.log(`Activities pagination completed in ${duration}ms`, {
      page: query.page,
      limit: query.limit,
      duration,
      resultCount: result.data.length,
    });
    
    return result;
  } catch (error) {
    // Log errors
    this.logger.error('Activities pagination failed', {
      error: error.message,
      query,
      duration: Date.now() - startTime,
    });
    throw error;
  }
}
```

### Usage Analytics

```typescript
// Track pagination usage patterns
@Get()
async getActivities(@Paginate() query: PaginateQuery) {
  // Track usage metrics
  this.analyticsService.track('activities_paginated', {
    page: query.page,
    limit: query.limit,
    hasFilters: Object.keys(query.filter || {}).length > 0,
    hasSearch: !!query.search,
    sortBy: query.sortBy,
  });
  
  return this.activityService.getActivities(query);
}
```

## 🔧 Configuration Options

### Environment Variables

```bash
# .env file
PAGINATION_DEFAULT_LIMIT=20
PAGINATION_MAX_LIMIT=100
PAGINATION_CACHE_TTL=300
PAGINATION_ENABLE_CACHING=true
```

### Configuration Service

```typescript
// pagination.config.ts
export const paginationConfig = {
  defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT || '20', 10),
  maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT || '100', 10),
  cacheTTL: parseInt(process.env.PAGINATION_CACHE_TTL || '300', 10),
  enableCaching: process.env.PAGINATION_ENABLE_CACHING === 'true',
};
```

## 🚀 Best Practices

### 1. Consistent Response Format
Always return the same response structure across all paginated endpoints.

### 2. Reasonable Limits
Set appropriate default and maximum limits to prevent abuse.

### 3. Efficient Queries
Use database indexes and optimize queries for better performance.

### 4. Error Handling
Provide clear error messages for invalid pagination parameters.

### 5. Caching Strategy
Implement appropriate caching for frequently accessed data.

### 6. Security
Validate all input parameters and implement proper access control.

## 🎯 Conclusion

The Activity Module with `nestjs-paginate` provides a robust, scalable, and efficient pagination solution. Key benefits include:

- **Performance**: Optimized database queries with proper indexing
- **Flexibility**: Advanced filtering, sorting, and search capabilities
- **Security**: Input validation and access control
- **Scalability**: Handles large datasets efficiently
- **Maintainability**: Clean, organized code structure

The implementation follows NestJS best practices and provides a solid foundation for building scalable applications with pagination support.
