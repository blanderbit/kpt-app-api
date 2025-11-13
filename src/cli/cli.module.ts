import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { CreateAdminCommand } from './commands/create-admin.command';
import { RemoveAdminCommand } from './commands/remove-admin.command';
import { ListAdminsCommand } from './commands/list-admins.command';
import { SeedDatabaseCommand } from './commands/seed-database.command';
import { databaseConfig } from '../config/database.config';
import { ActivityTypesService } from '../core/activity-types/activity-types.service';
import { MoodTypesService } from '../core/mood-types/mood-types.service';
import { OnboardingQuestionsService } from '../core/onboarding-questions/onboarding-questions.service';
import { SocialNetworksService } from '../core/social-networks/social-networks.service';
import { GoogleDriveFilesService } from '../common/services/google-drive-files.service';
import { SettingsService } from '../admin/settings/settings.service';

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
    SeedDatabaseCommand,
    ActivityTypesService,
    MoodTypesService,
    OnboardingQuestionsService,
    SocialNetworksService,
    GoogleDriveFilesService,
    {
      provide: SettingsService,
      useValue: {
        updateLastSync: () => undefined,
      },
    },
  ],
})
export class CliModule {}
