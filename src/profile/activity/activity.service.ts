import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional } from 'typeorm-transactional';
import { Repository, MoreThan, MoreThanOrEqual, LessThanOrEqual, Between, IsNull } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { RateActivity } from './entities/rate-activity.entity';
import { CreateActivityDto, UpdateActivityDto, ActivityResponseDto, ActivityFilterDto, ActivityStatisticsResponseDto } from './dto/activity.dto';
import { CreateRateActivityDto } from './dto/rate-activity.dto';
import { ActivityTypesService } from '../../core/activity-types';
import { PaginateQuery, paginate, Paginated } from 'nestjs-paginate';
import { ACTIVITY_PAGINATION_CONFIG } from './activity.config';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { User } from 'src/users/entities/user.entity';
import { ChatGPTService } from '../../core/chatgpt/chatgpt.service';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(RateActivity)
    private readonly rateActivityRepository: Repository<RateActivity>,
    private readonly activityTypesService: ActivityTypesService,
    private readonly chatGPTService: ChatGPTService,
  ) { }

  /**
   * Get user activities list with filtering and pagination
   */
  async getMyActivities(user: User, query: PaginateQuery): Promise<Paginated<Activity>> {
    // Calculate today's date range (start and end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayEndStr = todayEnd.toISOString();

    // Use nestjs-paginate with repository and custom config
    query.filter = { 
      ...query.filter,
      userId: `$eq:${user.id}`,
      createdAt: `$btw:${todayStart},${todayEndStr}`,
      archivedAt: `$null:true` // Only non-archived activities (archivedAt IS NULL)
    };

    return paginate(query, this.activityRepository, ACTIVITY_PAGINATION_CONFIG);
  }

  /**
   * Create new activity
   */
  @Transactional()
  async createActivity(user: User, createActivityDto: CreateActivityDto): Promise<ActivityResponseDto> {
    // Determine activity type through ActivityTypesService
    const activityType = this.activityTypesService.determineActivityType(
      createActivityDto.activityName,
      createActivityDto.content
    );

    // Calculate today's date range (start and end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get the count of existing activities for this user created today (excluding archived)
    const allActivities = await this.activityRepository.find({
      where: {
        user: { id: user.id },
        createdAt: MoreThanOrEqual(today),
        archivedAt: IsNull(), // Only non-archived activities
      },
    });

    // Filter to only include activities created today (in case of timezone issues)
    const todayActivities = allActivities.filter(act => {
      const actDate = new Date(act.createdAt);
      return actDate >= today && actDate <= todayEnd;
    });

    // Calculate next position (position starts from 0, so next position = count of today's activities)
    const nextPosition = todayActivities.length;

    // Create new activity with the calculated position (at the end)
    const activity = this.activityRepository.create({
      ...createActivityDto,
      user,
      activityType,
      status: 'active', // Activity is active by default
      position: nextPosition, // Place new activity at the end
    });

    // Save the new activity
    const savedActivity = await this.activityRepository.save(activity);

    this.classifyAndUpdateActivityType(savedActivity)

    this.logger.log(`New activity created at position ${nextPosition} (user has ${todayActivities.length} existing activities today)`);
    return this.mapToResponseDto(savedActivity);
  }

  /**
   * Close activity (create RateActivity and mark as closed)
   */
  @Transactional()
  async closeActivity(
    user: User,
    activityId: number,
    createRateActivityDto: CreateRateActivityDto
  ): Promise<ActivityResponseDto> {
      // Check that activity exists and belongs to user
      const activity = await this.activityRepository.findOne({
        where: {
          id: activityId,
          user: { id: user.id }
        },
        relations: ['user', 'rateActivities'],
      });

    if (!activity) {
      throw AppException.notFound(ErrorCode.PROFILE_ACTIVITY_NOT_FOUND, 'Activity not found', { activityId, userId: user.id });
    }

    if (activity.status === 'closed') {
      throw AppException.validation(ErrorCode.PROFILE_ACTIVITY_ALREADY_CLOSED, 'Activity is already closed', { activityId });
    }

    // Check if RateActivity already exists for this activity
    let rateActivity = await this.rateActivityRepository.findOne({
      where: { activity: { id: activityId } },
      relations: ['activity'],
    });

        // Mark activity as closed
    activity.status = 'closed';
    activity.closedAt = new Date();

    const updatedActivity = await this.activityRepository.save(activity);

    if (rateActivity) {
      // Update existing RateActivity
      rateActivity.satisfactionLevel = createRateActivityDto.satisfactionLevel;
      rateActivity.hardnessLevel = createRateActivityDto.hardnessLevel;
      rateActivity.activity = activity; // TypeORM will set activityId automatically from the relation
    } else {
      // Create new RateActivity - use only activity entity, TypeORM will set activityId automatically
      rateActivity = this.rateActivityRepository.create({
        satisfactionLevel: createRateActivityDto.satisfactionLevel,
        hardnessLevel: createRateActivityDto.hardnessLevel,
        activity, // TypeORM will set activityId automatically from the relation
      });
    }

    updatedActivity.rateActivities.push(rateActivity);

    await this.rateActivityRepository.save(rateActivity);


    return this.mapToResponseDto(updatedActivity);
  }

  /**
   * Get activity by ID
   */
  async getActivityById(userId: number, activityId: number): Promise<ActivityResponseDto> {
    const activity = await this.activityRepository.findOne({
      where: {
        id: activityId,
        user: { id: userId }
      },
      relations: ['user', 'rateActivities'],
    });

    if (!activity) {
      throw AppException.notFound(ErrorCode.PROFILE_ACTIVITY_NOT_FOUND, 'Activity not found', { activityId, userId });
    }

    return this.mapToResponseDto(activity);
  }

  /**
   * Update activity
   */
  @Transactional()
  async updateActivity(
    userId: number,
    activityId: number,
    updateActivityDto: UpdateActivityDto
  ): Promise<ActivityResponseDto> {
    const activity = await this.activityRepository.findOne({
      where: {
        id: activityId,
        user: { id: userId }
      },
      relations: ['user', 'rateActivities'],
    });

    if (!activity) {
      throw AppException.notFound(ErrorCode.PROFILE_ACTIVITY_NOT_FOUND, 'Activity not found', { activityId, userId });
    }

    if (activity.status === 'closed') {
      throw AppException.validation(ErrorCode.PROFILE_ACTIVITY_CANNOT_MODIFY_CLOSED, 'Cannot modify closed activity', { activityId });
    }

    // If name changed, redetermine type through ActivityTypesService
    if (updateActivityDto.activityName && updateActivityDto.activityName !== activity.activityName) {
      const newActivityType = this.activityTypesService.determineActivityType(
        updateActivityDto.activityName,
        updateActivityDto.content || activity.content
      );
      updateActivityDto['activityType'] = newActivityType;
    }

    Object.assign(activity, updateActivityDto);
    const updatedActivity = await this.activityRepository.save(activity);

    this.classifyAndUpdateActivityType(updatedActivity).catch((error) =>
      this.logger.warn(`Failed to re-classify activity ${updatedActivity.id}: ${error.message}`),
    );

    return this.mapToResponseDto(updatedActivity);
  }

  /**
   * Archive activity (instead of deleting)
   */
  @Transactional()
  async deleteActivity(userId: number, activityId: number): Promise<void> {
    const activity = await this.activityRepository.findOne({
      where: {
        id: activityId,
        user: { id: userId }
      },
      relations: ['user', 'rateActivities'],
    });

    if (!activity) {
      throw AppException.notFound(ErrorCode.PROFILE_ACTIVITY_NOT_FOUND, 'Activity not found', { activityId, userId });
    }

    if (activity.status === 'closed') {
      throw AppException.validation(ErrorCode.PROFILE_ACTIVITY_CANNOT_DELETE_CLOSED, 'Cannot archive closed activity', { activityId });
    }

    if (activity.archivedAt) {
      throw AppException.validation(ErrorCode.PROFILE_ACTIVITY_CANNOT_DELETE_CLOSED, 'Activity is already archived', { activityId });
    }

    // Calculate today's date range (start and end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get all activities for this user created today, ordered by position
    const allActivities = await this.activityRepository.find({
      where: {
        user: { id: userId },
        createdAt: MoreThanOrEqual(today),
        archivedAt: IsNull(), // Only non-archived activities
      },
      order: { position: 'ASC', createdAt: 'DESC' },
    });

    // Filter to only include activities created today (in case of timezone issues)
    const todayActivities = allActivities.filter(act => {
      const actDate = new Date(act.createdAt);
      return actDate >= today && actDate <= todayEnd;
    });

    // Find and remove the activity to archive from the list
    const activityIndex = todayActivities.findIndex(a => a.id === activityId);
    if (activityIndex === -1) {
      throw AppException.notFound(
        ErrorCode.PROFILE_ACTIVITY_NOT_FOUND,
        'Activity not found in today\'s activities',
        { activityId, userId }
      );
    }

    const archivedPosition = todayActivities[activityIndex].position;

    // Remove the activity from the list
    todayActivities.splice(activityIndex, 1);

    // Reassign positions sequentially from 0 to n-1 for remaining activities
    todayActivities.forEach((act, index) => {
      act.position = index;
    });

    // Save all activities with updated positions
    if (todayActivities.length > 0) {
      await this.activityRepository.save(todayActivities);
    }

    // Archive the activity instead of deleting
    activity.archivedAt = new Date();
    await this.activityRepository.save(activity);

    this.logger.log(`Activity ${activityId} archived from position ${archivedPosition}, reassigned ${todayActivities.length} activities`);
  }

  /**
   * Restore archived activity
   */
  async restoreActivity(userId: number, activityId: number): Promise<ActivityResponseDto> {
    const activity = await this.activityRepository.findOne({
      where: {
        id: activityId,
        user: { id: userId }
      },
      relations: ['user', 'rateActivities'],
    });

    if (!activity) {
      throw AppException.notFound(ErrorCode.PROFILE_ACTIVITY_NOT_FOUND, 'Activity not found', { activityId, userId });
    }

    if (!activity.archivedAt) {
      throw AppException.validation(ErrorCode.PROFILE_ACTIVITY_CANNOT_DELETE_CLOSED, 'Activity is not archived', { activityId });
    }

    // Restore activity by setting archivedAt to null
    activity.archivedAt = null;

    const restoredActivity = await this.activityRepository.save(activity);
    return this.mapToResponseDto(restoredActivity);
  }

  /**
   * Get archived activities for today with pagination
   */
  async getArchivedActivities(user: User, query: PaginateQuery): Promise<Paginated<Activity>> {
    // Calculate today's date range (start and end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayEndStr = todayEnd.toISOString();

    // Use nestjs-paginate with repository and custom config
    query.filter = { 
      ...query.filter,
      userId: `$eq:${user.id}`,
      archivedAt: `$btw:${todayStart},${todayEndStr}` // Only activities archived today
    };

    return paginate(query, this.activityRepository, ACTIVITY_PAGINATION_CONFIG);
  }

  /**
   * Get activity statistics for the last 7 days
   */
  async getActivityStatistics(userId: number): Promise<ActivityStatisticsResponseDto> {
    try {
      // Calculate date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      // Get all rate activities for user's activities in the last 7 days
      const rateActivities = await this.rateActivityRepository
        .createQueryBuilder('rateActivity')
        .innerJoin('rateActivity.activity', 'activity')
        .where('activity.userId = :userId', { userId })
        .andWhere('rateActivity.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
        .getMany();

      if (rateActivities.length === 0) {
        return {
          averageSatisfactionLevel: 0,
          averageHardnessLevel: 0,
          totalRatedActivities: 0,
          relationship: 'balanced',
          satisfactionPercentage: 0,
          hardnessPercentage: 0,
        };
      }

      // Calculate averages
      const totalSatisfaction = rateActivities.reduce((sum, ra) => sum + ra.satisfactionLevel, 0);
      const totalHardness = rateActivities.reduce((sum, ra) => sum + ra.hardnessLevel, 0);
      const count = rateActivities.length;

      const averageSatisfactionLevel = totalSatisfaction / count;
      const averageHardnessLevel = totalHardness / count;

      // Determine relationship
      let relationship: 'satisfaction_dominant' | 'hardness_dominant' | 'balanced';
      if (averageSatisfactionLevel > averageHardnessLevel) {
        relationship = 'satisfaction_dominant';
      } else if (averageSatisfactionLevel < averageHardnessLevel) {
        relationship = 'hardness_dominant';
      } else {
        relationship = 'balanced';
      }

      // Calculate percentages (since satisfactionLevel + hardnessLevel = 100, percentages are already in %)
      const satisfactionPercentage = averageSatisfactionLevel;
      const hardnessPercentage = averageHardnessLevel;

      return {
        averageSatisfactionLevel: Math.round(averageSatisfactionLevel * 100) / 100,
        averageHardnessLevel: Math.round(averageHardnessLevel * 100) / 100,
        totalRatedActivities: count,
        relationship,
        satisfactionPercentage: Math.round(averageSatisfactionLevel * 100) / 100,
        hardnessPercentage: Math.round(averageHardnessLevel * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Error getting activity statistics: ${error.message}`);
      throw AppException.internal(ErrorCode.PROFILE_ACTIVITY_NOT_FOUND, undefined, {
        error: error.message,
        operation: 'getActivityStatistics',
        userId,
      });
    }
  }

  /**
   * Get recommended types for activity name
   */
  async getRecommendedTypes(activityName: string, limit: number = 3): Promise<any[]> {
    return this.activityTypesService.getRecommendedTypes(activityName, limit);
  }

  /**
   * Get all available activity types
   */
  async getAllActivityTypes(): Promise<any[]> {
    return this.activityTypesService.getAllActivityTypes();
  }

  /**
   * Get activity types by category
   */
  async getActivityTypesByCategory(category: string): Promise<any[]> {
    return this.activityTypesService.getActivityTypesByCategory(category);
  }

  /**
   * Search activity types
   */
  async searchActivityTypes(query: string): Promise<any[]> {
    return this.activityTypesService.searchActivityTypes(query);
  }

  /**
   * Transform Activity to ResponseDto
   */
  private mapToResponseDto(activity: Activity): ActivityResponseDto {
    return {
      id: activity.id,
      userId: activity.user?.id,
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
      rateActivities: activity.rateActivities || [],
    };
  }

  private async classifyAndUpdateActivityType(activity: Activity): Promise<void> {
    this.logger.log(`ChatGPT classification for activity ${activity.id} started`);
    try {
      const allTypes = this.activityTypesService.getAllActivityTypes();
      if (allTypes.length === 0) {
        return;
      }

      const availableTypeIds = allTypes.map((type) => type.id);
      const keywordsMap = allTypes.reduce<Record<string, string[]>>((acc, type) => {
        acc[type.id] = type.keywords || [];
        return acc;
      }, {});

      const classification = await this.chatGPTService.getActivityType(
        activity.activityName,
        availableTypeIds,
        keywordsMap,
      );

      const resolvedType = classification?.activityType ?? 'unknown';

      if (resolvedType !== activity.activityType) {
        await this.activityRepository.update(activity.id, { activityType: resolvedType });
      }
    } catch (error) {
      this.logger.warn(`ChatGPT classification failed for activity ${activity.id}: ${error.message}`);
    }
  }

  /**
   * Change activity position
   */
  @Transactional()
  async changePosition(activityId: number, newPosition: number, user: User): Promise<ActivityResponseDto> {
    try {
      const activity = await this.activityRepository.findOne({
        where: { id: activityId, user: { id: user.id } },
        relations: ['rateActivities'],
      });

      if (!activity) {
        throw AppException.notFound(ErrorCode.PROFILE_ACTIVITY_NOT_FOUND, 'Activity not found');
      }

      if (activity.status === 'closed') {
        throw AppException.validation(ErrorCode.PROFILE_ACTIVITY_CANNOT_MODIFY_CLOSED, 'Cannot modify closed activity');
      }

      // Calculate today's date range (start and end of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // 1. Get all activities for this user created today, ordered by position (excluding archived)
      const allActivities = await this.activityRepository.find({
        where: {
          user: { id: user.id },
          createdAt: MoreThanOrEqual(today),
          archivedAt: IsNull(), // Only non-archived activities
        },
        order: { position: 'ASC', createdAt: 'DESC' },
        relations: ['rateActivities'],
      });

      // Filter to only include activities created today (in case of timezone issues)
      const todayActivities = allActivities.filter(act => {
        const actDate = new Date(act.createdAt);
        return actDate >= today && actDate <= todayEnd;
      });

      // 2. Find current activity in the list
      const currentActivityIndex = todayActivities.findIndex(a => a.id === activityId);
      
      if (currentActivityIndex === -1) {
        throw AppException.notFound(
          ErrorCode.PROFILE_ACTIVITY_NOT_FOUND,
          'Activity not found in today\'s activities',
          { activityId }
        );
      }

      const currentActivity = todayActivities[currentActivityIndex];
      const oldPosition = currentActivity.position;

      // If position hasn't changed, no need to update
      if (oldPosition === newPosition) {
        return this.mapToResponseDto(currentActivity);
      }

      // 3. Validate and adjust new position before removing
      const maxPosition = todayActivities.length - 1;
      if (newPosition < 0) {
        newPosition = 0;
      } else if (newPosition > maxPosition) {
        newPosition = maxPosition;
      }

      // 4. Adjust newPosition if moving forward (after removing, indices shift)
      let adjustedNewPosition = newPosition;
      if (newPosition > currentActivityIndex) {
        adjustedNewPosition = newPosition - 1;
      }

      // 5. Remove current activity from the list
      todayActivities.splice(currentActivityIndex, 1);

      // 6. Insert current activity at the adjusted new position
      todayActivities.splice(adjustedNewPosition, 0, currentActivity);

      // 7. Reassign positions sequentially from 0 to n-1
      todayActivities.forEach((act, index) => {
        act.position = index;
      });

      // 8. Save all activities with updated positions
      await this.activityRepository.save(todayActivities);

      // Reload the activity to get updated position
      const updatedActivity = await this.activityRepository.findOne({
        where: { id: activityId },
        relations: ['rateActivities'],
      });

      if (!updatedActivity) {
        throw AppException.notFound(ErrorCode.PROFILE_ACTIVITY_NOT_FOUND, 'Activity not found after position update');
      }

      this.logger.log(`Activity position updated: ${activityId} -> position ${newPosition} (was ${oldPosition})`);
      return this.mapToResponseDto(updatedActivity);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to change activity position:', error);
      throw AppException.internal(ErrorCode.PROFILE_ACTIVITY_UPDATE_FAILED, undefined, {
        error: error.message,
        operation: 'changePosition',
        activityId,
        userId: user.id
      });
    }
  }
}
