import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional } from 'typeorm-transactional';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { RateActivity } from './entities/rate-activity.entity';
import { CreateActivityDto, UpdateActivityDto, ActivityResponseDto, ActivityFilterDto } from './dto/activity.dto';
import { CreateRateActivityDto } from './dto/rate-activity.dto';
import { ActivityTypesService } from '../../core/activity-types';
import { PaginateQuery, paginate, Paginated } from 'nestjs-paginate';
import { ACTIVITY_PAGINATION_CONFIG } from './activity.config';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(RateActivity)
    private readonly rateActivityRepository: Repository<RateActivity>,
    private readonly activityTypesService: ActivityTypesService,
  ) {}

  /**
   * Get user activities list with filtering and pagination
   */
  async getMyActivities(user: User, query: PaginateQuery): Promise<Paginated<Activity>> {
    // Use nestjs-paginate with repository and custom config
    const config = {
      ...ACTIVITY_PAGINATION_CONFIG,
      filter: { user: { id: user.id } }, // Add userId filter
    };
    
    return paginate(query, this.activityRepository, config);
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

    // Get all existing activities for this user to shift their positions
    const existingActivities = await this.activityRepository.find({
      where: { userId: user.id },
      order: { position: 'ASC' }
    });

    // Shift all existing activities down by 1 position
    for (const existingActivity of existingActivities) {
      existingActivity.position = existingActivity.position + 1;
    }

    // Create new activity with position 0 (top)
    const activity = this.activityRepository.create({
      ...createActivityDto,
      user,
      activityType,
      status: 'active', // Activity is active by default
      position: 0, // Always place new activity at the top
    });

    // Save all activities (existing with shifted positions + new activity)
    await this.activityRepository.save([...existingActivities, activity]);

    this.logger.log(`New activity created at position 0, shifted ${existingActivities.length} existing activities`);
    return this.mapToResponseDto(activity);
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
        userId: user.id 
      },
      relations: ['user', 'rateActivities'],
    });

    if (!activity) {
      throw AppException.notFound(ErrorCode.PROFILE_ACTIVITY_NOT_FOUND, 'Activity not found', { activityId, userId: user.id });
    }

    if (activity.status === 'closed') {
      throw AppException.validation(ErrorCode.PROFILE_ACTIVITY_ALREADY_CLOSED, 'Activity is already closed', { activityId });
    }

    // Create RateActivity
    const rateActivity = this.rateActivityRepository.create({
      ...createRateActivityDto,
      activityId,
    });

    await this.rateActivityRepository.save(rateActivity);

    // Mark activity as closed
    activity.status = 'closed';
    activity.closedAt = new Date();
    
    const updatedActivity = await this.activityRepository.save(activity);
    return this.mapToResponseDto(updatedActivity);
  }

  /**
   * Get activity by ID
   */
  async getActivityById(userId: number, activityId: number): Promise<ActivityResponseDto> {
    const activity = await this.activityRepository.findOne({
      where: { 
        id: activityId, 
        userId: userId
      },
      relations: ['user', 'rateActivities'],
    });

    console.log(activity);

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
        userId: userId
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
    
    return this.mapToResponseDto(updatedActivity);
  }

  /**
   * Delete activity
   */
  @Transactional()
  async deleteActivity(userId: number, activityId: number): Promise<void> {
    const activity = await this.activityRepository.findOne({
      where: { 
        id: activityId, 
        userId: userId
      },
      relations: ['user', 'rateActivities'],
    });

    if (!activity) {
      throw AppException.notFound(ErrorCode.PROFILE_ACTIVITY_NOT_FOUND, 'Activity not found', { activityId, userId });
    }

    if (activity.status === 'closed') {
      throw AppException.validation(ErrorCode.PROFILE_ACTIVITY_CANNOT_DELETE_CLOSED, 'Cannot delete closed activity', { activityId });
    }

    await this.activityRepository.remove(activity);
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
      closedAt: activity.closedAt,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      rateActivities: activity.rateActivities || [],
    };
  }

  /**
   * Change activity position
   */
  @Transactional()
  async changePosition(activityId: number, newPosition: number, user: User): Promise<ActivityResponseDto> {
    try {
      const activity = await this.activityRepository.findOne({
        where: { id: activityId, userId: user.id  },
        relations: ['rateActivities'],
      });

      if (!activity) {
        throw AppException.notFound(ErrorCode.PROFILE_ACTIVITY_NOT_FOUND, 'Activity not found');
      }

      if (activity.status === 'closed') {
        throw AppException.validation(ErrorCode.PROFILE_ACTIVITY_CANNOT_MODIFY_CLOSED, 'Cannot modify closed activity');
      }

      const oldPosition = activity.position;
      
      // If position hasn't changed, no need to update
      if (oldPosition === newPosition) {
        return this.mapToResponseDto(activity);
      }

      // Get all activities for this user, ordered by position
      const allActivities = await this.activityRepository.find({
        where: { user: { id: user.id } },
        order: { position: 'ASC', createdAt: 'DESC' }
      });

      // Remove the current activity from the list
      const otherActivities = allActivities.filter(a => a.id !== activityId);

      // Create new positions array
      const newPositions = otherActivities.map(a => a.position);
      
      // Insert new position in the correct place
      if (newPosition < 0) {
        newPosition = 0;
      } else if (newPosition > otherActivities.length) {
        newPosition = otherActivities.length;
      }

      // Shift positions
      if (oldPosition < newPosition) {
        // Moving down: shift activities between old and new position up
        for (let i = 0; i < otherActivities.length; i++) {
          if (otherActivities[i].position > oldPosition && otherActivities[i].position <= newPosition) {
            otherActivities[i].position = otherActivities[i].position - 1;
          }
        }
      } else if (oldPosition > newPosition) {
        // Moving up: shift activities between new and old position down
        for (let i = 0; i < otherActivities.length; i++) {
          if (otherActivities[i].position >= newPosition && otherActivities[i].position < oldPosition) {
            otherActivities[i].position = otherActivities[i].position + 1;
          }
        }
      }

      // Update the current activity position
      activity.position = newPosition;

      // Save all changes
      await this.activityRepository.save([...otherActivities, activity]);

      this.logger.log(`Activity position updated: ${activityId} -> position ${newPosition} (was ${oldPosition})`);
      return this.mapToResponseDto(activity);
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
