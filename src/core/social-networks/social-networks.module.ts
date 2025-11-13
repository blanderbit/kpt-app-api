import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SocialNetworksService } from './social-networks.service';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';
import { SettingsModule } from '../../admin/settings/settings.module';

@Module({
  imports: [ConfigModule, forwardRef(() => SettingsModule)],
  providers: [SocialNetworksService, GoogleDriveFilesService],
  exports: [SocialNetworksService],
})
export class SocialNetworksModule {}
