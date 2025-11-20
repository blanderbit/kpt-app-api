import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserTemporaryArticle } from '../entities/user-temporary-article.entity';
import { UserTemporarySurvey } from '../entities/user-temporary-survey.entity';
import { User } from '../../../users/entities/user.entity';
import { Article, ArticleStatus } from '../../articles/entities/article.entity';
import { Survey, SurveyStatus } from '../../survey/entities/survey.entity';
import { SettingsService } from '../settings.service';
import { LanguageService } from '../../languages/services/language.service';
import {
  GenerateTemporaryArticlesBatchJob,
  GenerateTemporaryArticlesJob,
  GenerateTemporarySurveysBatchJob,
  GenerateTemporarySurveysJob,
} from './temporary-items.types';

@Processor('temporary-items')
@Injectable()
export class TemporaryItemsProcessor {
  private readonly logger = new Logger(TemporaryItemsProcessor.name);

  constructor(
    @InjectRepository(UserTemporaryArticle)
    private readonly userTemporaryArticleRepository: Repository<UserTemporaryArticle>,
    @InjectRepository(UserTemporarySurvey)
    private readonly userTemporarySurveyRepository: Repository<UserTemporarySurvey>,
    private readonly settingsService: SettingsService,
    @Inject(forwardRef(() => LanguageService))
    private readonly languageService: LanguageService,
  ) {}

  @Process('generate-temporary-articles-batch')
  async handleGenerateTemporaryArticlesBatch(job: Job<GenerateTemporaryArticlesBatchJob>) {
    const triggeredBy = job.data?.triggeredBy ?? 'manual';
    this.logger.log(`Executing temporary articles batch generation (triggered by ${triggeredBy})`);
    await this.settingsService.runGenerateTemporaryArticlesBatch(triggeredBy);
  }

  @Process('generate-temporary-surveys-batch')
  async handleGenerateTemporarySurveysBatch(job: Job<GenerateTemporarySurveysBatchJob>) {
    const triggeredBy = job.data?.triggeredBy ?? 'manual';
    this.logger.log(`Executing temporary surveys batch generation (triggered by ${triggeredBy})`);
    await this.settingsService.runGenerateTemporarySurveysBatch(triggeredBy);
  }

  @Process('generate-temporary-articles')
  async handleGenerateTemporaryArticles(job: Job<GenerateTemporaryArticlesJob>) {
    const { userId } = job.data;

    this.logger.log(`Starting temporary articles generation for user ${userId}`);

    try {
      return await this.executeWithDeadlockRetry(
        () =>
          this.userTemporaryArticleRepository.manager.transaction(async (manager) =>
            this.generateTemporaryArticlesForUser(manager, userId),
          ),
        'generating temporary articles',
        userId,
      );
    } catch (error) {
      this.logger.error(`Error generating temporary articles for user ${userId}: ${error.message}`);

      return {
        userId,
        success: false,
        articlesCount: 0,
        error: error.message,
      };
    }
  }

  @Process('generate-temporary-surveys')
  async handleGenerateTemporarySurveys(job: Job<GenerateTemporarySurveysJob>) {
    const { userId } = job.data;

    this.logger.log(`Starting temporary surveys generation for user ${userId}`);

    try {
      return await this.executeWithDeadlockRetry(
        () =>
          this.userTemporarySurveyRepository.manager.transaction(async (manager) =>
            this.generateTemporarySurveysForUser(manager, userId),
          ),
        'generating temporary surveys',
        userId,
      );
    } catch (error) {
      this.logger.error(`Error generating temporary surveys for user ${userId}: ${error.message}`);

      return {
        userId,
        success: false,
        surveysCount: 0,
        error: error.message,
      };
    }
  }

  /**
   * Get user language or default language
   */
  private getUserLanguage(user: User | null): string | null {
    // First, try to get language from user
    if (user?.language) {
      return user.language;
    }

    // If user language is not set, try to get default language from cache
    const languages = this.languageService.getLanguagesFromCache();
    const defaultLanguage = languages.find(lang => lang.isDefault);
    
    if (defaultLanguage) {
      return defaultLanguage.code;
    }

    // If no default language found, return null (no filtering)
    return null;
  }

  private async generateTemporaryArticlesForUser(manager: EntityManager, userId: number) {
    const articleRepository = manager.getRepository(Article);
    const userTemporaryArticleRepository = manager.getRepository(UserTemporaryArticle);

    const count = this.settingsService.getArticlesCount();
    if (count <= 0) {
      this.logger.warn(`Articles count is ${count} for user ${userId}, skipping generation`);
      return {
        userId,
        success: true,
        articlesCount: 0,
      };
    }

    const userRepository = manager.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      this.logger.warn(`User ${userId} not found, skipping temporary articles generation`);
      return {
        userId,
        success: true,
        articlesCount: 0,
      };
    }

