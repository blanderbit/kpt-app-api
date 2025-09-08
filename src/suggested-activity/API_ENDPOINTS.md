# API Endpoints Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the Suggested Activity Module, including user endpoints, admin management, and queue control.

## 🔐 Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <jwt-token>
```

## 👥 User Endpoints

### Get User's Suggested Activities

#### GET /suggested-activities
Retrieves suggested activities for the current user for the current day.

**Request:**
```http
GET /suggested-activities
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "activityName": "Morning Meditation",
      "content": "Start your day with 10 minutes of mindfulness meditation...",
      "reasoning": "Based on your morning routine patterns and stress levels...",
      "difficulty": "easy",
      "estimatedDuration": 10,
      "category": "wellness",
      "isUsed": false,
      "createdAt": "2024-01-15T06:00:00Z"
    }
  ],
  "message": "Suggested activities retrieved successfully"
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "No suggested activities found for today",
  "error": "NOT_FOUND"
}
```

### Add Suggested Activity to User Activities

#### POST /suggested-activities/:id/add
Adds a suggested activity to the user's activity list and removes the suggestion.

**Request:**
```http
POST /suggested-activities/1/add
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "notes": "Additional notes about the activity"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "activityName": "Morning Meditation",
    "content": "Start your day with 10 minutes of mindfulness meditation...",
    "difficulty": "easy",
    "duration": 10,
    "category": "wellness",
    "notes": "Additional notes about the activity",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Activity added successfully"
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "Daily limit of 10 activities exceeded",
  "error": "FORBIDDEN"
}
```

```json
{
  "success": false,
  "message": "Suggested activity not found",
  "error": "NOT_FOUND"
}
```

### Rate Suggested Activity

#### POST /suggested-activities/:id/rate
Provides feedback rating for a suggested activity.

**Request:**
```http
POST /suggested-activities/1/rate
Authorization: Bearer <jwt-token>
Content-Type: application/json

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

**Error Responses:**
```json
{
  "success": false,
  "message": "Invalid rating value. Must be between 1 and 5",
  "error": "BAD_REQUEST"
}
```

### Refresh Existing Suggestions

#### GET /suggested-activities/refresh
Updates existing suggested activities with new content while maintaining the same count.

**Request:**
```http
GET /suggested-activities/refresh
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updatedCount": 8,
    "message": "8 suggestions updated successfully"
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "No suggestions found to refresh",
  "error": "FORBIDDEN"
}
```

## 👨‍💼 Admin Management Endpoints

### Get All Suggested Activities

#### GET /admin/suggested-activities
Retrieves all suggested activities with pagination and filtering (admin only).

**Request:**
```http
GET /admin/suggested-activities?page=1&limit=20&userId=123&category=wellness
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": 1,
        "userId": 123,
        "userEmail": "user@example.com",
        "activityName": "Morning Meditation",
        "content": "Start your day with 10 minutes of mindfulness meditation...",
        "reasoning": "Based on your morning routine patterns...",
        "difficulty": "easy",
        "estimatedDuration": 10,
        "category": "wellness",
        "isUsed": false,
        "createdAt": "2024-01-15T06:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### Manual Generation

#### POST /admin/suggested-activities/generate
Manually triggers generation of suggested activities for specific users or all users.

**Request:**
```http
POST /admin/suggested-activities/generate
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "userIds": [123, 456, 789],
  "targetDate": "2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Generation tasks added to queue",
    "userIds": [123, 456, 789],
    "targetDate": "2024-01-15",
    "queueJobs": 3
  }
}
```

**Generate for All Users:**
```http
POST /admin/suggested-activities/generate
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "targetDate": "2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Generation tasks added to queue for all users",
    "totalUsers": 1500,
    "targetDate": "2024-01-15",
    "queueJobs": 1500
  }
}
```

### Delete Suggested Activity

#### DELETE /admin/suggested-activities/:id
Removes a specific suggested activity (admin only).

**Request:**
```http
DELETE /admin/suggested-activities/1
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "message": "Suggested activity deleted successfully"
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "Suggested activity not found",
  "error": "NOT_FOUND"
}
```

## 🎛️ Queue Management Endpoints

### Get Queue Statistics

#### GET /admin/queue/stats
Retrieves comprehensive statistics about the Bull queue (admin only).

**Request:**
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

### Pause Queue

#### POST /admin/queue/pause
Pauses the queue processing (admin only).

**Request:**
```http
POST /admin/queue/pause
Authorization: Bearer <jwt-token>
```

**Response:**
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

### Resume Queue

#### POST /admin/queue/resume
Resumes the queue processing (admin only).

**Request:**
```http
POST /admin/queue/resume
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Queue resumed successfully",
    "timestamp": "2024-01-15T10:35:00Z",
    "currentStatus": "active"
  }
}
```

### Clear Queue

#### DELETE /admin/queue/clear
Removes all jobs from the queue (admin only).

**Request:**
```http
DELETE /admin/queue/clear
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Queue cleared successfully",
    "clearedJobs": 107,
    "timestamp": "2024-01-15T10:40:00Z"
  }
}
```

### Get Queue Status

#### GET /admin/queue/status
Retrieves current queue status and health information (admin only).

**Request:**
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

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": <response_data>,
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 🔒 Error Codes

### HTTP Status Codes
- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **429** - Too Many Requests
- **500** - Internal Server Error

### Application Error Codes
- **NOT_FOUND** - Resource not found
- **FORBIDDEN** - Access denied
- **BAD_REQUEST** - Invalid request data
- **UNAUTHORIZED** - Authentication required
- **RATE_LIMIT_EXCEEDED** - Too many requests
- **INTERNAL_ERROR** - Server error

## 📝 Request Validation

### Required Fields
All required fields are marked with `*` in the documentation.

### Field Types
- **string** - Text values
- **number** - Numeric values
- **boolean** - True/false values
- **date** - ISO 8601 date strings
- **array** - Array of values
- **object** - JSON objects

### Validation Rules
- **Email**: Valid email format
- **Rating**: Integer between 1 and 5
- **Date**: ISO 8601 format (YYYY-MM-DD)
- **ID**: Positive integer
- **Limit**: Positive integer, maximum 100

## 🧪 Testing

### Test Endpoints
```bash
# Test user endpoints
curl -H "Authorization: Bearer <token>" http://localhost:3000/suggested-activities

