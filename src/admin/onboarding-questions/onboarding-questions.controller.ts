import {
  Controller,
  Get,
  Post,
  Query,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { OnboardingQuestionsAdminService } from './onboarding-questions-admin.service';
import { OnboardingStepDto, OnboardingQuestionsStatsDto } from '../../core/onboarding-questions';

@ApiTags('admin/onboarding-questions')
@Controller('admin/onboarding-questions')
export class OnboardingQuestionsController {
  constructor(private readonly onboardingQuestionsService: OnboardingQuestionsAdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all onboarding questions',
    description: 'Returns all available onboarding questions and steps',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all onboarding questions',
    type: [OnboardingStepDto],
  })
  @ApiQuery({
    name: 'lang',
    description: 'Language code for localized questions',
    required: false,
    example: 'en',
  })
  async getAllOnboardingQuestions(
    @Query('lang') language?: string,
  ): Promise<OnboardingStepDto[]> {
    return this.onboardingQuestionsService.getAllOnboardingQuestions(language);
  }

  @Get('by-step')
  @ApiOperation({
    summary: 'Get onboarding step by step name',
    description: 'Returns a specific onboarding step by its step name',
  })
  @ApiQuery({
    name: 'stepName',
    description: 'Step name identifier',
    example: 'improvement_goal',
    required: true,
  })
  @ApiQuery({
    name: 'lang',
    description: 'Language code for localized questions',
    required: false,
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding step details',
    type: OnboardingStepDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Onboarding step not found',
  })
  async getOnboardingStepByStepName(
    @Query('stepName') stepName: string,
    @Query('lang') language?: string,
  ): Promise<OnboardingStepDto | undefined> {
    return this.onboardingQuestionsService.getOnboardingStepByStepName(stepName, language);
  }

  @Get('required')
  @ApiOperation({
    summary: 'Get required onboarding steps only',
    description: 'Returns only the required onboarding steps',
  })
  @ApiResponse({
    status: 200,
    description: 'List of required onboarding steps',
    type: [OnboardingStepDto],
  })
  @ApiQuery({
    name: 'lang',
    description: 'Language code for localized questions',
    required: false,
    example: 'en',
  })
  async getRequiredOnboardingSteps(
    @Query('lang') language?: string,
  ): Promise<OnboardingStepDto[]> {
    return this.onboardingQuestionsService.getRequiredOnboardingSteps(language);
  }

  @Get('optional')
  @ApiOperation({
    summary: 'Get optional onboarding steps only',
    description: 'Returns only the optional onboarding steps',
  })
  @ApiResponse({
    status: 200,
    description: 'List of optional onboarding steps',
    type: [OnboardingStepDto],
  })
  @ApiQuery({
    name: 'lang',
    description: 'Language code for localized questions',
    required: false,
    example: 'en',
  })
  async getOptionalOnboardingSteps(
    @Query('lang') language?: string,
  ): Promise<OnboardingStepDto[]> {
    return this.onboardingQuestionsService.getOptionalOnboardingSteps(language);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get onboarding questions statistics',
    description: 'Returns statistical information about onboarding questions',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding questions statistics',
    type: OnboardingQuestionsStatsDto,
  })
  async getOnboardingQuestionsStats(): Promise<OnboardingQuestionsStatsDto> {
    return this.onboardingQuestionsService.getOnboardingQuestionsStats();
  }

  @Post('sync-with-drive')
  @ApiOperation({
    summary: 'Sync onboarding questions with Google Drive',
    description: 'Re-downloads onboarding questions from Google Drive into app cache',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding questions successfully synchronized with Google Drive',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Onboarding questions successfully synchronized with Google Drive'
        }
      }
    }
  })
  async syncWithDrive(): Promise<{ message: string }> {
    await this.onboardingQuestionsService.syncWithDrive();
    return { message: 'Onboarding questions successfully synchronized with Google Drive' };
  }

  @Post('push-to-drive')
  @ApiOperation({
    summary: 'Push local onboarding JSON to Google Drive',
    description: 'Reads a local JSON file (default: docs/current_onboarding_questions.json), uploads it to the file identified by ONBOARDING_QUESTIONS_FILE_ID, then reloads onboarding from Drive',
  })
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          example: 'docs/current_onboarding_questions.json',
          description: 'Path relative to project root or absolute',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Push result',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async pushToDrive(
    @Body('filePath') filePath?: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.onboardingQuestionsService.pushLocalFileToDrive(filePath);
  }
}
