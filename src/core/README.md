# Core Modules

This directory contains core modules that provide essential functionality across the application.

## Structure

```
src/core/
├── README.md                    # This file
├── index.ts                     # Main exports
└── google-drive/                # Google Drive integration
    ├── README.md               # Google Drive documentation
    ├── index.ts                # Module exports
    ├── google-drive.module.ts  # NestJS module
    └── google-drive.service.ts # Service implementation
```

## Available Modules

### Google Drive Module

Provides Google Drive integration functionality:
- Folder and file management
- Language file operations
- Error handling and logging

**Usage:**
```typescript
import { GoogleDriveModule } from './core/google-drive';

@Module({
  imports: [GoogleDriveModule],
})
export class AppModule {}
```

## Adding New Core Modules

1. Create a new directory under `src/core/`
2. Add module files (service, module, index)
3. Create README.md for documentation
4. Export from main `src/core/index.ts`

## Design Principles

- **Reusability**: Core modules should be reusable across different parts of the application
- **Independence**: Modules should have minimal dependencies on other modules
- **Configuration**: Use JSON configuration files instead of environment variables where possible
- **Error Handling**: Comprehensive error handling and logging
- **Documentation**: Each module should have clear documentation
