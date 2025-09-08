# 👨‍💼 Admin Module

Administrative functionality for managing users, languages, and system statistics.

## 📁 Structure

```
src/admin/
├── admin.controller.ts         # Admin API endpoints
├── admin.service.ts            # Admin business logic
├── admin.module.ts             # Module configuration
├── admin.config.ts             # Configuration constants
├── languages/                  # Language management
│   ├── language.controller.ts  # Language API endpoints
│   ├── language.module.ts      # Language module configuration
│   ├── language.service.ts     # Language business logic
│   ├── dto/                    # Language DTOs
│   │   └── language.dto.ts     # Language data transfer objects
│   ├── services/               # Language services
│   │   ├── google-drive.service.ts # Google Drive integration
│   │   └── language.service.ts # Language management
│   └── README.md               # Language module documentation
├── dto/                        # Admin DTOs
│   └── admin.dto.ts            # Admin data transfer objects
└── README.md                   # Module documentation
```

## 🚀 Features

### User Management
- **Administrator Authentication**: Secure admin login with JWT
- **User Statistics**: Comprehensive user analytics and reporting
- **User Pagination**: Efficient user listing with pagination
- **Role Management**: Administrator role assignment and validation

### Language Management
- **Multi-language Support**: Dynamic language file management
- **Google Drive Integration**: Cloud-based language file storage
- **Language Templates**: Standardized language file structure
- **Active/Archived Languages**: Language lifecycle management

### System Administration
- **Statistics Generation**: User count, admin count, verification status
- **Performance Optimization**: Parallel database queries
- **Error Handling**: Structured error codes and messages
- **Security**: Role-based access control and validation

## 🔧 API Endpoints

### Authentication

#### POST `/admin/login`
Administrator login with email and password.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "adminpassword123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "roles": ["admin"],
    "emailVerified": true,
    "isActive": true
  }
}
```

### User Management

#### GET `/admin/users`
Get paginated list of users.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term for email/name
- `role`: Filter by user role
- `status`: Filter by user status

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["user"],
      "emailVerified": true,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### Statistics

#### GET `/admin/stats`
Get comprehensive user statistics.

**Response:**
```json
{
  "totalUsers": 1000,
  "totalAdmins": 5,
  "verifiedUsers": 850,
  "unverifiedUsers": 150,
  "usersThisMonth": 45,
  "usersLastMonth": 38
}
```

### Language Management

#### GET `/admin/languages`
Get all available languages.

**Response:**
```json
[
  {
    "id": "en",
    "name": "English",
    "code": "en",
    "isActive": true,
    "totalKeys": 150,
    "totalTranslations": 150,
    "completionRate": 100
  }
]
```

#### POST `/admin/languages`
Create new language.

**Request:**
```json
{
  "code": "fr",
  "name": "French",
  "template": {
    "translations": {
      "common": {
        "welcome": "Bienvenue",
        "hello": "Bonjour"
      }
    }
  }
}
```

## 🚨 Error Code System

### Overview

The Admin Module uses the unified error code system from `src/common/error-codes.ts`. This system provides structured error responses with standardized codes across all modules.

### Error Code Structure

| Range | Category | Description |
|-------|----------|-------------|
| 1000-1099 | Authentication & Authorization | Login, permissions, sessions |
| 1100-1199 | User Management | User CRUD operations |
| 1200-1299 | Language Management | Language operations |
| 1300-1399 | Statistics & Reporting | Analytics generation |
| 1400-1499 | System & Configuration | System operations |
| 1500-1599 | Google Drive Integration | File operations |

### Admin Error Codes Used

```typescript
// Authentication & Authorization
ADMIN_INVALID_CREDENTIALS = '1001'           // Invalid email or password
ADMIN_INSUFFICIENT_PERMISSIONS = '1002'      // Insufficient permissions
ADMIN_ACCOUNT_NO_PASSWORD_SUPPORT = '1003'   // Account no password support
ADMIN_EMAIL_NOT_VERIFIED = '1004'            // Email not verified
ADMIN_TOKEN_EXPIRED = '1005'                 // Token expired
ADMIN_TOKEN_INVALID = '1006'                 // Token invalid
ADMIN_ROLE_REQUIRED = '1007'                 // Admin role required

// User Management
ADMIN_USER_NOT_FOUND = '1101'                // User not found
ADMIN_USER_ALREADY_EXISTS = '1102'           // User already exists
ADMIN_USER_INACTIVE = '1103'                 // User inactive
ADMIN_USER_ARCHIVED = '1104'                 // User archived
ADMIN_CANNOT_DELETE_ADMIN = '1105'           // Cannot delete admin
ADMIN_CANNOT_MODIFY_ADMIN_ROLE = '1106'      // Cannot modify admin role

