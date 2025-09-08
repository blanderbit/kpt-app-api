import { NestFactory } from '@nestjs/core';
import { CommandFactory } from 'nest-commander';
import { CliModule } from './cli.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(CliModule);
  await CommandFactory.run(CliModule, ['warn', 'error']);
  await app.close();
}

bootstrap();
