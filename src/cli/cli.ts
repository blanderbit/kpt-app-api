import 'tsconfig-paths/register';
// Load .env before any config that reads process.env (e.g. database.config)
import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { CommandFactory } from 'nest-commander';
import { initializeTransactionalContext, addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { CliModule } from './cli.module';
import { databaseConfig } from '../config/database.config';

async function bootstrap() {
  // Initialize transactional context for typeorm-transactional
  initializeTransactionalContext();
  
  const app = await NestFactory.createApplicationContext(CliModule);
  
  // Add transactional data source
  const dataSource = app.get(DataSource);
  addTransactionalDataSource(dataSource);
  
  await CommandFactory.run(CliModule, ['warn', 'error']);
  await app.close();
}

bootstrap();
