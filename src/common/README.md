# 🔧 Common Module

Common utilities and shared functionality for the KPT application.

## 📁 Structure

```
src/common/
├── error-codes.ts                    # Unified error code definitions
├── exceptions/
│   └── app.exception.ts             # Unified exception class
├── translations/
│   └── error-codes.default.json     # Default error message translations
└── README.md                         # Module documentation
```

## 🚨 Unified Error Code System

### Overview

The Common Module provides a unified error code system that standardizes error handling across all application modules. This system replaces individual error code files with a single, centralized approach.

### Features

- **Centralized Error Codes**: All error codes defined in one place
- **Module Separation**: Each module has its own range of codes
- **Structured Messages**: Consistent error message format
- **HTTP Status Mapping**: Automatic HTTP status code assignment
- **Context Support**: Additional error context and metadata
- **CLI & API Support**: Different output formats for different contexts

## 🔢 Error Code Structure

### Code Ranges by Module

| Range | Module | Description |
|-------|--------|-------------|
| 1000-1999 | **Admin** | Administrators, languages, statistics |
| 2000-2999 | **Auth** | Authentication, tokens, Firebase |
| 3000-3999 | **CLI** | Command line interface |
| 4000-4999 | **Profile** | User activities, mood tracking |
| 5000-5999 | **Suggested Activity** | AI generation, queues, cron jobs |
| 6000-6999 | **Email** | Email sending, templates |
| 7000-7999 | **Firebase** | Firebase integration |
| 8000-8999 | **Google Drive** | Google Drive API operations |
| 9000-9999 | **Common/System** | General system errors |

### Example Error Codes

```typescript
// Admin Module
ADMIN_INVALID_CREDENTIALS = '1001'           // Invalid email/password
ADMIN_INSUFFICIENT_PERMISSIONS = '1002'      // Insufficient permissions
ADMIN_EMAIL_NOT_VERIFIED = '1004'            // Email not verified

// Auth Module
AUTH_TOKEN_NOT_FOUND = '2301'                // Token not found
AUTH_TOKEN_EXPIRED = '2302'                  // Token expired
AUTH_TOKEN_REVOKED = '2304'                  // Token revoked

// CLI Module
CLI_MISSING_REQUIRED_FIELDS = '3404'         // Missing required fields
CLI_ADMIN_CREATION_FAILED = '3101'           // Admin creation failed
CLI_USER_NOT_FOUND = '3204'                  // User not found
```

## 🚀 AppException Class

### Overview

The `AppException` class extends NestJS's `HttpException` and provides structured error responses with error codes, descriptions, and context.

### Features

- **HTTP Status Codes**: Automatic status code assignment
- **Error Codes**: Module-specific error identification
- **Context Support**: Additional error metadata
- **Module Identification**: Automatic module detection from error code
- **Multiple Output Formats**: CLI, API, and general response formats

### Static Methods

```typescript
// HTTP Status-based exceptions
AppException.unauthorized(errorCode, message?, context?)
AppException.forbidden(errorCode, message?, context?)
AppException.notFound(errorCode, message?, context?)
AppException.conflict(errorCode, message?, context?)
AppException.validation(errorCode, message?, context?)
AppException.internal(errorCode, message?, context?)
AppException.serviceUnavailable(errorCode, message?, context?)
AppException.tooManyRequests(errorCode, message?, context?)
AppException.badGateway(errorCode, message?, context?)
AppException.gatewayTimeout(errorCode, message?, context?)
```

### Usage Examples

#### Basic Usage

```typescript
import { ErrorCode } from '../common/error-codes';
import { AppException } from '../common/exceptions/app.exception';

// Simple error
throw AppException.unauthorized(ErrorCode.AUTH_TOKEN_NOT_FOUND);

// With custom message
throw AppException.unauthorized(
  ErrorCode.AUTH_TOKEN_NOT_FOUND,
  'Authentication token not found in request'
);

// With context
throw AppException.validation(
  ErrorCode.CLI_MISSING_REQUIRED_FIELDS,
  'Email and password are required',
  { usage: 'npm run cli create-admin --email admin@example.com --password password123' }
);
```

#### In Services

```typescript
// Admin service
async adminLogin(adminLoginDto: AdminLoginDto): Promise<AdminLoginResponseDto> {
  const user = await this.usersService.findByEmail(adminLoginDto.email);
  if (!user) {
    throw AppException.unauthorized(
      ErrorCode.ADMIN_INVALID_CREDENTIALS,
      'Invalid email or password provided'
    );
  }

  if (!user.roles.includes('admin')) {
    throw AppException.forbidden(
      ErrorCode.ADMIN_INSUFFICIENT_PERMISSIONS,
      'User does not have required permissions'
    );
  }
}
```

#### In Guards

