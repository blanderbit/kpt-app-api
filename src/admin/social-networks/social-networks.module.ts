import { Module, forwardRef } from '@nestjs/common';
import { SocialNetworksController } from './social-networks.controller';
import { SocialNetworksAdminService } from './social-networks-admin.service';
import { SocialNetworksModule } from '../../core/social-networks';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SocialNetworksModule, forwardRef(() => SettingsModule)],
  controllers: [SocialNetworksController],
  providers: [SocialNetworksAdminService],
  exports: [SocialNetworksAdminService],
})
export class SocialNetworksAdminModule {}
