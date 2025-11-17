import { Injectable, Logger } from '@nestjs/common';
import { SuggestedActivityQueueService } from '../queue/suggested-activity-queue.service';
import { UsersService } from '../../users/users.service';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class SuggestedActivityCronService {
  private readonly logger = new Logger(SuggestedActivityCronService.name);
  private isProcessing = false;

  constructor(

    private readonly suggestedActivityQueueService: SuggestedActivityQueueService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Daily generation of suggested activities for all users
   * Called by SettingsService cron job
   */
  async generateDailySuggestions() {
    if (this.isProcessing) {
      this.logger.warn('Generation of suggestions already in progress, skipping...');
      return;
    }

    this.isProcessing = true;
    this.logger.log('Starting daily generation of suggested activities...');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Add cleanup task to queue (high priority)
      await this.suggestedActivityQueueService.addCleanupJob(today, 10);
      this.logger.log('Cleanup task added to queue');

      // 2. Process users by pagination
      const pageSize = parseInt(process.env.USERS_PAGE_SIZE || '100', 10);
      const delayBetweenPages = parseInt(process.env.USERS_PAGE_DELAY || '2000', 10);
      
      this.logger.log(`Pagination settings: page size=${pageSize}, delay=${delayBetweenPages}ms`);

      let totalProcessed = 0;
      let page = 1;
      let hasMoreUsers = true;

      while (hasMoreUsers) {
        try {
          // Get users by pages
          const usersPage = await this.usersService.findUsersWithPagination(page, pageSize);
          
          if (!usersPage.users || usersPage.users.length === 0) {
            hasMoreUsers = false;
            this.logger.log(`Page ${page}: no users found, finishing`);
            break;
          }

          this.logger.log(`Page ${page}: received ${usersPage.users.length} users`);

          // Add generation tasks for users on current page
          const userIds = usersPage.users.map(user => user.id);
          await this.suggestedActivityQueueService.addBulkGenerateSuggestionsJobs(userIds, today);
          
          totalProcessed += userIds.length;
          this.logger.log(`Page ${page}: added ${userIds.length} generation tasks. Total processed: ${totalProcessed}`);

          // Check if there are more pages
          hasMoreUsers = usersPage.users.length === pageSize;
          page++;

          // Pause between pages (except last)
          if (hasMoreUsers) {
            this.logger.log(`Pause ${delayBetweenPages}ms before next page...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenPages));
          }

        } catch (error) {
          this.logger.error(`Error processing page ${page}: ${error.message}`);
          // Continue with next page
          page++;
        }
      }

      this.logger.log(`User processing completed. Total processed: ${totalProcessed} users`);
      
      // 3. Get queue statistics
      const queueStats = await this.suggestedActivityQueueService.getQueueStats();
      this.logger.log(`Queue statistics: ${JSON.stringify(queueStats)}`);

    } catch (error) {
      this.logger.error(`Critical error adding tasks to queue: ${error.message}`);
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_CRON_GENERATION_FAILED, undefined, {
        error: error.message,
        context: 'generateDailySuggestions'
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Weekly cleanup of old suggested activities
   * Called by SettingsService cron job
   */
  async cleanupOldSuggestions() {
    if (this.isProcessing) {
      this.logger.warn('Cleanup already in progress, skipping...');
      return;
    }

    this.isProcessing = true;
    this.logger.log('Starting weekly cleanup of old suggested activities...');
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago
      
      await this.suggestedActivityQueueService.addCleanupJob(cutoffDate, 5);
      this.logger.log('Weekly cleanup task added to queue');
      
    } catch (error) {
      this.logger.error(`Error during weekly cleanup: ${error.message}`);
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_CRON_CLEANUP_FAILED, undefined, {
        error: error.message,
        context: 'cleanupOldSuggestions'
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Daily check of queue health and performance
   * Can be called manually or via cron
   */
  async checkQueueHealth() {
    this.logger.log('Starting daily queue health check...');
    
    try {
      const queueStats = await this.suggestedActivityQueueService.getQueueStats();
      
      this.logger.log(`Queue health check completed. Stats: ${JSON.stringify(queueStats)}`);
      
      // Check for potential issues
      if (queueStats.failed > 0) {
        this.logger.warn(`Queue has ${queueStats.failed} failed jobs`);
      }
      
      if (queueStats.waiting > 1000) {
        this.logger.warn(`Queue has ${queueStats.waiting} waiting jobs - potential bottleneck`);
      }
      
    } catch (error) {
      this.logger.error(`Error during queue health check: ${error.message}`);
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_CRON_HEALTH_CHECK_FAILED, undefined, {
        error: error.message,
        context: 'checkQueueHealth'
      });
    }
  }

  /**
   * Manual trigger for generating suggestions (for testing/admin use)
   */
  async manualGenerateSuggestions(userId?: number) {
    if (this.isProcessing) {
      throw AppException.conflict(ErrorCode.SUGGESTED_ACTIVITY_CRON_ALREADY_PROCESSING, undefined, {
        context: 'manualGenerateSuggestions'
      });
    }

    this.isProcessing = true;
    this.logger.log('Manual generation of suggestions triggered...');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (userId) {
        // Generate for specific user
        await this.suggestedActivityQueueService.addGenerateSuggestionsJob(userId, today);
        this.logger.log(`Manual generation task added for user ${userId}`);
      } else {
        // Generate for all users (like daily cron)
        await this.generateDailySuggestions();
      }
      
    } catch (error) {
      this.logger.error(`Error during manual generation: ${error.message}`);
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_CRON_MANUAL_GENERATION_FAILED, undefined, {
        error: error.message,
        context: 'manualGenerateSuggestions',
        userId
      });
    } finally {
      this.isProcessing = false;
    }
  }
}
