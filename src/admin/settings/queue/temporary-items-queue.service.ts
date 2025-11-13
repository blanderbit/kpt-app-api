import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import type {
  GenerateTemporaryArticlesJob,
  GenerateTemporarySurveysJob,
  GenerateTemporaryArticlesBatchJob,
  GenerateTemporarySurveysBatchJob,
} from './temporary-items.types';

@Injectable()
export class TemporaryItemsQueueService {
  private readonly logger = new Logger(TemporaryItemsQueueService.name);

  constructor(
    @InjectQueue('temporary-items') private readonly temporaryItemsQueue: Queue,
  ) {}

  async addGenerateTemporaryArticlesBatchJob(triggeredBy: string = 'manual') {
    try {
      const job = await this.temporaryItemsQueue.add(
        'generate-temporary-articles-batch',
        { triggeredBy } as GenerateTemporaryArticlesBatchJob,
        {
          attempts: 1,
          removeOnComplete: true,
          removeOnFail: 10,
        },
      );

      this.logger.log(
        `Temporary articles batch generation scheduled (job ${job.id}, triggered by ${triggeredBy})`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Error scheduling temporary articles batch generation (${triggeredBy}): ${error.message}`,
      );
      throw error;
    }
  }

  async addGenerateTemporaryArticlesJob(userId: number, priority: number = 0) {
    try {
      const job = await this.temporaryItemsQueue.add(
        'generate-temporary-articles',
        { userId } as GenerateTemporaryArticlesJob,
        {
          priority,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );

      this.logger.log(
        `Temporary articles generation task for user ${userId} added to queue. Job ID: ${job.id}`,
      );
      return job;
    } catch (error) {
      this.logger.error(`Error adding temporary articles generation task for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async addGenerateTemporarySurveysBatchJob(triggeredBy: string = 'manual') {
    try {
      const job = await this.temporaryItemsQueue.add(
        'generate-temporary-surveys-batch',
        { triggeredBy } as GenerateTemporarySurveysBatchJob,
        {
          attempts: 1,
          removeOnComplete: true,
          removeOnFail: 10,
        },
      );

      this.logger.log(
        `Temporary surveys batch generation scheduled (job ${job.id}, triggered by ${triggeredBy})`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Error scheduling temporary surveys batch generation (${triggeredBy}): ${error.message}`,
      );
      throw error;
    }
  }

  async addGenerateTemporarySurveysJob(userId: number, priority: number = 0) {
    try {
      const job = await this.temporaryItemsQueue.add(
        'generate-temporary-surveys',
        { userId } as GenerateTemporarySurveysJob,
        {
          priority,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );

      this.logger.log(
        `Temporary surveys generation task for user ${userId} added to queue. Job ID: ${job.id}`,
      );
      return job;
    } catch (error) {
      this.logger.error(`Error adding temporary surveys generation task for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async addBulkGenerateTemporaryArticlesJobs(userIds: number[]) {
    try {
      const jobs: any[] = [];

      for (const userId of userIds) {
        const job = await this.addGenerateTemporaryArticlesJob(userId);
        jobs.push(job);
      }

      this.logger.log(`Added ${jobs.length} temporary articles generation tasks to queue`);
      return jobs;
    } catch (error) {
      this.logger.error(`Error adding bulk temporary articles generation tasks: ${error.message}`);
      throw error;
    }
  }

  async addBulkGenerateTemporarySurveysJobs(userIds: number[]) {
    try {
      const jobs: any[] = [];

      for (const userId of userIds) {
        const job = await this.addGenerateTemporarySurveysJob(userId);
        jobs.push(job);
      }

      this.logger.log(`Added ${jobs.length} temporary surveys generation tasks to queue`);
      return jobs;
    } catch (error) {
      this.logger.error(`Error adding bulk temporary surveys generation tasks: ${error.message}`);
      throw error;
    }
  }

  async getQueueStats() {
    try {
      const [waiting, active, completed, failed, isPaused] = await Promise.all([
        this.temporaryItemsQueue.getWaiting(),
        this.temporaryItemsQueue.getActive(),
        this.temporaryItemsQueue.getCompleted(),
        this.temporaryItemsQueue.getFailed(),
        this.temporaryItemsQueue.isPaused(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length,
        isPaused: isPaused,
      };
    } catch (error) {
      this.logger.error(`Error getting queue statistics: ${error.message}`);
      throw error;
    }
  }
}
