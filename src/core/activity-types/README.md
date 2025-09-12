# Core Activity Types Module

This core module provides centralized functionality for managing activity types across the application.

## Files

- `activity-types.service.ts` - Core service for activity types operations
- `activity-types.module.ts` - NestJS module configuration
- `activity-type.dto.ts` - Data Transfer Object for activity types
- `index.ts` - Module exports

## Features

- **Google Drive Integration**: Load activity types from Google Drive
- **Caching**: In-memory caching for performance
- **Validation**: Type validation and error handling
- **Statistics**: Activity types analytics and filtering
- **Category Management**: Organize activities by categories

## Service Methods

### `loadActivityTypes(): Promise<void>`
Loads activity types from Google Drive and updates the cache.

### `getAllActivityTypes(): ActivityType[]`
Returns all available activity types.

### `getActivityTypesByCategory(category: string): ActivityType[]`
Returns activity types filtered by category.

### `getActivityCategories(): Record<string, string>`
Returns all available activity categories.

### `getActivityTypesStats(): ActivityTypesStats`
Returns statistical information about activity types.

## Dependencies

- `GoogleDriveFilesService` - Google Drive integration
- `ConfigModule` - Configuration management

## Usage

Import the module in your feature module:

```typescript
import { ActivityTypesModule } from '../../core/activity-types';

@Module({
  imports: [ActivityTypesModule],
  // ...
})
export class YourModule {}
```

Then inject the service:

```typescript
constructor(private readonly activityTypesService: ActivityTypesService) {}
```

## Configuration

The service requires the following environment variables:
- `ACTIVITY_TYPES_FILE_ID` - Google Drive file ID containing activity types data

## Data Structure

Activity types are stored as JSON in Google Drive with the following structure:

```json
{
  "activityTypes": [
    {
      "id": "reading",
      "name": "Чтение",
      "description": "Чтение книг, статей, новостей",
      "keywords": ["книги", "чтение", "обучение"],
      "category": "education",
      "icon": "📚",
      "color": "#2196F3"
    }
  ],
  "categories": {
    "education": "Образование",
    "sports": "Спорт",
    "entertainment": "Развлечения"
  }
}
```

## Error Handling

The service includes comprehensive error handling:
- Google Drive connection failures
- Invalid JSON data
- Missing required fields
- Network timeouts

All errors are logged and appropriate fallbacks are provided.
