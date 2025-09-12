import { validateFile } from './utils';

export interface GoogleDriveConfig {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain?: string;
}

/**
 * Load and validate Google Drive configuration from JSON file
 */
export function loadGoogleDriveConfig(): GoogleDriveConfig {
  const configPath = 'config/third-party/google-drive.json';
  const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'];
  
  return validateFile(configPath, 'Google Drive configuration', requiredFields, true) as GoogleDriveConfig;
}
