import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivityTypesService } from './activity-types.service';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';
import { SettingsModule } from '../../admin/settings/settings.module';

@Module({
  imports: [ConfigModule, forwardRef(() => SettingsModule)],
  providers: [ActivityTypesService, GoogleDriveFilesService],
  exports: [ActivityTypesService],
})
export class ActivityTypesModule {}
