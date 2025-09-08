import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { GenerateSuggestionsJob, CleanupJob } from './suggested-activity.processor';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class SuggestedActivityQueueService {
  private readonly logger = new Logger(SuggestedActivityQueueService.name);

  constructor(
    @InjectQueue('suggested-activity') private readonly suggestedActivityQueue: Queue,
  ) {}

  /**
   * Add suggestion generation task for user to queue
   */
  async addGenerateSuggestionsJob(userId: number, targetDate: Date, priority: number = 0) {
    try {
      const job = await this.suggestedActivityQueue.add(
        'generate-suggestions',
        { userId, targetDate } as GenerateSuggestionsJob,
        {
          priority,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        }
      );

      this.logger.log(`Suggestion generation task for user ${userId} added to queue. Job ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error(`Error adding generation task for user ${userId}: ${error.message}`);
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_QUEUE_ADD_JOB_FAILED, undefined, {
        error: error.message,
        userId,
        operation: 'addGenerateSuggestionsJob'
      });
    }
  }

  /**
   * Add cleanup task for old suggestions to queue
   */
  async addCleanupJob(targetDate: Date, priority: number = 10) {
    try {
      const job = await this.suggestedActivityQueue.add(
        'cleanup-old-suggestions',
        { targetDate } as CleanupJob,
        {
          priority, // High priority for cleanup
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        }
      );

      this.logger.log(`Cleanup task for old suggestions added to queue. Job ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error(`Error adding cleanup task: ${error.message}`);
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_QUEUE_ADD_CLEANUP_FAILED, undefined, {
        error: error.message,
        targetDate,
        operation: 'addCleanupJob'
      });
    }
  }

  /**
   * Add generation tasks for all users to queue
   */
  async addBulkGenerateSuggestionsJobs(userIds: number[], targetDate: Date) {
    try {
      const jobs: any[] = [];
      
      for (const userId of userIds) {
        const job = await this.addGenerateSuggestionsJob(userId, targetDate);
        jobs.push(job);
      }

      this.logger.log(`Added ${jobs.length} suggestion generation tasks to queue`);
      return jobs;
    } catch (error) {
      this.logger.error(`Error adding bulk generation tasks: ${error.message}`);
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_QUEUE_BULK_ADD_FAILED, undefined, {
        error: error.message,
        userIdsCount: userIds.length,
        operation: 'addBulkGenerateSuggestionsJobs'
      });
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        this.suggestedActivityQueue.getWaiting(),
        this.suggestedActivityQueue.getActive(),
        this.suggestedActivityQueue.getCompleted(),
        this.suggestedActivityQueue.getFailed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length,
      };
    } catch (error) {
      this.logger.error(`Error getting queue statistics: ${error.message}`);
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_QUEUE_GET_STATS_FAILED, undefined, {
        error: error.message,
        operation: 'getQueueStats'
      });
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus() {
    try {
      const stats = await this.getQueueStats();
      const isActive = stats.active > 0 || stats.waiting > 0;
      
      return {
        status: isActive ? 'active' : 'idle',
        timestamp: new Date().toISOString(),
        stats,
        error: null,
      };
    } catch (error) {
      this.logger.error(`Error getting queue status: ${error.message}`);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        stats: { waiting: 0, active: 0, completed: 0, failed: 0, total: 0 },
        error: error.message,
      };
    }
  }

  /**
   * Clear queue (remove all jobs)
   */
  async clearQueue() {
    try {
      await this.suggestedActivityQueue.empty();
      this.logger.log('Queue cleared successfully');
    } catch (error) {
      this.logger.error(`Error clearing queue: ${error.message}`);
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_QUEUE_CLEAR_FAILED, undefined, {
        error: error.message,
        operation: 'clearQueue'
      });
    }
  }

  /**
   * Pause queue
   */
  async pauseQueue() {
    try {
      await this.suggestedActivityQueue.pause();
      this.logger.log('Queue paused successfully');
    } catch (error) {
      this.logger.error(`Error pausing queue: ${error.message}`);
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_QUEUE_PAUSE_FAILED, undefined, {
        error: error.message,
        operation: 'pauseQueue'
      });
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue() {
    try {
      await this.suggestedActivityQueue.resume();
      this.logger.log('Queue resumed successfully');
    } catch (error) {
      this.logger.error(`Error resuming queue: ${error.message}`);
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_QUEUE_RESUME_FAILED, undefined, {
        error: error.message,
        operation: 'resumeQueue'
      });
    }
  }
}
