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
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PaginateQuery, Paginated, Paginate, PaginatedSwaggerDocs } from 'nestjs-paginate';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import {
  CreateActivityDto,
  UpdateActivityDto,
  ActivityResponseDto,
  ChangePositionDto,
  CloseActivityDto,
  ActivityStatisticsResponseDto,
} from './dto/activity.dto';
import { CreateRateActivityDto } from './dto/rate-activity.dto';
import { Activity } from './entities/activity.entity';
import { ACTIVITY_PAGINATION_CONFIG } from './activity.config';
import { ActivityTypesService } from '../../core/activity-types';
import { ActivityTypeDto } from '../../core/activity-types';

@ApiTags('activities')
@Controller('profile/activities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivityController {
  constructor(
    private readonly activityService: ActivityService,
    private readonly activityTypesService: ActivityTypesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create new activity',
    description: 'Creates a new activity for the current user',
  })
  @ApiResponse({
    status: 201,
    description: 'Activity created successfully',
    type: ActivityResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createActivity(
    @Body() createActivityDto: CreateActivityDto,
    @CurrentUser() user: User,
  ): Promise<ActivityResponseDto> {
    return this.activityService.createActivity(user, createActivityDto);
  }

  @Get()
  @PaginatedSwaggerDocs(Activity, ACTIVITY_PAGINATION_CONFIG)
  @ApiOperation({
    summary: 'Get my activities list',
    description: 'Returns user activities list with pagination, filtering and search',
  })
  @ApiResponse({
    status: 200,
    description: 'Activities list with pagination',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async getMyActivities(
    @CurrentUser() user: User,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Activity>> {
    return this.activityService.getMyActivities(user, query);
  }

  @Get('types')
  @ApiOperation({
    summary: 'Get all activity types',
    description: 'Returns all available activity types for the user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all activity types',
    type: [ActivityTypeDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async getAllActivityTypes(): Promise<ActivityTypeDto[]> {
    return this.activityTypesService.getAllActivityTypes();
  }

  @Get('archived')
  @PaginatedSwaggerDocs(Activity, ACTIVITY_PAGINATION_CONFIG)
  @ApiOperation({
    summary: 'Get archived activities for today',
    description: 'Returns archived activities for today with pagination, filtering and search',
  })
  @ApiResponse({
    status: 200,
    description: 'Archived activities list with pagination',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getArchivedActivities(
    @CurrentUser() user: User,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Activity>> {
    return this.activityService.getArchivedActivities(user, query);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get activity statistics for the last 7 days',
    description: 'Returns statistics about satisfaction and hardness levels over the last 7 days',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity statistics for the last 7 days',
    type: ActivityStatisticsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getActivityStatistics(
    @CurrentUser() user: User,
  ): Promise<ActivityStatisticsResponseDto> {
    return this.activityService.getActivityStatistics(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get activity by ID',
    description: 'Returns activity details by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity details',
    type: ActivityResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async getActivityById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<ActivityResponseDto> {
    const activity = await this.activityService.getActivityById(user.id, id);
    return this.mapToResponseDto(activity);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update activity',
    description: 'Updates an existing activity',
  })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity updated successfully',
    type: ActivityResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async updateActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateActivityDto: UpdateActivityDto,
    @CurrentUser() user: User,
  ): Promise<ActivityResponseDto> {
    const activity = await this.activityService.updateActivity(user.id, id, updateActivityDto);
    return this.mapToResponseDto(activity);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive activity',
    description: 'Archives an activity instead of deleting it',
  })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity archived successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async deleteActivity(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; message: string }> {
    await this.activityService.deleteActivity(user.id, id);
    return { success: true, message: 'Activity archived successfully' };
  }

  @Put(':id/position')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change activity position',
    description: 'Changes the position of an activity for ordering',
  })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity position updated successfully',
    type: ActivityResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @ApiResponse({ status: 400, description: 'Invalid position value' })
  async changePosition(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePositionDto: ChangePositionDto,
    @CurrentUser() user: User,
  ): Promise<ActivityResponseDto> {
    return this.activityService.changePosition(id, changePositionDto.position, user);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Close activity',
    description: 'Closes an activity with rating (satisfaction and hardness levels)',
  })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity closed successfully',
    type: ActivityResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @ApiResponse({ status: 400, description: 'Invalid rating values or activity already closed' })
  async closeActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() closeActivityDto: CloseActivityDto,
    @CurrentUser() user: User,
  ): Promise<ActivityResponseDto> {
    const createRateActivityDto: CreateRateActivityDto = {
      activityId: id,
      satisfactionLevel: closeActivityDto.satisfactionLevel,
      hardnessLevel: closeActivityDto.hardnessLevel,
    };
    return this.activityService.closeActivity(user, id, createRateActivityDto);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore archived activity',
    description: 'Restores an archived activity by setting archivedAt to null',
  })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity restored successfully',
    type: ActivityResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @ApiResponse({ status: 400, description: 'Activity is not archived' })
  async restoreActivity(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<ActivityResponseDto> {
    return this.activityService.restoreActivity(user.id, id);
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(activity: any): ActivityResponseDto {
    return {
      id: activity.id,
      userId: activity.user?.id,
      activityName: activity.activityName,
      activityType: activity.activityType,
      content: activity.content,
      position: activity.position,
      status: activity.status,
      closedAt: activity.closedAt,
      archivedAt: activity.archivedAt,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      rateActivities: activity.rateActivities || [],
    };
  }
}