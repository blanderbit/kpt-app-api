# 📧 Email Templates Documentation

## Overview

The Email Templates system provides a comprehensive framework for sending transactional emails in the KPT Application. It includes HTML templates, dynamic content generation, and integration with email service providers like SendGrid.

## 🏗️ Architecture

### Core Components

- **EmailService** - Main service for sending emails
- **TemplateService** - Template rendering and management
- **EmailModule** - Module configuration and dependencies
- **HTML Templates** - Responsive email templates
- **SendGrid Integration** - Email delivery service

### Email Features

- **Responsive Design** - Mobile-friendly email layouts
- **Dynamic Content** - Personalized email content
- **Template Management** - Centralized template system
- **Email Tracking** - Delivery and open rate monitoring
- **Multi-language Support** - Internationalization support

## 🔧 Installation and Configuration

### 1. Install Dependencies

```bash
npm install @nestjs-modules/mailer
npm install handlebars
npm install nodemailer
npm install @sendgrid/mail
```

### 2. Module Configuration

```typescript
// email.module.ts
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { EmailService } from './email.service';
import { TemplateService } from './template.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      defaults: {
        from: `"KPT App" <${process.env.SMTP_FROM}>`,
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [EmailService, TemplateService],
  exports: [EmailService],
})
export class EmailModule {}
```

### 3. SendGrid Configuration

```typescript
// sendgrid.config.ts
import { ConfigService } from '@nestjs/config';

export const sendgridConfig = {
  apiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@kpt-app.com',
  fromName: process.env.SENDGRID_FROM_NAME || 'KPT App',
  templates: {
    emailVerification: process.env.SENDGRID_EMAIL_VERIFICATION_TEMPLATE_ID,
    passwordReset: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID,
    emailChange: process.env.SENDGRID_EMAIL_CHANGE_TEMPLATE_ID,
  },
};
```

## 📧 Email Templates

### 1. Email Verification Template

#### HTML Structure

```html
<!-- templates/email-verification.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - KPT App</title>
    <style>
        /* Responsive CSS styles */
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .button {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #6c757d;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .container {
                padding: 10px;
            }
            .header, .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to KPT App!</h1>
            <p>Please verify your email address to get started</p>
        </div>
        
        <div class="content">
            <h2>Hello {{firstName}}!</h2>
            <p>Thank you for registering with KPT App. To complete your registration, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
                <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">{{verificationUrl}}</p>
            
            <p><strong>Important:</strong> This verification link will expire in 24 hours.</p>
            
            <p>If you didn't create an account with KPT App, you can safely ignore this email.</p>
        </div>
        
        <div class="footer">
            <p>© 2024 KPT App. All rights reserved.</p>
            <p>This email was sent to {{email}}. If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>
```

#### Template Variables

```typescript
interface EmailVerificationData {
  firstName: string;
  email: string;
  verificationUrl: string;
  expiryHours: number;
}
```

### 2. Password Reset Template

#### HTML Structure

```html
<!-- templates/password-reset.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - KPT App</title>
    <style>
        /* Responsive CSS styles */
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
        }
        .header {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .button {
            display: inline-block;
            background: #dc3545;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #6c757d;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>We received a request to reset your password</p>
        </div>
        
        <div class="content">
            <h2>Hello {{firstName}}!</h2>
            <p>We received a request to reset your password for your KPT App account. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
                <a href="{{resetUrl}}" class="button">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #dc3545;">{{resetUrl}}</p>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                    <li>This link will expire in 1 hour</li>
                    <li>If you didn't request this password reset, please ignore this email</li>
                    <li>Your current password will remain unchanged</li>
                </ul>
            </div>
            
            <p>For security reasons, this link can only be used once. If you need to reset your password again, please request a new reset link.</p>
        </div>
        
        <div class="footer">
            <p>© 2024 KPT App. All rights reserved.</p>
            <p>This email was sent to {{email}}. If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>
```

#### Template Variables

```typescript
interface PasswordResetData {
  firstName: string;
  email: string;
  resetUrl: string;
  expiryHours: number;
}
```

