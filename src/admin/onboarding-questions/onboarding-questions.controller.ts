import {
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
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
  async getAllOnboardingQuestions(): Promise<OnboardingStepDto[]> {
    return this.onboardingQuestionsService.getAllOnboardingQuestions();
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
  ): Promise<OnboardingStepDto | undefined> {
    return this.onboardingQuestionsService.getOnboardingStepByStepName(stepName);
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
  async getRequiredOnboardingSteps(): Promise<OnboardingStepDto[]> {
    return this.onboardingQuestionsService.getRequiredOnboardingSteps();
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
  async getOptionalOnboardingSteps(): Promise<OnboardingStepDto[]> {
    return this.onboardingQuestionsService.getOptionalOnboardingSteps();
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
    description: 'Synchronizes onboarding questions data with Google Drive',
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
}
