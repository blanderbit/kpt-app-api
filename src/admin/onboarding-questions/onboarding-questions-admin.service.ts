import { Injectable, Logger } from '@nestjs/common';
import { OnboardingQuestionsService } from '../../core/onboarding-questions';

@Injectable()
export class OnboardingQuestionsAdminService {
  private readonly logger = new Logger(OnboardingQuestionsAdminService.name);

  constructor(private readonly onboardingQuestionsService: OnboardingQuestionsService) {}

  /**
   * Sync onboarding questions with Google Drive
   * Reloads data from Google Drive
   */
  async syncWithDrive(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Starting onboarding questions sync with Google Drive...');
      
      // Reload onboarding questions from Google Drive
      await this.onboardingQuestionsService.loadOnboardingQuestions();
      
      this.logger.log('Onboarding questions synced successfully with Google Drive');
      
      return {
        success: true,
        message: 'Onboarding questions successfully synced with Google Drive'
      };
    } catch (error) {
      this.logger.error('Failed to sync onboarding questions with Google Drive', error);
      
      return {
        success: false,
        message: `Sync error: ${error.message}`
      };
    }
  }

  /**
   * Get all onboarding questions
   */
  async getAllOnboardingQuestions() {
    return this.onboardingQuestionsService.getAllOnboardingQuestions();
  }

  /**
   * Get onboarding step by step name
   */
  async getOnboardingStepByStepName(stepName: string) {
    return this.onboardingQuestionsService.getOnboardingStepByStepName(stepName);
  }

  /**
   * Get onboarding questions statistics
   */
  async getOnboardingQuestionsStats() {
    return this.onboardingQuestionsService.getOnboardingQuestionsStats();
  }

  /**
   * Get required onboarding steps only
   */
  async getRequiredOnboardingSteps() {
    return this.onboardingQuestionsService.getRequiredOnboardingSteps();
  }

  /**
   * Get optional onboarding steps only
   */
  async getOptionalOnboardingSteps() {
    return this.onboardingQuestionsService.getOptionalOnboardingSteps();
  }
}
