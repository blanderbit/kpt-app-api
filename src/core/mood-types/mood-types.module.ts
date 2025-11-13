import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MoodTypesService } from './mood-types.service';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';
import { SettingsModule } from '../../admin/settings/settings.module';

@Module({
  imports: [ConfigModule, forwardRef(() => SettingsModule)],
  providers: [MoodTypesService, GoogleDriveFilesService],
  exports: [MoodTypesService],
})
export class MoodTypesModule {}
