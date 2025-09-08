# 🎯 Activity Types System

## Overview

The Activity Types System provides a comprehensive framework for categorizing and managing different types of activities in the KPT Application. It includes predefined activity types, dynamic type generation, and intelligent recommendations based on user behavior.

## 🏗️ Architecture

### Core Components

- **ActivityTypesService** - Business logic for activity type management
- **ActivityTypeEntity** - Database entity for activity types
- **ActivityTypeDto** - Data transfer objects
- **TypeRecommendationEngine** - AI-powered recommendation system

### System Features

- **Predefined Types** - Standard activity categories
- **Dynamic Generation** - AI-generated activity types
- **User Preferences** - Personalized type recommendations
- **Category Management** - Hierarchical type organization
- **Search and Discovery** - Type discovery mechanisms

## 📊 Activity Type Structure

### Entity Definition

```typescript
// entities/activity-type.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('activity_types')
export class ActivityType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @Column('simple-array')
  keywords: string[];

  @Column()
  category: string;

  @Column()
  icon: string;

  @Column()
  color: string;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Type Categories

```typescript
export enum ActivityCategory {
  HEALTH = 'health',
  FITNESS = 'fitness',
  EDUCATION = 'education',
  WORK = 'work',
  SOCIAL = 'social',
  CREATIVE = 'creative',
  RELAXATION = 'relaxation',
  TRAVEL = 'travel',
  HOBBY = 'hobby',
  MAINTENANCE = 'maintenance'
}
```

## 🔧 Service Implementation

### ActivityTypesService

```typescript
// services/activity-types.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityType } from '../entities/activity-type.entity';

@Injectable()
export class ActivityTypesService {
  private readonly logger = new Logger(ActivityTypesService.name);

  constructor(
    @InjectRepository(ActivityType)
    private readonly activityTypeRepository: Repository<ActivityType>,
  ) {}

  async getAllTypes(): Promise<ActivityType[]> {
    return this.activityTypeRepository.find({
      where: { isActive: true },
      order: { usageCount: 'DESC', name: 'ASC' }
    });
  }

  async getTypesByCategory(category: string): Promise<ActivityType[]> {
    return this.activityTypeRepository.find({
      where: { category, isActive: true },
      order: { usageCount: 'DESC', name: 'ASC' }
    });
  }

  async searchTypes(query: string): Promise<ActivityType[]> {
    return this.activityTypeRepository
      .createQueryBuilder('type')
      .where('type.name ILIKE :query', { query: `%${query}%` })
      .orWhere('type.description ILIKE :query', { query: `%${query}%` })
      .orWhere('type.keywords @> ARRAY[:query]', { query })
      .andWhere('type.isActive = :isActive', { isActive: true })
      .orderBy('type.usageCount', 'DESC')
      .getMany();
  }

  async getRecommendedTypes(userId: number, limit: number = 5): Promise<ActivityType[]> {
    // Get user's activity history
    const userActivities = await this.getUserActivityHistory(userId);
    
    // Analyze patterns and preferences
    const preferences = this.analyzeUserPreferences(userActivities);
    
    // Get recommended types based on preferences
    return this.getTypesByPreferences(preferences, limit);
  }

  async incrementUsageCount(typeId: number): Promise<void> {
    await this.activityTypeRepository.increment({ id: typeId }, 'usageCount', 1);
  }

