import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { SocialNetworkDto } from '../../core/social-networks'
import { SocialNetworksAdminService } from './social-networks-admin.service'

@ApiTags('public/social-networks')
@Controller('public/social-networks')
export class SocialNetworksPublicController {
  constructor(private readonly socialNetworksService: SocialNetworksAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get social networks', description: 'Public endpoint returning all social networks' })
  @ApiResponse({ status: 200, description: 'List of social networks', type: [SocialNetworkDto] })
  async getSocialNetworks(): Promise<SocialNetworkDto[]> {
    return this.socialNetworksService.getAllSocialNetworks()
  }
}