# Test admin endpoints
curl -H "Authorization: Bearer <token>" http://localhost:3000/admin/suggested-activities

# Test queue endpoints
curl -H "Authorization: Bearer <token>" http://localhost:3000/admin/queue/stats
```

### Postman Collection
Import the provided Postman collection for easy API testing:
- **Environment Variables**: Set your base URL and JWT token
- **Pre-request Scripts**: Automatic token refresh
- **Test Scripts**: Response validation and error handling

## 📚 Rate Limiting

### Limits
- **User Endpoints**: 100 requests per minute
- **Admin Endpoints**: 50 requests per minute
- **Queue Endpoints**: 20 requests per minute

### Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642233600
```

## 🔍 Monitoring

### Health Checks
```http
GET /health
GET /admin/queue/status
```

### Metrics
- **Response Times**: Average, 95th percentile, 99th percentile
- **Error Rates**: By endpoint and error type
- **Queue Performance**: Job processing rates and latency
- **User Activity**: Endpoint usage patterns

### Logging
All API requests are logged with:
- **Request ID**: Unique identifier for tracing
- **User ID**: Authenticated user identifier
- **Endpoint**: Requested endpoint
- **Response Time**: Request processing duration
- **Status Code**: HTTP response status
- **Error Details**: Error information if applicable

## 🚀 Performance

### Optimization Features
- **Database Indexing**: Optimized queries for fast response
- **Caching**: Redis-based caching for frequently accessed data
- **Connection Pooling**: Efficient database connection management
- **Async Processing**: Non-blocking operations for better performance

### Benchmarks
- **Response Time**: < 100ms for simple queries
- **Throughput**: 1000+ requests per second
- **Concurrent Users**: 1000+ simultaneous users
- **Queue Processing**: 100+ jobs per minute

## 🔧 Configuration

### Environment Variables
```bash
# API Configuration
API_RATE_LIMIT=100
API_TIMEOUT=30000
API_MAX_PAYLOAD_SIZE=1048576

# Queue Configuration
QUEUE_MAX_JOBS=10000
QUEUE_PROCESSING_TIMEOUT=30000
QUEUE_RETRY_ATTEMPTS=3
```

### Feature Flags
```bash
# Enable/disable features
ENABLE_AI_GENERATION=true
ENABLE_QUEUE_MONITORING=true
ENABLE_RATE_LIMITING=true
ENABLE_LOGGING=true
```

## 📖 Additional Resources

### Documentation
- **Swagger UI**: Interactive API documentation at `/api-docs`
- **OpenAPI Spec**: Machine-readable API specification
- **Postman Collection**: Pre-configured API testing
- **Code Examples**: Sample code in multiple languages

### Support
- **API Status**: Check system status at `/status`
- **Error Codes**: Complete list of error codes and meanings
- **Troubleshooting**: Common issues and solutions
- **Contact**: Developer support and feedback
