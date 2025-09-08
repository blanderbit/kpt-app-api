# 🔥 Firebase Module

Firebase integration for authentication and user management in the KPT application.

## 📁 Structure

```
src/firebase/
├── firebase.service.ts          # Main Firebase service
├── firebase.module.ts           # Module configuration
└── README.md                    # Module documentation
```

## 🚀 Features

### Firebase Admin SDK
- **Initialization**: Automatic Firebase Admin SDK setup
- **Configuration**: Environment-based Firebase configuration
- **Error Handling**: Comprehensive error handling with specific error codes
- **User Management**: Firebase user operations and token management

### Authentication
- **ID Token Verification**: Secure token validation
- **User Lookup**: Find users by UID
- **Custom Token Creation**: Generate custom authentication tokens
- **Error Classification**: Specific error handling for different failure scenarios

### Error Handling
- **Unified Error Codes**: Uses centralized error code system (7000-7999)
- **Structured Exceptions**: Custom `AppException` with error codes
- **Detailed Error Messages**: Includes original Firebase error details
- **Error Classification**: Maps Firebase error codes to appropriate HTTP statuses

## 🔧 Configuration

### Environment Variables

```env
# Firebase Service Account Configuration
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
```

### Firebase Configuration

```typescript
import { firebaseConfig } from '../config/firebase.config';

// Configuration object with all Firebase settings
firebaseConfig.type                    // Service account type
firebaseConfig.project_id              // Firebase project ID
firebaseConfig.private_key_id          // Private key identifier
firebaseConfig.private_key             // Private key content
firebaseConfig.client_email            // Service account email
firebaseConfig.client_id               // Client identifier
firebaseConfig.auth_uri                // OAuth2 auth URI
firebaseConfig.token_uri               // OAuth2 token URI
firebaseConfig.auth_provider_x509_cert_url  // Auth provider certificate URL
firebaseConfig.client_x509_cert_url         // Client certificate URL
```

## 🔧 API Methods

### getAuth()
Returns Firebase Auth instance.

**Returns:**
- `admin.auth.Auth`: Firebase authentication instance

**Error Handling:**
- `FIREBASE_SERVICE_UNAVAILABLE`: If Firebase is not initialized

### verifyIdToken(idToken)
Verifies Firebase ID token and returns decoded information.

**Parameters:**
- `idToken`: Firebase ID token string

**Returns:**
- `Promise<admin.auth.DecodedIdToken>`: Decoded token information

**Error Handling:**
- `FIREBASE_TOKEN_EXPIRED`: Token has expired
- `FIREBASE_TOKEN_REVOKED`: Token has been revoked
- `FIREBASE_TOKEN_INVALID`: Token is invalid
- `FIREBASE_TOKEN_MALFORMED`: Token is malformed
- `FIREBASE_TOKEN_VERIFICATION_FAILED`: Generic verification failure

### getUserByUid(uid)
Retrieves Firebase user information by UID.

**Parameters:**
- `uid`: Firebase user UID

**Returns:**
- `Promise<admin.auth.UserRecord>`: Firebase user record

**Error Handling:**
- `FIREBASE_USER_NOT_FOUND`: User not found
- `FIREBASE_USER_DISABLED`: User account is disabled
- `FIREBASE_USER_DELETED`: User has been deleted
- `FIREBASE_PERMISSION_DENIED`: Permission denied
- `FIREBASE_OPERATION_FAILED`: Generic operation failure

### createCustomToken(uid, additionalClaims?)
Creates a custom Firebase authentication token.

**Parameters:**
- `uid`: Firebase user UID
- `additionalClaims?`: Optional custom claims object

**Returns:**
- `Promise<string>`: Custom authentication token

**Error Handling:**
- `FIREBASE_CUSTOM_TOKEN_CREATION_FAILED`: Token creation failed
- `FIREBASE_PERMISSION_DENIED`: Permission denied

## 🏗️ Architecture

### Core Components

#### FirebaseService
- **Initialization**: Handles Firebase Admin SDK setup
- **Error Handling**: Comprehensive error classification and handling
- **User Operations**: Firebase user management operations
- **Token Management**: ID token verification and custom token creation

### Error Handling Strategy
The service implements a multi-layered error handling approach:

1. **Firebase Error Code Mapping**: Maps Firebase-specific error codes to appropriate HTTP statuses
2. **Error Classification**: Categorizes errors by type (authentication, user, operation, etc.)
3. **Detailed Error Messages**: Includes original Firebase error details for debugging
4. **Unified Error System**: Uses the application's centralized error code system

### Dependencies
- **firebase-admin**: Firebase Admin SDK
- **@nestjs/config**: Configuration management
- **Error System**: Unified error codes and exceptions

## 🔐 Security Features

### Token Validation
- **ID Token Verification**: Secure validation of Firebase ID tokens
- **Custom Token Creation**: Secure generation of custom authentication tokens
- **Error Handling**: Prevents information leakage in error messages

