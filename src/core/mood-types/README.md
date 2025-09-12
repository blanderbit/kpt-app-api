# Core Mood Types Module

This core module provides centralized functionality for managing mood types across the application.

## Files

- `mood-types.service.ts` - Core service for mood types operations
- `mood-types.module.ts` - NestJS module configuration
- `mood-type.dto.ts` - Data Transfer Object for mood types
- `index.ts` - Module exports

## Features

- **Google Drive Integration**: Load mood types from Google Drive
- **Caching**: In-memory caching for performance
- **Validation**: Type validation and error handling
- **Statistics**: Mood types analytics and filtering

## Service Methods

### `loadMoodTypes(): Promise<void>`
Loads mood types from Google Drive and updates the cache.

### `getAllMoodTypes(): MoodType[]`
Returns all available mood types.

### `getMoodTypesByCategory(category: string): MoodType[]`
Returns mood types filtered by category (positive, neutral, negative).

### `getMoodTypesStats(): MoodTypesStats`
Returns statistical information about mood types.

## Dependencies

- `GoogleDriveFilesService` - Google Drive integration
- `ConfigModule` - Configuration management

## Usage

Import the module in your feature module:

```typescript
import { MoodTypesModule } from '../../core/mood-types';

@Module({
  imports: [MoodTypesModule],
  // ...
})
export class YourModule {}
```

Then inject the service:

```typescript
constructor(private readonly moodTypesService: MoodTypesService) {}
```

## Configuration

The service requires the following environment variables:
- `MOOD_TYPES_FILE_ID` - Google Drive file ID containing mood types data

## Data Structure

Mood types are stored as JSON in Google Drive with the following structure:

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

## Error Handling

The service includes comprehensive error handling:
- Google Drive connection failures
- Invalid JSON data
- Missing required fields
- Network timeouts

All errors are logged and appropriate fallbacks are provided.
