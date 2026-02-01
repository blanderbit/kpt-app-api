import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PaginateQuery, paginate, Paginated } from 'nestjs-paginate';
import { User } from '../../users/entities/user.entity';
import { Activity } from '../../profile/activity/entities/activity.entity';
import { SuggestedActivity } from '../../suggested-activity/entities/suggested-activity.entity';
import { MoodTracker } from '../../profile/mood-tracker/entities/mood-tracker.entity';
import { Survey } from '../survey/entities/survey.entity';
import { UserSurvey } from '../survey/entities/user-survey.entity';
import { Article } from '../articles/entities/article.entity';
import { UserHiddenArticle } from '../articles/entities/user-hidden-article.entity';
import { RateActivity } from '../../profile/activity/entities/rate-activity.entity';
import { CLIENT_PAGINATION_CONFIG } from './client-management.config';
import { surveyConfig } from '../survey/survey.config';
import { articleConfig } from '../articles/articles.config';
import { FilterOperator } from 'nestjs-paginate';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import {
  ClientUserResponseDto,
  UserActivitiesResponseDto,
  UserSuggestedActivitiesResponseDto,
  UserMoodTrackerMonthlyResponseDto,
  UserAnalyticsResponseDto,
  UserSurveysResponseDto,
  UserArticlesResponseDto,
} from './dto/client-management.dto';
import { ActivityResponseDto } from '../../profile/activity/dto/activity.dto';
import { SuggestedActivityResponseDto } from '../../suggested-activity/dto/suggested-activity.dto';
import { MoodTrackerResponseDto } from '../../profile/mood-tracker/dto/mood-tracker.dto';
import { SurveyResponseDto } from '../survey/dto/survey.dto';
import { ArticleResponseDto } from '../articles/dto/article.dto';

@Injectable()
export class ClientManagementService {
  private readonly logger = new Logger(ClientManagementService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(SuggestedActivity)
    private readonly suggestedActivityRepository: Repository<SuggestedActivity>,
    @InjectRepository(MoodTracker)
    private readonly moodTrackerRepository: Repository<MoodTracker>,
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    @InjectRepository(UserSurvey)
    private readonly userSurveyRepository: Repository<UserSurvey>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(UserHiddenArticle)
    private readonly userHiddenArticleRepository: Repository<UserHiddenArticle>,
    @InjectRepository(RateActivity)
    private readonly rateActivityRepository: Repository<RateActivity>,
  ) {}

  /**
   * Get clients (non-admin users) with pagination
   */
  async getClients(query: PaginateQuery): Promise<Paginated<User>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.roles NOT LIKE :adminRole', { adminRole: '%admin%' })
      .orderBy('user.createdAt', 'DESC');


    if (query?.filter?.emailVerified) {
      query.filter.emailVerified = `$eq:${query?.filter?.emailVerified.includes('true') ? 1: 0 }`
    }

