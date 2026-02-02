import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { SocialNetworkDto } from '../../core/social-networks'
import { SocialNetworksAdminService } from './social-networks-admin.service'

@ApiTags('public/social-networks')
@Controller('public/social-networks')
export class SocialNetworksPublicController {
  constructor(private readonly socialNetworksService: SocialNetworksAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get social networks', description: 'Public endpoint returning all social networks' })
  @ApiQuery({ name: 'lang', required: false, description: 'Language code (e.g. en, ru, uk)' })
  @ApiResponse({ status: 200, description: 'List of social networks', type: [SocialNetworkDto] })
  async getSocialNetworks(@Query('lang') lang?: string): Promise<SocialNetworkDto[]> {
    return this.socialNetworksService.getAllSocialNetworks(lang)
  }
}
