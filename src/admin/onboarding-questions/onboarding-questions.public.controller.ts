import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { OnboardingStepDto } from '../../core/onboarding-questions'
import { OnboardingQuestionsAdminService } from './onboarding-questions-admin.service'

@ApiTags('public/onboarding-questions')
@Controller('public/onboarding-questions')
export class OnboardingQuestionsPublicController {
  constructor(private readonly onboardingQuestionsService: OnboardingQuestionsAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get onboarding questions', description: 'Public endpoint returning all onboarding steps' })
  @ApiResponse({ status: 200, description: 'List of onboarding questions', type: [OnboardingStepDto] })
  async getOnboardingQuestions(): Promise<OnboardingStepDto[]> {
    return this.onboardingQuestionsService.getAllOnboardingQuestions()
  }
}
