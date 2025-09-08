import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { initializeTransactionalContext, addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { databaseConfig } from './config/database.config';

/**
 * Check if all required environment variables are present
 */
function validateEnvironmentVariables(): void {
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
    
    // Firebase
    'FIREBASE_TYPE',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID',
    'FIREBASE_AUTH_URI',
    'FIREBASE_TOKEN_URI',
    'FIREBASE_AUTH_PROVIDER_X509_CERT_URL',
    'FIREBASE_CLIENT_X509_CERT_URL',
    
    // OpenAI/ChatGPT
    'OPENAI_API_KEY',
    
    // Google OAuth
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
    
    // App Configuration
    'APP_NAME',
    'NODE_ENV',
    'PORT',
    
    // Suggested Activity Cron
    'USERS_PAGE_SIZE',
    'USERS_PAGE_DELAY'
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

async function bootstrap() {
  // Initialize transactional context for typeorm-transactional
  initializeTransactionalContext();
  
  // Validate environment variables before starting the app
  validateEnvironmentVariables();

  const app = await NestFactory.create(AppModule);

  // Get the TypeORM DataSource and add it to transactional context
  const dataSource = app.get(DataSource);
  addTransactionalDataSource(dataSource);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('KPT API')
    .setDescription('API documentation for KPT application')
    .setVersion('1.0')
    .addTag('auth', 'Authentication and authorization')
    .addTag('users', 'User management')
    .addTag('profile', 'Profile and activity')
    .addTag('suggested-activities', 'Suggested activities and AI recommendations')
    .addTag('admin', 'Administrative operations')
    .addTag('queue', 'Queue management')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch(error => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
