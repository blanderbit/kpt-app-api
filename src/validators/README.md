# Validators

This directory contains validation functions used in the main application startup process.

## Files

### `file-validator.ts`
Generic file validation utility that can:
- Check if a file exists
- Parse JSON files
- Validate required fields in JSON files
- Provide consistent error messages

### `environment-validator.ts`
Validates that all required environment variables are present before starting the application.

### `firebase-validator.ts`
Loads and validates Firebase configuration from JSON file.

### `google-drive-validator.ts`
Loads and validates Google Drive configuration from JSON file.

### `utils/`
Utility functions for validators.

#### `utils/file-validator.ts`
Generic file validation utility.

#### `utils/index.ts`
Exports all utility functions.

### `index.ts`
Auto-imports all validators and provides `validateAllConfigs()` function.

## Usage

```typescript
import { 
  validateAllConfigs,
  validateEnvironmentVariables, 
  validateFile, 
  loadFirebaseConfig,
  loadGoogleDriveConfig 
} from './validators';

// Validate all configurations at once (recommended)
validateAllConfigs();

// Or validate individually
validateEnvironmentVariables();
const firebaseConfig = loadFirebaseConfig();
const googleDriveConfig = loadGoogleDriveConfig();

// Generic file validation
const config = validateFile('path/to/file.json', 'Config file', ['requiredField'], true);
```

## Adding New Validators

1. Create a new file in this directory
2. Export the validation function
3. Add the export to `index.ts`
4. Import and use in `main.ts`
