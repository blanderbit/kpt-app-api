import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MoodSurveyService } from '../services/mood-survey.service';
import { MoodSurveyResponseDto } from '../dto/mood-survey.dto';

@ApiTags('Public Mood Surveys')
@Controller('mood-surveys')
export class PublicMoodSurveyController {
  constructor(private readonly moodSurveyService: MoodSurveyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all active mood surveys',
    description: 'Returns a list of all active (non-archived) mood surveys',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active mood surveys',
    type: [MoodSurveyResponseDto],
  })
  async getAllMoodSurveys(): Promise<MoodSurveyResponseDto[]> {
    return this.moodSurveyService.getAllActiveMoodSurveys();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get mood survey by ID',
    description: 'Returns mood survey details by ID (only active surveys)',
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
  @ApiResponse({
    status: 404,
    description: 'Mood survey not found or archived',
  })
  async getMoodSurveyById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MoodSurveyResponseDto> {
    return this.moodSurveyService.getActiveMoodSurveyById(id);
  }
}
