import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { OnboardingQuestionsService, OnboardingQuestionsData, OnboardingStepDto } from '../../core/onboarding-questions';
import { LanguageService } from '../languages/services/language.service';

const DEFAULT_ONBOARDING_JSON_PATH = 'docs/current_onboarding_questions.json';

/** Get nested value by dot path, e.g. "onboarding_questions.improvement_goal.step_question" */
function getValueByPath(obj: Record<string, any>, pathKey: string): string | undefined {
  if (!obj || typeof pathKey !== 'string') return undefined;
  const parts = pathKey.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

/** Resolve a string that may be a translation key into the translated text */
function resolveText(
  value: string,
  translations: Record<string, any> | null,
): string {
  if (!value || typeof value !== 'string') return value || '';
  if (!translations) return value;
  const key = value.trim();
  if (!key.includes('.')) return value;
  const resolved = getValueByPath(translations, key);
  return resolved !== undefined ? resolved : value;
}

@Injectable()
export class OnboardingQuestionsAdminService {
  private readonly logger = new Logger(OnboardingQuestionsAdminService.name);

  constructor(
    private readonly onboardingQuestionsService: OnboardingQuestionsService,
    private readonly languageService: LanguageService,
  ) {}

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
   * Get all onboarding questions, with translation keys resolved for the given language
   */
  async getAllOnboardingQuestions(language?: string): Promise<OnboardingStepDto[]> {
    const steps = this.onboardingQuestionsService.getAllOnboardingQuestions(language);
    return this.resolveStepsWithTranslations(steps, language);
  }

  /**
   * Get onboarding step by step name, with translation keys resolved
   */
  async getOnboardingStepByStepName(stepName: string, language?: string): Promise<OnboardingStepDto | undefined> {
    const step = this.onboardingQuestionsService.getOnboardingStepByStepName(stepName, language);
    if (!step) return undefined;
    const [resolved] = this.resolveStepsWithTranslations([step], language);
    return resolved;
  }

  /**
   * Get onboarding questions statistics
   */
  async getOnboardingQuestionsStats() {
    return this.onboardingQuestionsService.getOnboardingQuestionsStats();
  }

  /**
   * Get required onboarding steps only, with translation keys resolved
   */
  async getRequiredOnboardingSteps(language?: string): Promise<OnboardingStepDto[]> {
    const steps = this.onboardingQuestionsService.getRequiredOnboardingSteps(language);
    return this.resolveStepsWithTranslations(steps, language);
  }

  /**
   * Get optional onboarding steps only, with translation keys resolved
   */
  async getOptionalOnboardingSteps(language?: string): Promise<OnboardingStepDto[]> {
    const steps = this.onboardingQuestionsService.getOptionalOnboardingSteps(language);
    return this.resolveStepsWithTranslations(steps, language);
  }

  /**
   * Resolve translation keys (e.g. onboarding_questions.*) in step/question/answer texts using language cache
   */
  private resolveStepsWithTranslations(
    steps: OnboardingStepDto[],
    language?: string,
  ): OnboardingStepDto[] {
    const lang = language || 'en';
    const translations = this.languageService.getTranslationsByCode(lang);
    const hasTranslations = translations && typeof translations === 'object';
    const sampleKeys = hasTranslations ? Object.keys(translations).slice(0, 6) : [];
    this.logger.log(`[resolveStepsWithTranslations] lang="${lang}" translations=${hasTranslations ? `object with ${Object.keys(translations).length} topKeys` : 'NULL'} sampleTopKeys=[${sampleKeys.join(', ')}] stepsCount=${steps.length}`);
    if (hasTranslations && steps.length > 0) {
      const firstKey = steps[0].stepQuestion;
      const firstResolved = typeof firstKey === 'string' && firstKey.includes('.')
        ? (translations.onboarding_questions ? 'has onboarding_questions' : 'NO onboarding_questions in translations')
        : 'not a key';
      this.logger.log(`[resolveStepsWithTranslations] first stepQuestion key="${firstKey}" => ${firstResolved}`);
    }
    return steps.map(step => ({
      ...step,
      stepQuestion: resolveText(step.stepQuestion, translations),
      answers: step.answers.map(a => ({
        ...a,
        text: resolveText(a.text, translations),
        subtitle: resolveText(a.subtitle, translations),
      })),
    }));
  }

  /**
   * Push local onboarding JSON file to Google Drive, then reload from Drive.
   * @param filePath Path to JSON file (relative to project root or absolute). Default: docs/current_onboarding_questions.json
   */
  async pushLocalFileToDrive(filePath?: string): Promise<{ success: boolean; message: string }> {
    const resolvedPath = path.isAbsolute(filePath || '')
      ? filePath!
      : path.join(process.cwd(), filePath || DEFAULT_ONBOARDING_JSON_PATH);

    try {
      if (!fs.existsSync(resolvedPath)) {
        return {
          success: false,
          message: `File not found: ${resolvedPath}`,
        };
      }

      const raw = fs.readFileSync(resolvedPath, 'utf8');
      const content: OnboardingQuestionsData = JSON.parse(raw);

      if (!content.onboardingSteps || !Array.isArray(content.onboardingSteps)) {
        return {
          success: false,
          message: 'Invalid JSON: expected object with "onboardingSteps" array',
        };
      }

      await this.onboardingQuestionsService.pushContentToDrive(content);
      await this.onboardingQuestionsService.loadOnboardingQuestions();

      this.logger.log(`Pushed ${resolvedPath} to Google Drive and reloaded onboarding questions`);
      return {
        success: true,
        message: `Pushed to Google Drive and reloaded. File: ${resolvedPath}`,
      };
    } catch (error) {
      this.logger.error('Failed to push onboarding questions to Google Drive', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
