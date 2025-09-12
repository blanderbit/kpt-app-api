// Import all validators
import { validateEnvironmentVariables } from './environment-validator';
import { loadFirebaseConfig, type FirebaseConfig } from './firebase-validator';
import { loadGoogleDriveConfig, type GoogleDriveConfig } from './google-drive-validator';

// Import utilities
export { validateFile } from './utils';

// Export individual validators
export { validateEnvironmentVariables };
export { loadFirebaseConfig, type FirebaseConfig };
export { loadGoogleDriveConfig, type GoogleDriveConfig };

// Auto-import all validators and run them in sequence
export function validateAllConfigs(): void {
  console.log('🔍 Starting configuration validation...');
  
  // 1. Validate environment variables first
  console.log('📋 Validating environment variables...');
  validateEnvironmentVariables();
  
  // 2. Validate Firebase configuration
  console.log('🔥 Validating Firebase configuration...');
  loadFirebaseConfig();
  
  // 3. Validate Google Drive configuration
  console.log('🌐 Validating Google Drive configuration...');
  loadGoogleDriveConfig();
  
  console.log('✅ All configurations validated successfully!');
}
