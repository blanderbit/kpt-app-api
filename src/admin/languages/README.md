# 🌍 Language Module

Module for managing application languages with Google Drive integration. All data is stored in Google Drive without using a local database.

## 📁 Structure

```
src/admin/languages/
├── language.module.ts              # Language Module
├── language.controller.ts           # Controller for API endpoints
├── entities/                       # Database entities
│   └── language.entity.ts          # Language entity
├── dto/                            # Data Transfer Objects
│   └── language.dto.ts             # DTOs for languages
├── services/                       # Services
│   ├── language.service.ts         # Main service for language management
│   └── google-drive.service.ts     # Service for Google Drive operations
└── README.md                       # Module documentation
```

## 🚀 Functionality

### Core Features
- **Language Management** - creation, editing, archiving
- **Google Drive Integration** - automatic file synchronization
- **Default Templates** - ready-made templates for new languages
- **Translation Statistics** - tracking translation progress
- **Archiving** - safe language deletion with preservation in Google Drive

### API Endpoints

#### Language Management
- `GET /admin/languages` - get all languages
- `GET /admin/languages?active=true` - get only active languages
- `GET /admin/languages/:id` - get language by ID
- `GET /admin/languages/code/:code` - get language by code
- `POST /admin/languages` - create new language
- `PUT /admin/languages/:id` - update language
- `DELETE /admin/languages/:id` - archive language
- `POST /admin/languages/:id/restore` - restore language from archive

#### Templates and Synchronization
- `POST /admin/languages/download-template` - download default template
- `POST /admin/languages/:id/sync` - synchronize with Google Drive

#### Google Drive Integration
- `GET /admin/languages/google-drive/files` - files from Google Drive
- `GET /admin/languages/google-drive/test-connection` - connection test
- `GET /admin/languages/google-drive/folders` - folder information

#### Statistics
- `GET /admin/languages/statistics` - general language statistics

## 🏗️ Architecture

### Data Storage
All language data is stored in Google Drive in JSON file format. Each language is represented by a separate file with metadata and translations.

### Language File Structure
```typescript
interface LanguageFile {
  language: {
    code: string;           // Language code (en, ru, es)
    name: string;           // Name in English
    nativeName: string;     // Name in native language
    direction: 'ltr' | 'rtl'; // Text direction
    isActive: boolean;      // Whether language is active
    isDefault: boolean;     // Whether it's the default language
    version: string;        // File version
    lastUpdated: string;    // Last update date
  };
  translations: {
    // Translation categories
    common: Record<string, string>;
    auth: Record<string, string>;
    profile: Record<string, string>;
    // ... other categories
  };
  metadata: {
    createdBy: string;      // Who created it
    updatedBy: string;      // Who last updated it
    createdAt: string;      // Creation date
    updatedAt: string;      // Update date
    totalKeys: number;      // Total number of keys
    totalTranslations: number; // Number of completed translations
    completionRate: number; // Completion percentage
    notes?: string;         // Notes
  };
}
```

### Google Drive Integration

#### Folder Structure
```
Google Drive
└── KPT App Languages/              # Root folder for languages
    ├── en.json                     # English language
    ├── ru.json                     # Russian language
    ├── es.json                     # Spanish language
    └── Archived Languages/         # Archive folder
        ├── old-en.json             # Old versions
        └── deprecated-ru.json      # Deprecated languages
```

#### Google Drive Functions
- **Folder Creation** - automatic structure creation
- **File Upload** - language JSON files
- **File Updates** - change synchronization
- **Archiving** - moving to archive folder
- **Downloading** - getting files for local work

## 🔧 Business Logic

### Language Creation
1. **Validation** - checking code uniqueness
2. **Template Creation** - based on default template
3. **Google Drive Upload** - automatic file upload
4. **Statistics** - counting keys and translations
5. **Data Return** - information about created language

### Language Update
1. **Existence Check** - finding language by Google Drive file ID
2. **File Download** - temporary download for editing
3. **Metadata Update** - changing language information
4. **Upload Back** - updating file in Google Drive

### Language Archiving
1. **Capability Check** - cannot archive default language
2. **Google Drive Move** - to archive folder
3. **Logging** - archiving record in logs

### Google Drive Synchronization
1. **Existence Check** - finding language by file ID
2. **File Download** - temporary download from Google Drive
3. **Data Processing** - reading and analyzing file
4. **Cleanup** - removing temporary files

## 📊 Statistics and Metrics

