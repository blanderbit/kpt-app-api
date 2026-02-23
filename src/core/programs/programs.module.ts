import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProgramsService } from './programs.service';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';
import { SettingsModule } from '../../admin/settings/settings.module';

@Module({
  imports: [ConfigModule, forwardRef(() => SettingsModule)],
  providers: [ProgramsService, GoogleDriveFilesService],
  exports: [ProgramsService],
})
export class ProgramsModule {}
