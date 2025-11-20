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
import { MoodSurveyAdminService } from './mood-survey-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import {
  CreateMoodSurveyDto,
  UpdateMoodSurveyDto,
  MoodSurveyResponseDto,
  ArchiveMoodSurveyDto,
} from '../../profile/mood-tracker/dto/mood-survey.dto';

@ApiTags('admin/mood-surveys')
@Controller('admin/mood-surveys')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin')
export class MoodSurveyAdminController {
  constructor(private readonly moodSurveyAdminService: MoodSurveyAdminService) {}

  @Post()
  @ApiOperation({
    summary: 'Create new mood survey',
    description: 'Creates a new mood survey with questions',
  })
  @ApiResponse({
    status: 201,
    description: 'Mood survey created successfully',
    type: MoodSurveyResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  async createMoodSurvey(
    @Body() createMoodSurveyDto: CreateMoodSurveyDto,
    @CurrentUser() user: User,
  ): Promise<MoodSurveyResponseDto> {
    return this.moodSurveyAdminService.createMoodSurvey(createMoodSurveyDto, user.email);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all mood surveys',
    description: 'Returns a list of all mood surveys (including archived)',
  })
  @ApiQuery({
    name: 'isArchived',
    description: 'Include isArchived surveys',
    required: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'List of mood surveys',
    type: [MoodSurveyResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  async getAllMoodSurveys(
    @Query('isArchived') archived?: string,
  ): Promise<MoodSurveyResponseDto[]> {
    return this.moodSurveyAdminService.getAllMoodSurveys(archived === 'true' ? 1 : 0);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get mood survey by ID',
    description: 'Returns mood survey details by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Mood survey ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Mood survey details',
    type: MoodSurveyResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  @ApiResponse({ status: 404, description: 'Mood survey not found' })
  async getMoodSurveyById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MoodSurveyResponseDto> {
    return this.moodSurveyAdminService.getMoodSurveyById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update mood survey',
    description: 'Updates an existing mood survey',
  })
  @ApiParam({
    name: 'id',
    description: 'Mood survey ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Mood survey updated successfully',
    type: MoodSurveyResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  @ApiResponse({ status: 404, description: 'Mood survey not found' })
  async updateMoodSurvey(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMoodSurveyDto: UpdateMoodSurveyDto,
    @CurrentUser() user: User,
  ): Promise<MoodSurveyResponseDto> {
    return this.moodSurveyAdminService.updateMoodSurvey(id, updateMoodSurveyDto, user.email);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive mood survey',
    description: 'Archives a mood survey (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'Mood survey ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Mood survey archived successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  @ApiResponse({ status: 404, description: 'Mood survey not found' })
  async archiveMoodSurvey(
    @Param('id', ParseIntPipe) id: number,
    @Body() archiveMoodSurveyDto: ArchiveMoodSurveyDto,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; message: string }> {
    return this.moodSurveyAdminService.archiveMoodSurvey(id, user.email, archiveMoodSurveyDto.reason);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore archived mood survey',
    description: 'Restores an archived mood survey',
  })
  @ApiParam({
    name: 'id',
    description: 'Mood survey ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Mood survey restored successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  @ApiResponse({ status: 404, description: 'Mood survey not found' })
  async restoreMoodSurvey(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; message: string }> {
    return this.moodSurveyAdminService.restoreMoodSurvey(id);
  }

  @Get('user/:userId/answers-stats')
  @ApiOperation({
    summary: 'Get mood survey answers statistics by user',
    description: 'Returns count of each mood survey answer for a specific user',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Mood survey answers statistics',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'number',
      },
      example: {
        'Survey Title 1': 5,
        'Survey Title 2': 3,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  async getUserMoodSurveyAnswersStats(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Record<string, number>> {
    return this.moodSurveyAdminService.getUserMoodSurveyAnswersStats(userId);
  }
}
