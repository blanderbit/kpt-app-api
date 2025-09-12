# Admin Activity Types Module

This module provides administrative functionality for managing activity types in the application.

## Files

- `activity-types-admin.service.ts` - Service for admin operations on activity types
- `activity-types-admin.controller.ts` - Controller with admin endpoints
- `activity-types-admin.module.ts` - NestJS module configuration
- `index.ts` - Module exports

## Features

- **Sync with Google Drive**: Force reload activity types from Google Drive
- **View All Types**: Get all available activity types
- **Filter by Category**: Get activity types filtered by category
- **Category Management**: Get all activity categories
- **Statistics**: Get statistical information about activity types

## Endpoints

### POST `/admin/activity-types/sync-with-drive`
Synchronizes activity types with Google Drive by reloading the data.

**Response:**
```json
{
  "success": true,
  "message": "Типы активности успешно синхронизированы с Google Drive"
}
```

### GET `/admin/activity-types`
Get all available activity types.

**Response:**
```json
[
  {
    "id": "reading",
    "name": "Чтение",
    "description": "Чтение книг, статей, новостей",
    "keywords": ["книги", "чтение", "обучение"],
    "category": "education",
    "icon": "📚",
    "color": "#2196F3"
  }
]
```

### GET `/admin/activity-types/by-category?category=education`
Get activity types filtered by category.

**Query Parameters:**
- `category`: Category to filter by

### GET `/admin/activity-types/categories`
Get all available activity categories.

**Response:**
```json
{
  "education": "Образование",
  "sports": "Спорт",
  "entertainment": "Развлечения"
}
```

### GET `/admin/activity-types/stats`
Get statistical information about activity types.

**Response:**
```json
{
  "totalCount": 25,
  "categoryCounts": {
    "education": 8,
    "sports": 5,
    "entertainment": 7,
    "work": 3,
    "social": 2
  },
  "averageDifficulty": 2.5
}
```

## Security

All endpoints require:
- JWT authentication (`JwtAuthGuard`)
- Admin role permissions (`RolesGuard`)

## Dependencies

- `ActivityTypesService` - Core activity types service
- `GoogleDriveFilesService` - Google Drive integration
- `ConfigModule` - Configuration management

## Usage

The module is automatically imported in the main `AdminModule` and available at `/admin/activity-types/*` endpoints.
