import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Res,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
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
import { LanguageService } from '../services/language.service';
import { GoogleDriveService } from '../../../core/google-drive';
import {
  CreateLanguageDto,
  UpdateLanguageDto,
  LanguageResponseDto,
  DownloadTemplateDto,
  ArchiveLanguageDto,
  SetActiveLanguageDto,
} from '../dto/language.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SettingsService } from '../../settings/settings.service';

@ApiTags('admin-languages')
@Controller('admin/languages')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin')
export class LanguageController {
  constructor(
    private readonly languageService: LanguageService,
    private readonly googleDriveService: GoogleDriveService,
    private readonly settingsService: SettingsService,
  ) {}


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

  @Get(':id/language')
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
    @CurrentUser('email') adminUser: string,
  ) {
    return this.languageService.restoreLanguage(id, adminUser);
  }

  @Patch(':id/set-default')
  @ApiOperation({
    summary: 'Set language as default',
    description: 'Set a language as the default language. All other languages will have isDefault set to false.',
  })
  @ApiParam({
    name: 'id',
    description: 'Google Drive file ID of the language',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Language set as default',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Language not found',
  })
  async setDefaultLanguage(
    @Param('id') id: string,
    @CurrentUser('email') adminUser: string,
  ) {
    return this.languageService.setDefaultLanguage(id, adminUser);
  }

  @Patch(':id/set-active')
  @ApiOperation({
    summary: 'Set language active status',
    description: 'Set a language as active or inactive',
  })
  @ApiParam({
    name: 'id',
    description: 'Google Drive file ID of the language',
    type: String,
  })
  @ApiBody({ type: SetActiveLanguageDto })
  @ApiResponse({
    status: 200,
    description: 'Language active status updated',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Language not found',
  })
  async setActiveLanguage(
    @Param('id') id: string,
    @Body() setActiveLanguageDto: SetActiveLanguageDto,
    @CurrentUser('email') adminUser: string,
  ) {
    return this.languageService.setActiveLanguage(id, setActiveLanguageDto.isActive, adminUser);
  }

  @Patch('set-all-active')
  @ApiOperation({
    summary: 'Set all languages as active',
    description: 'Set all languages (except archived) as active',
  })
  @ApiResponse({
    status: 200,
    description: 'All languages set as active',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        updatedCount: { type: 'number' },
      },
    },
  })
  async setAllLanguagesActive(
    @CurrentUser('email') adminUser: string,
  ) {
    return this.languageService.setAllLanguagesActive(adminUser);
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
  async downloadDefaultTemplate(
    @Body() downloadTemplateDto: DownloadTemplateDto,
    @Res() res: Response,
  ) {
    const result = await this.languageService.downloadDefaultTemplate(downloadTemplateDto);
    
    try {
      // Устанавливаем заголовки для скачивания файла
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadTemplateDto.code}.json"`);
      
      // Читаем файл и отправляем его
      const fileContent = fs.readFileSync(result.filePath, 'utf8');
      res.send(fileContent);
    } finally {
      // Удаляем временный файл после отправки
      if (fs.existsSync(result.filePath)) {
        fs.unlinkSync(result.filePath);
      }
    }
  }

  @Delete('archived/:id')
  @ApiOperation({
    summary: 'Permanently delete archived language',
    description: 'Permanently deletes a language from archive folder',
  })
  @ApiParam({
    name: 'id',
    description: 'Google Drive file ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Language permanently deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Language not found in archive',
  })
  async deleteArchivedLanguage(
    @Param('id') id: string,
    @CurrentUser('email') adminUser: string,
  ) {
    return this.languageService.deleteArchivedLanguage(id, adminUser);
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
    const rootFolderId = await this.googleDriveService.getLanguagesRootFolder();
    const archiveFolderId = await this.googleDriveService.getArchiveFolder();

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
    const languages = await this.languageService.getLanguagesFromGoogleDrive();
    
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

  @Get('cache')
  @ApiOperation({
    summary: 'Get languages from cache',
    description: 'Returns cached languages with last sync date',
  })
  @ApiResponse({
    status: 200,
    description: 'Cached languages',
    schema: {
      type: 'object',
      properties: {
        languages: { type: 'array', items: { $ref: '#/components/schemas/LanguageResponseDto' } },
        total: { type: 'number' },
        lastSyncDate: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getLanguagesFromCache() {
    const languages = this.languageService.getLanguagesFromCache();
    const lastSyncDate = this.languageService.getLastSyncDate();
    
    return {
      languages,
      total: languages.length,
      lastSyncDate: lastSyncDate ? lastSyncDate.toISOString() : null,
    };
  }

  @Get('archived/cache')
  @ApiOperation({
    summary: 'Get archived languages from cache',
    description: 'Returns cached archived languages with last sync date',
  })
  @ApiResponse({
    status: 200,
    description: 'Cached archived languages',
    schema: {
      type: 'object',
      properties: {
        languages: { type: 'array', items: { $ref: '#/components/schemas/LanguageResponseDto' } },
        total: { type: 'number' },
        lastSyncDate: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getArchivedLanguagesFromCache() {
    const languages = this.languageService.getArchivedLanguagesFromCache();
    const lastSyncDate = this.languageService.getLastArchivedSyncDate();
    
    return {
      languages,
      total: languages.length,
      lastSyncDate: lastSyncDate ? lastSyncDate.toISOString() : null,
    };
  }

  @Post('sync')
  @ApiOperation({
    summary: 'Sync languages from Google Drive',
    description: 'Manually triggers synchronization of languages from Google Drive to cache',
  })
  @ApiResponse({
    status: 200,
    description: 'Languages successfully synchronized',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        languages: { type: 'array', items: { $ref: '#/components/schemas/LanguageResponseDto' } },
        total: { type: 'number' },
        syncedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async syncLanguages() {
    const result = await this.languageService.syncLanguagesFromGoogleDrive();
    
    // Update last sync timestamp
    this.settingsService.updateLastSync('languages');
    
    return {
      message: 'Languages successfully synchronized from Google Drive',
      languages: result.languages,
      total: result.languages.length,
      syncedAt: result.syncedAt.toISOString(),
    };
  }

  @Post('archived/sync')
  @ApiOperation({
    summary: 'Sync archived languages from Google Drive',
    description: 'Manually triggers synchronization of archived languages from Google Drive to cache',
  })
  @ApiResponse({
    status: 200,
    description: 'Archived languages successfully synchronized',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        languages: { type: 'array', items: { $ref: '#/components/schemas/LanguageResponseDto' } },
        total: { type: 'number' },
        syncedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async syncArchivedLanguages() {
    const result = await this.languageService.syncArchivedLanguagesFromGoogleDrive();
    
    return {
      message: 'Archived languages successfully synchronized from Google Drive',
      languages: result.languages,
      total: result.languages.length,
      syncedAt: result.syncedAt.toISOString(),
    };
  }
}
