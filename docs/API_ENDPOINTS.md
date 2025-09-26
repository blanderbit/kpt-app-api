# API Endpoints Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the KPT Application, including authentication, user management, activities, admin functions, and system operations.

## 🔐 Authentication

### Base URL
```
https://api.kpt-app.com/v1
```

### Authentication Headers
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

## 👥 User Management

### User Registration

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
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
    "isVerified": false,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "User registered successfully"
}
```

### User Login

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
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
    "user": {
      "id": 123,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["user"]
    }
  },
  "message": "Login successful"
}
```

### Password Reset

#### POST /auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### POST /auth/reset-password
Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## 🏃‍♂️ Activities

### Get User Activities

#### GET /profile/activities
Get paginated list of user activities.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sortBy` - Sorting field and direction
- `search` - Search query
- `filter` - Filter parameters

**Example:**
```http
GET /profile/activities?page=1&limit=20&sortBy=createdAt:DESC&search=meditation
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "activityName": "Morning Meditation",
      "activityType": "wellness",
      "content": "10 minutes mindfulness session",
      "status": "active",
      "createdAt": "2024-01-15T06:00:00Z"
    }
  ],
  "meta": {
    "itemsPerPage": 20,
    "totalItems": 45,
    "currentPage": 1,
    "totalPages": 3
  },
  "links": {
    "first": "/profile/activities?page=1&limit=20",
    "next": "/profile/activities?page=2&limit=20",
    "last": "/profile/activities?page=3&limit=20"
  }
}
```

### Create Activity

#### POST /profile/activities
Create a new user activity.

**Request Body:**
```json
{
  "activityName": "Evening Run",
  "activityType": "fitness",
  "content": "5km run in the park",
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 789,
    "activityName": "Evening Run",
    "activityType": "fitness",
    "content": "5km run in the park",
    "status": "active",
    "createdAt": "2024-01-15T18:00:00Z"
  },
  "message": "Activity created successfully"
}
```

### Update Activity

#### PUT /profile/activities/:id
Update an existing activity.

**Request Body:**
```json
{
  "activityName": "Evening Run - Updated",
  "content": "5km run in the park with stretching"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 789,
    "activityName": "Evening Run - Updated",
    "content": "5km run in the park with stretching",
    "updatedAt": "2024-01-15T19:00:00Z"
  },
  "message": "Activity updated successfully"
}
```

### Delete Activity

#### DELETE /profile/activities/:id
Delete a user activity.

**Response:**
```json
{
  "success": true,
  "message": "Activity deleted successfully"
}
```

## 🎯 Suggested Activities

### Get Suggested Activities

#### GET /suggested-activities
Get suggested activities for the current day.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "activityName": "Morning Yoga",
      "content": "15 minutes gentle yoga session",
      "reasoning": "Based on your morning routine patterns",
      "difficulty": "easy",
      "estimatedDuration": 15,
      "category": "wellness"
    }
  ],
  "message": "Suggested activities retrieved successfully"
}
```

### Add Suggested Activity

#### POST /suggested-activities/:id/add
Add suggested activity to user activities.

**Request Body:**
```json
{
  "notes": "Additional personal notes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "activityName": "Morning Yoga",
    "content": "15 minutes gentle yoga session",
    "notes": "Additional personal notes",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Activity added successfully"
}
```

### Rate Suggested Activity

#### POST /suggested-activities/:id/rate
Rate a suggested activity.

**Request Body:**
```json
{
  "rating": 5,
  "feedback": "Great suggestion, very helpful!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "rating": 5,
    "feedback": "Great suggestion, very helpful!",
    "updatedAt": "2024-01-15T10:35:00Z"
  },
  "message": "Rating submitted successfully"
}
```

## 🧠 Mood Tracking

### Get Mood Entries

#### GET /profile/mood-tracker
Get user mood tracking entries.

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `date` - Filter by specific date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "mood": "happy",
      "intensity": 8,
      "notes": "Had a great workout session",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "itemsPerPage": 20,
    "totalItems": 45,
    "currentPage": 1,
    "totalPages": 3
  }
}
```

### Create Mood Entry

#### POST /profile/mood-tracker
Create a new mood entry.

**Request Body:**
```json
{
  "mood": "energetic",
  "intensity": 7,
  "notes": "Feeling motivated after morning run"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 124,
    "mood": "energetic",
    "intensity": 7,
    "notes": "Feeling motivated after morning run",
    "createdAt": "2024-01-15T11:00:00Z"
  },
  "message": "Mood entry created successfully"
}
```

## 👨‍💼 Admin Functions

### Get All Users

#### GET /admin/users
Get paginated list of all users (Admin only).

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `search` - Search query
- `filter` - Filter parameters

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
      "createdAt": "2024-01-15T06:00:00Z"
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

### Get User by ID

#### GET /admin/users/:id
Get specific user details (Admin only).

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
    "createdAt": "2024-01-15T06:00:00Z",
    "lastLoginAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update User

#### PUT /admin/users/:id
Update user information (Admin only).

**Request Body:**
```json
{
  "firstName": "Johnny",
  "roles": ["user", "moderator"]
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
    "updatedAt": "2024-01-15T12:00:00Z"
  },
  "message": "User updated successfully"
}
```

### Delete User

#### DELETE /admin/users/:id
Delete user account (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## 🎛️ Queue Management

### Get Queue Statistics

#### GET /admin/queue/stats
Get Bull queue statistics (Admin only).

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
    "totalJobs": 107
  }
}
```

