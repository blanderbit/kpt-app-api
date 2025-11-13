import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClientStaticService } from './client-static.service';
import {
  ClientStaticFilterDto,
  MoodTrackerFilterDto,
  ClientStaticCountResponseDto,
} from './dto/client-static.dto';

@ApiTags('admin/client-static')
@Controller('admin/client-static')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin')
export class ClientStaticController {
  constructor(private readonly clientStaticService: ClientStaticService) {}

  @Get('registered-users')
  @ApiOperation({
    summary: 'Get count of registered users by filters',
    description: 'Returns the count of users registered within the specified filters (date range, registration method, age, social networks, theme)',
  })
  @ApiResponse({
    status: 200,
    description: 'Count of registered users',
    type: ClientStaticCountResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (admin required)',
  })
  async getRegisteredUsersCount(
    @Query() filters: ClientStaticFilterDto,
  ): Promise<ClientStaticCountResponseDto> {
    return this.clientStaticService.getRegisteredUsersCount(filters);
  }

  @Get('inactive-users')
  @ApiOperation({
    summary: 'Get count of inactive users by filters',
    description: 'Returns the count of inactive users (users who haven\'t updated their profile in the last 30 days) within the specified filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Count of inactive users',
    type: ClientStaticCountResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (admin required)',
  })
  async getInactiveUsersCount(
    @Query() filters: ClientStaticFilterDto,
  ): Promise<ClientStaticCountResponseDto> {
    return this.clientStaticService.getInactiveUsersCount(filters);
  }

  @Get('survey-responded-users')
  @ApiOperation({
    summary: 'Get count of users who answered surveys by filters',
    description: 'Returns the count of users who answered surveys within the specified filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Count of users who answered surveys',
    type: ClientStaticCountResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (admin required)',
  })
  async getSurveyRespondedUsersCount(
    @Query() filters: ClientStaticFilterDto,
  ): Promise<ClientStaticCountResponseDto> {
    return this.clientStaticService.getSurveyRespondedUsersCount(filters);
  }

  @Get('article-visited-users')
  @ApiOperation({
    summary: 'Get count of users who visited articles by filters',
    description: 'Returns the count of users who visited (hidden) articles within the specified filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Count of users who visited articles',
    type: ClientStaticCountResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (admin required)',
  })
  async getArticleVisitedUsersCount(
    @Query() filters: ClientStaticFilterDto,
  ): Promise<ClientStaticCountResponseDto> {
    return this.clientStaticService.getArticleVisitedUsersCount(filters);
  }

  @Get('mood-tracked-users')
  @ApiOperation({
    summary: 'Get count of users who tracked mood by filters',
    description: 'Returns the count of users who tracked mood within the specified filters (includes days count and mood type filters)',
  })
  @ApiResponse({
    status: 200,
    description: 'Count of users who tracked mood',
    type: ClientStaticCountResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (admin required)',
  })
  async getMoodTrackedUsersCount(
    @Query() filters: MoodTrackerFilterDto,
  ): Promise<ClientStaticCountResponseDto> {
    return this.clientStaticService.getMoodTrackedUsersCount(filters);
  }
}

