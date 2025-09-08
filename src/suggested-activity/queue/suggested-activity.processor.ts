import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { Job } from 'bull';
import { SuggestedActivityService } from '../services/suggested-activity.service';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';

export interface GenerateSuggestionsJob {
  userId: number;
  targetDate: Date;
}

export interface CleanupJob {
  targetDate: Date;
}

@Processor('suggested-activity')
export class SuggestedActivityProcessor {
  private readonly logger = new Logger(SuggestedActivityProcessor.name);

  constructor(
    private readonly suggestedActivityService: SuggestedActivityService,
  ) {}

  /**
   * Process suggestion generation task for a single user
   */
  @Process('generate-suggestions')
  @Transactional()
  async handleGenerateSuggestions(job: Job<GenerateSuggestionsJob>) {
    const { userId, targetDate } = job.data;
    
    this.logger.log(`Starting suggestion generation for user ${userId}`);
    
    try {
      // Generate suggestions for user
      const suggestions = await this.suggestedActivityService.generateSuggestedActivities(userId, targetDate);
      
      // Save suggestions to database
      if (suggestions.length > 0) {
        await this.suggestedActivityService['suggestedActivityRepository'].save(suggestions);
        this.logger.log(`User ${userId}: generated ${suggestions.length} suggestions`);
        
        // Return result for logging
        return {
          userId,
          suggestionsCount: suggestions.length,
          success: true,
        };
      }
      
      this.logger.log(`User ${userId}: no suggestions generated`);
      return {
        userId,
        suggestionsCount: 0,
        success: true,
      };
      
    } catch (error) {
      this.logger.error(`Error generating suggestions for user ${userId}: ${error.message}`);
      
      // Return error for logging
      return {
        userId,
        suggestionsCount: 0,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process cleanup task for old suggestions
   */
  @Process('cleanup-old-suggestions')
  @Transactional()
  async handleCleanupOldSuggestions(job: Job<CleanupJob>) {
    const { targetDate } = job.data;
    
    this.logger.log('Starting cleanup of old suggestions');
    
    try {
      // Remove suggestions older than 7 days
      const weekAgo = new Date(targetDate);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const result = await this.suggestedActivityService['suggestedActivityRepository']
        .createQueryBuilder('suggestion')
        .delete()
        .where('suggestion.suggestedDate < :weekAgo', { weekAgo })
        .andWhere('suggestion.isUsed = :isUsed', { isUsed: false })
        .execute();

      this.logger.log(`Cleanup completed. Deleted ${result.affected || 0} old suggestions`);
      
      return {
        success: true,
        deletedCount: result.affected || 0,
      };
      
    } catch (error) {
      this.logger.error(`Error during cleanup of old suggestions: ${error.message}`);
      
      return {
        success: false,
        deletedCount: 0,
        error: error.message,
      };
    }
  }

  /**
   * Process bulk suggestion generation task for multiple users
   */
  @Process('bulk-generate-suggestions')
  @Transactional()
  async handleBulkGenerateSuggestions(job: Job<{ userIds: number[]; targetDate: Date }>) {
    const { userIds, targetDate } = job.data;
    
    this.logger.log(`Starting bulk suggestion generation for ${userIds.length} users`);
    
    try {
      const results: Array<{
        userId: number;
        success: boolean;
        suggestionsCount?: number;
        error?: string;
      }> = [];
      let successCount = 0;
      let errorCount = 0;
      
      for (const userId of userIds) {
        try {
          const suggestions = await this.suggestedActivityService.generateSuggestedActivities(userId, targetDate);
          
          if (suggestions.length > 0) {
            await this.suggestedActivityService['suggestedActivityRepository'].save(suggestions);
            successCount++;
            results.push({
              userId,
              success: true,
              suggestionsCount: suggestions.length,
            });
          } else {
            results.push({
              userId,
              success: true,
              suggestionsCount: 0,
            });
          }
        } catch (error) {
          errorCount++;
          results.push({
            userId,
            success: false,
            error: error.message,
          });
          this.logger.error(`Error generating suggestions for user ${userId}: ${error.message}`);
        }
      }
      
      this.logger.log(`Bulk generation completed. Success: ${successCount}, Errors: ${errorCount}`);
      
      return {
        success: true,
        totalUsers: userIds.length,
        successCount,
        errorCount,
        results,
      };
      
    } catch (error) {
      this.logger.error(`Critical error during bulk generation: ${error.message}`);
      
      return {
        success: false,
        totalUsers: userIds.length,
        successCount: 0,
        errorCount: userIds.length,
        error: error.message,
      };
    }
  }

  /**
   * Process task validation and health check
   */
  @Process('health-check')
  async handleHealthCheck(job: Job) {
    this.logger.log('Starting queue health check');
    
    try {
      // Check if service is accessible
      const isHealthy = await this.suggestedActivityService.healthCheck();
      
      this.logger.log(`Health check completed. Service healthy: ${isHealthy}`);
      
      return {
        success: true,
        healthy: isHealthy,
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      
      return {
        success: false,
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
