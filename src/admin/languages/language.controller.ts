import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { LanguageService } from './services/language.service';
import { GoogleDriveService } from '../../core/google-drive';
import {
  CreateLanguageDto,
  UpdateLanguageDto,
  LanguageResponseDto,
  DownloadTemplateDto,
  ArchiveLanguageDto,
  RestoreLanguageDto,
} from './dto/language.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('admin-languages')
@Controller('admin/languages')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin')
export class LanguageController {
  constructor(
    private readonly languageService: LanguageService,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all languages',
    description: 'Returns a list of all languages (not archived)',
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
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  async getAllLanguages(@Query('active') active?: boolean) {
    if (active) {
      return this.languageService.getActiveLanguages();
    }
    return this.languageService.getAllLanguages();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get language by ID',
    description: 'Returns language information by Google Drive file ID',
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
    return this.languageService.getLanguageById(id);
  }

  @Get('code/:code')
  @ApiOperation({
    summary: 'Get language by code',
    description: 'Returns language information by code (e.g., en, ru)',
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
    return this.languageService.getLanguageByCode(code);
  }

  @Post()
  @ApiOperation({
    summary: 'Create new language',
    description: 'Creates a new language with custom template and uploads to Google Drive',
  })
  @ApiBody({ type: CreateLanguageDto })
  @ApiResponse({
    status: 201,
    description: 'Language successfully created',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
  })
  @ApiResponse({
    status: 409,
    description: 'Language with this code already exists',
  })
  async createLanguage(
    @Body() createLanguageDto: CreateLanguageDto,
    @CurrentUser('email') adminUser: string,
  ) {
    return this.languageService.createLanguage(createLanguageDto, adminUser);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update language',
    description: 'Updates language information',
  })
  @ApiParam({
    name: 'id',
    description: 'Google Drive file ID',
    type: String,
    example: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  })
  @ApiBody({ type: UpdateLanguageDto })
  @ApiResponse({
    status: 200,
    description: 'Language successfully updated',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Language not found',
  })
  async updateLanguage(
    @Param('id') id: string,
    @Body() updateLanguageDto: UpdateLanguageDto,
    @CurrentUser('email') adminUser: string,
  ) {
    return this.languageService.updateLanguage(id, updateLanguageDto, adminUser);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Archive language',
    description: 'Moves language to archive (does not delete completely)',
  })
  @ApiParam({
    name: 'id',
    description: 'Google Drive file ID',
    type: String,
    example: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  })
  @ApiBody({ type: ArchiveLanguageDto })
  @ApiResponse({
    status: 200,
    description: 'Language successfully archived',
  })
  @ApiResponse({
    status: 404,
    description: 'Language not found',
  })
  async archiveLanguage(
    @Param('id') id: string,
    @Body() archiveLanguageDto: ArchiveLanguageDto,
    @CurrentUser('email') adminUser: string,
  ) {
    return this.languageService.archiveLanguage(id, adminUser, archiveLanguageDto.reason);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restore language from archive',
    description: 'Restores language from archive to active state',
  })
  @ApiParam({
    name: 'id',
    description: 'Google Drive file ID',
    type: String,
    example: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  })
  @ApiBody({ type: RestoreLanguageDto })
  @ApiResponse({
    status: 200,
    description: 'Language successfully restored',
  })
  @ApiResponse({
    status: 404,
    description: 'Language not found',
  })
  async restoreLanguage(
    @Param('id') id: string,
    @Body() restoreLanguageDto: RestoreLanguageDto,
    @CurrentUser('email') adminUser: string,
  ) {
    return this.languageService.restoreLanguage(id, adminUser);
  }

  @Post('download-template')
  @ApiOperation({
    summary: 'Download default language template',
    description: 'Downloads a default language template file',
  })
  @ApiBody({ type: DownloadTemplateDto })
  @ApiResponse({
    status: 201,
    description: 'Template successfully downloaded',
  })
  async downloadDefaultTemplate(@Body() downloadTemplateDto: DownloadTemplateDto) {
    return this.languageService.downloadDefaultTemplate(downloadTemplateDto);
  }

  @Get('google-drive/files')
  @ApiOperation({
    summary: 'Get languages from Google Drive folder',
    description: 'Returns a list of language files from Google Drive',
  })
  @ApiResponse({
    status: 200,
    description: 'List of files from Google Drive',
  })
  async getLanguagesFromGoogleDrive() {
    return this.languageService.getLanguagesFromGoogleDrive();
  }

  @Get('google-drive/test-connection')
  @ApiOperation({
    summary: 'Test Google Drive connection',
    description: 'Tests connection to Google Drive API',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection test result',
  })
  async testGoogleDriveConnection() {
    const isConnected = await this.googleDriveService.testConnection();
    return {
      isConnected,
      message: isConnected ? 'Google Drive connection successful' : 'Google Drive connection failed',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('google-drive/folders')
  @ApiOperation({
    summary: 'Get Google Drive folder information',
    description: 'Returns information about root language folder and archive folder',
  })
  @ApiResponse({
    status: 200,
    description: 'Folder information',
  })
  async getGoogleDriveFolders() {
    const rootFolderId = await this.googleDriveService.getOrCreateLanguagesRootFolder();
    const archiveFolderId = await this.googleDriveService.getOrCreateArchiveFolder(rootFolderId);

    return {
      rootFolder: {
        id: rootFolderId,
        name: 'KPT App Languages',
        url: `https://drive.google.com/drive/folders/${rootFolderId}`,
      },
      archiveFolder: {
        id: archiveFolderId,
        name: 'Archived Languages',
        url: `https://drive.google.com/drive/folders/${archiveFolderId}`,
      },
    };
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get language statistics',
    description: 'Returns general statistics for all languages',
  })
  @ApiResponse({
    status: 200,
    description: 'Language statistics',
  })
  async getLanguageStatistics() {
    const languages = await this.languageService.getAllLanguages();
    
    const totalLanguages = languages.length;
    const activeLanguages = languages.filter(lang => lang.isActive).length;
    const archivedLanguages = languages.filter(lang => lang.isArchived).length;
    const defaultLanguages = languages.filter(lang => lang.isDefault).length;
    
    const totalKeys = languages.reduce((sum, lang) => sum + lang.totalKeys, 0);
    const totalTranslations = languages.reduce((sum, lang) => sum + lang.totalTranslations, 0);
    const averageCompletionRate = totalLanguages > 0 
      ? Math.round(languages.reduce((sum, lang) => sum + lang.completionRate, 0) / totalLanguages)
      : 0;

    return {
      totalLanguages,
      activeLanguages,
      archivedLanguages,
      defaultLanguages,
      totalKeys,
      totalTranslations,
      averageCompletionRate,
    };
  }
}