    return paginate(query, queryBuilder, CLIENT_PAGINATION_CONFIG);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<ClientUserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'avatarUrl',
        'emailVerified',
        'theme',
        'language',
        'roles',
        'initSatisfactionLevel',
        'initHardnessLevel',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'User not found');
    }

    // Check if user is admin
    const roles = typeof user.roles === 'string' ? user.roles.split(',').map(r => r.trim()) : [];
    if (roles.includes('admin')) {
      throw AppException.forbidden(ErrorCode.ADMIN_INSUFFICIENT_PERMISSIONS, 'Cannot access admin user through client management');
    }

    return {
      ...user,
      roles,
    };
  }

  /**
   * Get user activities filtered by date
   */
  async getUserActivities(userId: number, date: string): Promise<UserActivitiesResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'User not found');
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const activities = await this.activityRepository.find({
      where: {
        createdAt: Between(targetDate, endDate),
        user: { id: userId },
      },
      relations: ['rateActivities'],
      order: { createdAt: 'DESC' },
    });

    return {
      activities: activities.map(activity => this.mapActivityToDto(activity)),
      date,
    };
  }

  /**
   * Get user suggested activities
   */
  async getUserSuggestedActivities(userId: number): Promise<UserSuggestedActivitiesResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'User not found');
    }

    const suggestedActivities = await this.suggestedActivityRepository.find({
      where: {
        userId,
      },
      order: {
        suggestedDate: 'DESC',
        createdAt: 'DESC',
      },
    });

    return {
      suggestedActivities: suggestedActivities.map(sa => this.mapSuggestedActivityToDto(sa)),
    };
  }

  /**
   * Get user mood tracker for a month
   */
  async getUserMoodTrackerMonthly(userId: number, year: number, month: number): Promise<UserMoodTrackerMonthlyResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'User not found');
    }

    // Validate month
    if (month < 1 || month > 12) {
      throw AppException.validation(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Invalid month. Must be between 1 and 12');
    }

    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(year, month, 0); // Last day of the month
    endDate.setHours(23, 59, 59, 999);

    const moodTrackers = await this.moodTrackerRepository.find({
      where: {
        user: { id: userId },
        moodDate: Between(startDate, endDate),
      },
      relations: ['moodSurveys'],
      order: { moodDate: 'ASC' },
    });

    const totalDays = new Date(year, month, 0).getDate(); // Days in the month

    return {
      year,
      month,
      moodTrackers: moodTrackers.map(mt => this.mapMoodTrackerToDto(mt)),
      totalDays,
      trackedDays: moodTrackers.length,
    };
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: number): Promise<UserAnalyticsResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'User not found');
    }

    // Get total and completed tasks
    const [totalTasks, completedTasks] = await Promise.all([
      this.activityRepository.count({ where: { user: { id: userId } } }),
      this.activityRepository.count({ where: { user: { id: userId }, status: 'closed' } }),
    ]);

    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Get rate activity statistics
    const rateActivities = await this.rateActivityRepository
      .createQueryBuilder('rateActivity')
      .leftJoin('rateActivity.activity', 'activity')
      .where('activity.userId = :userId', { userId })
      .getMany();

    let averageSatisfaction: number | null = null;
    let averageHardness: number | null = null;

    if (rateActivities.length > 0) {
      const totalSatisfaction = rateActivities.reduce((sum, ra) => sum + ra.satisfactionLevel, 0);
      const totalHardness = rateActivities.reduce((sum, ra) => sum + ra.hardnessLevel, 0);
      averageSatisfaction = Math.round((totalSatisfaction / rateActivities.length) * 100) / 100;
      averageHardness = Math.round((totalHardness / rateActivities.length) * 100) / 100;
    }

    return {
      totalTasks,
      completedTasks,
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
      averageSatisfaction,
      averageHardness,
      totalRateActivities: rateActivities.length,
    };
  }

  /**
   * Get surveys user answered with pagination
   */
  async getUserSurveys(userId: number, query: PaginateQuery): Promise<Paginated<Survey>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'User not found');
    }

    const userSurveys = await this.userSurveyRepository.find({
      where: { userId },
      relations: ['survey'],
    });

    const surveyIds = userSurveys.map(us => us.surveyId);
    
    if (surveyIds.length === 0) {
      return paginate(query, this.surveyRepository.createQueryBuilder('survey').where('1=0'), {
        ...surveyConfig,
        defaultLimit: 10,
      });
    }

    const queryBuilder = this.surveyRepository
      .createQueryBuilder('survey')
      .leftJoinAndSelect('survey.files', 'files')
      .where('survey.id IN (:...surveyIds)', { surveyIds })
      .orderBy('survey.createdAt', 'DESC');

    return paginate(query, queryBuilder, {
      ...surveyConfig,
      defaultLimit: 10,
    });
  }

  /**
   * Get articles user hidden with pagination
   */
  async getUserArticles(userId: number, query: PaginateQuery): Promise<Paginated<Article>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'User not found');
    }

    const hiddenArticles = await this.userHiddenArticleRepository.find({
      where: { userId },
    });

    const articleIds = hiddenArticles.map(ha => ha.articleId);
    
    if (articleIds.length === 0) {
      return paginate(query, this.articleRepository.createQueryBuilder('article').where('1=0'), {
        ...articleConfig,
        defaultLimit: 10,
      });
    }

    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.files', 'files')
      .where('article.id IN (:...articleIds)', { articleIds })
      .orderBy('article.createdAt', 'DESC');

    return paginate(query, queryBuilder, {
      ...articleConfig,
      defaultLimit: 10,
    });
  }

  // Helper methods for mapping entities to DTOs
  private mapActivityToDto(activity: Activity): ActivityResponseDto {
    return {
      id: activity.id,
      activityName: activity.activityName,
      activityType: activity.activityType,
      content: activity.content,
      position: activity.position,
      status: activity.status,
      fromSuggestedActivity: activity.fromSuggestedActivity ?? false,
      closedAt: activity.closedAt,
      archivedAt: activity.archivedAt,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      userId: activity.userId,
      rateActivities: activity.rateActivities || [],
    };
  }

  private mapSuggestedActivityToDto(suggestedActivity: SuggestedActivity): SuggestedActivityResponseDto {
    return {
      id: suggestedActivity.id,
      userId: suggestedActivity.userId,
      activityName: suggestedActivity.activityName,
      activityType: suggestedActivity.activityType,
      content: suggestedActivity.content,
      reasoning: suggestedActivity.reasoning,
      confidenceScore: Number(suggestedActivity.confidenceScore),
      isUsed: suggestedActivity.isUsed,
      suggestedDate: suggestedActivity.suggestedDate,
      usedAt: suggestedActivity.usedAt,
      createdAt: suggestedActivity.createdAt,
      updatedAt: suggestedActivity.updatedAt,
    };
  }

  private mapMoodTrackerToDto(moodTracker: MoodTracker): MoodTrackerResponseDto {
    return {
      id: moodTracker.id,
      moodType: moodTracker.moodType,
      moodTypeDetails: null, // Can be populated if MoodTypesService is injected
      moodDate: moodTracker.moodDate,
      notes: moodTracker.notes,
      createdAt: moodTracker.createdAt,
      updatedAt: moodTracker.updatedAt,
      moodSurveys: moodTracker.moodSurveys?.map(ms => ({
        id: ms.id,
        title: ms.title,
        isArchived: ms.isArchived,
        createdAt: ms.createdAt,
        updatedAt: ms.updatedAt,
      })) || [],
    };
  }

  private mapSurveyToDto(survey: Survey): SurveyResponseDto {
    return {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      questions: survey.questions,
      status: survey.status,
      language: survey.language ?? null,
      createdBy: survey.createdBy,
      updatedBy: survey.updatedBy,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
      archivedAt: survey.archivedAt,
      archivedBy: survey.archivedBy,
      files: survey.files?.map(file => ({
        id: file.id,
        fileUrl: file.fileUrl,
        fileKey: file.fileKey,
        fileName: file.fileName,
        mimeType: file.mimeType,
        size: file.size,
      })) || [],
    };
  }

  private mapArticleToDto(article: Article): ArticleResponseDto {
    return {
      id: article.id,
      title: article.title,
      text: article.text,
      status: article.status,
      files: article.files?.map(file => ({
        id: file.id,
        fileUrl: file.fileUrl,
        fileKey: file.fileKey,
        fileName: file.fileName,
        mimeType: file.mimeType,
        size: file.size,
      })) || [],
      updatedBy: article.updatedBy,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      archivedAt: article.archivedAt ?? null,
      archivedBy: article.archivedBy ?? null,
    };
  }
}
