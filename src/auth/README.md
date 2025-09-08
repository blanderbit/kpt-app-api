# 🔐 Auth Module

Authentication and authorization module for the KPT application.

## 📁 Structure

```
src/auth/
├── auth.controller.ts         # Authentication endpoints
├── auth.service.ts            # Authentication business logic
├── auth.module.ts             # Module configuration
├── redis-blacklist.service.ts # JWT token blacklisting
├── guards/                    # Authentication guards
│   ├── jwt-auth.guard.ts     # JWT authentication guard
│   └── blacklist.guard.ts    # Token blacklist guard
├── strategies/                # Passport strategies
│   └── jwt.strategy.ts       # JWT strategy
├── dto/                      # Data Transfer Objects
│   ├── login.dto.ts          # Login request
│   ├── register.dto.ts       # Registration request
│   ├── forgot-password.dto.ts # Forgot password request
│   ├── reset-password.dto.ts # Reset password request
│   └── firebase-auth.dto.ts  # Firebase authentication
└── README.md                  # Module documentation
```

## 🚀 Features

### Authentication Methods
- **Email/Password**: Traditional email and password authentication
- **Firebase**: Firebase ID token authentication
- **JWT**: JSON Web Token-based sessions

### Security Features
- **Password Hashing**: bcrypt with 10 rounds
- **Token Blacklisting**: Redis-based JWT token revocation
- **Role-based Access Control**: User role management
- **Email Verification**: Email confirmation for new accounts
- **Password Reset**: Secure password recovery system

### Session Management
- **JWT Tokens**: Stateless authentication
- **Token Expiration**: Configurable token lifetime
- **Refresh Tokens**: Token renewal mechanism
- **Force Logout**: Ability to revoke all user sessions

## 🔧 API Endpoints

### Authentication

#### POST `/auth/login`
User login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["user"]
  }
}
```

#### POST `/auth/register`
User registration.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### POST `/auth/firebase`
Firebase authentication.

**Request:**
```json
{
  "idToken": "firebase-id-token-here"
}
```

#### POST `/auth/forgot-password`
Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

#### POST `/auth/reset-password`
Reset password with token.

**Request:**
```json
{
  "token": "reset-token-here",
  "newPassword": "newpassword123"
}
```

#### POST `/auth/logout`
User logout (blacklist current token).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

## 🚨 Error Code System

### Overview

The Auth Module uses the unified error code system from `src/common/error-codes.ts`. This system provides structured error responses with standardized codes across all modules.

### Error Code Structure

| Range | Category | Description |
|-------|----------|-------------|
| 2000-2099 | Authentication & Authorization | Login, permissions, sessions |
| 2100-2199 | User Registration & Login | Registration, login issues |
| 2200-2299 | Password Management | Password operations, reset |
| 2300-2399 | Token Management | JWT, refresh tokens |
| 2400-2499 | Firebase Integration | Firebase authentication |
| 2500-2599 | Security & Validation | Security checks, validation |
| 2600-2699 | Redis & Blacklist | Token blacklisting operations |

### Auth Error Codes Used

```typescript
// Authentication & Authorization
AUTH_INVALID_CREDENTIALS = '2001'           // Invalid email or password
AUTH_USER_NOT_FOUND = '2002'                // User not found
AUTH_ACCOUNT_DISABLED = '2003'              // Account disabled
AUTH_ACCOUNT_LOCKED = '2004'                // Account locked
AUTH_INSUFFICIENT_PERMISSIONS = '2005'      // Insufficient permissions
AUTH_SESSION_EXPIRED = '2006'               // Session expired
AUTH_INVALID_SESSION = '2007'               // Invalid session

// User Registration & Login
AUTH_USER_ALREADY_EXISTS = '2101'           // User already exists
AUTH_INVALID_EMAIL_FORMAT = '2102'          // Invalid email format
AUTH_INVALID_PASSWORD_FORMAT = '2103'       // Invalid password format
AUTH_EMAIL_ALREADY_VERIFIED = '2104'        // Email already verified
AUTH_REGISTRATION_DISABLED = '2105'         // Registration disabled
AUTH_LOGIN_DISABLED = '2106'                // Login disabled

// Password Management
AUTH_PASSWORD_TOO_WEAK = '2201'             // Password too weak
AUTH_PASSWORD_MISMATCH = '2202'             // Password mismatch
AUTH_PASSWORD_RESET_EXPIRED = '2203'        // Password reset expired
AUTH_PASSWORD_RESET_INVALID = '2204'        // Password reset invalid
AUTH_PASSWORD_CHANGE_FAILED = '2205'        // Password change failed
AUTH_OLD_PASSWORD_INCORRECT = '2206'        // Old password incorrect

// Token Management
AUTH_TOKEN_NOT_FOUND = '2301'               // Token not found
AUTH_TOKEN_EXPIRED = '2302'                 // Token expired
AUTH_TOKEN_INVALID = '2303'                 // Token invalid
AUTH_TOKEN_REVOKED = '2304'                 // Token revoked
AUTH_TOKEN_MALFORMED = '2305'               // Token malformed
AUTH_TOKEN_TYPE_INVALID = '2306'            // Token type invalid
AUTH_REFRESH_TOKEN_INVALID = '2307'         // Refresh token invalid
AUTH_REFRESH_TOKEN_EXPIRED = '2308'         // Refresh token expired

