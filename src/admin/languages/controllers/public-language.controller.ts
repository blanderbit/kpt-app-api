import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LanguageService } from '../services/language.service';
import { LanguageResponseDto } from '../dto/language.dto';

@ApiTags('Public Languages')
@Controller('languages')
export class PublicLanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all languages',
    description: 'Returns a list of all languages from cache (not archived)',
  })
  @ApiQuery({
    name: 'active',
    description: 'Get only active languages',
    required: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'List of languages',
    type: [LanguageResponseDto],
  })
  async getAllLanguages(@Query('active') active?: boolean) {
    const languages = this.languageService.getLanguagesFromCache();
    
    if (active) {
      return languages.filter(lang => lang.isActive);
    }
    
    return languages;
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get language by ID',
    description: 'Returns language information by Google Drive file ID from cache',
  })
  @ApiParam({
    name: 'id',
    description: 'Google Drive file ID',
    type: String,
    example: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  })
  @ApiResponse({
    status: 200,
    description: 'Language information',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Language not found',
  })
  async getLanguageById(@Param('id') id: string) {
    const languages = this.languageService.getLanguagesFromCache();
    const language = languages.find(lang => lang.id === id || lang.googleDriveFileId === id);
    
    if (!language) {
      throw new BadRequestException(`Language with ID "${id}" not found in cache`);
    }
    
    return language;
  }

  @Get('code/:code')
  @ApiOperation({
    summary: 'Get language by code',
    description: 'Returns language information by code (e.g., en, ru) from cache',
  })
  @ApiParam({
    name: 'code',
    description: 'Language code',
    type: String,
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'Language information',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Language not found',
  })
  async getLanguageByCode(@Param('code') code: string) {
    const languages = this.languageService.getLanguagesFromCache();
    const language = languages.find(lang => lang.code === code);
    
    if (!language) {
      throw new BadRequestException(`Language with code "${code}" not found in cache`);
    }
    
    return language;
  }
}
