import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BackupController } from './backup.controller';
import { BackupDatabaseService } from './backup.database.service';
import { GoogleDriveModule } from '../../core/google-drive';

@Module({
  imports: [
    ConfigModule,
    GoogleDriveModule,
  ],
  controllers: [BackupController],
  providers: [BackupDatabaseService],
  exports: [BackupDatabaseService],
})
export class BackupModule {}
