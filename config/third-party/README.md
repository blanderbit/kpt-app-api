# 🔧 Third-Party Service Configurations

This directory contains configuration examples for various third-party services used in the application.

## 🚀 Quick Links

- [🔥 Firebase Setup](./FIREBASE_SETUP.md) - Detailed Firebase setup guide
- [🌐 Google Drive Setup](./GOOGLE_DRIVE_SETUP.md) - Detailed Google Drive setup guide

## 📁 Structure

```
config/third-party/
├── README.md                    # Configuration documentation
├── FIREBASE_SETUP.md           # Detailed Firebase setup guide
├── GOOGLE_DRIVE_SETUP.md       # Detailed Google Drive setup guide
├── google-drive.example.json    # Google Drive configuration example
├── firebase.example.json        # Firebase configuration example
├── sendgrid.example.json        # SendGrid configuration example
├── redis.example.json           # Redis configuration example
└── openai.example.json          # OpenAI configuration example
```

## ⚠️ Important

**All files in this directory are examples and do NOT contain real keys!**

- **Examples** - files with `.example.json` extension
- **Real configurations** - should be created based on examples
- **Security** - real files should NOT be committed to Git

## 🔐 Setup

### 1. Copy Examples

```bash
# For Google Drive
cp config/third-party/google-drive.example.json config/third-party/google-drive.json

# For Firebase
cp config/third-party/firebase.example.json config/third-party/firebase.json

# For SendGrid
cp config/third-party/sendgrid.example.json config/third-party/sendgrid.json

# For Redis
cp config/third-party/redis.example.json config/third-party/redis.json

# For OpenAI
cp config/third-party/openai.example.json config/third-party/openai.json
```

### 2. Fill with Real Data

Edit the copied files, replacing placeholder values with real keys and settings.

### 3. Add to .gitignore

Make sure the following lines are added to `.gitignore`:

```gitignore
# Third-party service configurations
config/third-party/*.json
!config/third-party/*.example.json
```

## 🌐 Google Drive

### Setup

📖 **Detailed Guide**: [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md)

**Quick Start**:
1. Enable Google Drive API in Google Cloud Console
2. Create Service Account with Editor permissions
3. Download JSON key
4. Copy content to `google-drive.json`

### Usage

```typescript
// Application automatically loads configuration from file
import { googleDriveConfig } from './config/google.config';
```

## 🔥 Firebase

### Setup

📖 **Detailed Guide**: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

**Quick Start**:
1. Go to Firebase Console
2. Project Settings → Service accounts → Generate new private key
3. Download JSON file
4. Copy content to `firebase.json`

### Usage

```typescript
// Application automatically loads configuration from file
import { firebaseConfig } from './config/firebase.config';
```

## 📧 SendGrid

### Setup

1. Create SendGrid account
2. Generate API key
3. Create email templates
4. Fill configuration in `sendgrid.json`

### Usage

```typescript
// In .env file
SENDGRID_CONFIG_FILE=./config/third-party/sendgrid.json
```

## 🗄️ Redis

### Setup

1. Install Redis server
2. Configure password and other parameters
3. Fill configuration in `redis.json`

### Usage

```typescript
// In .env file
REDIS_CONFIG_FILE=./config/third-party/redis.json
```

## 🤖 OpenAI

### Setup

1. Create OpenAI account
2. Generate API key
3. Configure model parameters
4. Fill configuration in `openai.json`

### Usage

```typescript
// In .env file
OPENAI_CONFIG_FILE=./config/third-party/openai.json
```

## 🔒 Security

### Recommendations

1. **Never commit** real keys to Git
2. **Use environment variables** for sensitive data
3. **Regularly rotate** API keys
4. **Limit permissions** for Service Accounts
5. **Monitor API usage**

### Environment Variables

For additional security, use environment variables:

```env
# Google Drive - automatically loaded from config/third-party/google-drive.json
# No environment variables required

# Firebase - automatically loaded from config/third-party/firebase.json
# No environment variables required

# SendGrid
SENDGRID_CONFIG_FILE=./config/third-party/sendgrid.json

# Redis
REDIS_CONFIG_FILE=./config/third-party/redis.json

# OpenAI
OPENAI_CONFIG_FILE=./config/third-party/openai.json
```

## 🧪 Testing

### Configuration Verification

After setup, verify connections:

```bash
# Google Drive
curl -X GET "http://localhost:3000/admin/languages/google-drive/test-connection"

# Firebase - automatically validated on application startup
# If firebase.json is missing or invalid, application won't start

# Redis (if endpoint exists)
curl -X GET "http://localhost:3000/api/redis/test"
```

## 📚 Additional Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [Firebase Console](https://console.firebase.google.com/)
- [SendGrid Dashboard](https://app.sendgrid.com/)
- [Redis Documentation](https://redis.io/documentation)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

**Happy configuring! 🎉**
