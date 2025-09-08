# 📧 Email Module

Email functionality for sending various types of emails in the KPT application.

## 📁 Structure

```
src/email/
├── email.service.ts            # Main email service
├── email.module.ts             # Module configuration
├── email.config.ts             # Email configuration and subjects
├── template.service.ts         # HTML template rendering with dynamic discovery
├── templates/                  # Email HTML templates
│   ├── email-verification.html
│   ├── password-reset.html
│   └── email-change-confirmation.html
└── README.md                   # Module documentation
```

## 🚀 Features

### Email Types
- **Email Verification**: Confirm user email addresses
- **Password Reset**: Secure password recovery
- **Email Change Confirmation**: Confirm email address changes

### Template System
- **HTML Templates**: Professional email layouts
- **Dynamic Content**: Variable substitution in templates
- **Responsive Design**: Mobile-friendly email templates
- **Dynamic Discovery**: Automatically detects available templates

### Error Handling
- **Unified Error Codes**: Uses centralized error code system
- **Structured Exceptions**: Custom `AppException` with error codes
- **Detailed Error Messages**: Specific error descriptions for debugging
- **Graceful Fallbacks**: Proper error handling for missing configurations

### Configuration
- **Environment Variables**: Configurable frontend URLs
- **App Customization**: Customizable app name and branding
- **Centralized Settings**: All email settings in one place
- **Validation**: Checks for required configuration before sending

## 🔧 Configuration

### Environment Variables

```env
# Required
FRONTEND_URL=https://your-app.com

# Optional
APP_NAME=KPT App
```

### Email Configuration

```typescript
import { emailServiceConfig, EmailSubject } from './email.config';

// Configuration object
emailServiceConfig.frontendUrl    // Frontend URL from environment
emailServiceConfig.appName        // App name (default: 'KPT App')

// Email subjects enum
EmailSubject.VERIFICATION                    // "Email Verification - KPT App"
EmailSubject.PASSWORD_RESET                  // "Password Reset - KPT App"
EmailSubject.EMAIL_CHANGE_CONFIRMATION      // "Email Change Confirmation - KPT App"
```

## 📤 Email Subjects

### EmailSubject Enum

```typescript
export enum EmailSubject {
  VERIFICATION = 'Email Verification - KPT App',
  PASSWORD_RESET = 'Password Reset - KPT App',
  EMAIL_CHANGE_CONFIRMATION = 'Email Change Confirmation - KPT App',
}
```

### Usage Examples

```typescript
// In email service
await this.mailerService.sendMail({
  to: email,
  subject: EmailSubject.VERIFICATION,
  html: htmlContent,
});

// Direct usage
const subject = EmailSubject.PASSWORD_RESET;
```

## 🔧 API Methods

### sendVerificationEmail(email, token)
Sends email verification link.

**Parameters:**
- `email`: User's email address
- `token`: Verification token

**Template Variables:**
- `verificationUrl`: Complete verification URL
- `email`: User's email address

**Error Handling:**
- `EMAIL_FRONTEND_URL_NOT_SET`: If frontend URL is not configured
- `EMAIL_SEND_FAILED`: If email sending fails

### sendPasswordResetEmail(email, token)
Sends password reset link.

**Parameters:**
- `email`: User's email address
- `token`: Password reset token

**Template Variables:**
- `resetUrl`: Complete password reset URL
- `email`: User's email address

**Error Handling:**
- `EMAIL_FRONTEND_URL_NOT_SET`: If frontend URL is not configured
- `EMAIL_SEND_FAILED`: If email sending fails

### sendEmailChangeConfirmation(email, token)
Sends email change confirmation.

**Parameters:**
- `email`: New email address
- `token`: Confirmation token

**Template Variables:**
- `confirmUrl`: Complete confirmation URL
- `email`: New email address

**Error Handling:**
- `EMAIL_FRONTEND_URL_NOT_SET`: If frontend URL is not configured
- `EMAIL_SEND_FAILED`: If email sending fails

## 🏗️ Architecture

### Core Components

#### EmailService
- **Email Sending**: Handles all email operations
- **Configuration Validation**: Checks required settings before sending
- **Error Handling**: Uses unified error code system
- **Template Integration**: Uses TemplateService for HTML rendering

#### TemplateService
- **HTML Rendering**: Renders HTML templates with variables
- **Dynamic Discovery**: Automatically finds available templates
- **Variable Substitution**: Replaces placeholders with actual values
- **Error Handling**: Structured error handling with error codes

#### Email Configuration
- **Environment Variables**: Loads configuration from environment
- **Default Values**: Provides sensible defaults
- **Type Safety**: TypeScript interfaces for configuration

### Dependencies
- **@nestjs-modules/mailer**: Email sending functionality
- **Template Engine**: HTML template rendering
- **Configuration**: Environment-based settings
- **Error System**: Unified error codes and exceptions

