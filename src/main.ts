import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { initializeTransactionalContext, addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { databaseConfig } from './config/database.config';
import { validateAllConfigs } from './validators';


async function bootstrap() {
  // Initialize transactional context for typeorm-transactional
  initializeTransactionalContext();
  
  // Validate all configurations
  validateAllConfigs();

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