  async createCustomType(typeData: Partial<ActivityType>): Promise<ActivityType> {
    const newType = this.activityTypeRepository.create(typeData);
    return this.activityTypeRepository.save(newType);
  }
}
```

## 🎯 Type Recommendation Engine

### User Preference Analysis

```typescript
// services/type-recommendation.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class TypeRecommendationService {
  analyzeUserPreferences(activities: any[]): UserPreferences {
    const preferences: UserPreferences = {
      categories: {},
      timePatterns: {},
      difficultyLevels: {},
      frequency: {}
    };

    // Analyze category preferences
    activities.forEach(activity => {
      const category = activity.activityType?.category;
      if (category) {
        preferences.categories[category] = (preferences.categories[category] || 0) + 1;
      }
    });

    // Analyze time patterns
    activities.forEach(activity => {
      const hour = new Date(activity.createdAt).getHours();
      const timeSlot = this.getTimeSlot(hour);
      preferences.timePatterns[timeSlot] = (preferences.timePatterns[timeSlot] || 0) + 1;
    });

    return preferences;
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  getTypesByPreferences(preferences: UserPreferences, limit: number): ActivityType[] {
    // Implementation of recommendation algorithm
    // Based on user preferences, activity popularity, and diversity
  }
}
```

### Recommendation Algorithm

```typescript
interface UserPreferences {
  categories: Record<string, number>;
  timePatterns: Record<string, number>;
  difficultyLevels: Record<string, number>;
  frequency: Record<string, number>;
}

class RecommendationAlgorithm {
  calculateTypeScore(
    type: ActivityType, 
    preferences: UserPreferences, 
    userHistory: any[]
  ): number {
    let score = 0;

    // Category preference score
    const categoryScore = preferences.categories[type.category] || 0;
    score += categoryScore * 0.3;

    // Popularity score
    score += Math.log(type.usageCount + 1) * 0.2;

    // Diversity score (avoid recommending same types)
    const userTypeCount = userHistory.filter(a => a.activityType?.id === type.id).length;
    score -= userTypeCount * 0.1;

    // Time pattern score
    const currentHour = new Date().getHours();
    const timeSlot = this.getTimeSlot(currentHour);
    const timeScore = preferences.timePatterns[timeSlot] || 0;
    score += timeScore * 0.15;

    return Math.max(0, score);
  }
}
```

## 📱 API Endpoints

### Get All Activity Types

#### GET /activity-types
Retrieve all available activity types.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Morning Run",
      "description": "Cardiovascular exercise in the morning",
      "keywords": ["running", "cardio", "morning", "fitness"],
      "category": "fitness",
      "icon": "🏃‍♂️",
      "color": "#4CAF50",
      "usageCount": 1250,
      "isActive": true
    }
  ],
  "message": "Activity types retrieved successfully"
}
```

### Get Types by Category

#### GET /activity-types/category/:category
Get activity types for a specific category.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Morning Run",
      "description": "Cardiovascular exercise in the morning",
      "category": "fitness",
      "icon": "🏃‍♂️",
      "color": "#4CAF50"
    }
  ],
  "message": "Fitness activity types retrieved successfully"
}
```

### Search Activity Types

#### GET /activity-types/search?q=:query
Search for activity types by name, description, or keywords.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Morning Run",
      "description": "Cardiovascular exercise in the morning",
      "keywords": ["running", "cardio", "morning", "fitness"],
      "category": "fitness",
    "icon": "🏃‍♂️",
    "color": "#4CAF50"
  }
  ],
  "message": "Search results for 'run'"
}
```

### Get Recommended Types

#### GET /activity-types/recommended
Get personalized activity type recommendations.