### User Management
- **User Lookup**: Secure user information retrieval
- **Permission Control**: Proper permission checking
- **Account Status**: Handles disabled and deleted accounts

### Configuration Security
- **Service Account**: Uses secure service account credentials
- **Environment Variables**: Secure configuration management
- **Initialization Validation**: Ensures proper Firebase setup

## 📊 Error Handling

### Error Code System
The Firebase module uses the unified error code system with codes in the range **7000-7999**.

#### Initialization & Configuration Errors (7000-7099)
- `7001`: Firebase initialization failed
- `7002`: Configuration missing
- `7003`: Configuration invalid
- `7004`: Credentials invalid
- `7005`: Project not found
- `7006`: Service account error

#### Authentication Errors (7100-7199)
- `7101`: Authentication failed
- `7102`: Token verification failed
- `7103`: Token expired
- `7104`: Token invalid
- `7105`: Token revoked
- `7106`: Token malformed
- `7107`: User not found
- `7108`: User disabled
- `7109`: User deleted
- `7110`: Custom token creation failed

#### Operation Errors (7200-7299)
- `7201`: Operation failed
- `7202`: Permission denied
- `7203`: Quota exceeded
- `7204`: Rate limit exceeded
- `7205`: Timeout error

#### External Service Errors (7300-7399)
- `7301`: External service unavailable
- `7302`: Network error
- `7303`: API error
- `7304`: Service unavailable

#### Generic Errors (7900-7999)
- `7901`: Internal server error
- `7999`: Unknown error

### Exception Handling
```typescript
import { AppException } from '../common/exceptions/app.exception';
import { ErrorCode } from '../common/error-codes';

// Unauthorized error (token expired)
throw AppException.unauthorized(
  ErrorCode.FIREBASE_TOKEN_EXPIRED,
  `Firebase ID token expired: ${error.message}`
);

// Not found error (user not found)
throw AppException.notFound(
  ErrorCode.FIREBASE_USER_NOT_FOUND,
  `Firebase user not found with UID: ${uid}. Error: ${error.message}`
);

// Forbidden error (permission denied)
throw AppException.forbidden(
  ErrorCode.FIREBASE_PERMISSION_DENIED,
  `Permission denied to access Firebase user: ${error.message}`
);
```

### Error Details from Try-Catch
The service captures and includes original Firebase error details:

```typescript
try {
  return await this.firebaseApp.auth().getUser(uid);
} catch (error) {
  // Include original error message for debugging
  throw AppException.notFound(
    ErrorCode.FIREBASE_USER_NOT_FOUND,
    `Firebase user not found with UID: ${uid}. Error: ${error.message}`
  );
}
```

## 📊 Monitoring & Logging

### Error Tracking
- **Error Classification**: Categorizes errors by type and severity
- **Detailed Logging**: Includes original Firebase error details
- **Performance Metrics**: Monitor Firebase operation performance

### Firebase Analytics
- **Token Verification**: Track token validation success/failure rates
- **User Operations**: Monitor user lookup and management operations
- **Custom Token Creation**: Track custom token generation success

## 🛠️ Development

### Adding New Firebase Operations

1. **Define Error Codes**: Add new error codes to the Firebase range (7000-7999)
2. **Implement Method**: Add new method to `FirebaseService`
3. **Error Handling**: Implement comprehensive error handling with specific error codes
4. **Update Tests**: Add unit and integration tests

### Example: Adding User Update Method

```typescript
async updateUser(uid: string, userData: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord> {
  try {
    return await this.firebaseApp.auth().updateUser(uid, userData);
  } catch (error) {
    // Handle specific Firebase user update errors
    if (error.code === 'auth/user-not-found') {
      throw AppException.notFound(
        ErrorCode.FIREBASE_USER_NOT_FOUND,
        `Firebase user not found for update: ${error.message}`
      );
    }
    
    if (error.code === 'auth/permission-denied') {
      throw AppException.forbidden(
        ErrorCode.FIREBASE_PERMISSION_DENIED,
        `Permission denied to update Firebase user: ${error.message}`
      );
    }
    
    // Generic user update error
    throw AppException.internal(
      ErrorCode.FIREBASE_OPERATION_FAILED,
      `Failed to update Firebase user ${uid}: ${error.message}`
    );
  }
}
```

### Testing

```bash
# Run Firebase module tests
npm run test firebase

# Run specific test file
npm run test firebase.service.spec.ts

# Run e2e tests
npm run test:e2e firebase
```

## 📚 Useful Links

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firebase Auth Error Codes](https://firebase.google.com/docs/auth/admin/errors)
- [Firebase Admin Auth](https://firebase.google.com/docs/auth/admin/manage-users)
- [Firebase Custom Tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens)

---

**Important:** 
- Ensure all Firebase environment variables are properly configured
- Firebase service account credentials must have appropriate permissions
- The service automatically handles Firebase initialization and error classification
- All errors include original Firebase error details for debugging
