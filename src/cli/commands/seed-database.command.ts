import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner, DeepPartial } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { promises as fs } from 'fs';
import * as path from 'path';

import { User } from '../../users/entities/user.entity';
import { Activity } from '../../profile/activity/entities/activity.entity';
import { RateActivity } from '../../profile/activity/entities/rate-activity.entity';
import { MoodTracker } from '../../profile/mood-tracker/entities/mood-tracker.entity';
import { MoodSurvey } from '../../profile/mood-tracker/entities/mood-survey.entity';
import { SuggestedActivity } from '../../suggested-activity/entities/suggested-activity.entity';
import { UserSurvey } from '../../admin/survey/entities/user-survey.entity';
import { Survey, SurveyQuestion, SurveyStatus } from '../../admin/survey/entities/survey.entity';
import { UserTemporarySurvey } from '../../admin/settings/entities/user-temporary-survey.entity';
import { Article, ArticleStatus } from '../../admin/articles/entities/article.entity';
import { UserTemporaryArticle } from '../../admin/settings/entities/user-temporary-article.entity';
import { UserHiddenArticle } from '../../admin/articles/entities/user-hidden-article.entity';
import { UserDevice, DevicePlatform } from '../../notifications/entities/user-device.entity';
import { NotificationType, UserNotificationTracker } from '../../notifications/entities/user-notification.entity';
import { File } from '../../common/entities/file.entity';
import { Subscription } from '../../pay/subscriptions/entities/subscription.entity';
import { SubscriptionPlanInterval } from '../../pay/subscriptions/enums/subscription-plan-interval.enum';
import { SubscriptionStatus } from '../../pay/subscriptions/enums/subscription-status.enum';
import { SubscriptionProvider } from '../../pay/subscriptions/enums/subscription-provider.enum';
import {
  ActivityTypesService,
  ActivityType,
  ActivityTypesData,
} from '../../core/activity-types/activity-types.service';
import { MoodTypesService, MoodType, MoodTypesData } from '../../core/mood-types/mood-types.service';
import {
  OnboardingQuestionsService,
  LocalizedText,
  OnboardingStep,
  OnboardingQuestionsData,
} from '../../core/onboarding-questions/onboarding-questions.service';
import { OnboardingStepDto } from '../../core/onboarding-questions';
import {
  SocialNetworksService,
  SocialNetwork,
  SocialNetworksData,
} from '../../core/social-networks/social-networks.service';

interface SeedOptions {
  users?: number;
  admins?: number;
  skipClean?: boolean;
}

interface SeedArguments {
  regularUsers: number;
  adminUsers: number;
  skipClean: boolean;
}

interface ReferenceData {
  activityTypes: ActivityType[];
  moodTypes: MoodType[];
  onboardingSteps: OnboardingStepDto[];
  socialNetworks: SocialNetwork[];
}

@Injectable()
@Command({
  name: 'seed-database',
  description: 'Populate the database with demo data for development and testing',
})
export class SeedDatabaseCommand extends CommandRunner {
  private readonly logger = new Logger(SeedDatabaseCommand.name);
  private referenceData: ReferenceData | null = null;

  constructor(
    private readonly dataSource: DataSource,
    private readonly activityTypesService: ActivityTypesService,
    private readonly moodTypesService: MoodTypesService,
    private readonly onboardingQuestionsService: OnboardingQuestionsService,
    private readonly socialNetworksService: SocialNetworksService,
  ) {
    super();
  }

  async run(passedParams: string[], options?: SeedOptions): Promise<void> {
    const args: SeedArguments = {
      regularUsers: Number.isFinite(options?.users) ? Number(options?.users) : 100,
      adminUsers: Number.isFinite(options?.admins) ? Number(options?.admins) : 10,
      skipClean: Boolean(options?.skipClean),
    };

    this.logger.log(
      `Starting database seed (users=${args.regularUsers}, admins=${args.adminUsers}, skipClean=${args.skipClean})`,
    );

    try {
      await this.seedDatabase(args);
      this.logger.log('✅ Database seed completed successfully');
    } catch (error) {
      this.logger.error('❌ Database seed failed', error instanceof Error ? error.stack : String(error));
      process.exit(1);
    }
  }

