import { Injectable, Logger, OnModuleInit, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CronExpression } from '@nestjs/schedule';
import { UserTemporaryArticle } from './entities/user-temporary-article.entity';
import { UserTemporarySurvey } from './entities/user-temporary-survey.entity';
import { Article, ArticleStatus } from '../articles/entities/article.entity';
import { Survey, SurveyStatus } from '../survey/entities/survey.entity';
import { User } from '../../users/entities/user.entity';
import { SettingsResponseDto, UpdateSettingsDto } from './dto/settings.dto';
import { TemporaryItemsQueueService } from './queue/temporary-items-queue.service';
import { UsersService } from '../../users/users.service';
import { SuggestedActivityCronService } from '../../suggested-activity/cron/suggested-activity-cron.service';

export interface NotificationCronConfig {
  inactivity: string;
  mood: string;
  surveys: string;
  articles: string;
  globalActivity: string;
}

interface SettingsConfig {
  googleDriveSync: {
    onboardingQuestions: Date | null;
    languages: Date | null;
    activityTypes: Date | null;
    socialNetworks: Date | null;
    moodTypes: Date | null;
  };
  suggestedActivities: {
    count: number;
    cron: {
      generateDailySuggestions: string;
      cleanupOldSuggestions: string;
    };
  };
  articles: {
    count: number;
    cron: {
      generateArticles: string | null;
      cleanupOldArticles: string | null;
    };
    expirationDays: number;
  };
  surveys: {
    count: number;
    cron: {
      generateSurveys: string | null;
      cleanupOldSurveys: string | null;
    };
    expirationDays: number;
  };
  notifications: {
    cron: NotificationCronConfig;
  };
}

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private config: SettingsConfig;

  constructor(
    @InjectRepository(UserTemporaryArticle)
    private readonly userTemporaryArticleRepository: Repository<UserTemporaryArticle>,
    @InjectRepository(UserTemporarySurvey)
    private readonly userTemporarySurveyRepository: Repository<UserTemporarySurvey>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(forwardRef(() => SuggestedActivityCronService))
    private readonly suggestedActivityCronService: SuggestedActivityCronService,
    private readonly temporaryItemsQueueService: TemporaryItemsQueueService,
    private readonly usersService: UsersService,
  ) {
    // Initialize default configuration
    this.config = this.getDefaultConfig();
  }

  onModuleInit() {
    // Register initial cron jobs
    this.registerCronJobs();
  }

  private getDefaultConfig(): SettingsConfig {
    const twoDayCron = '0 0 */2 * *';
    return {
      googleDriveSync: {
        onboardingQuestions: new Date(),
        languages: new Date(),
        activityTypes: new Date(),
        socialNetworks: new Date(),
        moodTypes: new Date(),
      },
      suggestedActivities: {
        count: 3,
        cron: {
          generateDailySuggestions: CronExpression.EVERY_DAY_AT_6AM,
          cleanupOldSuggestions: CronExpression.EVERY_DAY_AT_3AM,
        },
      },
      articles: {
        count: 5,
        cron: {
          generateArticles: twoDayCron,
          cleanupOldArticles: twoDayCron,
        },
        expirationDays: 7,
      },
      surveys: {
        count: 3,
        cron: {
          generateSurveys: twoDayCron,
          cleanupOldSurveys: twoDayCron,
        },
        expirationDays: 7,
      },
      notifications: {
        cron: {
          inactivity: CronExpression.EVERY_DAY_AT_9AM,
          mood: CronExpression.EVERY_DAY_AT_10AM,
          surveys: CronExpression.EVERY_DAY_AT_11AM,
          articles: CronExpression.EVERY_DAY_AT_NOON,
          globalActivity: CronExpression.EVERY_DAY_AT_1PM,
        },
      },
    };
  }

  /**
   * Get current settings configuration
   */
  getSettings(): SettingsResponseDto {
    return {
      googleDriveSync: {
        onboardingQuestions: this.config.googleDriveSync.onboardingQuestions?.toISOString() || null,
        languages: this.config.googleDriveSync.languages?.toISOString() || null,
        activityTypes: this.config.googleDriveSync.activityTypes?.toISOString() || null,
        socialNetworks: this.config.googleDriveSync.socialNetworks?.toISOString() || null,
        moodTypes: this.config.googleDriveSync.moodTypes?.toISOString() || null,
      },
      suggestedActivities: {
        count: this.config.suggestedActivities.count,
        cron: {
          generateDailySuggestions: this.config.suggestedActivities.cron.generateDailySuggestions,
          cleanupOldSuggestions: this.config.suggestedActivities.cron.cleanupOldSuggestions,
        },
      },
      articles: {
        count: this.config.articles.count,
        cron: {
          generateArticles: this.config.articles.cron.generateArticles,
          cleanupOldArticles: this.config.articles.cron.cleanupOldArticles,
        },
        expirationDays: this.config.articles.expirationDays,
      },
      surveys: {
        count: this.config.surveys.count,
        cron: {
          generateSurveys: this.config.surveys.cron.generateSurveys,
          cleanupOldSurveys: this.config.surveys.cron.cleanupOldSurveys,
        },
        expirationDays: this.config.surveys.expirationDays,
      },
      notifications: {
        cron: {
          inactivity: this.config.notifications.cron.inactivity,
          mood: this.config.notifications.cron.mood,
          surveys: this.config.notifications.cron.surveys,
          articles: this.config.notifications.cron.articles,
          globalActivity: this.config.notifications.cron.globalActivity,
        },
      },
      cronExpressions: Array.from(new Set(Object.values(CronExpression))),
    };
  }

  /**
   * Update settings configuration
   */
  async updateSettings(updateDto: UpdateSettingsDto): Promise<SettingsResponseDto> {
    if (updateDto.googleDriveSync) {
      if (updateDto.googleDriveSync.onboardingQuestions !== undefined) {
        this.config.googleDriveSync.onboardingQuestions = updateDto.googleDriveSync.onboardingQuestions
          ? new Date(updateDto.googleDriveSync.onboardingQuestions)
          : null;
      }
      if (updateDto.googleDriveSync.languages !== undefined) {
        this.config.googleDriveSync.languages = updateDto.googleDriveSync.languages
          ? new Date(updateDto.googleDriveSync.languages)
          : null;
      }
      if (updateDto.googleDriveSync.activityTypes !== undefined) {
        this.config.googleDriveSync.activityTypes = updateDto.googleDriveSync.activityTypes
          ? new Date(updateDto.googleDriveSync.activityTypes)
          : null;
      }
      if (updateDto.googleDriveSync.socialNetworks !== undefined) {
        this.config.googleDriveSync.socialNetworks = updateDto.googleDriveSync.socialNetworks
          ? new Date(updateDto.googleDriveSync.socialNetworks)
          : null;
      }
      if (updateDto.googleDriveSync.moodTypes !== undefined) {
        this.config.googleDriveSync.moodTypes = updateDto.googleDriveSync.moodTypes
          ? new Date(updateDto.googleDriveSync.moodTypes)
          : null;
      }
    }

    if (updateDto.suggestedActivities) {
      if (updateDto.suggestedActivities.count !== undefined) {
        this.config.suggestedActivities.count = updateDto.suggestedActivities.count;
      }
      if (updateDto.suggestedActivities.cron) {
        if (updateDto.suggestedActivities.cron.generateDailySuggestions !== undefined) {
          this.config.suggestedActivities.cron.generateDailySuggestions =
            updateDto.suggestedActivities.cron.generateDailySuggestions;
          this.updateCronJob('generateDailySuggestions', this.config.suggestedActivities.cron.generateDailySuggestions);
        }
        if (updateDto.suggestedActivities.cron.cleanupOldSuggestions !== undefined) {
          this.config.suggestedActivities.cron.cleanupOldSuggestions =
            updateDto.suggestedActivities.cron.cleanupOldSuggestions;
          this.updateCronJob('cleanupOldSuggestions', this.config.suggestedActivities.cron.cleanupOldSuggestions);
        }
      }
    }

    if (updateDto.articles) {
      if (updateDto.articles.count !== undefined) {
        this.config.articles.count = updateDto.articles.count;
      }
      if (updateDto.articles.expirationDays !== undefined) {
        this.config.articles.expirationDays = updateDto.articles.expirationDays;
      }
      if (updateDto.articles.cron) {
        if (updateDto.articles.cron.generateArticles !== undefined) {
          this.config.articles.cron.generateArticles = updateDto.articles.cron.generateArticles;
          this.updateCronJob('generateArticles', this.config.articles.cron.generateArticles);
        }
        if (updateDto.articles.cron.cleanupOldArticles !== undefined) {
          this.config.articles.cron.cleanupOldArticles = updateDto.articles.cron.cleanupOldArticles;
          this.updateCronJob('cleanupOldArticles', this.config.articles.cron.cleanupOldArticles);
        }
      }
    }

    if (updateDto.surveys) {
      if (updateDto.surveys.count !== undefined) {
        this.config.surveys.count = updateDto.surveys.count;
      }
      if (updateDto.surveys.expirationDays !== undefined) {
        this.config.surveys.expirationDays = updateDto.surveys.expirationDays;
      }
      if (updateDto.surveys.cron) {
        if (updateDto.surveys.cron.generateSurveys !== undefined) {
          this.config.surveys.cron.generateSurveys = updateDto.surveys.cron.generateSurveys;
          this.updateCronJob('generateSurveys', this.config.surveys.cron.generateSurveys);
        }
        if (updateDto.surveys.cron.cleanupOldSurveys !== undefined) {
          this.config.surveys.cron.cleanupOldSurveys = updateDto.surveys.cron.cleanupOldSurveys;
          this.updateCronJob('cleanupOldSurveys', this.config.surveys.cron.cleanupOldSurveys);
        }
      }
    }

    if (updateDto.notifications) {
      this.updateNotificationCronSettings(updateDto.notifications);
    }

    this.logger.log('Settings updated successfully');
    return this.getSettings();
  }

  /**
   * Update last sync timestamp for a specific module
   */
  updateLastSync(module: 'onboardingQuestions' | 'languages' | 'activityTypes' | 'socialNetworks' | 'moodTypes'): void {
    this.config.googleDriveSync[module] = new Date();
    this.logger.log(`Updated last sync timestamp for ${module}`);
  }

  /**
   * Get notifications cron configuration
   */
  getNotificationCronSettings(): NotificationCronConfig {
    return { ...this.config.notifications.cron };
  }

  /**
   * Update notifications cron configuration
   */
  updateNotificationCronSettings(cronDto: Partial<NotificationCronConfig>): NotificationCronConfig {
    const updated: NotificationCronConfig = { ...this.config.notifications.cron };

    const entries = Object.entries(cronDto) as Array<[keyof NotificationCronConfig, string | undefined]>;
    for (const [key, value] of entries) {
      if (value === undefined) {
        continue;
      }
      const normalized = value.trim();
      if (!normalized) {
        throw new BadRequestException(`Cron expression for "${key}" cannot be empty`);
      }
      this.assertValidCronExpression(normalized, key);
      updated[key] = normalized;
    }

    this.config.notifications.cron = updated;
    this.logger.log('Notification cron settings updated');
    return updated;
  }

  private assertValidCronExpression(expression: string, field: string): void {
    try {
      // Using CronJob to validate expression format
      new CronJob(expression, () => undefined);
    } catch (error) {
      this.logger.warn(`Invalid cron expression for ${field}: ${expression}`);
      throw new BadRequestException(`Invalid cron expression for "${field}": ${expression}`);
    }
  }

  /**
   * Get suggested activities count
   */
  getSuggestedActivitiesCount(): number {
    return this.config.suggestedActivities.count;
  }

  /**
   * Get articles count
   */
  getArticlesCount(): number {
    return this.config.articles.count;
  }

  /**
   * Get surveys count
   */
  getSurveysCount(): number {
    return this.config.surveys.count;
  }

  /**
   * Get articles expiration days
   */
  getArticlesExpirationDays(): number {
    return this.config.articles.expirationDays;
  }

  /**
   * Get surveys expiration days
   */
  getSurveysExpirationDays(): number {
    return this.config.surveys.expirationDays;
  }

  /**
   * Register all cron jobs
   */
  private registerCronJobs(): void {
    // Register suggested activities cron jobs
    this.registerCronJob(
      'generateDailySuggestions',
      this.config.suggestedActivities.cron.generateDailySuggestions,
      () => this.suggestedActivityCronService.generateDailySuggestions(),
    );
    this.registerCronJob(
      'cleanupOldSuggestions',
      this.config.suggestedActivities.cron.cleanupOldSuggestions,
      () => this.suggestedActivityCronService.cleanupOldSuggestions(),
    );

    // Register articles cron jobs if configured
    if (this.config.articles.cron.generateArticles) {
      this.registerCronJob(
        'generateArticles',
        this.config.articles.cron.generateArticles,
        () => this.generateTemporaryArticles('cron'),
      );
    }
    if (this.config.articles.cron.cleanupOldArticles) {
      this.registerCronJob(
        'cleanupOldArticles',
        this.config.articles.cron.cleanupOldArticles,
        () => this.cleanupOldTemporaryArticles(),
      );
    }

    // Register surveys cron jobs if configured
    if (this.config.surveys.cron.generateSurveys) {
      this.registerCronJob(
        'generateSurveys',
        this.config.surveys.cron.generateSurveys,
        () => this.generateTemporarySurveys('cron'),
      );
    }
    if (this.config.surveys.cron.cleanupOldSurveys) {
      this.registerCronJob(
        'cleanupOldSurveys',
        this.config.surveys.cron.cleanupOldSurveys,
        () => this.cleanupOldTemporarySurveys(),
      );
    }
  }

  /**
   * Register a single cron job
   */
  private registerCronJob(name: string, cronExpression: string | null, callback?: () => void): void {
    if (!cronExpression) {
      return;
    }

    try {
      // Remove existing job if exists
      if (this.schedulerRegistry.doesExist('cron', name)) {
        this.schedulerRegistry.deleteCronJob(name);
      }

      const job = new CronJob(cronExpression, () => {
        this.logger.log(`Cron job ${name} executed`);
        if (callback) {
          callback();
        }
      });

      this.schedulerRegistry.addCronJob(name, job);
      job.start();
      this.logger.log(`Registered cron job: ${name} with expression: ${cronExpression}`);
    } catch (error) {
      this.logger.error(`Failed to register cron job ${name}:`, error);
    }
  }

  /**
   * Update an existing cron job
   */
  private updateCronJob(name: string, cronExpression: string | null): void {
    if (!cronExpression) {
      // Remove job if expression is null
      if (this.schedulerRegistry.doesExist('cron', name)) {
        this.schedulerRegistry.deleteCronJob(name);
        this.logger.log(`Removed cron job: ${name}`);
      }
      return;
    }

    // Get callback based on job name
    let callback: (() => void) | undefined;
    if (name === 'generateDailySuggestions') {
      callback = () => this.suggestedActivityCronService.generateDailySuggestions();
    } else if (name === 'cleanupOldSuggestions') {
      callback = () => this.suggestedActivityCronService.cleanupOldSuggestions();
    } else if (name === 'generateArticles') {
      callback = () => this.generateTemporaryArticles('cron');
    } else if (name === 'cleanupOldArticles') {
      callback = () => this.cleanupOldTemporaryArticles();
    } else if (name === 'generateSurveys') {
      callback = () => this.generateTemporarySurveys('cron');
    } else if (name === 'cleanupOldSurveys') {
      callback = () => this.cleanupOldTemporarySurveys();
    }

    this.registerCronJob(name, cronExpression, callback);
  }

  /**
   * Get temporary articles for a user
   */
  async getUserTemporaryArticles(userId: number): Promise<UserTemporaryArticle[]> {
    return this.userTemporaryArticleRepository
      .createQueryBuilder('assignment')
      .innerJoinAndSelect('assignment.article', 'article', 'article.status = :status', {
        status: ArticleStatus.ACTIVE,
      })
      .where('assignment.userId = :userId', { userId })
      .orderBy('assignment.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Create temporary articles for users (called by cron)
   * Uses pagination and queue for processing
   */
  async generateTemporaryArticles(triggeredBy: string = 'manual'): Promise<void> {
    await this.temporaryItemsQueueService.addGenerateTemporaryArticlesBatchJob(triggeredBy);
  }

  async runGenerateTemporaryArticlesBatch(triggeredBy: string = 'manual'): Promise<void> {
    this.logger.log(`Starting generation of temporary articles... (triggered by ${triggeredBy})`);
    
    try {
      const activeArticles = await this.articleRepository.find({
        where: { status: ArticleStatus.ACTIVE },
      });

      if (activeArticles.length === 0) {
        this.logger.warn('No active articles found');
        return;
      }

      const pageSize = parseInt(process.env.USERS_PAGE_SIZE || '10', 10);
      const delayBetweenPages = parseInt(process.env.USERS_PAGE_DELAY || '2000', 10);
      
      this.logger.log(`Pagination settings: page size=${pageSize}, delay=${delayBetweenPages}ms`);

      let totalProcessed = 0;
      let page = 1;
      let hasMoreUsers = true;

      while (hasMoreUsers) {
        try {
          const usersPage = await this.usersService.findUsersWithPagination(page, pageSize, {
            excludeRoles: ['admin'],
          });
          
          if (!usersPage.users || usersPage.users.length === 0) {
            hasMoreUsers = false;
            this.logger.log(`Page ${page}: no users found, finishing`);
            break;
          }

          this.logger.log(`Page ${page}: received ${usersPage.users.length} users`);

          const userIds = usersPage.users.map(user => user.id);
          await this.temporaryItemsQueueService.addBulkGenerateTemporaryArticlesJobs(userIds);
          
          totalProcessed += userIds.length;
          this.logger.log(`Page ${page}: added ${userIds.length} temporary articles generation tasks. Total processed: ${totalProcessed}`);

          hasMoreUsers = usersPage.users.length === pageSize;
          page++;

          if (hasMoreUsers) {
            this.logger.log(`Pause ${delayBetweenPages}ms before next page...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenPages));
          }

        } catch (error) {
          this.logger.error(`Error processing page ${page}: ${error.message}`);
          page++;
        }
      }

      this.logger.log(`User processing completed. Total processed: ${totalProcessed} users`);
      
      const queueStats = await this.temporaryItemsQueueService.getQueueStats();
      this.logger.log(`Queue statistics: ${JSON.stringify(queueStats)}`);

    } catch (error) {
      this.logger.error('Failed to generate temporary articles:', error);
      throw error;
    }
  }

  /**
   * Cleanup expired temporary articles
   */
  async cleanupOldTemporaryArticles(): Promise<void> {
    this.logger.log('Starting cleanup of expired temporary articles...');
    
    try {
      const now = new Date();
      const result = await this.userTemporaryArticleRepository
        .createQueryBuilder()
        .delete()
        .where('expiresAt IS NOT NULL AND expiresAt < :now', { now })
        .execute();

      this.logger.log(`Cleaned up ${result.affected || 0} expired temporary articles`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired temporary articles:', error);
      throw error;
    }
  }

  /**
   * Get temporary surveys for a user
   */
  async getUserTemporarySurveys(userId: number): Promise<UserTemporarySurvey[]> {
    return this.userTemporarySurveyRepository
      .createQueryBuilder('assignment')
      .innerJoinAndSelect('assignment.survey', 'survey', 'survey.status = :status', {
        status: SurveyStatus.ACTIVE,
      })
      .where('assignment.userId = :userId', { userId })
      .orderBy('assignment.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Create temporary surveys for users (called by cron)
   * Uses pagination and queue for processing
   */
  async generateTemporarySurveys(triggeredBy: string = 'manual'): Promise<void> {
    await this.temporaryItemsQueueService.addGenerateTemporarySurveysBatchJob(triggeredBy);
  }

  async runGenerateTemporarySurveysBatch(triggeredBy: string = 'manual'): Promise<void> {
    this.logger.log(`Starting generation of temporary surveys... (triggered by ${triggeredBy})`);
    
    try {
      const activeSurveys = await this.surveyRepository.find({
        where: { status: SurveyStatus.ACTIVE },
      });

      if (activeSurveys.length === 0) {
        this.logger.warn('No active surveys found');
        return;
      }

      const pageSize = parseInt(process.env.USERS_PAGE_SIZE || '10', 10);
      const delayBetweenPages = parseInt(process.env.USERS_PAGE_DELAY || '2000', 10);
      
      this.logger.log(`Pagination settings: page size=${pageSize}, delay=${delayBetweenPages}ms`);

      let totalProcessed = 0;
      let page = 1;
      let hasMoreUsers = true;

      while (hasMoreUsers) {
        try {
          const usersPage = await this.usersService.findUsersWithPagination(page, pageSize, {
            excludeRoles: ['admin'],
          });
          
          if (!usersPage.users || usersPage.users.length === 0) {
            hasMoreUsers = false;
            this.logger.log(`Page ${page}: no users found, finishing`);
            break;
          }

          this.logger.log(`Page ${page}: received ${usersPage.users.length} users`);

          const userIds = usersPage.users.map(user => user.id);
          await this.temporaryItemsQueueService.addBulkGenerateTemporarySurveysJobs(userIds);
          
          totalProcessed += userIds.length;
          this.logger.log(`Page ${page}: added ${userIds.length} temporary surveys generation tasks. Total processed: ${totalProcessed}`);

          hasMoreUsers = usersPage.users.length === pageSize;
          page++;

          if (hasMoreUsers) {
            this.logger.log(`Pause ${delayBetweenPages}ms before next page...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenPages));
          }

        } catch (error) {
          this.logger.error(`Error processing page ${page}: ${error.message}`);
          page++;
        }
      }

      this.logger.log(`User processing completed. Total processed: ${totalProcessed} users`);
      
      const queueStats = await this.temporaryItemsQueueService.getQueueStats();
      this.logger.log(`Queue statistics: ${JSON.stringify(queueStats)}`);

    } catch (error) {
      this.logger.error('Failed to generate temporary surveys:', error);
      throw error;
    }
  }

  /**
   * Cleanup expired temporary surveys
   */
  async cleanupOldTemporarySurveys(): Promise<void> {
    this.logger.log('Starting cleanup of expired temporary surveys...');
    
    try {
      const now = new Date();
      const result = await this.userTemporarySurveyRepository
        .createQueryBuilder()
        .delete()
        .where('expiresAt IS NOT NULL AND expiresAt < :now', { now })
        .execute();

      this.logger.log(`Cleaned up ${result.affected || 0} expired temporary surveys`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired temporary surveys:', error);
      throw error;
    }
  }
}