**Query Parameters:**
- `limit` - Number of recommendations (default: 5)
- `category` - Filter by specific category
- `exclude` - Exclude specific type IDs

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Morning Run",
      "description": "Cardiovascular exercise in the morning",
      "category": "fitness",
      "icon": "🏃‍♂️",
      "color": "#4CAF50",
      "recommendationScore": 8.5,
      "reason": "Based on your fitness preferences and morning routine"
    }
  ],
  "message": "Personalized recommendations retrieved successfully"
}
```

## 🎨 Type Customization

### Create Custom Type

#### POST /activity-types/custom
Create a custom activity type for the user.

**Request Body:**
```json
{
  "name": "Custom Workout",
  "description": "Personalized workout routine",
  "keywords": ["custom", "workout", "personal"],
  "category": "fitness",
  "icon": "💪",
  "color": "#FF9800"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 999,
    "name": "Custom Workout",
    "description": "Personalized workout routine",
    "keywords": ["custom", "workout", "personal"],
    "category": "fitness",
    "icon": "💪",
    "color": "#FF9800",
    "isCustom": true,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Custom activity type created successfully"
}
```

### Update Custom Type

#### PUT /activity-types/custom/:id
Update a custom activity type.

**Request Body:**
```json
{
  "name": "Updated Custom Workout",
  "description": "Enhanced personalized workout routine"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 999,
    "name": "Updated Custom Workout",
    "description": "Enhanced personalized workout routine",
    "updatedAt": "2024-01-15T11:00:00Z"
  },
  "message": "Custom activity type updated successfully"
}
```

## 🔍 Type Discovery

### Trending Types

#### GET /activity-types/trending
Get currently trending activity types.

**Query Parameters:**
- `period` - Time period (day, week, month)
- `limit` - Number of trending types

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Morning Run",
      "description": "Cardiovascular exercise in the morning",
      "category": "fitness",
      "icon": "🏃‍♂️",
      "color": "#4CAF50",
      "trendingScore": 9.2,
      "growthRate": "+15%",
      "period": "week"
    }
  ],
  "message": "Trending activity types retrieved successfully"
}
```

### Similar Types

#### GET /activity-types/:id/similar
Get activity types similar to the specified type.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "Evening Walk",
      "description": "Relaxing evening walk",
      "category": "fitness",
      "icon": "🚶‍♂️",
      "color": "#2196F3",
      "similarityScore": 0.85
    }
  ],
  "message": "Similar activity types retrieved successfully"
}
```

## 📊 Analytics and Insights

### Type Usage Statistics

#### GET /activity-types/analytics
Get analytics for activity types (Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTypes": 150,
    "activeTypes": 145,
    "customTypes": 25,
    "mostPopular": [
      {
        "id": 1,
        "name": "Morning Run",
        "usageCount": 1250,
        "percentage": 15.2
      }
    ],
    "categoryDistribution": {
      "fitness": 35,
      "wellness": 25,
      "education": 20,
      "work": 15,
      "other": 5
    },
    "growthTrends": {
      "newTypesThisMonth": 12,
      "inactiveTypes": 5,
      "popularityChanges": "+8%"
    }
  },
  "message": "Activity type analytics retrieved successfully"
}
```

### User Type Insights

#### GET /profile/activity-types/insights
Get personal insights about activity type usage.

**Response:**
```json
{
  "success": true,
  "data": {
    "favoriteCategories": ["fitness", "wellness"],
    "mostUsedTypes": [
      {
        "id": 1,
        "name": "Morning Run",
        "usageCount": 45,
        "lastUsed": "2024-01-15T06:00:00Z"
      }
    ],
    "typeDiversity": {
      "uniqueTypes": 25,
      "totalActivities": 150,
      "diversityScore": 0.83
    },
    "recommendations": {
      "exploreCategory": "education",
      "tryNewType": "Meditation",
      "reason": "Based on your wellness preferences"
    }
  },
  "message": "Personal insights retrieved successfully"
}
```

## 🚀 Performance Optimization

### Database Indexes

```sql
-- Create indexes for efficient queries
CREATE INDEX idx_activity_types_category ON activity_types(category);
CREATE INDEX idx_activity_types_active ON activity_types(is_active);
CREATE INDEX idx_activity_types_usage ON activity_types(usage_count);
CREATE INDEX idx_activity_types_keywords ON activity_types USING GIN(keywords);

-- Composite indexes for common queries
CREATE INDEX idx_activity_types_category_active ON activity_types(category, is_active);
CREATE INDEX idx_activity_types_category_usage ON activity_types(category, usage_count);
```

### Caching Strategy

