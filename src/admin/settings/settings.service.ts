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
import { GoogleDriveService } from '../../core/google-drive';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';

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
    programs: Date | null;
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
  trialMode: {
    periodDays: number;
    activitiesPerDay: number;
    articlesAvailable: boolean;
    surveysAvailable: boolean;
  };
}

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private config: SettingsConfig;

  private readonly settingsFileId: string | undefined;

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
    private readonly googleDriveService: GoogleDriveService,
    private readonly googleDriveFilesService: GoogleDriveFilesService,
  ) {
    this.settingsFileId = process.env.SETTINGS_FILE_ID;
    // Initialize default configuration
    this.config = this.getDefaultConfig();
  }

  async onModuleInit() {
    // Load settings from Google Drive if file ID is configured
    await this.loadSettingsFromGoogleDrive();
    // Register initial cron jobs
    this.registerCronJobs();
  }

  /**
   * Load settings from Google Drive file
   */
  private async loadSettingsFromGoogleDrive(): Promise<void> {
    if (!this.settingsFileId) {
      this.logger.warn('SETTINGS_FILE_ID not configured, using default settings');
      return;
    }

    try {
      this.logger.log('Loading settings from Google Drive...');
      const fileContent = await this.googleDriveService.getFileContent(this.settingsFileId);
      const settingsData = JSON.parse(fileContent);

      // Merge loaded settings with default config
      if (settingsData.suggestedActivities) {
        if (settingsData.suggestedActivities.count !== undefined) {
          this.config.suggestedActivities.count = settingsData.suggestedActivities.count;
        }
        if (settingsData.suggestedActivities.cron) {
          this.config.suggestedActivities.cron = {
            ...this.config.suggestedActivities.cron,
            ...settingsData.suggestedActivities.cron,
          };
        }
      }

      if (settingsData.articles) {
        if (settingsData.articles.count !== undefined) {
          this.config.articles.count = settingsData.articles.count;
        }
        if (settingsData.articles.expirationDays !== undefined) {
          this.config.articles.expirationDays = settingsData.articles.expirationDays;
        }
        if (settingsData.articles.cron) {
          this.config.articles.cron = {
            ...this.config.articles.cron,
            ...settingsData.articles.cron,
          };
        }
      }

      if (settingsData.surveys) {
        if (settingsData.surveys.count !== undefined) {
          this.config.surveys.count = settingsData.surveys.count;
        }
        if (settingsData.surveys.expirationDays !== undefined) {
          this.config.surveys.expirationDays = settingsData.surveys.expirationDays;
        }
        if (settingsData.surveys.cron) {
          this.config.surveys.cron = {
            ...this.config.surveys.cron,
            ...settingsData.surveys.cron,
          };
        }
      }

      if (settingsData.notifications?.cron) {
        this.config.notifications.cron = {
          ...this.config.notifications.cron,
          ...settingsData.notifications.cron,
        };
      }

      if (settingsData.trialMode) {
        if (settingsData.trialMode.periodDays !== undefined) {
          this.config.trialMode.periodDays = settingsData.trialMode.periodDays;
        }
        if (settingsData.trialMode.activitiesPerDay !== undefined) {
          this.config.trialMode.activitiesPerDay = settingsData.trialMode.activitiesPerDay;
        }
        if (settingsData.trialMode.articlesAvailable !== undefined) {
          this.config.trialMode.articlesAvailable = settingsData.trialMode.articlesAvailable;
        }
        if (settingsData.trialMode.surveysAvailable !== undefined) {
          this.config.trialMode.surveysAvailable = settingsData.trialMode.surveysAvailable;
        }
      }

      this.logger.log('Settings loaded successfully from Google Drive');
    } catch (error) {
      this.logger.error('Failed to load settings from Google Drive, using default settings', error);
    }
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
        programs: new Date(),
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
      trialMode: {
        periodDays: 7,
        activitiesPerDay: 3,
        articlesAvailable: false,
        surveysAvailable: false,
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
        programs: this.config.googleDriveSync.programs?.toISOString() || null,
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
      trialMode: {
        periodDays: this.config.trialMode.periodDays,
        activitiesPerDay: this.config.trialMode.activitiesPerDay,
        articlesAvailable: this.config.trialMode.articlesAvailable,
        surveysAvailable: this.config.trialMode.surveysAvailable,
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
      if (updateDto.googleDriveSync.programs !== undefined) {
        this.config.googleDriveSync.programs = updateDto.googleDriveSync.programs
          ? new Date(updateDto.googleDriveSync.programs)
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

    if (updateDto.trialMode) {
      if (updateDto.trialMode.periodDays !== undefined) {
        this.config.trialMode.periodDays = updateDto.trialMode.periodDays;
      }
      if (updateDto.trialMode.activitiesPerDay !== undefined) {
        this.config.trialMode.activitiesPerDay = updateDto.trialMode.activitiesPerDay;
      }
      if (updateDto.trialMode.articlesAvailable !== undefined) {
        this.config.trialMode.articlesAvailable = updateDto.trialMode.articlesAvailable;
      }
      if (updateDto.trialMode.surveysAvailable !== undefined) {
        this.config.trialMode.surveysAvailable = updateDto.trialMode.surveysAvailable;
      }
    }

    if (updateDto.notifications) {
      this.updateNotificationCronSettings(updateDto.notifications);
    }

    // Save settings to Google Drive if file ID is configured
    await this.saveSettingsToGoogleDrive();

    this.logger.log('Settings updated successfully');
    return this.getSettings();
  }

  /**
   * Save current settings configuration to Google Drive file
   */
  private async saveSettingsToGoogleDrive(): Promise<void> {
    if (!this.settingsFileId) {
      this.logger.warn('SETTINGS_FILE_ID not configured, skipping save to Google Drive');
      return;
    }

    if (!this.googleDriveFilesService.isAvailable()) {
      this.logger.warn('Google Drive not available, skipping save to Google Drive');
      return;
    }

    try {
      // Prepare settings data in the same format as loaded from Google Drive
      const settingsData = {
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
        trialMode: {
          periodDays: this.config.trialMode.periodDays,
          activitiesPerDay: this.config.trialMode.activitiesPerDay,
          articlesAvailable: this.config.trialMode.articlesAvailable,
          surveysAvailable: this.config.trialMode.surveysAvailable,
        },
      };

      await this.googleDriveFilesService.updateFileContent(this.settingsFileId, settingsData);
      this.logger.log('Settings saved successfully to Google Drive');
    } catch (error) {
      this.logger.error('Failed to save settings to Google Drive', error);
      // Don't throw error to prevent breaking the update flow
    }
  }

  /**
   * Update last sync timestamp for a specific module
   */
  updateLastSync(module: 'onboardingQuestions' | 'languages' | 'activityTypes' | 'socialNetworks' | 'moodTypes' | 'programs'): void {
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

