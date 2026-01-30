import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { OnboardingStepDto } from '../../core/onboarding-questions'
import { OnboardingQuestionsAdminService } from './onboarding-questions-admin.service'

@ApiTags('public/onboarding-questions')
@Controller('public/onboarding-questions')
export class OnboardingQuestionsPublicController {
  constructor(private readonly onboardingQuestionsService: OnboardingQuestionsAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get onboarding questions', description: 'Public endpoint returning all onboarding steps' })
  @ApiResponse({ status: 200, description: 'List of onboarding questions', type: [OnboardingStepDto] })
  @ApiQuery({ name: 'lang', required: false, description: 'Language code for localized questions', example: 'en' })
  async getOnboardingQuestions(
    @Query('lang') language?: string,
  ): Promise<OnboardingStepDto[]> {
    return this.onboardingQuestionsService.getAllOnboardingQuestions(language)
  }
}
