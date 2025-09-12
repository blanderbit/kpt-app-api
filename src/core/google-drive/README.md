# Google Drive Core Module

This module provides Google Drive integration functionality for the application.

## Files

- `google-drive.service.ts` - Main service for Google Drive operations
- `google-drive.module.ts` - NestJS module configuration
- `index.ts` - Module exports

## Features

- **Folder Management**: Create, list, and manage folders
- **File Operations**: Upload, download, and manage files
- **Language Support**: Specialized methods for language file management
- **Error Handling**: Comprehensive error handling and logging

## Usage

### Import the Module

```typescript
import { GoogleDriveModule } from './core/google-drive';

@Module({
  imports: [GoogleDriveModule],
  // ...
})
export class AppModule {}
```

### Use the Service

```typescript
import { GoogleDriveService } from './core/google-drive';

@Injectable()
export class SomeService {
  constructor(private googleDriveService: GoogleDriveService) {}

  async uploadFile() {
    return await this.googleDriveService.uploadFile('path/to/file', 'filename');
  }
}
```

## Configuration

The service automatically loads configuration from `config/third-party/google-drive.json`.

Required environment variables:
- `LANGUAGES_FOLDER_ID` - Root folder ID for language files

## Dependencies

- `@nestjs/common` - NestJS framework
- `googleapis` - Google APIs client library
- `fs` - Node.js file system module

## Error Handling

The service includes comprehensive error handling:
- API initialization errors
- File operation errors
- Network errors
- Authentication errors

All errors are logged and appropriate exceptions are thrown.
