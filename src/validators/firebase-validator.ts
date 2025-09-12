import { validateFile } from './utils';

export interface FirebaseConfig {
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
 * Load and validate Firebase configuration from JSON file
 */
export function loadFirebaseConfig(): FirebaseConfig {
  const configPath = 'config/third-party/firebase.json';
  const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'];
  
  return validateFile(configPath, 'Firebase configuration', requiredFields, true) as FirebaseConfig;
}