### Key Indicators
- **totalKeys** - total number of translation keys
- **totalTranslations** - number of completed translations
- **completionRate** - translation completion percentage (0-100%)

### Grouping by Completion
- **0-25%** - Initial stage
- **26-50%** - In progress
- **51-75%** - Close to completion
- **76-100%** - Completed

### General Statistics
- **totalLanguages** - total number of languages
- **activeLanguages** - number of active languages
- **archivedLanguages** - number of archived languages
- **defaultLanguages** - number of default languages
- **averageCompletionRate** - average completion percentage

## 🔐 Security

### Authorization
- **JwtAuthGuard** - JWT token verification
- **RolesGuard** - user role verification
- **@Roles('admin')** - administrators only

### Validation
- **DTO Validation** - input data verification
- **Business Rules** - code uniqueness, archiving restrictions
- **File Verification** - JSON structure validation of language files

### Restrictions
- **Language Code** - 2-10 characters, unique
- **Text Direction** - only 'ltr' or 'rtl'
- **Version** - X.Y.Z format
- **Completion Percentage** - 0-100%

## 📝 DTOs

### CreateLanguageDto
```typescript
export class CreateLanguageDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  nativeName: string;

  @IsString()
  @IsIn(['ltr', 'rtl'])
  @IsOptional()
  direction?: 'ltr' | 'rtl';

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
```

### UpdateLanguageDto
```typescript
export class UpdateLanguageDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  nativeName?: string;

  @IsString()
  @IsIn(['ltr', 'rtl'])
  @IsOptional()
  direction?: 'ltr' | 'rtl';

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
```

## 🧪 Testing

### Unit Tests
- **LanguageService** - language management business logic
- **GoogleDriveService** - Google Drive integration
- **DTO Validation** - input data verification

### Integration Tests
- **API Endpoints** - complete request cycle
- **Google Drive API** - file upload and download
- **File System** - temporary file creation and deletion

### E2E Tests
- **User Scenarios** - creation, update, archiving
- **Google Drive Integration** - complete synchronization cycle
- **Error Handling** - invalid data, API issues

## 🔍 Monitoring

### Logging
- **Language Creation** - for audit
- **Google Drive Operations** - upload, download, archiving
- **Synchronization Errors** - for debugging
- **Status Changes** - activation, archiving

### Metrics
- **Language Count** - by status and completion
- **Google Drive Operations** - execution time, success rate
- **Translation Statistics** - progress by languages
- **API Usage** - popular endpoints

## 📈 Optimization

### Caching
- **Language List** - for frequent requests
- **Statistics** - aggregated data
- **Google Drive Metadata** - file information

### Google Drive Optimization
- **Metadata Caching** - for quick access to file information
- **Batch Operations** - grouping API requests
- **Temporary Files** - efficient local copy management

### Google Drive Optimization
- **Batch Operations** - request grouping
- **Token Caching** - reducing authentication
- **Error Handling** - retry logic for failures

## 🚀 Development

### Planned Improvements
- **Machine Translation** - automatic translations
- **Versioning** - translation change history
- **Notifications** - alerts about new languages
- **Export/Import** - support for various formats

### API Versioning
- **v1** - current version
- **v2** - extended capabilities
- **Backward Compatibility** - support for old versions

### Scaling
- **Microservices** - separate language service
- **CDN** - language file caching
- **Database** - sharding for large volumes

## 🔗 Integrations

### Internal Modules
- **Admin** - for administrative interface
- **Auth** - for role verification
- **Config** - for Google Drive settings

### External Services
- **Google Drive API** - for file storage
- **Google Cloud** - for authentication
- **CDN** - for fast file delivery

## 📚 Documentation

### File Structure
- **[Default Template](../../data/languages/templates/default-language-template.json)** - base template for all languages
- **[Google Drive Setup](../../config/third-party/GOOGLE_DRIVE_SETUP.md)** - setup instructions
- **[Configurations](../../config/third-party/README.md)** - third-party service configuration examples

### Google Drive
- **[API Reference](https://developers.google.com/drive/api)** - official documentation
- **[Authentication](https://developers.google.com/identity/protocols/oauth2)** - OAuth 2.0
- **[File Management](https://developers.google.com/drive/api/guides/manage-files)** - file management

### API
- **[Swagger](../docs/API_ENDPOINTS.md)** - complete API documentation
- **[Examples](../docs/API_ENDPOINTS.md)** - endpoint usage

---

**Important:** The module requires configured Google Drive API keys and administrator role. All data is stored in Google Drive without using a local database.
