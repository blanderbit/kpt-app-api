import {
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { SocialNetworksAdminService } from './social-networks-admin.service';
import { SocialNetworkDto, SocialNetworksStatsDto } from '../../core/social-networks';

@ApiTags('admin/social-networks')
@Controller('admin/social-networks')
export class SocialNetworksController {
  constructor(private readonly socialNetworksService: SocialNetworksAdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all social networks',
    description: 'Returns all available social networks',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all social networks',
    type: [SocialNetworkDto],
  })
  async getAllSocialNetworks(): Promise<SocialNetworkDto[]> {
    return this.socialNetworksService.getAllSocialNetworks();
  }

  @Get('by-category')
  @ApiOperation({
    summary: 'Get social networks by category',
    description: 'Returns social networks filtered by category',
  })
  @ApiQuery({
    name: 'category',
    description: 'Social network category',
    example: 'social',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Social networks by category',
    type: [SocialNetworkDto],
  })
  async getSocialNetworksByCategory(
    @Query('category') category: string,
  ): Promise<SocialNetworkDto[]> {
    return this.socialNetworksService.getSocialNetworksByCategory(category);
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Get all social network categories',
    description: 'Returns all available social network categories',
  })
  @ApiResponse({
    status: 200,
    description: 'List of social network categories',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'string',
      },
      example: {
        social: 'Social Networks',
        professional: 'Professional Networks',
        messaging: 'Messaging Platforms'
      }
    },
  })
  async getSocialNetworkCategories(): Promise<Record<string, string>> {
    return this.socialNetworksService.getSocialNetworkCategories();
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get social networks statistics',
    description: 'Returns statistical information about social networks',
  })
  @ApiResponse({
    status: 200,
    description: 'Social networks statistics',
    type: SocialNetworksStatsDto,
  })
  async getSocialNetworksStats(): Promise<SocialNetworksStatsDto> {
    return this.socialNetworksService.getSocialNetworksStats();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get social network by ID',
    description: 'Returns a specific social network by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Social network details',
    type: SocialNetworkDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Social network not found',
  })
  async getSocialNetworkById(@Query('id') id: string): Promise<SocialNetworkDto | undefined> {
    return this.socialNetworksService.getSocialNetworkById(id);
  }

  @Post('sync-with-drive')
  @ApiOperation({
    summary: 'Sync social networks with Google Drive',
    description: 'Synchronizes social networks data with Google Drive',
  })
  @ApiResponse({
    status: 200,
    description: 'Social networks successfully synchronized with Google Drive',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Social networks successfully synchronized with Google Drive'
        }
      }
    }
  })
  async syncWithDrive(): Promise<{ message: string }> {
    await this.socialNetworksService.syncWithDrive();
    return { message: 'Social networks successfully synchronized with Google Drive' };
  }
}