## 🔐 Security Features

### Token-based Links
- **Secure URLs**: All email links include secure tokens
- **Expiration**: Tokens have configurable expiration times
- **Single Use**: Tokens are invalidated after use

### Email Validation
- **Input Sanitization**: Email addresses are validated
- **Template Security**: HTML templates are safely rendered
- **Rate Limiting**: Email sending is rate-limited

### Configuration Security
- **Required Settings**: Validates essential configuration
- **Environment Variables**: Secure configuration management
- **Error Handling**: Prevents information leakage in errors

## 📊 Error Handling

### Error Code System
The email module uses the unified error code system with codes in the range **6000-6999**.

#### Template Management Errors (6000-6099)
- `6001`: Template not found
- `6002`: Template loading failed
- `6003`: Template rendering failed
- `6004`: Invalid template format
- `6005`: Variable substitution failed
- `6006`: Directory access failed

#### Email Sending Errors (6100-6199)
- `6101`: Email sending failed
- `6102`: Invalid recipient
- `6103`: Invalid sender
- `6104`: Attachment too large
- `6105`: Rate limit exceeded
- `6106`: Service unavailable
- `6107`: Quota exceeded

#### Configuration Errors (6200-6299)
- `6201`: Configuration missing
- `6202`: Frontend URL not set
- `6203`: SMTP configuration invalid
- `6204`: Template directory not found
- `6205`: Mailer service unavailable

#### Validation Errors (6300-6399)
- `6301`: Invalid email format
- `6302`: Email too long
- `6303`: Subject too long
- `6304`: Content too large
- `6305`: Suspicious content

### Exception Handling
```typescript
import { AppException } from '../common/exceptions/app.exception';
import { ErrorCode } from '../common/error-codes';

// Service unavailable error
throw AppException.serviceUnavailable(
  ErrorCode.EMAIL_FRONTEND_URL_NOT_SET,
  'Frontend URL is not configured'
);

// Internal server error
throw AppException.internal(
  ErrorCode.EMAIL_SEND_FAILED,
  `Failed to send email: ${error.message}`
);
```

## 📊 Monitoring & Logging

### Email Tracking
- **Send Status**: Track email delivery status
- **Error Logging**: Log email sending failures with error codes
- **Performance Metrics**: Monitor email sending performance

### Template Analytics
- **Dynamic Discovery**: Automatically detect new templates
- **Template Performance**: Compare template effectiveness
- **Error Tracking**: Monitor template-related errors

## 🛠️ Development

### Adding New Email Types

1. **Add Subject**: Add new subject to `EmailSubject` enum
2. **Create Template**: Add HTML template file to `templates/` directory
3. **Add Method**: Implement email sending method in `EmailService`
4. **Update Tests**: Add unit and integration tests

### Example: Adding Welcome Email

```typescript
// 1. Add to EmailSubject enum
WELCOME = 'Welcome to KPT App',

// 2. Add method to EmailService
async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  if (!emailServiceConfig.frontendUrl) {
    throw AppException.serviceUnavailable(
      ErrorCode.EMAIL_FRONTEND_URL_NOT_SET,
      'Frontend URL is not configured'
    );
  }

  const htmlContent = await this.templateService.renderTemplate('welcome', {
    firstName,
    email,
  });
  
  try {
    await this.mailerService.sendMail({
      to: email,
      subject: EmailSubject.WELCOME,
      html: htmlContent,
    });
  } catch (error) {
    throw AppException.internal(
      ErrorCode.EMAIL_SEND_FAILED,
      `Failed to send welcome email: ${error.message}`
    );
  }
}
```

### Dynamic Template Discovery

The `getAvailableTemplates()` method automatically discovers templates:

```typescript
// Automatically finds all .html files in templates directory
const templates = this.templateService.getAvailableTemplates();
// Returns: ['email-verification', 'password-reset', 'email-change-confirmation']

// No need to manually maintain template list
// Just add new .html files to templates/ directory
```

### Testing

```bash
# Run email module tests
npm run test email

# Run specific test file
npm run test email.service.spec.ts

# Run e2e tests
npm run test:e2e email
```

## 📚 Useful Links

- [NestJS Mailer](https://github.com/nest-modules/mailer)
- [Email Template Best Practices](https://www.emailonacid.com/blog/article/email-development/email-coding-best-practices/)
- [HTML Email Templates](https://www.campaignmonitor.com/dev-resources/guides/coding-html-emails/)

---

**Important:** 
- Ensure `FRONTEND_URL` environment variable is set before starting the application
- Email functionality will not work without this configuration
- The system will throw `EMAIL_FRONTEND_URL_NOT_SET` error if configuration is missing
- Templates are automatically discovered from the `templates/` directory