```typescript
// Implement caching for frequently accessed types
@CacheKey('activity-types-all')
@CacheTTL(3600) // 1 hour
async getAllTypes(): Promise<ActivityType[]> {
  return this.activityTypeRepository.find({
    where: { isActive: true },
    order: { usageCount: 'DESC', name: 'ASC' }
  });
}

@CacheKey('activity-types-category')
@CacheTTL(1800) // 30 minutes
async getTypesByCategory(category: string): Promise<ActivityType[]> {
  return this.activityTypeRepository.find({
    where: { category, isActive: true },
    order: { usageCount: 'DESC', name: 'ASC' }
  });
}
```

## 🧪 Testing

### Unit Tests

```typescript
describe('ActivityTypesService', () => {
  it('should return all active activity types', async () => {
    const types = await service.getAllTypes();
    
    expect(types).toBeDefined();
    expect(types.length).toBeGreaterThan(0);
    expect(types.every(type => type.isActive)).toBe(true);
  });

  it('should filter types by category', async () => {
    const fitnessTypes = await service.getTypesByCategory('fitness');
    
    expect(fitnessTypes).toBeDefined();
    expect(fitnessTypes.every(type => type.category === 'fitness')).toBe(true);
  });

  it('should search types by query', async () => {
    const searchResults = await service.searchTypes('run');
    
    expect(searchResults).toBeDefined();
    expect(searchResults.some(type => 
      type.name.toLowerCase().includes('run') ||
      type.keywords.some(keyword => keyword.toLowerCase().includes('run'))
    )).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('ActivityTypesController (e2e)', () => {
  it('should return all activity types', async () => {
    const response = await request(app.getHttpServer())
      .get('/activity-types')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should return types by category', async () => {
    const response = await request(app.getHttpServer())
      .get('/activity-types/category/fitness')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.every(type => type.category === 'fitness')).toBe(true);
  });
});
```

## 🔒 Security Considerations

### Input Validation

```typescript
// Validate custom type creation
@Post('custom')
async createCustomType(@Body() createTypeDto: CreateCustomTypeDto) {
  // Validate input
  if (createTypeDto.name.length < 2 || createTypeDto.name.length > 50) {
    throw new BadRequestException('Type name must be between 2 and 50 characters');
  }

  if (createTypeDto.keywords.length > 10) {
    throw new BadRequestException('Maximum 10 keywords allowed');
  }

  // Check for duplicate names
  const existingType = await this.activityTypeRepository.findOne({
    where: { name: createTypeDto.name }
  });

  if (existingType) {
    throw new ConflictException('Activity type with this name already exists');
  }

  return this.activityTypesService.createCustomType(createTypeDto);
}
```

### Rate Limiting

```typescript
// Apply rate limiting to type creation
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 custom types per minute
@Post('custom')
async createCustomType(@Body() createTypeDto: CreateCustomTypeDto) {
  return this.activityTypesService.createCustomType(createTypeDto);
}
```

## 📚 Best Practices

### 1. Type Naming
- Use clear, descriptive names
- Avoid abbreviations and acronyms
- Maintain consistency across categories

### 2. Keyword Management
- Include relevant synonyms
- Use common search terms
- Limit to 10 keywords per type

### 3. Category Organization
- Keep categories broad but meaningful
- Avoid too many subcategories
- Use consistent naming conventions

### 4. Icon and Color Selection
- Choose intuitive icons
- Ensure color accessibility
- Maintain visual consistency

### 5. Performance
- Implement proper caching
- Use database indexes
- Optimize search queries

## 🎯 Conclusion

The Activity Types System provides a robust foundation for categorizing and managing activities in the KPT Application. Key benefits include:

- **Flexibility**: Support for both predefined and custom types
- **Intelligence**: AI-powered recommendations based on user behavior
- **Performance**: Optimized queries and caching strategies
- **Scalability**: Efficient handling of large type collections
- **User Experience**: Intuitive discovery and personalization

The system follows best practices for data management and provides a solid foundation for building engaging activity-based applications.
