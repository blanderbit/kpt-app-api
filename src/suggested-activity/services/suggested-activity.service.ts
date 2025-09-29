import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional } from 'typeorm-transactional';
import { Repository, Between } from 'typeorm';
import { SuggestedActivity } from '../entities/suggested-activity.entity';
import { Activity } from '../../profile/activity/entities/activity.entity';
import { RateActivity } from '../../profile/activity/entities/rate-activity.entity';
import { ActivityTypesService } from '../../core/activity-types';
import { CreateSuggestedActivityDto, SuggestedActivityResponseDto } from '../dto/suggested-activity.dto';
import { ChatGPTService } from '../../core/chatgpt';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class SuggestedActivityService {
  constructor(
    @InjectRepository(SuggestedActivity)
    private readonly suggestedActivityRepository: Repository<SuggestedActivity>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(RateActivity)
    private readonly rateActivityRepository: Repository<RateActivity>,
    private readonly activityTypesService: ActivityTypesService,
    private readonly chatGPTService: ChatGPTService,
  ) {}

  /**
   * Get suggested activities for user only for current day
   */
  async getUserSuggestedActivities(user: User, date?: Date): Promise<SuggestedActivityResponseDto[]> {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    const suggestedActivities = await this.suggestedActivityRepository.find({
      where: {
        user: {id: user.id},
        suggestedDate: targetDate,
        isUsed: false,
      },
      relations: ['user'],
      order: {
        confidenceScore: 'DESC',
        createdAt: 'ASC',
      },
    });

    return suggestedActivities.map(this.mapToResponseDto);
  }

  /**
   * Add suggested activity to regular activities
   * Removes suggestion after adding and checks limit of 10 suggestions per day
   */
  @Transactional()
  async addSuggestedActivityToActivities(
    user: User,
    suggestedActivityId: number,
    notes?: string,
  ): Promise<any> {
    // Check suggestion limit for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySuggestionsCount = await this.suggestedActivityRepository.count({
      where: {
        user: {id: user.id},
        suggestedDate: today,
      },
      relations: ['user'],
    });

    if (todaySuggestionsCount >= 10) {
      throw AppException.forbidden(ErrorCode.SUGGESTED_ACTIVITY_DAILY_LIMIT_EXCEEDED, undefined, {
        userId: user.id,
        limit: 10,
        current: todaySuggestionsCount
      });
    }

    // Find suggested activity
    const suggestedActivity = await this.suggestedActivityRepository.findOne({
      where: { id: suggestedActivityId, user: {id: user.id} },
      relations: ['user'],
    });

    if (!suggestedActivity) {
      throw AppException.notFound(ErrorCode.SUGGESTED_ACTIVITY_NOT_FOUND, undefined, {
        suggestedActivityId,
        userId: user.id,
      });
    }

    if (suggestedActivity.isUsed) {
      throw AppException.forbidden(ErrorCode.SUGGESTED_ACTIVITY_ALREADY_USED, undefined, {
        suggestedActivityId,
        userId: user.id,
      });
    }

    // Create new activity
    const newActivity = this.activityRepository.create({
      activityName: suggestedActivity.activityName,
      activityType: suggestedActivity.activityType,
      content: suggestedActivity.content,
      user: user,
      status: 'active',
    });

    const savedActivity = await this.activityRepository.save(newActivity);

    // Remove suggested activity after use
    await this.suggestedActivityRepository.remove(suggestedActivity);

    return {
      message: 'Activity successfully added',
      activity: savedActivity,
    };
  }

  /**
   * Delete suggested activity
   */
  @Transactional()
  async deleteSuggestedActivity(userId: number, suggestedActivityId: number): Promise<any> {
    const suggestedActivity = await this.suggestedActivityRepository.findOne({
      where: { id: suggestedActivityId, user: {id: userId} },
      relations: ['user'],
    });

    if (!suggestedActivity) {
      throw AppException.notFound(ErrorCode.SUGGESTED_ACTIVITY_NOT_FOUND, undefined, {
        suggestedActivityId,
        userId
      });
    }

    await this.suggestedActivityRepository.remove(suggestedActivity);

    return {
      message: 'Suggested activity successfully deleted',
    };
  }

  /**
   * Refresh suggested activities for user
   */
  
  async refreshSuggestedActivities(userId: number, date?: Date): Promise<any> {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Remove existing suggestions for the date
    await this.suggestedActivityRepository.delete({
      userId,
      suggestedDate: targetDate,
    });

    // Generate new suggestions
    const newSuggestions = await this.generateSuggestedActivities(userId, targetDate);

    return {
      message: 'Suggested activities successfully refreshed',
      suggestionsCount: newSuggestions.length,
      date: targetDate,
    };
  }

  /**
   * Generate suggested activities for user
   */
  @Transactional()
  async generateSuggestedActivities(userId: number, targetDate: Date): Promise<SuggestedActivity[]> {
    try {
      // Get user activity patterns
      const patterns = await this.analyzeActivityPatternsWithAI(userId);
      
      // Get available activity types
      const activityTypes: any = await this.activityTypesService.getAllActivityTypes();
      
      // Generate suggestions based on patterns
      const suggestions: SuggestedActivity[] = [];
      const maxSuggestions = 6; // Maximum suggestions per day
      
      for (let i = 0; i < maxSuggestions; i++) {
        // Select activity type based on patterns
        const selectedType = this.selectActivityType(patterns, activityTypes, i);
        
        // Generate content using AI
        const { activityName, content } = await this.chatGPTService.generateActivityContent(
          selectedType,
          patterns,
          i
        );
        
        // Generate reasoning
        const reasoning = await this.chatGPTService.generateReasoning(
          patterns,
          selectedType,
          this.calculateConfidenceScore(patterns, selectedType)
        );
        
        // Create suggestion
        const suggestion = this.suggestedActivityRepository.create({
          userId,
          activityName,
          activityType: selectedType,
          content,
          reasoning,
          confidenceScore: this.calculateConfidenceScore(patterns, selectedType),
          suggestedDate: targetDate,
          isUsed: false,
        });
        
        suggestions.push(suggestion);
      }
      
      // Save all suggestions
      const savedSuggestions = await this.suggestedActivityRepository.save(suggestions);
      
      return savedSuggestions;
      
    } catch (error) {
      // this.logger.error(`Error generating suggested activities for user ${userId}: ${error.message}`); // Original code had this line commented out
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_GENERATION_FAILED, undefined, {
        error: error.message,
        userId,
        targetDate
      });
    }
  }

  /**
   * Analyze user activity patterns using AI
   */
  async analyzeActivityPatternsWithAI(userId: number): Promise<any> {
    try {
      // Get user activities from last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const activities = await this.activityRepository.find({
        where: {
          user: {id: userId},
          createdAt: Between(weekAgo, new Date()),
          status: 'closed',
        },
        relations: ['rateActivities','user'],
      });
      
      if (activities.length === 0) {
        return this.getDefaultPatterns();
      }
      
      // Analyze patterns
      const patterns: any = {
        types: {},
        satisfaction: 0,
        hardness: 0,
        completionRate: 0,
        totalActivities: activities.length,
        completedActivities: activities.filter(a => a.status === 'closed').length,
        recommendedCount: Math.min(6, Math.max(3, Math.ceil(activities.length / 2))),
        activityPreferences: [],
        timePatterns: {},
        difficultyTrend: 'stable',
      };
      
      // Calculate type distribution
      activities.forEach(activity => {
        patterns.types[activity.activityType] = (patterns.types[activity.activityType] || 0) + 1;
      });
      
      // Calculate satisfaction and hardness
      let totalSatisfaction = 0;
      let totalHardness = 0;
      let ratedActivities = 0;
      
      activities.forEach(activity => {
        if (activity.rateActivities && activity.rateActivities.length > 0) {
          const rating = activity.rateActivities[0];
          totalSatisfaction += rating.satisfactionLevel;
          totalHardness += rating.hardnessLevel;
          ratedActivities++;
        }
      });
      
      if (ratedActivities > 0) {
        patterns.satisfaction = Math.round(totalSatisfaction / ratedActivities);
        patterns.hardness = Math.round(totalHardness / ratedActivities);
      }
      
      // Calculate completion rate
      patterns.completionRate = Math.round((patterns.completedActivities / patterns.totalActivities) * 100);
      
      // Determine preferences
      patterns.activityPreferences = Object.keys(patterns.types)
        .sort((a, b) => patterns.types[b] - patterns.types[a])
        .slice(0, 3);
      
      // Analyze time patterns
      activities.forEach(activity => {
        const hour = new Date(activity.createdAt).getHours();
        if (hour >= 6 && hour < 12) {
          patterns.timePatterns.morning = (patterns.timePatterns.morning || 0) + 1;
        } else if (hour >= 12 && hour < 18) {
          patterns.timePatterns.afternoon = (patterns.timePatterns.afternoon || 0) + 1;
        } else {
          patterns.timePatterns.evening = (patterns.timePatterns.evening || 0) + 1;
        }
      });
      
      // Determine difficulty trend
      if (patterns.hardness > 70) {
        patterns.difficultyTrend = 'increasing';
      } else if (patterns.hardness < 30) {
        patterns.difficultyTrend = 'decreasing';
      }
      
      return patterns;
      
    } catch (error) {
      // this.logger.error(`Error analyzing activity patterns for user ${userId}: ${error.message}`); // Original code had this line commented out
      return this.getDefaultPatterns();
    }
  }

  /**
   * Get default patterns for new users
   */
  private getDefaultPatterns(): any {
    return {
      types: { health: 1, learning: 1, work: 1 },
      satisfaction: 75,
      hardness: 50,
      completionRate: 80,
      totalActivities: 3,
      completedActivities: 3,
      recommendedCount: 5,
      activityPreferences: ['health', 'learning', 'work'],
      timePatterns: { morning: 1, afternoon: 1, evening: 1 },
      difficultyTrend: 'stable',
    };
  }

  /**
   * Select activity type based on patterns
   */
  private selectActivityType(patterns: any, availableTypes: string[], index: number): string {
    // Prioritize user preferences
    if (patterns.activityPreferences.length > 0) {
      const preferenceIndex = index % patterns.activityPreferences.length;
      return patterns.activityPreferences[preferenceIndex];
    }
    
    // Fallback to available types
    return availableTypes[index % availableTypes.length] || 'health';
  }

  /**
   * Calculate confidence score for suggestion
   */
  private calculateConfidenceScore(patterns: any, activityType: string): number {
    let score = 70; // Base score
    
    // Boost score if user likes this type
    if (patterns.types[activityType]) {
      score += 15;
    }
    
    // Boost score if user has high satisfaction
    if (patterns.satisfaction > 80) {
      score += 10;
    }
    
    // Boost score if user has high completion rate
    if (patterns.completionRate > 80) {
      score += 5;
    }
    
    return Math.min(100, score);
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(entity: SuggestedActivity): SuggestedActivityResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      activityName: entity.activityName,
      activityType: entity.activityType,
      content: entity.content,
      reasoning: entity.reasoning,
      confidenceScore: entity.confidenceScore,
      isUsed: entity.isUsed,
      suggestedDate: entity.suggestedDate,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - try to access repository
      await this.suggestedActivityRepository.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }
}
