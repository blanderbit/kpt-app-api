import { Controller, Get, Put, Body, UseGuards, Post, Inject, forwardRef } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SettingsService } from './settings.service';
import { SettingsResponseDto, UpdateSettingsDto, UpdateNotificationCronDto } from './dto/settings.dto';
import { NotificationsCronService } from '../../notifications/notifications.cron';

@ApiTags('admin/settings')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    @Inject(forwardRef(() => NotificationsCronService))
    private readonly notificationsCronService: NotificationsCronService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get current settings configuration',
    description: 'Returns the current settings configuration including Google Drive sync timestamps, cron configurations, and counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
    type: SettingsResponseDto,
  })
  async getSettings(): Promise<SettingsResponseDto> {
    return this.settingsService.getSettings();
  }

  @Put()
  @ApiOperation({
    summary: 'Update settings configuration',
    description: 'Updates the settings configuration. Can update Google Drive sync timestamps, cron expressions, counts, and expiration days',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
    type: SettingsResponseDto,
  })
  async updateSettings(@Body() updateDto: UpdateSettingsDto): Promise<SettingsResponseDto> {
    return this.settingsService.updateSettings(updateDto);
  }

  @Put('notifications/cron')
  @ApiOperation({
    summary: 'Update notification cron expressions',
    description: 'Updates notification reminder cron expressions and re-registers notification cron jobs',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification cron settings updated successfully',
    type: SettingsResponseDto,
  })
  async updateNotificationCron(@Body() cronDto: UpdateNotificationCronDto): Promise<SettingsResponseDto> {
    this.settingsService.updateNotificationCronSettings(cronDto);
    this.notificationsCronService.refreshCronJobs();
    return this.settingsService.getSettings();
  }

  @Post('cron/generate-articles')
  @ApiOperation({
    summary: 'Manually trigger generation of temporary articles',
    description: 'Manually triggers the generation of temporary articles for all users',
  })
  @ApiResponse({
    status: 200,
    description: 'Temporary articles generation triggered successfully',
  })
  async generateArticles(): Promise<{ message: string }> {
    await this.settingsService.generateTemporaryArticles('manual');
    return { message: 'Temporary articles generation completed' };
  }

  @Post('cron/cleanup-articles')
  @ApiOperation({
    summary: 'Manually trigger cleanup of expired temporary articles',
    description: 'Manually triggers the cleanup of expired temporary articles',
  })
  @ApiResponse({
    status: 200,
    description: 'Cleanup of expired temporary articles completed',
  })
  async cleanupArticles(): Promise<{ message: string }> {
    await this.settingsService.cleanupOldTemporaryArticles();
    return { message: 'Cleanup of expired temporary articles completed' };
  }

  @Post('cron/generate-surveys')
  @ApiOperation({
    summary: 'Manually trigger generation of temporary surveys',
    description: 'Manually triggers the generation of temporary surveys for all users',
  })
  @ApiResponse({
    status: 200,
    description: 'Temporary surveys generation triggered successfully',
  })
  async generateSurveys(): Promise<{ message: string }> {
    await this.settingsService.generateTemporarySurveys('manual');
    return { message: 'Temporary surveys generation completed' };
  }

  @Post('cron/cleanup-surveys')
  @ApiOperation({
    summary: 'Manually trigger cleanup of expired temporary surveys',
    description: 'Manually triggers the cleanup of expired temporary surveys',
  })
  @ApiResponse({
    status: 200,
    description: 'Cleanup of expired temporary surveys completed',
  })
  async cleanupSurveys(): Promise<{ message: string }> {
    await this.settingsService.cleanupOldTemporarySurveys();
    return { message: 'Cleanup of expired temporary surveys completed' };
  }
}

