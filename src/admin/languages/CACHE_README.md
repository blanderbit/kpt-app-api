# Language Cache System

## Overview

The language system now uses in-memory caching for improved performance and reduced Google Drive API calls.

## How It Works

### Initialization

When the application starts:
1. `LanguageService` implements `OnModuleInit`
2. Automatically calls `syncLanguagesFromGoogleDrive()`
3. Loads all languages from Google Drive into memory cache
4. Logs success/failure of initialization

```typescript
async onModuleInit() {
  this.logger.log('Initializing language service - loading languages from Google Drive...');
  await this.syncLanguagesFromGoogleDrive();
}
```

### Cache Storage

Languages are stored in two private properties:
- `languagesCache: LanguageResponseDto[]` - Array of cached languages
- `lastSyncDate: Date | null` - Timestamp of last synchronization

### Public API (No Auth Required)

#### Get All Languages (from cache)
```
GET /languages
GET /languages?active=true
```

Returns languages from cache. Fast, no Google Drive API calls.

**Response:**
```json
[
  {
    "code": "en",
    "name": "English",
    "isActive": true,
    ...
  }
]
```

#### Get Language by ID (from cache)
```
GET /languages/:id
```

#### Get Language by Code (from cache)
```
GET /languages/code/:code
```

### Admin API (Auth Required)

#### Get Languages from Cache
```
GET /admin/languages/cache
```

Returns cached languages with metadata.

**Response:**
```json
{
  "languages": [...],
  "total": 5,
  "lastSyncDate": "2024-01-15T10:30:00.000Z"
}
```

#### Sync Languages from Google Drive
```
POST /admin/languages/sync
```

Manually triggers synchronization from Google Drive. Use this when:
- Languages were updated in Google Drive
- Need to refresh cache manually
- After creating/updating languages

**Response:**
```json
{
  "message": "Languages successfully synchronized from Google Drive",
  "languages": [...],
  "total": 5,
  "syncedAt": "2024-01-15T10:30:00.000Z"
}
```

## Benefits

✅ **Performance**: No Google Drive API calls for read operations  
✅ **Reliability**: Works even if Google Drive is slow/unavailable  
✅ **Consistency**: All clients see the same data  
✅ **Speed**: Instant response from memory  

## When to Sync

- Automatically on app startup
- After creating new language
- After updating language properties
- After archiving/restoring language
- When admin clicks "Sync" button

## Implementation Details

### Service Methods

```typescript
// Get from cache
getLanguagesFromCache(): LanguageResponseDto[]

// Get last sync timestamp
getLastSyncDate(): Date | null

// Sync from Google Drive
syncLanguagesFromGoogleDrive(): Promise<{ languages, syncedAt }>
```

### Cache Update Flow

1. Admin creates/updates language in Google Drive
2. Admin calls `POST /admin/languages/sync`
3. Service fetches fresh data from Google Drive
4. Updates `languagesCache` and `lastSyncDate`
5. All subsequent requests use updated cache

## Notes

- Cache is in-memory, lost on app restart (but reloaded automatically)
- No database required for language list
- Google Drive remains source of truth
- Sync is manual (except on startup)
- Consider adding auto-sync cron job in the future

## Future Enhancements

- [ ] Add WebSocket notifications on sync
- [ ] Add automatic sync every N hours
- [ ] Add cache invalidation strategies
- [ ] Add Redis-based cache for multi-instance deployments

