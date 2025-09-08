import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { CreateAdminCommand } from './commands/create-admin.command';
import { RemoveAdminCommand } from './commands/remove-admin.command';
import { ListAdminsCommand } from './commands/list-admins.command';
import { databaseConfig } from '../config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    UsersModule,
  ],
  providers: [
    CreateAdminCommand,
    RemoveAdminCommand,
    ListAdminsCommand,
  ],
})
export class CliModule {}