### 3. Email Change Confirmation Template

#### HTML Structure

```html
<!-- templates/email-change-confirmation.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Email Change - KPT App</title>
    <style>
        /* Responsive CSS styles */
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
        }
        .header {
            background: linear-gradient(135deg, #20bf6b 0%, #0fb9b1 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .button {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .info-box {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #6c757d;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Confirm Email Change</h1>
            <p>Please confirm your new email address</p>
        </div>
        
        <div class="content">
            <h2>Hello {{firstName}}!</h2>
            <p>You recently requested to change your email address from <strong>{{oldEmail}}</strong> to <strong>{{newEmail}}</strong>.</p>
            
            <p>To confirm this change, please click the button below:</p>
            
            <div style="text-align: center;">
                <a href="{{confirmationUrl}}" class="button">Confirm Email Change</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #28a745;">{{confirmationUrl}}</p>
            
            <div class="info-box">
                <strong>ℹ️ What happens next:</strong>
                <ul>
                    <li>Your email address will be updated to {{newEmail}}</li>
                    <li>You'll need to use the new email for future logins</li>
                    <li>This confirmation link expires in 24 hours</li>
                </ul>
            </div>
            
            <p>If you didn't request this change, please contact our support team immediately.</p>
        </div>
        
        <div class="footer">
            <p>© 2024 KPT App. All rights reserved.</p>
            <p>This email was sent to {{newEmail}}. If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>
```

#### Template Variables

```typescript
interface EmailChangeData {
  firstName: string;
  oldEmail: string;
  newEmail: string;
  confirmationUrl: string;
  expiryHours: number;
}
```

## 🔧 Service Implementation

### EmailService

