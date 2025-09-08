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
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { CreateActivityDto, UpdateActivityDto, ActivityResponseDto } from './dto/activity.dto';
import { CreateRateActivityDto } from './dto/rate-activity.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Activity } from './entities/activity.entity';
import { ACTIVITY_PAGINATION_CONFIG } from './activity.config';
import { PaginatedSwaggerDocs } from 'nestjs-paginate';
import { User } from 'src/users/entities/user.entity';

@ApiTags('activities')
@Controller('profile/activities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

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

  @Post()
  @ApiOperation({
    summary: 'Create new activity',
    description: 'Creates new activity with automatic type determination through AI',
  })
  @ApiResponse({
    status: 201,
    description: 'Activity created',
    type: ActivityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async createActivity(
    @CurrentUser() user: User,
    @Body() createActivityDto: CreateActivityDto,
  ): Promise<ActivityResponseDto> {
    return this.activityService.createActivity(user, createActivityDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get activity by ID',
    description: 'Returns user activity by ID with rating activities',
  })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity found',
    type: ActivityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async getActivityById(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) activityId: number,
  ): Promise<ActivityResponseDto> {
    console.log('userId', userId);
    return this.activityService.getActivityById(userId, activityId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update activity',
    description: 'Updates activity (cannot modify closed ones)',
  })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity updated',
    type: ActivityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot modify closed activity',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async updateActivity(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) activityId: number,
    @Body() updateActivityDto: UpdateActivityDto,
  ): Promise<ActivityResponseDto> {
    return this.activityService.updateActivity(userId, activityId, updateActivityDto);
  }

  @Post(':id/close')
  @ApiOperation({
    summary: 'Close activity',
    description: 'Closes activity, creates RateActivity and marks as closed',
  })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity closed',
    type: ActivityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Activity is already closed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async closeActivity(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) activityId: number,
    @Body() createRateActivityDto: CreateRateActivityDto,
  ): Promise<ActivityResponseDto> {
    return this.activityService.closeActivity(user, activityId, createRateActivityDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete activity',
    description: 'Deletes activity (cannot delete closed ones)',
  })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot delete closed activity',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async deleteActivity(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) activityId: number,
  ): Promise<void> {
    return this.activityService.deleteActivity(userId, activityId);
  }

  // ===== Activity Types Endpoints =====

  @Get('types/all')
  @ApiOperation({
    summary: 'Get all activity types',
    description: 'Returns complete list of all available activity types',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity types list',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async getAllActivityTypes(): Promise<any[]> {
    return this.activityService.getAllActivityTypes();
  }

  @Get('types/recommended')
  @ApiOperation({
    summary: 'Get recommended types for name',
    description: 'Returns recommended activity types based on name',
  })
  @ApiQuery({
    name: 'name',
    description: 'Activity name for analysis',
    required: true,
    type: String,
    example: 'Morning run',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of recommendations',
    required: false,
    type: Number,
    example: 3,
  })
  @ApiResponse({
    status: 200,
    description: 'Recommended activity types',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async getRecommendedTypes(
    @Query('name') name: string,
    @Query('limit', new DefaultValuePipe(3), ParseIntPipe) limit: number,
  ): Promise<any[]> {
    if (!name) {
      throw new Error('Activity name is required');
    }
    return this.activityService.getRecommendedTypes(name, limit);
  }

  @Get('types/category/:category')
  @ApiOperation({
    summary: 'Get activity types by category',
    description: 'Returns activity types for specific category',
  })
  @ApiParam({
    name: 'category',
    description: 'Activity category',
    type: String,
    example: 'health',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity types by category',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async getActivityTypesByCategory(
    @Param('category') category: string,
  ): Promise<any[]> {
    return this.activityService.getActivityTypesByCategory(category);
  }

  @Get('types/search')
  @ApiOperation({
    summary: 'Search activity types',
    description: 'Search activity types by keyword',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query',
    required: true,
    type: String,
    example: 'sport',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async searchActivityTypes(
    @Query('q') query: string,
  ): Promise<any[]> {
    if (!query) {
      throw new Error('Search query is required');
    }
    return this.activityService.searchActivityTypes(query);
  }
}
