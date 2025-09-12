# Admin Mood Types Module

This module provides administrative functionality for managing mood types in the application.

## Files

- `mood-types-admin.service.ts` - Service for admin operations on mood types
- `mood-types-admin.controller.ts` - Controller with admin endpoints
- `mood-types-admin.module.ts` - NestJS module configuration
- `index.ts` - Module exports

## Features

- **Sync with Google Drive**: Force reload mood types from Google Drive
- **View All Types**: Get all available mood types
- **Filter by Category**: Get mood types filtered by category
- **Statistics**: Get statistical information about mood types

## Endpoints

### POST `/admin/mood-types/sync-with-drive`
Synchronizes mood types with Google Drive by reloading the data.

**Response:**
```json
{
  "success": true,
  "message": "Типы настроения успешно синхронизированы с Google Drive"
}
```

### GET `/admin/mood-types`
Get all available mood types.

**Response:**
```json
[
  {
    "id": "happy",
    "name": "Счастливый",
    "description": "Чувствую себя счастливым и довольным",
    "emoji": "😊",
    "color": "#4CAF50",
    "score": 8,
    "category": "positive"
  }
]
```

### GET `/admin/mood-types/by-category?category=positive`
Get mood types filtered by category.

**Query Parameters:**
- `category`: Category to filter by (`positive`, `neutral`, `negative`)

### GET `/admin/mood-types/stats`
Get statistical information about mood types.

**Response:**
```json
{
  "totalCount": 15,
  "categoryCounts": {
    "positive": 8,
    "neutral": 3,
    "negative": 4
  },
  "averageScore": 2.5
}
```

## Security

All endpoints require:
- JWT authentication (`JwtAuthGuard`)
- Admin role permissions (`RolesGuard`)

## Dependencies

- `MoodTypesService` - Core mood types service
- `GoogleDriveFilesService` - Google Drive integration
- `ConfigModule` - Configuration management

## Usage

The module is automatically imported in the main `AdminModule` and available at `/admin/mood-types/*` endpoints.