```typescript
// email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EmailVerificationData, PasswordResetData, EmailChangeData } from './interfaces';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmailVerification(data: EmailVerificationData): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Verify Your Email - KPT App',
        template: 'email-verification',
        context: {
          ...data,
          verificationUrl: this.buildVerificationUrl(data.verificationUrl),
        },
      });

      this.logger.log(`Email verification sent to ${data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send email verification to ${data.email}:`, error);
      throw error;
    }
  }

  async sendPasswordReset(data: PasswordResetData): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Reset Your Password - KPT App',
        template: 'password-reset',
        context: {
          ...data,
          resetUrl: this.buildResetUrl(data.resetUrl),
        },
      });

      this.logger.log(`Password reset email sent to ${data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${data.email}:`, error);
      throw error;
    }
  }

  async sendEmailChangeConfirmation(data: EmailChangeData): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: data.newEmail,
        subject: 'Confirm Email Change - KPT App',
        template: 'email-change-confirmation',
        context: {
          ...data,
          confirmationUrl: this.buildConfirmationUrl(data.confirmationUrl),
        },
      });

      this.logger.log(`Email change confirmation sent to ${data.newEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send email change confirmation to ${data.newEmail}:`, error);
      throw error;
    }
  }

  private buildVerificationUrl(token: string): string {
    const baseUrl = this.configService.get('APP_URL');
    return `${baseUrl}/auth/verify-email?token=${token}`;
  }

  private buildResetUrl(token: string): string {
    const baseUrl = this.configService.get('APP_URL');
    return `${baseUrl}/auth/reset-password?token=${token}`;
  }

  private buildConfirmationUrl(token: string): string {
    const baseUrl = this.configService.get('APP_URL');
    return `${baseUrl}/profile/confirm-email-change?token=${token}`;
  }
}
```

### TemplateService

```typescript
// template.service.ts
import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { compile } from 'handlebars';

@Injectable()
export class TemplateService {
  private readonly templatesPath = join(__dirname, 'templates');

  async renderTemplate(templateName: string, data: any): Promise<string> {
    const templatePath = join(this.templatesPath, `${templateName}.html`);
    const templateContent = readFileSync(templatePath, 'utf-8');
    
    const template = compile(templateContent);
    return template(data);
  }

  async renderEmailVerification(data: EmailVerificationData): Promise<string> {
    return this.renderTemplate('email-verification', data);
  }

  async renderPasswordReset(data: PasswordResetData): Promise<string> {
    return this.renderTemplate('password-reset', data);
  }

  async renderEmailChange(data: EmailChangeData): Promise<string> {
    return this.renderTemplate('email-change-confirmation', data);
  }
}
```

## 📱 Responsive Design

### CSS Media Queries

```css
/* Mobile-first responsive design */
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

/* Tablet and desktop */
@media (min-width: 768px) {
  .container {
    padding: 30px;
  }
  
  .header, .content {
    padding: 40px;
  }
}

/* Large desktop */
@media (min-width: 1200px) {
  .container {
    max-width: 700px;
  }
}

/* Mobile optimization */
@media (max-width: 600px) {
  .container {
    padding: 10px;
  }
  
  .header, .content {
    padding: 20px;
  }
  
  .button {
    display: block;
    width: 100%;
    text-align: center;
    margin: 15px 0;
  }
  
  h1 {
    font-size: 24px;
  }
  
  h2 {
    font-size: 20px;
  }
}
```

### Email Client Compatibility

```css
/* Outlook compatibility */
.Outlook {
  background-color: #f8f9fa;
}

/* Gmail compatibility */
.gmail {
  background-color: #f8f9fa;
}

/* Apple Mail compatibility */
.apple-mail {
  background-color: #f8f9fa;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .container {
    background-color: #1a1a1a;
    color: #ffffff;
  }
  
  .content {
    background-color: #2d2d2d;
  }
}
```

## 🚀 Usage Examples

### Sending Email Verification

```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  constructor(private readonly emailService: EmailService) {}

  async register(registerDto: RegisterDto): Promise<void> {
    // Create user
    const user = await this.createUser(registerDto);
    
    // Generate verification token
    const verificationToken = this.generateVerificationToken();
    
    // Send verification email
    await this.emailService.sendEmailVerification({
      firstName: user.firstName,
      email: user.email,
      verificationUrl: verificationToken,
      expiryHours: 24,
    });
  }
}
```

### Sending Password Reset

```typescript
// auth.service.ts
async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
  const user = await this.findUserByEmail(forgotPasswordDto.email);
  
  if (user) {
    const resetToken = this.generateResetToken();
    
    await this.emailService.sendPasswordReset({
      firstName: user.firstName,
      email: user.email,
      resetUrl: resetToken,
      expiryHours: 1,
    });
  }
}
```

### Sending Email Change Confirmation

```typescript
// profile.service.ts
async changeEmail(userId: number, newEmail: string): Promise<void> {
  const user = await this.findUserById(userId);
  const confirmationToken = this.generateConfirmationToken();
  
  await this.emailService.sendEmailChangeConfirmation({
    firstName: user.firstName,
    oldEmail: user.email,
    newEmail: newEmail,
    confirmationUrl: confirmationToken,
    expiryHours: 24,
  });
}
```

## 📊 Email Tracking

### SendGrid Analytics

```typescript
// email-tracking.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailTrackingService {
  constructor(private readonly configService: ConfigService) {}

  async trackEmailOpen(emailId: string, userId: number): Promise<void> {
    // Track email open event
    await this.analyticsService.track('email_opened', {
      emailId,
      userId,
      timestamp: new Date(),
    });
  }

  async trackEmailClick(emailId: string, userId: number, link: string): Promise<void> {
    // Track email link click
    await this.analyticsService.track('email_link_clicked', {
      emailId,
      userId,
      link,
      timestamp: new Date(),
    });
  }

  async getEmailStats(userId: number): Promise<EmailStats> {
    // Get email statistics for user
    return this.analyticsService.getEmailStats(userId);
  }
}
```

### Email Metrics

```typescript
interface EmailStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  lastSent: Date;
  lastOpened: Date;
}
```

## 🔒 Security Considerations

### Email Security

```typescript
// email-security.service.ts
@Injectable()
export class EmailSecurityService {
  async validateEmailAddress(email: string): Promise<boolean> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Check for disposable email domains
    const domain = email.split('@')[1];
    const isDisposable = await this.checkDisposableDomain(domain);
    
    return !isDisposable;
  }

  async rateLimitEmailSending(email: string): Promise<boolean> {
    // Implement rate limiting for email sending
    const key = `email_rate_limit:${email}`;
    const currentCount = await this.redisService.get(key);
    
    if (currentCount && parseInt(currentCount) >= 5) {
      return false; // Rate limit exceeded
    }
    
    await this.redisService.incr(key);
    await this.redisService.expire(key, 3600); // 1 hour
    
    return true;
  }
}
```

### Content Security

```typescript
// content-sanitization.service.ts
@Injectable()
export class ContentSanitizationService {
  sanitizeHtml(html: string): string {
    // Remove potentially dangerous HTML
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  validateTemplateData(data: any): boolean {
    // Validate template data to prevent injection attacks
    const allowedFields = ['firstName', 'email', 'verificationUrl', 'resetUrl'];
    
    for (const key in data) {
      if (!allowedFields.includes(key)) {
        return false;
      }
    }
    
    return true;
  }
}
```

## 🧪 Testing

### Unit Tests

```typescript
describe('EmailService', () => {
  it('should send email verification', async () => {
    const emailData = {
      firstName: 'John',
      email: 'john@example.com',
      verificationUrl: 'token123',
      expiryHours: 24,
    };

    await service.sendEmailVerification(emailData);
    
    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'john@example.com',
      subject: 'Verify Your Email - KPT App',
      template: 'email-verification',
      context: expect.objectContaining(emailData),
    });
  });
});
```

### Integration Tests

```typescript
describe('Email Templates (e2e)', () => {
  it('should render email verification template', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201);

    // Check if email was sent
    expect(response.body.message).toContain('verification email sent');
  });
});
```

## 🔧 Configuration

### Environment Variables

```bash
# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@kpt-app.com

# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@kpt-app.com
SENDGRID_FROM_NAME=KPT App

# App Configuration
APP_URL=https://app.kpt-app.com
EMAIL_VERIFICATION_EXPIRY=24
PASSWORD_RESET_EXPIRY=1
EMAIL_CHANGE_EXPIRY=24
```

### Configuration Service

```typescript
// email.config.ts
export const emailConfig = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL,
    fromName: process.env.SENDGRID_FROM_NAME,
  },
  app: {
    url: process.env.APP_URL,
    verificationExpiry: parseInt(process.env.EMAIL_VERIFICATION_EXPIRY || '24', 10),
    resetExpiry: parseInt(process.env.PASSWORD_RESET_EXPIRY || '1', 10),
    changeExpiry: parseInt(process.env.EMAIL_CHANGE_EXPIRY || '24', 10),
  },
};
```

## 🚀 Best Practices

### 1. Template Design
- Use responsive design principles
- Test across multiple email clients
- Keep templates simple and focused
- Use inline CSS for better compatibility

### 2. Content Management
- Personalize content when possible
- Use clear call-to-action buttons
- Include fallback text for images
- Test email rendering in different clients

### 3. Security
- Validate all email addresses
- Implement rate limiting
- Sanitize HTML content
- Use secure token generation

### 4. Performance
- Optimize image sizes
- Use CDN for static assets
- Implement email queuing
- Monitor delivery rates

## 🎯 Conclusion

The Email Templates system provides a robust foundation for sending transactional emails in the KPT Application. Key benefits include:

- **Responsiveness**: Mobile-friendly email designs
- **Security**: Content validation and sanitization
- **Flexibility**: Dynamic content generation
- **Reliability**: Integration with SendGrid
- **Maintainability**: Centralized template management

Follow the best practices outlined in this guide to ensure effective email communication with users.

## 📚 Additional Resources

- [SendGrid Documentation](https://sendgrid.com/docs/)
- [Email Template Best Practices](https://www.emailonacid.com/blog/)
- [Responsive Email Design](https://www.litmus.com/blog/)
- [Email Client Compatibility](https://www.campaignmonitor.com/dev-resources/guides/coding-html-emails/)
