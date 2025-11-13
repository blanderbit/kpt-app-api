import { Injectable, Logger, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { OnboardingStepDto, OnboardingQuestionsDto, OnboardingQuestionsStatsDto } from './onboarding-question.dto';
import { SettingsService } from '../../admin/settings/settings.service';

export interface OnboardingAnswer {
  id: string;
  text: string;
  subtitle: string;
  icon: string;
}

export interface OnboardingStep {
  stepName: string;
  stepQuestion: string;
  answers: OnboardingAnswer[];
  inputType: string;
  required: boolean;
}

export interface OnboardingQuestionsData {
  onboardingSteps: OnboardingStep[];
}

@Injectable()
export class OnboardingQuestionsService implements OnModuleInit {
  private readonly logger = new Logger(OnboardingQuestionsService.name);
  private onboardingQuestionsData: OnboardingQuestionsData;
  private readonly fileId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly googleDriveFilesService: GoogleDriveFilesService,
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService?: SettingsService,
  ) {
    this.onboardingQuestionsData = { onboardingSteps: [] };
    this.fileId = this.configService.get<string>('ONBOARDING_QUESTIONS_FILE_ID') || '';
  }

  async onModuleInit(): Promise<void> {
    await this.loadOnboardingQuestions();
  }

  /**
   * Loads onboarding questions from Google Drive
   */
  async loadOnboardingQuestions(): Promise<void> {
    try {
      // Load from Google Drive
      if (this.fileId && this.googleDriveFilesService.isAvailable()) {
        this.logger.log('Loading onboarding questions from Google Drive');
        this.onboardingQuestionsData = await this.googleDriveFilesService.getFileContent(this.fileId);
        return;
      }

      // If Google Drive is unavailable, use empty array
      this.logger.warn('Google Drive not available, using empty onboarding questions');
      this.onboardingQuestionsData = {
        onboardingSteps: []
      };
    } catch (error) {
      this.logger.error('Error loading onboarding questions:', error);
      // Fallback to empty array
      this.onboardingQuestionsData = {
        onboardingSteps: []
      };
    } finally {
      this.settingsService?.updateLastSync('onboardingQuestions');
    }
  }

  /**
   * Get all onboarding questions
   */
  getAllOnboardingQuestions(): OnboardingStepDto[] {
    return this.onboardingQuestionsData.onboardingSteps;
  }

  /**
   * Get onboarding step by name
   */
  getOnboardingStepByStepName(stepName: string): OnboardingStepDto | undefined {
    return this.onboardingQuestionsData.onboardingSteps.find(step => step.stepName === stepName);
  }

  /**
   * Get onboarding questions statistics
   */
  getOnboardingQuestionsStats(): OnboardingQuestionsStatsDto {
    const steps = this.onboardingQuestionsData.onboardingSteps;
    const totalAnswers = steps.reduce((sum, step) => sum + step.answers.length, 0);
    const requiredSteps = steps.filter(step => step.required).length;
    const optionalSteps = steps.filter(step => !step.required).length;

    return {
      totalSteps: steps.length,
      totalAnswers,
      averageAnswersPerStep: steps.length > 0 ? Math.round(totalAnswers / steps.length) : 0,
      requiredSteps,
      optionalSteps
    };
  }

  /**
   * Get required onboarding steps only
   */
  getRequiredOnboardingSteps(): OnboardingStepDto[] {
    return this.onboardingQuestionsData.onboardingSteps.filter(step => step.required);
  }

  /**
   * Get optional onboarding steps only
   */
  getOptionalOnboardingSteps(): OnboardingStepDto[] {
    return this.onboardingQuestionsData.onboardingSteps.filter(step => !step.required);
  }
}
