import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const Bull = require('bull');

type QueueJobState = 'waiting' | 'active' | 'delayed' | 'completed' | 'failed' | 'paused';

export interface QueueInfo {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export interface QueueListResponse {
  queues: QueueInfo[];
  total: number;
}

@Injectable()
export class AdminQueueService {
  private readonly logger = new Logger(AdminQueueService.name);
  private redisClient: Redis;
  private queueCache: Map<string, Queue> = new Map();

  constructor(
    private readonly configService: ConfigService,
  ) {
    // Initialize Redis client
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB', 0),
    });
  }

  /**
   * Get all queue names from Redis
   */
  async getAllQueueNames(): Promise<string[]> {
    try {
      // Get all keys that match Bull queue pattern
      const keys = await this.redisClient.keys('bull:*:id');
      
      // Extract queue names from keys (format: bull:queueName:id)
      const queueNames = keys.map(key => {
        const parts = key.split(':');
        return parts[1];
      });
      
      // Remove duplicates
      return [...new Set(queueNames)];
    } catch (error) {
      this.logger.error(`Error getting queue names: ${error.message}`);
      return [];
    }
  }

  /**
   * Get queue by name (create if not exists)
   */
  private getQueueByName(queueName: string): Queue {
    // Check cache first
    const cached = this.queueCache.get(queueName);
    if (cached) {
      return cached;
    }

    // Create new Queue instance
    const queue = new Bull(queueName, {
      redis: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD'),
        db: this.configService.get('REDIS_DB', 0),
      },
    });

    // Cache for reuse
    this.queueCache.set(queueName, queue);
    
    return queue;
  }

  /**
   * Get statistics for a specific queue
   */
  async getQueueStats(queueName: string) {
    try {
      const queue = this.getQueueByName(queueName);

      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
        queue.isPaused(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length,
        paused,
      };
    } catch (error) {
      this.logger.error(`Error getting queue stats for ${queueName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get list of all queues with statistics
   */
  async getQueueList(): Promise<QueueListResponse> {
    try {
      const queueNames = await this.getAllQueueNames();
      const total = queueNames.length;
      
      // Get stats for all queues in parallel
      const queuesInfo = await Promise.all(
        queueNames.map(async (queueName) => {
          const queue = this.getQueueByName(queueName);
          
          try {
            const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
              queue.getWaiting(),
              queue.getActive(),
              queue.getCompleted(),
              queue.getFailed(),
              queue.getDelayed(),
              queue.isPaused(),
            ]);

            return {
              name: queueName,
              waiting: waiting.length,
              active: active.length,
              completed: completed.length,
              failed: failed.length,
              delayed: delayed.length,
              paused,
              hasError: false,
            };
          } catch (error) {
            this.logger.error(`Error getting stats for queue ${queueName}: ${error.message}`);
            // Return queue with error flag if loading failed
            return {
              name: queueName,
              waiting: 0,
              active: 0,
              completed: 0,
              failed: 0,
              delayed: 0,
              paused: false,
              hasError: true,
              errorMessage: error.message,
            };
          }
        })
      );
      
      return {
        queues: queuesInfo,
        total,
      };
    } catch (error) {
      this.logger.error(`Error getting queue list: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear queue (remove all jobs)
   */
  async clearQueue(queueName: string) {
    try {
      const queue = this.getQueueByName(queueName);

      const wasPaused = await queue.isPaused().catch(() => false);

      if (!wasPaused) {
        try {
          // pause queue and wait until current jobs complete before cleaning
          await queue.pause(true);
        } catch (pauseError) {
          this.logger.warn(`Unable to pause queue ${queueName} before clearing: ${pauseError.message}`);
        }
      }

      try {
        // obliterate removes all jobs (including repeatables) in one go
        await queue.obliterate({ force: true });
        this.logger.log(`Queue "${queueName}" obliterated successfully`);
      } catch (obliterateError) {
        this.logger.warn(`Obliterate failed for queue ${queueName}: ${obliterateError.message}. Falling back to manual cleanup.`);

        // clear waiting/delayed jobs
        await queue.empty().catch((emptyError: Error) => {
          this.logger.warn(`queue.empty() failed for ${queueName}: ${emptyError.message}`);
        });

        // remove repeatable jobs explicitly
        const repeatableJobs = await queue.getRepeatableJobs().catch(() => []);
        await Promise.all(
          repeatableJobs.map(async (job) => {
            try {
              await queue.removeRepeatableByKey(job.key);
            } catch (removeError) {
              this.logger.warn(`Failed to remove repeatable job ${job.key} in queue ${queueName}: ${removeError.message}`);
            }
          })
        );

        // remove jobs by state
        const jobStates: QueueJobState[] = ['waiting', 'active', 'delayed', 'completed', 'failed', 'paused'];
        for (const state of jobStates) {
          try {
            const jobs = await queue.getJobs([state]);
            await Promise.all(
              jobs.map(async (job) => {
                try {
                  await job.remove();
                } catch (removeError) {
                  this.logger.warn(`Error removing ${state} job ${job.id} from queue ${queueName}: ${removeError.message}`);
                }
              })
            );
          } catch (stateError) {
            this.logger.warn(`Failed to fetch ${state} jobs for queue ${queueName}: ${stateError.message}`);
          }
        }
      }

      if (!wasPaused) {
        try {
          await queue.resume();
        } catch (resumeError) {
          this.logger.warn(`Unable to resume queue ${queueName} after clearing: ${resumeError.message}`);
        }
      }

      this.logger.log(`Queue "${queueName}" cleared successfully`);
    } catch (error) {
      this.logger.error(`Error clearing queue ${queueName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName: string) {
    try {
      const queue = this.getQueueByName(queueName);

      await queue.pause();
      this.logger.log(`Queue "${queueName}" paused successfully`);
    } catch (error) {
      this.logger.error(`Error pausing queue ${queueName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName: string) {
    try {
      const queue = this.getQueueByName(queueName);

      await queue.resume();
      this.logger.log(`Queue "${queueName}" resumed successfully`);
    } catch (error) {
      this.logger.error(`Error resuming queue ${queueName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear all failed jobs in a queue
   */
  async clearFailedJobs(queueName: string) {
    try {
      const queue = this.getQueueByName(queueName);

      const failed = await queue.getFailed();
      await Promise.all(failed.map(job => job.remove()));
      
      this.logger.log(`Cleared ${failed.length} failed jobs from queue "${queueName}"`);
      return { cleared: failed.length };
    } catch (error) {
      this.logger.error(`Error clearing failed jobs in queue ${queueName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear all completed jobs in a queue
   */
  async clearCompletedJobs(queueName: string) {
    try {
      const queue = this.getQueueByName(queueName);

      const completed = await queue.getCompleted();
      await Promise.all(completed.map(job => job.remove()));
      
      this.logger.log(`Cleared ${completed.length} completed jobs from queue "${queueName}"`);
      return { cleared: completed.length };
    } catch (error) {
      this.logger.error(`Error clearing completed jobs in queue ${queueName}: ${error.message}`);
      throw error;
    }
  }
}

