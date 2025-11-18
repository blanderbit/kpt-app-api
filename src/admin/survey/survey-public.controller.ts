import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SurveyPublicService } from './survey-public.service';
import { SettingsService } from '../settings/settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { SurveyResponseDto, SubmitSurveyAnswerDto } from './dto/survey.dto';

@ApiTags('surveys')
@Controller('surveys')
export class SurveyPublicController {
  constructor(
    private readonly surveyPublicService: SurveyPublicService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get('random')
  @ApiOperation({
    summary: 'Get random survey',
    description: 'Returns a random active survey that user has not completed',
  })
  @ApiResponse({
    status: 200,
    description: 'Random survey',
    type: [SurveyResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'No surveys available',
  })
  async getRandomSurvey(
    @CurrentUser() user?: User,
  ): Promise<SurveyResponseDto[]> {
    return this.surveyPublicService.getRandomSurvey(user?.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all active surveys',
    description: 'Returns a list of all active surveys with completion status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active surveys',
    type: [SurveyResponseDto],
  })
  async getAllSurveys(
    @CurrentUser() user?: User,
  ): Promise<SurveyResponseDto[]> {
    return this.surveyPublicService.getActiveSurveys(user?.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get survey by ID',
    description: 'Returns survey details by ID (only active surveys)',
  })
  @ApiParam({
    name: 'id',
    description: 'Survey ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Survey details',
    type: SurveyResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Survey not found or archived',
  })
  async getSurveyById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: User,
  ): Promise<SurveyResponseDto> {
    return this.surveyPublicService.getSurveyById(id, user?.id);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit survey answer',
    description: 'Submits or updates user answer to a survey',
  })
  @ApiParam({
    name: 'id',
    description: 'Survey ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Survey answer submitted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 404,
    description: 'Survey not found or archived',
  })
  async submitSurveyAnswer(
    @Param('id', ParseIntPipe) id: number,
    @Body() submitAnswerDto: SubmitSurveyAnswerDto,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; message: string }> {
    return this.surveyPublicService.submitSurveyAnswer(id, user.id, submitAnswerDto);
  }

  @Get('temporary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get temporary surveys for current user',
    description: 'Returns temporary surveys assigned to the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of temporary surveys',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async getTemporarySurveys(@CurrentUser() user: User) {
    const temporarySurveys = await this.settingsService.getUserTemporarySurveys(user.id);
    return temporarySurveys.map(ts => ({
      id: ts.id,
      survey: ts.survey,
      expiresAt: ts.expiresAt,
      createdAt: ts.createdAt,
    }));
  }
}

