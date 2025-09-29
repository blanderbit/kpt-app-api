/**
 * Check if all required environment variables are present
 */
export function validateEnvironmentVariables(): void {
  const requiredEnvVars = [
    // Database
    'DATABASE_HOST',
    'DATABASE_PORT', 
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
    
    // JWT
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'JWT_REFRESH_SECRET',
    'JWT_REFRESH_EXPIRES_IN',
    
    // Redis
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD',
    'REDIS_DB',
    'REDIS_PREFIX',
    
    // Email
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASS',
    'EMAIL_FROM',
    'EMAIL_SECURE',
    'FRONTEND_URL',
    
    // OpenAI/ChatGPT
    'OPENAI_API_KEY',
    // App Configuration
    'APP_NAME',
    'NODE_ENV',
    'PORT',
    
    // Suggested Activity Cron
    'USERS_PAGE_SIZE',
    'USERS_PAGE_DELAY',
    
    // Google Drive File IDs
    'ACTIVITY_TYPES_FILE_ID',
    'MOOD_TYPES_FILE_ID',
    'SOCIAL_NETWORKS_FILE_ID',
    'ONBOARDING_QUESTIONS_FILE_ID'
  ];

  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    console.error('');
    missingVars.forEach(varName => {
      console.error(`   • ${varName}`);
    });
    console.error('');
    console.error('Please check your .env file and ensure all required variables are set.');
    console.error('Refer to the documentation for the complete list of required environment variables.');
    console.error('');
    
    // Stop the process
    process.exit(1);
  }

  console.log('✅ All required environment variables are present');
}
