import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserSurvey } from '../survey/entities/user-survey.entity';
import { UserHiddenArticle } from '../articles/entities/user-hidden-article.entity';
import { MoodTracker } from '../../profile/mood-tracker/entities/mood-tracker.entity';
import {
  ClientStaticFilterDto,
  MoodTrackerFilterDto,
  ClientStaticCountResponseDto,
} from './dto/client-static.dto';

@Injectable()
export class ClientStaticService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSurvey)
    private readonly userSurveyRepository: Repository<UserSurvey>,
    @InjectRepository(UserHiddenArticle)
    private readonly userHiddenArticleRepository: Repository<UserHiddenArticle>,
    @InjectRepository(MoodTracker)
    private readonly moodTrackerRepository: Repository<MoodTracker>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Build base query builder with common filters
   */
  private buildBaseQuery(filters: ClientStaticFilterDto) {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.roles NOT LIKE :adminRole', { adminRole: '%admin%' });

    // Date range filter (for registration date)
    if (filters.dateFrom || filters.dateTo) {
      if (filters.dateFrom && filters.dateTo) {
        const startDate = new Date(filters.dateFrom);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        queryBuilder.andWhere('user.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      } else if (filters.dateFrom) {
        const startDate = new Date(filters.dateFrom);
        startDate.setHours(0, 0, 0, 0);
        queryBuilder.andWhere('user.createdAt >= :startDate', { startDate });
      } else if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        queryBuilder.andWhere('user.createdAt <= :endDate', { endDate });
      }
    }

    // Registration method filter
    if (filters.registrationMethod === 'firebase') {
      queryBuilder.andWhere('user.firebaseUid IS NOT NULL');
    } else if (filters.registrationMethod === 'email') {
      queryBuilder.andWhere('user.firebaseUid IS NULL');
    }

    // Age filter
    if (filters.age) {
      queryBuilder.andWhere('user.age = :age', { age: filters.age });
    }

    // Social networks filter
    if (filters.socialNetworks && filters.socialNetworks.length > 0) {
      const conditions = filters.socialNetworks.map((network, index) => {
        return `user.socialNetworks LIKE :network${index}`;
      });
      queryBuilder.andWhere(`(${conditions.join(' OR ')})`, 
        filters.socialNetworks.reduce((acc, network, index) => {
          acc[`network${index}`] = `%${network}%`;
          return acc;
        }, {} as Record<string, string>)
      );
    }

    // Theme filter
    if (filters.theme) {
      queryBuilder.andWhere('user.theme = :theme', { theme: filters.theme });
    }

    return queryBuilder;
  }

  /**
   * Get count of registered users by filters
   */
  async getRegisteredUsersCount(
    filters: ClientStaticFilterDto,
  ): Promise<ClientStaticCountResponseDto> {
    const queryBuilder = this.buildBaseQuery(filters);
    const count = await queryBuilder.getCount();
    return { count };
  }

  /**
   * Get count of inactive users by filters
   * Inactive users are those who haven't updated their profile in the last 30 days
   */
  async getInactiveUsersCount(
    filters: ClientStaticFilterDto,
  ): Promise<ClientStaticCountResponseDto> {
    const queryBuilder = this.buildBaseQuery(filters);
    
    // Users who haven't updated in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    queryBuilder.andWhere('user.updatedAt < :thirtyDaysAgo', { thirtyDaysAgo });

    const count = await queryBuilder.getCount();
    return { count };
  }

  /**
   * Get count of users who answered surveys by filters
   */
  async getSurveyRespondedUsersCount(
    filters: ClientStaticFilterDto,
  ): Promise<ClientStaticCountResponseDto> {
    const baseQuery = this.buildBaseQuery(filters);
    
    // Get user IDs that match base filters
    const baseUsers = await baseQuery.select('user.id').getRawMany();
    const userIds = baseUsers.map((u: any) => u.user_id);

    if (userIds.length === 0) {
      return { count: 0 };
    }

    // Build query for user surveys with date filter
    let surveyQuery = this.userSurveyRepository
      .createQueryBuilder('userSurvey')
      .where('userSurvey.userId IN (:...userIds)', { userIds });

    // Apply date filter for survey response date
    if (filters.dateFrom || filters.dateTo) {
      if (filters.dateFrom && filters.dateTo) {
        const startDate = new Date(filters.dateFrom);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        surveyQuery.andWhere('userSurvey.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      } else if (filters.dateFrom) {
        const startDate = new Date(filters.dateFrom);
        startDate.setHours(0, 0, 0, 0);
        surveyQuery.andWhere('userSurvey.createdAt >= :startDate', { startDate });
      } else if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        surveyQuery.andWhere('userSurvey.createdAt <= :endDate', { endDate });
      }
    }

    // Count distinct users - getCount doesn't support DISTINCT, so we use getRawOne
    const result = await surveyQuery
      .select('COUNT(DISTINCT userSurvey.userId)', 'count')
      .getRawOne();
    return { count: parseInt(result?.count || '0', 10) };
  }

  /**
   * Get count of users who visited articles by filters
   */
  async getArticleVisitedUsersCount(
    filters: ClientStaticFilterDto,
  ): Promise<ClientStaticCountResponseDto> {
    const baseQuery = this.buildBaseQuery(filters);
    
    // Get user IDs that match base filters
    const baseUsers = await baseQuery.select('user.id').getRawMany();
    const userIds = baseUsers.map((u: any) => u.user_id);

    if (userIds.length === 0) {
      return { count: 0 };
    }

    // Build query for user hidden articles with date filter
    let articleQuery = this.userHiddenArticleRepository
      .createQueryBuilder('userHiddenArticle')
      .where('userHiddenArticle.user_id IN (:...userIds)', { userIds });

    // Apply date filter for article visit date
    if (filters.dateFrom || filters.dateTo) {
      if (filters.dateFrom && filters.dateTo) {
        const startDate = new Date(filters.dateFrom);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        articleQuery.andWhere('userHiddenArticle.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      } else if (filters.dateFrom) {
        const startDate = new Date(filters.dateFrom);
        startDate.setHours(0, 0, 0, 0);
        articleQuery.andWhere('userHiddenArticle.createdAt >= :startDate', { startDate });
      } else if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        articleQuery.andWhere('userHiddenArticle.createdAt <= :endDate', { endDate });
      }
    }

    // Count distinct users - getCount doesn't support DISTINCT, so we use getRawOne
    const result = await articleQuery
      .select('COUNT(DISTINCT userHiddenArticle.user_id)', 'count')
      .getRawOne();
    return { count: parseInt(result?.count || '0', 10) };
  }

  /**
   * Get count of users who tracked mood by filters
   */
  async getMoodTrackedUsersCount(
    filters: MoodTrackerFilterDto,
  ): Promise<ClientStaticCountResponseDto> {
    const baseQuery = this.buildBaseQuery(filters);
    
    // Get user IDs that match base filters
    const baseUsers = await baseQuery.select('user.id').getRawMany();
    const userIds = baseUsers.map((u: any) => u.user_id);

    if (userIds.length === 0) {
      return { count: 0 };
    }

    // Build query for mood trackers
    let moodQuery = this.moodTrackerRepository
      .createQueryBuilder('moodTracker')
      .leftJoin('moodTracker.user', 'user')
      .where('user.id IN (:...userIds)', { userIds });

    // Mood type filter
    if (filters.moodType) {
      moodQuery.andWhere('moodTracker.moodType = :moodType', { moodType: filters.moodType });
    }

    // Date range filter for mood tracking date
    if (filters.dateFrom || filters.dateTo) {
      if (filters.dateFrom && filters.dateTo) {
        const startDate = new Date(filters.dateFrom);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        moodQuery.andWhere('moodTracker.moodDate BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      } else if (filters.dateFrom) {
        const startDate = new Date(filters.dateFrom);
        startDate.setHours(0, 0, 0, 0);
        moodQuery.andWhere('moodTracker.moodDate >= :startDate', { startDate });
      } else if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        moodQuery.andWhere('moodTracker.moodDate <= :endDate', { endDate });
      }
    }

    // Days filter - users who tracked mood for at least N days
    if (filters.days) {
      moodQuery
        .select('user.id')
        .groupBy('user.id')
        .having('COUNT(DISTINCT moodTracker.moodDate) >= :days', { days: filters.days });
      // Count grouped results - getCount() works with groupBy
      const count = await moodQuery.getCount();
      return { count };
    } else {
      // Count distinct users - getCount doesn't support DISTINCT, so we use getRawOne
      const result = await moodQuery
        .select('COUNT(DISTINCT user.id)', 'count')
        .getRawOne();
      return { count: parseInt(result?.count || '0', 10) };
    }
  }
}

