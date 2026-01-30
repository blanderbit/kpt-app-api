import { Injectable, Logger, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { OnboardingStepDto, OnboardingQuestionsStatsDto } from './onboarding-question.dto';
import { SettingsService } from '../../admin/settings/settings.service';

export type LocalizedText = string | Record<string, string> | null | undefined;

export interface OnboardingAnswer {
  id: string;
  text: LocalizedText;
  subtitle: LocalizedText;
  icon: string;
}

export interface OnboardingStep {
  stepName: string;
  stepQuestion: LocalizedText;
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
  private readonly defaultLanguageCode: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly googleDriveFilesService: GoogleDriveFilesService,
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService?: SettingsService,
  ) {
    this.onboardingQuestionsData = { onboardingSteps: [] };
    this.fileId = this.configService.get<string>('ONBOARDING_QUESTIONS_FILE_ID') || '';
    this.defaultLanguageCode = this.configService.get<string>('DEFAULT_LANGUAGE_CODE') || 'en';
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
   * Push onboarding questions content to Google Drive (overwrites the file identified by ONBOARDING_QUESTIONS_FILE_ID).
   * Call loadOnboardingQuestions() after this to refresh in-memory cache.
   */
  async pushContentToDrive(content: OnboardingQuestionsData): Promise<void> {
    if (!this.fileId) {
      this.logger.warn('ONBOARDING_QUESTIONS_FILE_ID not set, cannot push to Drive');
      throw AppException.validation(ErrorCode.ADMIN_CONFIGURATION_ERROR, 'ONBOARDING_QUESTIONS_FILE_ID is not configured');
    }
    if (!this.googleDriveFilesService.isAvailable()) {
      throw AppException.validation(ErrorCode.ADMIN_GOOGLE_DRIVE_CONNECTION_FAILED, 'Google Drive is not available');
    }
    await this.googleDriveFilesService.updateFileContent(this.fileId, content);
    this.logger.log('Onboarding questions content pushed to Google Drive');
  }

  /**
   * Get all onboarding questions
   */
  getAllOnboardingQuestions(language?: string): OnboardingStepDto[] {
    return this.onboardingQuestionsData.onboardingSteps.map(step => this.mapStepForLanguage(step, language));
  }

  /**
   * Get onboarding step by name
   */
  getOnboardingStepByStepName(stepName: string, language?: string): OnboardingStepDto | undefined {
    const step = this.onboardingQuestionsData.onboardingSteps.find(s => s.stepName === stepName);
    return step ? this.mapStepForLanguage(step, language) : undefined;
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
  getRequiredOnboardingSteps(language?: string): OnboardingStepDto[] {
    return this.onboardingQuestionsData.onboardingSteps
      .filter(step => step.required)
      .map(step => this.mapStepForLanguage(step, language));
  }

  /**
   * Get optional onboarding steps only
   */
  getOptionalOnboardingSteps(language?: string): OnboardingStepDto[] {
    return this.onboardingQuestionsData.onboardingSteps
      .filter(step => !step.required)
      .map(step => this.mapStepForLanguage(step, language));
  }

  private mapStepForLanguage(step: OnboardingStep, language?: string): OnboardingStepDto {
    return {
      stepName: step.stepName,
      stepQuestion: this.resolveLocalizedText(step.stepQuestion, language),
      answers: step.answers.map(answer => ({
        id: answer.id,
        text: this.resolveLocalizedText(answer.text, language),
        subtitle: this.resolveLocalizedText(answer.subtitle, language),
        icon: answer.icon,
      })),
      inputType: step.inputType,
      required: step.required,
    };
  }

  private resolveLocalizedText(value: LocalizedText, language?: string): string {
    if (typeof value === 'string') {
      return value;
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return '';
    }

    const normalizedLanguage = this.normalizeLanguageCode(language);
    const normalizedDefault = this.normalizeLanguageCode(this.defaultLanguageCode);

    if (normalizedLanguage && typeof value[normalizedLanguage] === 'string') {
      return value[normalizedLanguage] as string;
    }

    const normalizedLanguageBase = normalizedLanguage?.split('-')[0];
    if (normalizedLanguageBase && typeof value[normalizedLanguageBase] === 'string') {
      return value[normalizedLanguageBase] as string;
    }

    if (normalizedDefault && typeof value[normalizedDefault] === 'string') {
      return value[normalizedDefault] as string;
    }

    const normalizedDefaultBase = normalizedDefault?.split('-')[0];
    if (normalizedDefaultBase && typeof value[normalizedDefaultBase] === 'string') {
      return value[normalizedDefaultBase] as string;
    }

    if (typeof value.en === 'string') {
      return value.en;
    }

    for (const key of Object.keys(value)) {
      const candidate = value[key];
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        return candidate;
      }
    }

    return '';
  }

  private normalizeLanguageCode(language?: string): string | undefined {
    if (!language) {
      return undefined;
    }

    return language.trim().toLowerCase().replace('_', '-');
  }
}