### Pause Queue

#### POST /admin/queue/pause
Pause queue processing (Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Queue paused successfully",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Resume Queue

#### POST /admin/queue/resume
Resume queue processing (Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Queue resumed successfully",
    "timestamp": "2024-01-15T10:35:00Z"
  }
}
```

### Clear Queue

#### DELETE /admin/queue/clear
Clear all jobs from queue (Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Queue cleared successfully",
    "clearedJobs": 107
  }
}
```

## 🔧 System Operations

### Health Check

#### GET /health
Check system health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": "2 hours 15 minutes",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "email": "connected"
  }
}
```

### System Status

#### GET /status
Get detailed system status.

**Response:**
```json
{
  "success": true,
  "data": {
    "system": "operational",
    "version": "1.0.0",
    "environment": "production",
    "uptime": "2 hours 15 minutes",
    "memory": {
      "used": "512MB",
      "total": "2GB",
      "percentage": 25
    },
    "database": {
      "status": "connected",
      "connections": 15,
      "maxConnections": 100
    }
  }
}
```

## 📊 Analytics

### Get User Analytics

#### GET /profile/analytics
Get user activity analytics.

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
    "activities": {
      "total": 25,
      "completed": 20,
      "completionRate": 80
    },
    "mood": {
      "average": 7.2,
      "trend": "improving"
    },
    "productivity": {
      "score": 8.5,
      "trend": "stable"
    }
  }
}
```

### Get System Analytics

#### GET /admin/analytics
Get system-wide analytics (Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1500,
      "active": 1200,
      "newThisWeek": 45
    },
    "activities": {
      "total": 15000,
      "thisWeek": 2500
    },
    "system": {
      "uptime": "99.9%",
      "responseTime": "120ms",
      "errorRate": "0.1%"
    }
  }
}
```

## 🔒 Error Responses

### Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": {
    "email": "Email must be a valid email address",
    "password": "Password must be at least 8 characters long"
  }
}
```

### Authentication Error

```json
{
  "success": false,
  "message": "Authentication required",
  "error": "UNAUTHORIZED"
}
```

### Authorization Error

```json
{
  "success": false,
  "message": "Access denied",
  "error": "FORBIDDEN"
}
```

### Not Found Error

```json
{
  "success": false,
  "message": "Resource not found",
  "error": "NOT_FOUND"
}
```

### Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "INTERNAL_ERROR"
}
```

## 📝 Request/Response Format

### Standard Response Structure

```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "error": string (optional),
  "details": object (optional)
}
```

### Pagination Response Structure

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "itemsPerPage": number,
    "totalItems": number,
    "currentPage": number,
    "totalPages": number
  },
  "links": {
    "first": string,
    "previous": string,
    "current": string,
    "next": string,
    "last": string
  }
}
```

## 🔐 Security

### Rate Limiting

- **Public endpoints**: 100 requests per minute
- **Authenticated endpoints**: 200 requests per minute
- **Admin endpoints**: 50 requests per minute

### CORS Configuration

```typescript
{
  origin: ['https://app.kpt-app.com', 'https://admin.kpt-app.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}
```

### JWT Token

- **Access token**: 15 minutes expiration
- **Refresh token**: 7 days expiration
- **Algorithm**: HS256

## 📚 Additional Resources

### Swagger Documentation

Interactive API documentation available at:
```
https://api.kpt-app.com/docs
```

### Postman Collection

Download the complete Postman collection:
```
https://api.kpt-app.com/postman-collection.json
```

### SDK Libraries

- **JavaScript/TypeScript**: `npm install kpt-app-sdk`
- **Python**: `pip install kpt-app-sdk`
- **Java**: Available in Maven Central

## 🚀 Getting Started

### 1. Get API Key

Register at [https://app.kpt-app.com](https://app.kpt-app.com) to get your API credentials.

### 2. Set Up Authentication

```javascript
import { KptAppClient } from 'kpt-app-sdk';

const client = new KptAppClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.kpt-app.com/v1'
});
```

### 3. Make Your First Request

```javascript
// Get user activities
const activities = await client.activities.list({
  page: 1,
  limit: 20
});

console.log('Activities:', activities.data);
```

## 🆘 Support

### Documentation

- **API Reference**: [https://docs.kpt-app.com](https://docs.kpt-app.com)
- **Tutorials**: [https://docs.kpt-app.com/tutorials](https://docs.kpt-app.com/tutorials)
- **Examples**: [https://docs.kpt-app.com/examples](https://docs.kpt-app.com/examples)

### Contact

- **Email**: api-support@kpt-app.com
- **Discord**: [https://discord.gg/kpt-app](https://discord.gg/kpt-app)
- **GitHub**: [https://github.com/kpt-app/issues](https://github.com/kpt-app/issues)

### Status Page

Check system status at:
```
https://status.kpt-app.com
```