  @Option({
    flags: '--users <number>',
    description: 'Number of regular users to generate (default: 100)',
  })
  parseUsers(val: string): number {
    const parsed = Number.parseInt(val, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
  }

  @Option({
    flags: '--admins <number>',
    description: 'Number of admin users to generate (default: 10)',
  })
  parseAdmins(val: string): number {
    const parsed = Number.parseInt(val, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 10;
  }

  @Option({
    flags: '--skip-clean',
    description: 'Do not truncate tables before seeding',
  })
  parseSkipClean(): boolean {
    return true;
  }

  private async seedDatabase(args: SeedArguments): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!args.skipClean) {
        await this.cleanDatabase(queryRunner);
      }

      const manager = queryRunner.manager;

      const userRepo = manager.getRepository(User);
      const moodSurveyRepo = manager.getRepository(MoodSurvey);
      const activityRepo = manager.getRepository(Activity);
      const rateActivityRepo = manager.getRepository(RateActivity);
      const moodTrackerRepo = manager.getRepository(MoodTracker);
      const suggestedActivityRepo = manager.getRepository(SuggestedActivity);
      const surveyRepo = manager.getRepository(Survey);
      const userSurveyRepo = manager.getRepository(UserSurvey);
      const userTemporarySurveyRepo = manager.getRepository(UserTemporarySurvey);
      const articleRepo = manager.getRepository(Article);
      const userTemporaryArticleRepo = manager.getRepository(UserTemporaryArticle);
      const userHiddenArticleRepo = manager.getRepository(UserHiddenArticle);
      const userDeviceRepo = manager.getRepository(UserDevice);
      const notificationTrackerRepo = manager.getRepository(UserNotificationTracker);
      const fileRepo = manager.getRepository(File);
      const subscriptionRepo = manager.getRepository(Subscription);

      const passwordHash = await bcrypt.hash('Password123!', 10);
      const referenceData = await this.loadReferenceData();

      const lastUserIdRow = await userRepo.createQueryBuilder('user').select('MAX(user.id)', 'max').getRawOne();
      const lastUserId = Number(lastUserIdRow?.max ?? 0);

      const adminSeed = this.generateAdminUsers(args.adminUsers, passwordHash, referenceData, lastUserId);
      const regularSeed = this.generateRegularUsers(
        args.regularUsers,
        passwordHash,
        referenceData,
        lastUserId + adminSeed.length,
      );

      const adminUsers = await userRepo.save(adminSeed);
      const regularUsers = await userRepo.save(regularSeed);
      const allUsers = [...adminUsers, ...regularUsers];

      const moodSurveys = await moodSurveyRepo.save(this.generateMoodSurveys());
      const activeMoodSurveys = moodSurveys.filter((survey) => !survey.isArchived);

      const surveys = await surveyRepo.save(this.generateSurveys(adminUsers));
      const activeSurveys = surveys.filter((survey) => survey.status === SurveyStatus.ACTIVE);

      const articles = await articleRepo.save(this.generateArticles(adminUsers));
      const activeArticles = articles.filter((article) => article.status === ArticleStatus.ACTIVE);

      await fileRepo.save(this.generateFilesForSurveys(surveys));
      await fileRepo.save(this.generateFilesForArticles(articles));

      const activities = await activityRepo.save(this.generateActivities(allUsers, referenceData));
      await rateActivityRepo.save(this.generateActivityRatings(activities));

      const moodTrackers = await moodTrackerRepo.save(
        this.generateMoodTrackers(allUsers, activeMoodSurveys, referenceData.moodTypes),
      );
      await this.attachMoodSurveysToTrackers(queryRunner, moodTrackers, activeMoodSurveys);

      await suggestedActivityRepo.save(this.generateSuggestedActivities(allUsers, referenceData.activityTypes));

      await userSurveyRepo.save(this.generateUserSurveys(allUsers, surveys));
      await userTemporarySurveyRepo.save(this.generateUserTemporarySurveys(allUsers, activeSurveys));

      await userTemporaryArticleRepo.save(this.generateUserTemporaryArticles(allUsers, activeArticles));
      await userHiddenArticleRepo.save(this.generateHiddenArticles(allUsers, articles));

      await userDeviceRepo.save(this.generateUserDevices(allUsers));
      await notificationTrackerRepo.save(this.generateNotificationTrackers(allUsers));
      await subscriptionRepo.save(this.generateSubscriptions(allUsers));

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async cleanDatabase(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'user_notification_tracker',
      'user_devices',
      'user_hidden_articles',
      'user_temporary_articles',
      'user_temporary_surveys',
      'user_surveys',
      'suggested_activities',
      'rate_activities',
      'activities',
      'mood_tracker_surveys',
      'mood_trackers',
      'mood_surveys',
      'files',
      'articles',
      'surveys',
      'subscriptions',
      'users',
    ];

    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0;');
    for (const table of tables) {
      await queryRunner.query(`TRUNCATE TABLE \`${table}\`;`);
    }
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1;');
  }

