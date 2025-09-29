import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SocialNetworksService } from './social-networks.service';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';

@Module({
  imports: [ConfigModule],
  providers: [SocialNetworksService, GoogleDriveFilesService],
  exports: [SocialNetworksService],
})
export class SocialNetworksModule {}
