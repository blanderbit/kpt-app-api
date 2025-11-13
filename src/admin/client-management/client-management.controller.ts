import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
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
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User } from '../../users/entities/user.entity';
import { CLIENT_PAGINATION_CONFIG } from './client-management.config';
import { PaginatedSwaggerDocs } from 'nestjs-paginate';
import { ClientManagementService } from './client-management.service';
import {
  ClientUserResponseDto,
  UserActivitiesResponseDto,
  UserSuggestedActivitiesResponseDto,
  UserMoodTrackerMonthlyResponseDto,
  UserAnalyticsResponseDto,
  UserSurveysResponseDto,
  UserArticlesResponseDto,
} from './dto/client-management.dto';

@ApiTags('admin/client-management')
@Controller('admin/clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin')
export class ClientManagementController {
  constructor(
    private readonly clientManagementService: ClientManagementService,
  ) {}

  @Get()
  @PaginatedSwaggerDocs(User, CLIENT_PAGINATION_CONFIG)
  @ApiOperation({
    summary: 'Get clients (non-admin users) with pagination',
    description: 'Returns a paginated list of all non-admin users',
  })
  @ApiResponse({
    status: 200,
    description: 'Clients list with pagination',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (admin required)',
  })
  async getClients(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<User>> {
    return this.clientManagementService.getClients(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns user information by ID (non-admin users only)',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User information',
    type: ClientUserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (admin required)',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ClientUserResponseDto> {
    return this.clientManagementService.getUserById(id);
  }

  @Get(':id/activities')
  @ApiOperation({
    summary: 'Get user activities filtered by date',
    description: 'Returns user activities for a specific date',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'date',
    description: 'Date filter (YYYY-MM-DD)',
    type: String,
    required: true,
    example: '2024-01-15',
  })
  @ApiResponse({
    status: 200,
    description: 'User activities for the date',
    type: UserActivitiesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (admin required)',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserActivities(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date: string,
  ): Promise<UserActivitiesResponseDto> {
    return this.clientManagementService.getUserActivities(id, date);
  }

  @Get(':id/suggested-activities')
  @ApiOperation({
    summary: 'Get user suggested activities',
    description: 'Returns all suggested activities for the user',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User suggested activities',
    type: UserSuggestedActivitiesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (admin required)',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserSuggestedActivities(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserSuggestedActivitiesResponseDto> {
    return this.clientManagementService.getUserSuggestedActivities(id);
  }

  @Get(':id/mood-tracker/monthly')
  @ApiOperation({
    summary: 'Get user mood tracker for a month',
    description: 'Returns mood tracker entries for a specific month',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'year',
    description: 'Year (YYYY)',
    type: Number,
    required: true,
    example: 2024,
  })
  @ApiQuery({
    name: 'month',
    description: 'Month (1-12)',
    type: Number,
    required: true,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User mood tracker for the month',
    type: UserMoodTrackerMonthlyResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (admin required)',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserMoodTrackerMonthly(
    @Param('id', ParseIntPipe) id: number,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ): Promise<UserMoodTrackerMonthlyResponseDto> {
    return this.clientManagementService.getUserMoodTrackerMonthly(id, year, month);
  }

  @Get(':id/analytics')
  @ApiOperation({
    summary: 'Get user profile analytics',
    description: 'Returns analytics for user profile including tasks completed, task count, and rate activity',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User analytics',
    type: UserAnalyticsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (admin required)',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserAnalytics(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserAnalyticsResponseDto> {
    return this.clientManagementService.getUserAnalytics(id);
  }

  @Get(':id/surveys')
  @ApiOperation({
    summary: 'Get surveys user answered',
    description: 'Returns all surveys that the user has answered',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Surveys user answered',
    type: UserSurveysResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (admin required)',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserSurveys(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserSurveysResponseDto> {
    return this.clientManagementService.getUserSurveys(id);
  }

  @Get(':id/articles')
  @ApiOperation({
    summary: 'Get articles user hidden',
    description: 'Returns all articles that the user has hidden (closed)',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Articles user hidden',
    type: UserArticlesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (admin required)',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserArticles(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserArticlesResponseDto> {
    return this.clientManagementService.getUserArticles(id);
  }
}


