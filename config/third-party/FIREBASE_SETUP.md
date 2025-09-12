# 🔥 Firebase Setup Guide

## Download the Service Account File

1. **Go to Firebase Console**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Select your project

2. **Navigate to Service Accounts**
   - Go to: **Project Settings** → **Service accounts** → **Firebase Admin SDK**
   - Click **Generate new private key**

3. **Download the Key**
   - A `.json` file will download – that's your `service_account.json`

## Setup Configuration

1. **Create Configuration File**
   ```bash
   cp config/third-party/firebase.example.json config/third-party/firebase.json
   ```

2. **Replace Content**
   - Open the downloaded JSON file
   - Copy all content
   - Replace the example content in `firebase.json`

## File Structure

The `firebase.json` file should contain:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/...",
  "universe_domain": "googleapis.com"
}
```

## Usage

```typescript
// Application automatically loads configuration from file
// No additional .env variables required
import { firebaseConfig } from './config/firebase.config';
```

## Troubleshooting

- **File not found**: Ensure `firebase.json` exists in `config/third-party/`
- **Invalid JSON**: Check that the downloaded file is valid JSON
- **Missing fields**: Verify all required fields are present
- **Permissions**: Ensure the service account has necessary Firebase permissions

## Security Notes

- Never commit `firebase.json` to version control
- Keep the private key secure
- Regularly rotate service account keys
- Use least privilege principle for service account roles