    // Get user language or default language
    const userLanguage = this.getUserLanguage(user);

    const queryBuilder = articleRepository
      .createQueryBuilder('article')
      .where('article.status = :status', { status: ArticleStatus.ACTIVE });

    // Filter by language if available
    if (userLanguage) {
      queryBuilder.andWhere('article.language = :language', { language: userLanguage });
    }

    const activeArticles = await queryBuilder
      .orderBy('RAND()')
      .limit(count)
      .getMany();

    if (activeArticles.length === 0) {
      this.logger.warn(`No active articles found for user ${userId}`);
      return {
        userId,
        success: true,
        articlesCount: 0,
      };
    }

    const expirationDays = this.settingsService.getArticlesExpirationDays();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    await userTemporaryArticleRepository
      .createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId })
      .execute();

    const temporaryArticles = activeArticles.map((article) =>
      userTemporaryArticleRepository.create({
        user,
        article,
        expiresAt,
      }),
    );

    if (temporaryArticles.length > 0) {
      await userTemporaryArticleRepository.save(temporaryArticles);
      this.logger.log(`User ${userId}: created ${temporaryArticles.length} temporary articles`);
    } else {
      this.logger.log(`User ${userId}: no temporary articles created (none selected)`);
    }

    return {
      userId,
      success: true,
      articlesCount: temporaryArticles.length,
    };
  }

  private async generateTemporarySurveysForUser(manager: EntityManager, userId: number) {
    const surveyRepository = manager.getRepository(Survey);
    const userTemporarySurveyRepository = manager.getRepository(UserTemporarySurvey);

    const count = this.settingsService.getSurveysCount();
    if (count <= 0) {
      this.logger.warn(`Surveys count is ${count} for user ${userId}, skipping generation`);
      return {
        userId,
        success: true,
        surveysCount: 0,
      };
    }

    const userRepository = manager.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      this.logger.warn(`User ${userId} not found, skipping temporary surveys generation`);
      return {
        userId,
        success: true,
        surveysCount: 0,
      };
    }

    // Get user language or default language
    const userLanguage = this.getUserLanguage(user);

    const queryBuilder = surveyRepository
      .createQueryBuilder('survey')
      .where('survey.status = :status', { status: SurveyStatus.ACTIVE });

    // Filter by language if available
    if (userLanguage) {
      queryBuilder.andWhere('survey.language = :language', { language: userLanguage });
    }

    const activeSurveys = await queryBuilder
      .orderBy('RAND()')
      .limit(count)
      .getMany();

    if (activeSurveys.length === 0) {
      this.logger.warn(`No active surveys found for user ${userId}`);
      return {
        userId,
        success: true,
        surveysCount: 0,
      };
    }

    const expirationDays = this.settingsService.getSurveysExpirationDays();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    await userTemporarySurveyRepository
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId })
      .execute();

    const temporarySurveys = activeSurveys.map((survey) =>
      userTemporarySurveyRepository.create({
        user,
        survey,
        expiresAt,
      }),
    );

    if (temporarySurveys.length > 0) {
      await userTemporarySurveyRepository.save(temporarySurveys);
      this.logger.log(`User ${userId}: created ${temporarySurveys.length} temporary surveys`);
    } else {
      this.logger.log(`User ${userId}: no temporary surveys created (none selected)`);
    }

    return {
      userId,
      success: true,
      surveysCount: temporarySurveys.length,
    };
  }

  private async executeWithDeadlockRetry<T>(
    operation: () => Promise<T>,
    context: string,
    userId: number,
    maxAttempts = 3,
  ): Promise<T> {
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        attempt += 1;
        if (!this.isDeadlockError(error) || attempt >= maxAttempts) {
          throw error;
        }

        const delay = 200 * attempt;
        this.logger.warn(
          `Deadlock detected while ${context} for user ${userId}. Retry ${attempt}/${maxAttempts} in ${delay}ms`,
        );
        await this.delay(delay);
      }
    }

    throw new Error(`Failed ${context} for user ${userId} after ${maxAttempts} attempts`);
  }

  private isDeadlockError(error: any): boolean {
    if (!error) {
      return false;
    }

    return (
      error?.code === 'ER_LOCK_DEADLOCK' ||
      error?.errno === 1213 ||
      (typeof error?.message === 'string' && error.message.includes('Deadlock found'))
    );
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
