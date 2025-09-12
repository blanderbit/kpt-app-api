# 🌐 Google Drive Setup Guide

## Step-by-Step Configuration

### 🔹 1. Enable Google Drive API

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project (or create a new one)

2. **Navigate to APIs & Services**
   - Go to: **APIs & Services** → **Library**
   - Search for "Google Drive API"
   - Click on it and press **Enable**

### 🔹 2. Create Service Account

1. **Navigate to Service Accounts**
   - In the same project, go to: **IAM & Admin** → **Service Accounts**
   - Click **Create Service Account**

2. **Configure Service Account**
   - Enter name (e.g., `drive-service-account`)
   - Add description (optional)
   - Click **Create and Continue**

3. **Assign Roles**
   - **Minimal required**: `Editor` role
   - **More specific**: `Drive API` → `Drive File` permissions
   - Click **Continue** and **Done**

### 🔹 3. Download Key (JSON)

1. **Access Service Account**
   - Go to the created service account
   - Click on the **Keys** tab
   - Click **Add key** → **Create new key**

2. **Select Key Type**
   - Choose **JSON** format
   - Click **Create**

3. **Download File**
   - A JSON file will download automatically
   - File name: `your-project-name-xxxxx.json`

## Setup Configuration

1. **Create Configuration File**
   ```bash
   cp config/third-party/google-drive.example.json config/third-party/google-drive.json
   ```

2. **Replace Content**
   - Open the downloaded JSON file
   - Copy all content
   - Replace the example content in `google-drive.json`

## File Structure

The `google-drive.json` file should contain:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project-id.iam.gserviceaccount.com",
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
import { googleDriveConfig } from './config/google.config';
```

## Permissions Setup

### Required Permissions
- **Drive API**: Read/Write access to Google Drive
- **Service Account**: Editor role or specific Drive permissions

### Folder Access
- Share specific folders with the service account email
- Service account email: `your-service-account@your-project-id.iam.gserviceaccount.com`

## Troubleshooting

- **API not enabled**: Ensure Google Drive API is enabled in Google Cloud Console
- **Permission denied**: Check service account roles and folder sharing
- **File not found**: Ensure `google-drive.json` exists in `config/third-party/`
- **Invalid JSON**: Verify the downloaded file is valid JSON
- **Missing fields**: Check that all required fields are present

## Security Notes

- Never commit `google-drive.json` to version control
- Keep the private key secure
- Regularly rotate service account keys
- Use least privilege principle for service account roles
- Only share necessary folders with the service account
