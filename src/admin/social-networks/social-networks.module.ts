import { Module } from '@nestjs/common';
import { SocialNetworksController } from './social-networks.controller';
import { SocialNetworksAdminService } from './social-networks-admin.service';
import { SocialNetworksModule } from '../../core/social-networks';

@Module({
  imports: [SocialNetworksModule],
  controllers: [SocialNetworksController],
  providers: [SocialNetworksAdminService],
  exports: [SocialNetworksAdminService],
})
export class SocialNetworksAdminModule {}