  private async loadReferenceData(): Promise<ReferenceData> {
    if (this.referenceData) {
      return this.referenceData;
    }

    await Promise.all([
      this.activityTypesService.loadActivityTypes(),
      this.moodTypesService.loadMoodTypes(),
      this.onboardingQuestionsService.loadOnboardingQuestions(),
      this.socialNetworksService.loadSocialNetworks(),
    ]);

    const [activityTypes, moodTypes, onboardingSteps, socialNetworks] = await Promise.all([
      this.loadActivityTypesData(),
      this.loadMoodTypesData(),
      this.loadOnboardingStepsData(),
      this.loadSocialNetworksData(),
    ]);

    this.referenceData = {
      activityTypes,
      moodTypes,
      onboardingSteps,
      socialNetworks,
    };

    return this.referenceData;
  }

  private async loadActivityTypesData(): Promise<ActivityType[]> {
    let types = this.activityTypesService.getAllActivityTypes() ?? [];
    if (!types.length) {
      const fallback = await this.loadJsonFile<ActivityTypesData>('activity-types.json');
      types = fallback?.activityTypes ?? [];
    }

    if (!types.length) {
      this.logger.warn('Activity types dataset is empty, using fallback ids');
      return [{ id: 'general', name: 'General', description: '', keywords: [], category: 'other', icon: '⭐', color: '#999999' }];
    }

    return types;
  }

  private async loadMoodTypesData(): Promise<MoodType[]> {
    let types = this.moodTypesService.getAllMoodTypes() ?? [];
    if (!types.length) {
      const fallback = await this.loadJsonFile<MoodTypesData>('mood-types.json');
      types = fallback?.moodTypes ?? [];
    }

    if (!types.length) {
      this.logger.warn('Mood types dataset is empty, using fallback mood type');
      return [
        {
          id: 'neutral',
          name: 'Neutral',
          description: 'Neutral baseline mood',
          emoji: '😐',
          color: '#9E9E9E',
          score: 5,
          category: 'neutral',
        },
      ];
    }

    return types;
  }

  private async loadOnboardingStepsData(): Promise<OnboardingStepDto[]> {
    let steps = this.onboardingQuestionsService.getAllOnboardingQuestions('en') ?? [];
    if (!steps.length) {
      const fallback = await this.loadJsonFile<OnboardingQuestionsData>('onboarding-questions.json');
      steps = this.mapOnboardingStepsToDto(fallback?.onboardingSteps ?? []);
    }

    if (!steps.length) {
      this.logger.warn('Onboarding questions dataset is empty, onboarding answers will be minimal');
    }

    return steps;
  }

  private async loadSocialNetworksData(): Promise<SocialNetwork[]> {
    let networks = this.socialNetworksService.getAllSocialNetworks() ?? [];
    if (!networks.length) {
      const fallback = await this.loadJsonFile<SocialNetworksData>('social-networks.json');
      networks = fallback?.socialNetworks ?? [];
    }

    if (!networks.length) {
      this.logger.warn('Social networks dataset is empty, using fallback platforms');
      networks = [
        { id: 'facebook', name: 'Facebook', description: '', svg: '', color: '#1877F2', category: 'social' },
        { id: 'instagram', name: 'Instagram', description: '', svg: '', color: '#E4405F', category: 'social' },
        { id: 'linkedin', name: 'LinkedIn', description: '', svg: '', color: '#0077B5', category: 'professional' },
      ];
    }

    return networks;
  }