```typescript
// Auth guard
async canActivate(context: ExecutionContext): Promise<boolean> {
  const token = this.extractTokenFromHeader(request);
  
  if (!token) {
    throw AppException.unauthorized(
      ErrorCode.AUTH_TOKEN_NOT_FOUND,
      'Authentication token not found in request'
    );
  }

  const isBlacklisted = await this.redisBlacklistService.isBlacklisted(token);
  if (isBlacklisted) {
    throw AppException.unauthorized(
      ErrorCode.AUTH_TOKEN_REVOKED,
      'Authentication token has been revoked'
    );
  }
}
```

#### In CLI Commands

```typescript
// CLI command
async run(passedParams: string[], options?: CreateAdminOptions): Promise<void> {
  if (!options?.email || !options?.password) {
    const error = AppException.validation(
      ErrorCode.CLI_MISSING_REQUIRED_FIELDS,
      'Email and password are required',
      { usage: 'npm run cli create-admin --email admin@example.com --password password123' }
    );
    console.error(error.getCliMessage());
    process.exit(1);
  }
}
```

## 📤 Output Formats

### API Response Format

```json
{
  "statusCode": 401,
  "errorCode": "2301",
  "message": "Authentication token not found in request",
  "description": "Authentication token not found in request",
  "module": "Auth",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "context": {
    "requestId": "req-123",
    "ip": "192.168.1.1"
  }
}
```

### CLI Output Format

```
❌ Error 2301: Authentication token not found in request
   Module: Auth
   Description: Authentication token not found in request
   Status: 401
   Context: {"requestId":"req-123","ip":"192.168.1.1"}
```

### General Response Format

```typescript
// Get structured response
const response = error.getResponse();

// Get CLI-formatted message
const cliMessage = error.getCliMessage();

// Get API-formatted message
const apiMessage = error.getApiMessage();
```

## 🔄 Migration Guide

### Step 1: Import Dependencies

```typescript
import { ErrorCode } from '../common/error-codes';
import { AppException } from '../common/exceptions/app.exception';
```

### Step 2: Replace Old Error Handling

```typescript
// Before (old way)
throw new Error(`Error ${ErrorCode.ADMIN_INVALID_CREDENTIALS}: Invalid email or password`);

// After (new way)
throw AppException.unauthorized(
  ErrorCode.ADMIN_INVALID_CREDENTIALS,
  'Invalid email or password provided'
);
```

### Step 3: Update Error Handling

```typescript
// Before
catch (error) {
  console.error('❌ Error 1001:', error.message);
}

// After
catch (error) {
  if (error instanceof AppException) {
    console.error(error.getCliMessage());
  } else {
    const appError = AppException.internal(
      ErrorCode.COMMON_UNKNOWN_ERROR,
      'Unknown error occurred',
      { originalError: error.message }
    );
    console.error(appError.getCliMessage());
  }
}
```

## 🛠️ Development

### Adding New Error Codes

1. **Choose Module Range**: Select appropriate range for your module
2. **Add to Enum**: Add new code to `ErrorCode` enum
3. **Add Description**: Add description to `ErrorDescription` mapping
4. **Update Translations**: Add to `error-codes.default.json`
5. **Document**: Update this README with new codes

### Example: Adding New Admin Error

```typescript
// In error-codes.ts
export enum ErrorCode {
  // ... existing codes ...
  ADMIN_NEW_FEATURE_FAILED = '1998',  // New admin feature
}

export const ErrorDescription: Record<ErrorCode, string> = {
  // ... existing descriptions ...
  [ErrorCode.ADMIN_NEW_FEATURE_FAILED]: 'New admin feature failed',
};
```

```json
// In error-codes.default.json
{
  "errorCodes": {
    "1998": "New admin feature failed"
  }
}
```

## 📊 Benefits

### For Developers
- **Consistency**: All errors follow the same format
- **Maintainability**: Centralized error code management
- **Debugging**: Easy to identify error types by code
- **Documentation**: Self-documenting error codes

### For Frontend
- **Localization**: Easy to translate error messages
- **User Experience**: Consistent error handling
- **Error Mapping**: Map error codes to user-friendly messages
- **Retry Logic**: Implement retry strategies based on error codes

### For Operations
- **Monitoring**: Track error patterns by code
- **Alerting**: Set up alerts for specific error codes
- **Analytics**: Analyze error frequency and impact
- **Support**: Provide better customer support with error codes

## 🔍 Error Code Lookup

### Helper Functions

```typescript
import { getErrorDescription, getModuleFromErrorCode } from '../common/error-codes';

// Get error description
const description = getErrorDescription(ErrorCode.ADMIN_INVALID_CREDENTIALS);
// Returns: "Invalid email or password provided"

// Get module name
const module = getModuleFromErrorCode(ErrorCode.ADMIN_INVALID_CREDENTIALS);
// Returns: "Admin"
```

## 📚 Useful Links

- [NestJS Exception Filters](https://docs.nestjs.com/exception-filters)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Error Handling Best Practices](https://docs.nestjs.com/exception-filters#exception-filters-1)

---

**Note**: This error code system is designed to be extensible. When adding new functionality, consider adding appropriate error codes to maintain consistency across the application.