// Language Management
ADMIN_LANGUAGE_NOT_FOUND = '1201'            // Language not found
ADMIN_LANGUAGE_CODE_EXISTS = '1202'          // Language code exists
ADMIN_LANGUAGE_INVALID_CODE = '1203'         // Invalid language code
ADMIN_LANGUAGE_INVALID_TEMPLATE = '1204'     // Invalid template
ADMIN_LANGUAGE_ARCHIVE_FAILED = '1205'       // Archive failed
ADMIN_LANGUAGE_RESTORE_FAILED = '1206'       // Restore failed
ADMIN_LANGUAGE_SYNC_FAILED = '1207'          // Sync failed

// Statistics & Reporting
ADMIN_STATS_GENERATION_FAILED = '1301'       // Stats generation failed
ADMIN_INVALID_DATE_RANGE = '1302'            // Invalid date range
ADMIN_REPORT_GENERATION_FAILED = '1303'      // Report generation failed

// System & Configuration
ADMIN_CONFIGURATION_ERROR = '1401'            // Configuration error
ADMIN_EXTERNAL_SERVICE_UNAVAILABLE = '1402'  // External service unavailable
ADMIN_DATABASE_CONNECTION_FAILED = '1403'    // Database connection failed
ADMIN_FILE_OPERATION_FAILED = '1404'         // File operation failed

// Google Drive Integration
ADMIN_GOOGLE_DRIVE_CONNECTION_FAILED = '1501' // Google Drive connection failed
ADMIN_GOOGLE_DRIVE_FILE_NOT_FOUND = '1502'    // File not found
ADMIN_GOOGLE_DRIVE_UPLOAD_FAILED = '1503'     // Upload failed
ADMIN_GOOGLE_DRIVE_DOWNLOAD_FAILED = '1504'   // Download failed
ADMIN_GOOGLE_DRIVE_PERMISSION_DENIED = '1505' // Permission denied
```

### Error Handling

The module uses the unified `AppException` class for structured error responses:

```typescript
import { ErrorCode } from '../common/error-codes';
import { AppException } from '../common/exceptions/app.exception';

// Example error throwing
throw AppException.unauthorized(
  ErrorCode.ADMIN_INVALID_CREDENTIALS,
  'Invalid email or password provided'
);

// Example error output
// Error 1001: Invalid email or password provided
```

## 🏗️ Architecture

### Core Components

#### AdminService
- **User Authentication**: Admin login with JWT
- **Statistics Generation**: Parallel database queries for performance
- **User Management**: Pagination and filtering
- **Error Handling**: Structured error responses

#### LanguageService
- **Language CRUD**: Create, read, update, delete languages
- **Google Drive Integration**: Cloud file management
- **Template Validation**: Language file structure validation
- **Performance Optimization**: Parallel file processing

#### GoogleDriveService
- **File Operations**: Upload, download, list files
- **API Integration**: Google Drive API wrapper
- **Error Handling**: Graceful API failure handling
- **Caching**: File metadata caching

### Dependencies
- **@nestjs/typeorm**: Database operations
- **@nestjs/jwt**: JWT token handling
- **@nestjs/passport**: Authentication framework
- **bcrypt**: Password hashing
- **nestjs-paginate**: Pagination support

## 🔐 Security Features

### Authentication
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt with 10 salt rounds
- **Role Validation**: Administrator role verification
- **Email Verification**: Required email confirmation

### Authorization
- **Role-based Access**: Administrator-only endpoints
- **Permission Checking**: Granular permission validation
- **Session Management**: Secure session handling
- **Input Validation**: DTO-based request validation

## 📊 Performance Optimization

### Database Queries
- **Parallel Execution**: Promise.all for concurrent queries
- **Query Optimization**: TypeORM createQueryBuilder
- **Pagination**: Efficient user listing with limits
- **Indexing**: Optimized database indexes

### File Operations
- **Parallel Processing**: Concurrent file operations
- **Streaming**: Efficient file upload/download
- **Caching**: Metadata caching for performance
- **Batch Operations**: Bulk file operations

## 🛠️ Development

### Adding New Features

1. **Define Error Codes**: Add to `src/common/error-codes.ts`
2. **Create DTOs**: Define request/response structures
3. **Implement Service**: Add business logic
4. **Add Controller**: Create API endpoints
5. **Update Tests**: Add unit and integration tests

### Testing

```bash
# Run admin module tests
npm run test admin

# Run specific test file
npm run test admin.service.spec.ts

# Run e2e tests
npm run test:e2e admin
```

## 📚 Useful Links

- [NestJS Controllers](https://docs.nestjs.com/controllers)
- [NestJS Services](https://docs.nestjs.com/providers)
- [TypeORM](https://typeorm.io/)
- [JWT Authentication](https://docs.nestjs.com/security/authentication)

---

**Important:** Ensure proper administrator role assignment and email verification for admin accounts.