  private async loadJsonFile<T>(fileName: string): Promise<T | null> {
    try {
      const filePath = path.resolve(process.cwd(), 'data', fileName);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      this.logger.warn(`Failed to read fallback data file ${fileName}: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  private buildUserProfile(referenceData: ReferenceData) {
    const socialNetworkIds = this.randomElements(
      referenceData.socialNetworks.map((network) => network.id),
      1,
      4,
    );
    const activityTypeIds = this.randomElements(referenceData.activityTypes.map((type) => type.id), 2, 4);
    const moodTypeIds = this.randomElements(referenceData.moodTypes.map((type) => type.id), 1, 2);
    const onboardingSelection = this.buildOnboardingAnswers(referenceData.onboardingSteps);
    const taskTracking = this.resolveTaskTrackingMethod(
      onboardingSelection.answers,
      referenceData.onboardingSteps,
      onboardingSelection.detailed,
    );
    const primaryMoodType =
      this.randomElement(moodTypeIds) ?? referenceData.moodTypes[0]?.id ?? 'neutral';

    return {
      socialNetworkIds,
      activityTypeIds,
      moodTypeIds,
      onboarding: onboardingSelection,
      taskTrackingMethod: taskTracking.text,
      taskTrackingAnswerId: taskTracking.answerId,
      primaryMoodType,
      timezone: faker.location.timeZone(),
    };
  }

  private buildOnboardingAnswers(
    steps: OnboardingStepDto[],
  ): {
    answers: Record<string, string>;
    detailed: Record<string, { answerId: string; text: string }>;
    taskTrackingAnswerId: string | null;
  } {
    const answers: Record<string, string> = {};
    const detailed: Record<string, { answerId: string; text: string }> = {};
    let taskTrackingAnswerId: string | null = null;

    steps.forEach((step) => {
      if (!step.answers || step.answers.length === 0) {
        return;
      }

      const selected = faker.helpers.arrayElement(step.answers);
      answers[step.stepName] = selected.id;
      detailed[step.stepName] = {
        answerId: selected.id,
        text: selected.text,
      };

      if (step.stepName === 'starting_approach') {
        taskTrackingAnswerId = selected.id;
      }
    });

    return { answers, detailed, taskTrackingAnswerId };
  }

  private resolveTaskTrackingMethod(
    onboardingAnswers: Record<string, string>,
    steps: OnboardingStepDto[],
    detailed: Record<string, { answerId: string; text: string }>,
  ): { text: string; answerId: string | null } {
    const stepName = 'starting_approach';
    const answerId = onboardingAnswers[stepName];

    if (!answerId) {
      return { text: 'Flexible schedule', answerId: null };
    }

    const detailedEntry = detailed[stepName];
    if (detailedEntry && detailedEntry.answerId === answerId) {
      return { text: detailedEntry.text, answerId };
    }

    const step = steps.find((item) => item.stepName === stepName);
    const answerText = step?.answers?.find((answer) => answer.id === answerId)?.text;

    return {
      text: answerText ?? 'Flexible schedule',
      answerId,
    };
  }

  private randomElements<T>(items: T[], min: number, max: number): T[] {
    if (!items.length) {
      return [];
    }

    const upperBound = Math.max(0, Math.min(items.length, max));
    const lowerBound = Math.max(0, Math.min(upperBound, min));
    const count = upperBound === lowerBound ? upperBound : faker.number.int({ min: lowerBound, max: upperBound });

    const pool = [...items];
    const result: T[] = [];

    for (let i = 0; i < count && pool.length; i += 1) {
      const index = faker.number.int({ min: 0, max: pool.length - 1 });
      result.push(pool.splice(index, 1)[0]);
    }

    return result;
  }

  private randomElement<T>(items: T[]): T | null {
    if (!items.length) {
      return null;
    }
    return faker.helpers.arrayElement(items);
  }

  private mapOnboardingStepsToDto(steps: OnboardingStep[]): OnboardingStepDto[] {
    return steps.map((step) => ({
      stepName: step.stepName,
      stepQuestion: this.resolveLocalizedText(step.stepQuestion),
      answers: step.answers.map((answer) => ({
        id: answer.id,
        text: this.resolveLocalizedText(answer.text),
        subtitle: this.resolveLocalizedText(answer.subtitle),
        icon: answer.icon,
      })),
      inputType: step.inputType,
      required: step.required,
    }));
  }

  private resolveLocalizedText(value: LocalizedText): string {
    if (typeof value === 'string') {
      return value;
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return '';
    }

    const preferredOrder = ['en', 'ru', 'uk'];
    for (const code of preferredOrder) {
      if (typeof value[code] === 'string') {
        return value[code] as string;
      }
    }

    for (const key of Object.keys(value)) {
      const candidate = value[key];
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        return candidate;
      }
    }

    return '';
  }

  private generateAdminUsers(
    count: number,
    passwordHash: string,
    referenceData: ReferenceData,
    startIndex = 0,
  ): DeepPartial<User>[] {
    return Array.from({ length: count }).map((_, index) => {
      const firstName = faker.person.firstName();
      const profile = this.buildUserProfile(referenceData);
      const googleId = faker.helpers.maybe(() => faker.string.alphanumeric(12), { probability: 0.4 });
      const sequence = startIndex + index + 1;

      return {
        email: `admin${sequence}@example.com`,
        passwordHash,
        firstName,
        avatarUrl: faker.image.avatarGitHub(),
        emailVerified: true,
        googleId: googleId ?? undefined,
        firebaseUid: faker.string.uuid(),
        theme: faker.helpers.arrayElement(['light', 'dark']),
        roles: 'admin',
        meta: {
          timezone: profile.timezone,
          completedOnboarding: true,
          preferredLanguage: faker.helpers.arrayElement(['ru', 'en', 'de']),
          onboardingQuestionAndAnswers: profile.onboarding.answers,
          onboardingQuestionDetails: profile.onboarding.detailed,
          preferredActivityTypes: profile.activityTypeIds,
          preferredMoodTypes: profile.moodTypeIds,
          taskTrackingAnswerId: profile.taskTrackingAnswerId,
          socialNetworks: profile.socialNetworkIds,
          lastSyncedAt: new Date().toISOString(),
        },
        age: faker.number.int({ min: 25, max: 55 }).toString(),
        initialFeeling: profile.primaryMoodType,
        socialNetworks: profile.socialNetworkIds.join(','),
        taskTrackingMethod: profile.taskTrackingMethod,
      } satisfies DeepPartial<User>;
    });
  }

  private generateRegularUsers(
    count: number,
    passwordHash: string,
    referenceData: ReferenceData,
    startIndex = 0,
  ): DeepPartial<User>[] {
    return Array.from({ length: count }).map((_, index) => {
      const firstName = faker.person.firstName();
      const profile = this.buildUserProfile(referenceData);
      const googleId = faker.helpers.maybe(() => faker.string.alphanumeric(12), { probability: 0.3 });
      const emailVerified = faker.datatype.boolean();
      const sequence = startIndex + index + 1;

      return {
        email: `user${sequence}@example.com`,
        passwordHash,
        firstName,
        avatarUrl: faker.image.avatarGitHub(),
        emailVerified,
        googleId: googleId ?? undefined,
        firebaseUid: faker.string.uuid(),
        theme: faker.helpers.arrayElement(['light', 'dark']),
        roles: 'user',
        meta: {
          timezone: profile.timezone,
          onboardingQuestionAndAnswers: profile.onboarding.answers,
          onboardingQuestionDetails: profile.onboarding.detailed,
          preferredActivityTypes: profile.activityTypeIds,
          preferredMoodTypes: profile.moodTypeIds,
          taskTrackingAnswerId: profile.taskTrackingAnswerId,
          socialNetworks: profile.socialNetworkIds,
          completedOnboarding: true,
        },
        age: faker.number.int({ min: 18, max: 65 }).toString(),
        initialFeeling: profile.primaryMoodType,
        socialNetworks: profile.socialNetworkIds.join(','),
        taskTrackingMethod: profile.taskTrackingMethod,
      } satisfies DeepPartial<User>;
    });
  }

  private generateMoodSurveys(): MoodSurvey[] {
    return Array.from({ length: 8 }).map((_, index) => {
      const isArchived = index >= 6;
      return {
        title: `Mood Pulse ${index + 1}`,
        isArchived,
        createdBy: 'system@kpt.app',
        updatedBy: 'system@kpt.app',
        archivedAt: isArchived ? faker.date.past({ years: 1 }) : null,
        archivedBy: isArchived ? 'system@kpt.app' : null,
      } as MoodSurvey;
    });
  }

  private generateSurveys(adminUsers: User[]): Survey[] {
    return Array.from({ length: 18 }).map((_, index) => {
      const status = index < 9 ? SurveyStatus.ACTIVE : index < 14 ? SurveyStatus.AVAILABLE : SurveyStatus.ARCHIVED;
      const author = faker.helpers.arrayElement(adminUsers);
      return {
        title: `Wellbeing Survey ${index + 1}`,
        description: faker.lorem.sentences(2),
        questions: this.buildSurveyQuestions(index),
        status,
        createdBy: author.email,
        updatedBy: author.email,
        archivedAt: status === SurveyStatus.ARCHIVED ? faker.date.recent({ days: 120 }) : null,
        archivedBy: status === SurveyStatus.ARCHIVED ? author.email : null,
      } as Survey;
    });
  }

  private buildSurveyQuestions(index: number): SurveyQuestion[] {
    return [
      {
        id: `q${index + 1}-a`,
        text: 'Как вы оцениваете своё общее состояние сегодня?',
        type: 'single',
        options: [
          { id: 'excellent', text: 'Отлично' },
          { id: 'good', text: 'Хорошо' },
          { id: 'ok', text: 'Нормально' },
          { id: 'bad', text: 'Плохо' },
        ],
      },
      {
        id: `q${index + 1}-b`,
        text: 'Какие факторы повлияли на ваше настроение?',
        type: 'multiple',
        options: [
          { id: 'sleep', text: 'Сон' },
          { id: 'work', text: 'Работа' },
          { id: 'family', text: 'Семья' },
          { id: 'health', text: 'Здоровье' },
          { id: 'weather', text: 'Погода' },
        ],
      },
      {
        id: `q${index + 1}-c`,
        text: 'Чем вы гордитесь сегодня?',
        type: 'single',
        options: [
          { id: 'proud-1', text: 'Выполнил все задачи' },
          { id: 'proud-2', text: 'Помог коллегам' },
          { id: 'proud-3', text: 'Изучил что-то новое' },
        ],
      },
    ];
  }

  private generateArticles(adminUsers: User[]): Article[] {
    return Array.from({ length: 24 }).map((_, index) => {
      const status = index < 10 ? ArticleStatus.ACTIVE : index < 18 ? ArticleStatus.AVAILABLE : ArticleStatus.ARCHIVED;
      const author = faker.helpers.arrayElement(adminUsers);
      return {
        title: `Гайд по продуктивности №${index + 1}`,
        text: faker.lorem.paragraphs(3),
        status,
        updatedBy: author.email,
        archivedAt: status === ArticleStatus.ARCHIVED ? faker.date.recent({ days: 200 }) : null,
        archivedBy: status === ArticleStatus.ARCHIVED ? author.email : null,
      } as Article;
    });
  }

  private generateFilesForSurveys(surveys: Survey[]): File[] {
    return surveys
      .filter((_, index) => index % 2 === 0)
      .map((survey) => {
        const timestamp = Date.now();
        return {
          fileName: `survey-${survey.id}-attachment.pdf`,
          fileUrl: `https://cdn.kpt.app/surveys/${survey.id}/attachment-${timestamp}.pdf`,
          fileKey: `surveys/${survey.id}/attachment-${timestamp}.pdf`,
          mimeType: 'application/pdf',
          size: faker.number.int({ min: 50_000, max: 800_000 }),
          entityType: 'survey',
          entityId: survey.id,
          surveyId: survey.id,
        } as File;
      });
  }

  private generateFilesForArticles(articles: Article[]): File[] {
    return articles
      .filter((_, index) => index % 3 === 0)
      .map((article) => {
        const timestamp = Date.now();
        return {
          fileName: `article-${article.id}-resource.pdf`,
          fileUrl: `https://cdn.kpt.app/articles/${article.id}/resource-${timestamp}.pdf`,
          fileKey: `articles/${article.id}/resource-${timestamp}.pdf`,
          mimeType: 'application/pdf',
          size: faker.number.int({ min: 80_000, max: 1_100_000 }),
          entityType: 'article',
          entityId: article.id,
          articleId: article.id,
        } as File;
      });
  }

  private generateActivities(users: User[], referenceData: ReferenceData): DeepPartial<Activity>[] {
    const activityTypeIds = referenceData.activityTypes.map((type) => type.id);

    return users.flatMap((user) => {
      const count = faker.number.int({ min: 2, max: 5 });
      return Array.from({ length: count }).map((_, index) => {
        const isClosed = faker.datatype.boolean({ probability: 0.35 });
        const activityTypeId = this.randomElement(activityTypeIds) ?? 'general';
        const closedAt = isClosed ? faker.date.recent({ days: 45 }) : undefined;
        return {
          activityName: faker.company.catchPhrase(),
          activityType: activityTypeId,
          content: faker.lorem.paragraph(),
          position: index,
          status: isClosed ? 'closed' : 'active',
          closedAt,
          user,
        } satisfies DeepPartial<Activity>;
      });
    });
  }

  private generateActivityRatings(activities: Activity[]): RateActivity[] {
    return activities.map((activity) => ({
      activity,
      satisfactionLevel: faker.number.int({ min: 20, max: 100 }),
      hardnessLevel: faker.number.int({ min: 10, max: 90 }),
    })) as RateActivity[];
  }

  private generateMoodTrackers(users: User[], moodSurveys: MoodSurvey[], moodTypes: MoodType[]): DeepPartial<MoodTracker>[] {
    const moodTypeIds = moodTypes.map((type) => type.id);

    return users.flatMap((user) => {
      const count = faker.number.int({ min: 3, max: 6 });
      return Array.from({ length: count }).map(() => ({
        moodType: this.randomElement(moodTypeIds) ?? 'neutral',
        moodDate: faker.date.recent({ days: 90 }),
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.6 }) ?? null,
        user,
        moodSurveys: this.randomElements(moodSurveys, 0, Math.min(2, moodSurveys.length)),
      })) as DeepPartial<MoodTracker>[];
    });
  }

  private async attachMoodSurveysToTrackers(
    queryRunner: QueryRunner,
    moodTrackers: MoodTracker[],
    moodSurveys: MoodSurvey[],
  ): Promise<void> {
    for (const tracker of moodTrackers) {
      const existing = await queryRunner.manager
        .createQueryBuilder()
        .relation(MoodTracker, 'moodSurveys')
        .of(tracker)
        .loadMany<MoodSurvey>();

      const existingIds = new Set(existing.map((survey) => survey.id));
      const candidateSurveys = this.randomElements(moodSurveys, 0, Math.min(2, moodSurveys.length));
      const surveysToAdd = candidateSurveys.filter((survey) => !existingIds.has(survey.id));

      if (surveysToAdd.length === 0) {
        continue;
      }

      await queryRunner.manager
        .createQueryBuilder()
        .relation(MoodTracker, 'moodSurveys')
        .of(tracker)
        .add(surveysToAdd.map((survey) => survey.id));
    }
  }

  private generateSuggestedActivities(users: User[], activityTypes: ActivityType[]): DeepPartial<SuggestedActivity>[] {
    return users.flatMap((user) => {
      const count = faker.number.int({ min: 1, max: 3 });
      return Array.from({ length: count }).map(() => {
        const selectedType = this.randomElement(activityTypes) ?? null;
        const confidenceScore = Number(faker.number.float({ min: 40, max: 98 }).toFixed(2));
        const usedAt = faker.helpers.maybe(() => faker.date.recent({ days: 30 }), { probability: 0.3 });
        return {
        userId: user.id,
          activityName: selectedType ? `${selectedType.name}: ${faker.company.buzzPhrase()}` : faker.company.buzzPhrase(),
          activityType: selectedType?.id ?? 'general',
        content: faker.lorem.paragraph(),
        reasoning: faker.lorem.sentences(2),
          confidenceScore,
        isUsed: faker.datatype.boolean({ probability: 0.35 }),
        suggestedDate: faker.date.recent({ days: 60 }),
          usedAt: usedAt ?? undefined,
        } satisfies DeepPartial<SuggestedActivity>;
      });
    });
  }

  private generateUserSurveys(users: User[], surveys: Survey[]): UserSurvey[] {
    return users.flatMap((user) => {
      const assignedSurveys = this.randomElements(surveys, 1, Math.min(3, surveys.length));

      return assignedSurveys.map((survey) => ({
        userId: user.id,
        surveyId: survey.id,
        answers: this.buildSurveyAnswers(survey),
      })) as UserSurvey[];
    });
  }

  private buildSurveyAnswers(survey: Survey): Record<string, unknown> {
    const answers: Record<string, unknown> = {};
    if (!survey.questions) {
      return answers;
    }

    survey.questions.forEach((question) => {
      if (question.type === 'single') {
        const option = faker.helpers.arrayElement(question.options);
        answers[question.id] = option?.id ? [option.id] : [];
        return;
      }

      const options = this.randomElements(question.options, 1, Math.min(3, question.options.length));
      answers[question.id] = options.map((option) => option.id);
    });

    return answers;
  }

  private generateUserTemporarySurveys(users: User[], surveys: Survey[]): UserTemporarySurvey[] {
    if (surveys.length === 0) {
      return [];
    }

    return users.map((user) => {
      const survey = faker.helpers.arrayElement(surveys);
      return {
        user,
        survey,
        language: 'en',
        expiresAt: faker.helpers.maybe(() => faker.date.soon({ days: 45 }), { probability: 0.6 }) ?? undefined,
      } as UserTemporarySurvey;
    });
  }

  private generateUserTemporaryArticles(users: User[], articles: Article[]): UserTemporaryArticle[] {
    if (articles.length === 0) {
      return [];
    }

    return users.map((user) => {
      const article = faker.helpers.arrayElement(articles);
      return {
        user,
        article,
        language: 'en',
        expiresAt: faker.helpers.maybe(() => faker.date.soon({ days: 30 }), { probability: 0.5 }) ?? undefined,
      } as UserTemporaryArticle;
    });
  }

  private generateHiddenArticles(users: User[], articles: Article[]): UserHiddenArticle[] {
    if (articles.length === 0) {
      return [];
    }

    return users
      .filter(() => faker.datatype.boolean({ probability: 0.4 }))
      .map((user) => {
        const article = faker.helpers.arrayElement(articles);
        return {
          userId: user.id,
          articleId: article.id,
        } as UserHiddenArticle;
      });
  }

  private generateUserDevices(users: User[]): DeepPartial<UserDevice>[] {
    const platforms = Object.values(DevicePlatform);

    return users.flatMap((user) => {
      const count = faker.number.int({ min: 1, max: 2 });
      return Array.from({ length: count }).map(() => ({
        userId: user.id,
        token: faker.string.uuid() + faker.string.alphanumeric(32),
        platform: faker.helpers.arrayElement(platforms),
        isActive: faker.datatype.boolean({ probability: 0.85 }),
        lastUsedAt: faker.helpers.maybe(() => faker.date.recent({ days: 20 }), { probability: 0.7 }),
      }));
    });
  }

  private generateNotificationTrackers(users: User[]): UserNotificationTracker[] {
    const types = Object.values(NotificationType);

    return users.flatMap((user) =>
      types.map((type) => ({
        userId: user.id,
        type,
        lastSentAt:
          faker.helpers.maybe(() => faker.date.recent({ days: 60 }), { probability: 0.8 }) ??
          faker.helpers.maybe(() => faker.date.past({ years: 1 }), { probability: 0.4 }) ??
          null,
      })),
    ) as UserNotificationTracker[];
  }

  private generateSubscriptions(users: User[]): DeepPartial<Subscription>[] {
    const products = [
      {
        productId: 'kpt-pro-monthly',
        planInterval: SubscriptionPlanInterval.MONTHLY,
        price: 9.99,
      },
      {
        productId: 'kpt-pro-yearly',
        planInterval: SubscriptionPlanInterval.YEARLY,
        price: 99.0,
      },
      {
        productId: 'kpt-plus-monthly',
        planInterval: SubscriptionPlanInterval.MONTHLY,
        price: 14.99,
      },
      {
        productId: 'kpt-plus-yearly',
        planInterval: SubscriptionPlanInterval.YEARLY,
        price: 149.0,
      },
    ] as const;

    const statuses = [
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.EXPIRED,
      SubscriptionStatus.CANCELLED,
      SubscriptionStatus.PAST_DUE,
    ];

    const environmentOptions = ['production', 'sandbox'] as const;

    const addDays = (date: Date, days: number): Date => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    return users.flatMap((user) => {
      const subscriptionCount = faker.number.int({ min: 0, max: 2 });
      if (subscriptionCount === 0) {
        return [];
      }

      return Array.from({ length: subscriptionCount }).map(() => {
        const product = faker.helpers.arrayElement(products);
        const status = faker.helpers.arrayElement(statuses);
        const baseStart = faker.date.recent({ days: 120 });

        const cycleDays = product.planInterval === SubscriptionPlanInterval.MONTHLY ? 30 : 365;
        let periodStart = baseStart;
        let periodEnd = addDays(periodStart, cycleDays);
        let cancelledAt: Date | undefined;

        if (status === SubscriptionStatus.EXPIRED || status === SubscriptionStatus.CANCELLED) {
          periodEnd = faker.date.past({ years: 1 });
          periodStart = addDays(periodEnd, -cycleDays);
          cancelledAt = status === SubscriptionStatus.CANCELLED ? addDays(periodEnd, -3) : periodEnd;
        } else if (status === SubscriptionStatus.PAST_DUE) {
          periodStart = faker.date.recent({ days: 40 });
          periodEnd = addDays(periodStart, cycleDays);
          cancelledAt = undefined;
        } else {
          // active subscription
          const now = new Date();
          if (periodEnd < now) {
            periodStart = faker.date.recent({ days: 15 });
            periodEnd = addDays(periodStart, cycleDays);
          }
        }

        const price = product.price.toFixed(2);

        return {
          userId: user.id,
          userEmail: user.email,
          appUserId: String(user.id),
          provider: SubscriptionProvider.REVENUECAT,
          externalSubscriptionId: `txn_${faker.string.alphanumeric(18)}`,
          productId: product.productId,
          environment: faker.helpers.arrayElement(environmentOptions),
          planInterval: product.planInterval,
          status,
          periodStart,
          periodEnd,
          cancelledAt,
          price,
          currency: 'USD',
          priceInUsd: price,
          metadata: {
            source: 'seed',
            generatedAt: new Date().toISOString(),
            note: 'Demo subscription entry',
          },
        } satisfies DeepPartial<Subscription>;
      });
    });
  }
}

