import { Injectable } from '@nestjs/common';
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

    const activity = this.activityRepository.create({
      ...createActivityDto,
      user,
      activityType,
      status: 'active', // Activity is active by default
    });

    const savedActivity = await this.activityRepository.save(activity);
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
      where: { id: activityId, user: {id: user.id} },
      relations: ['user'],
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
      where: { id: activityId, user: {id: userId} },
      relations: ['user'],
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
      where: { id: activityId, user: {id: userId} },
      relations: ['user'],
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
      where: { id: activityId, user: {id: userId} },
      relations: ['user'],
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
      isPublic: activity.isPublic,
      status: activity.status,
      closedAt: activity.closedAt,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      rateActivities: activity.rateActivities || [],
    };
  }
}
