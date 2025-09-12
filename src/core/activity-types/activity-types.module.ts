import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivityTypesService } from './activity-types.service';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';

@Module({
  imports: [ConfigModule],
  providers: [ActivityTypesService, GoogleDriveFilesService],
  exports: [ActivityTypesService],
})
export class ActivityTypesModule {}