// Firebase Integration
AUTH_FIREBASE_TOKEN_INVALID = '2401'        // Firebase token invalid
AUTH_FIREBASE_TOKEN_EXPIRED = '2402'        // Firebase token expired
AUTH_FIREBASE_USER_NOT_FOUND = '2403'       // Firebase user not found
AUTH_FIREBASE_AUTH_FAILED = '2404'          // Firebase auth failed
AUTH_FIREBASE_CONNECTION_FAILED = '2405'    // Firebase connection failed
AUTH_FIREBASE_PERMISSION_DENIED = '2406'    // Firebase permission denied

// Security & Validation
AUTH_TOO_MANY_LOGIN_ATTEMPTS = '2501'       // Too many login attempts
AUTH_SUSPICIOUS_ACTIVITY = '2502'            // Suspicious activity
AUTH_IP_BLOCKED = '2503'                    // IP blocked
AUTH_DEVICE_NOT_TRUSTED = '2504'            // Device not trusted
AUTH_LOCATION_RESTRICTED = '2505'            // Location restricted
AUTH_TIME_RESTRICTED = '2506'                // Time restricted

// Redis & Blacklist
AUTH_REDIS_CONNECTION_FAILED = '2601'       // Redis connection failed
AUTH_BLACKLIST_CHECK_FAILED = '2602'        // Blacklist check failed
AUTH_TOKEN_ADD_TO_BLACKLIST_FAILED = '2603' // Token add to blacklist failed
AUTH_TOKEN_REMOVE_FROM_BLACKLIST_FAILED = '2604' // Token remove from blacklist failed
AUTH_BLACKLIST_CLEANUP_FAILED = '2605'      // Blacklist cleanup failed

// Email Verification
AUTH_EMAIL_VERIFICATION_FAILED = '2701'     // Email verification failed
AUTH_EMAIL_VERIFICATION_EXPIRED = '2702'    // Email verification expired
AUTH_EMAIL_VERIFICATION_INVALID = '2703'    // Email verification invalid
AUTH_EMAIL_SEND_FAILED = '2704'             // Email send failed
AUTH_EMAIL_TEMPLATE_NOT_FOUND = '2705'      // Email template not found

// Rate Limiting
AUTH_RATE_LIMIT_EXCEEDED = '2801'           // Rate limit exceeded
AUTH_TOO_MANY_REQUESTS = '2802'             // Too many requests
AUTH_REQUEST_THROTTLED = '2803'             // Request throttled
AUTH_COOLDOWN_PERIOD = '2804'               // Cooldown period

// Generic Auth Errors
AUTH_AUTHENTICATION_FAILED = '2901'         // Authentication failed
AUTH_AUTHORIZATION_FAILED = '2902'           // Authorization failed
AUTH_VALIDATION_FAILED = '2903'             // Validation failed
AUTH_INTERNAL_AUTH_ERROR = '2904'           // Internal auth error
AUTH_EXTERNAL_SERVICE_UNAVAILABLE = '2905'  // External service unavailable
AUTH_UNKNOWN_AUTH_ERROR = '2999'            // Unknown auth error
```

### Error Handling

The module uses standardized error handling with error codes:

```typescript
// Example error throwing
throw new Error(`Error ${ErrorCode.AUTH_INVALID_CREDENTIALS}: Invalid email or password provided`);

// Example error output
// Error 2001: Invalid email or password provided
```

## 🏗️ Architecture

### Core Components

#### AuthService
- Handles user authentication logic
- Manages JWT token generation
- Integrates with Firebase authentication
- Handles password operations

#### RedisBlacklistService
- Manages JWT token blacklisting
- Uses Redis for token storage
- Provides cleanup mechanisms
- Supports force logout functionality

#### Guards
- **JwtAuthGuard**: Validates JWT tokens
- **BlacklistGuard**: Checks token blacklist status

#### Strategies
- **JwtStrategy**: Passport JWT authentication strategy

### Dependencies
- **@nestjs/jwt**: JWT token handling
- **@nestjs/passport**: Authentication framework
- **@nestjs/bull**: Queue management for Redis
- **bcrypt**: Password hashing
- **passport-jwt**: JWT strategy implementation

## 🔐 Security Features

### Password Security
- **Hashing**: bcrypt with 10 salt rounds
- **Validation**: Minimum length and complexity requirements
- **Reset**: Secure token-based password reset

### Token Security
- **JWT**: Secure token format
- **Expiration**: Configurable token lifetime
- **Blacklisting**: Token revocation capability
- **Refresh**: Automatic token renewal

### Access Control
- **Roles**: User role management
- **Permissions**: Granular access control
- **Session Management**: Secure session handling

## 📊 Monitoring & Logging

### Logging
- **Authentication Events**: Login, logout, registration
- **Security Events**: Failed attempts, suspicious activity
- **Error Tracking**: Detailed error logging with codes

### Metrics
- **Login Attempts**: Success/failure rates
- **Token Operations**: Blacklist operations
- **Performance**: Response times, error rates

## 🛠️ Development

### Adding New Authentication Methods

1. Create new DTO for the authentication method
2. Add method to AuthService
3. Create corresponding endpoint in AuthController
4. Add error codes to common error codes file
5. Update documentation

### Testing

```bash
# Test authentication endpoints
npm run test:e2e auth

# Test specific functionality
npm run test auth.service.spec.ts
```

## 📚 Useful Links

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport.js](http://www.passportjs.org/)
- [JWT.io](https://jwt.io/)
- [bcrypt](https://github.com/dcodeIO/bcrypt.js)

---

**Important:** Ensure Redis is running for token blacklisting functionality.
