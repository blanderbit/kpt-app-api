import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MoodTypesService } from './mood-types.service';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';

@Module({
  imports: [ConfigModule],
  providers: [MoodTypesService, GoogleDriveFilesService],
  exports: [MoodTypesService],
})
export class MoodTypesModule {}
