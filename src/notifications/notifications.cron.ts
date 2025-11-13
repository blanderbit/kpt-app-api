import { Inject, Injectable, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { NotificationsConfigService } from './notifications.config';
import { NotificationsQueueService } from './queue/notifications-queue.service';
import { NotificationQueueJobType } from './queue/job-types';
import { SettingsService, NotificationCronConfig } from '../admin/settings/settings.service';

const CRON_JOB_NAMES = {
  inactivity: 'firebase-notifications-inactivity',
  mood: 'firebase-notifications-mood',
  surveys: 'firebase-notifications-surveys',
  articles: 'firebase-notifications-articles',
  globalActivity: 'firebase-notifications-global-activity',
};

@Injectable()
export class NotificationsCronService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsCronService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: NotificationsConfigService,
    private readonly notificationsQueue: NotificationsQueueService,
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService: SettingsService,
  ) {}

  onModuleInit() {
    this.refreshCronJobs();
  }

  refreshCronJobs(): void {
    this.logger.log('Refreshing notification cron jobs from settings');
    this.registerCronJobs();
  }

  private registerCronJobs(): void {
    const cronExpressions = this.resolveCronExpressions();

    const jobs: Array<{
      name: string;
      expression: string;
      handler: () => Promise<unknown>;
    }> = [
      {
        name: CRON_JOB_NAMES.inactivity,
        expression: cronExpressions.inactivity,
        handler: () => this.notificationsQueue.addSchedulerJob(NotificationQueueJobType.SCHEDULE_INACTIVITY),
      },
      {
        name: CRON_JOB_NAMES.mood,
        expression: cronExpressions.mood,
        handler: () => this.notificationsQueue.addSchedulerJob(NotificationQueueJobType.SCHEDULE_MOOD),
      },
      {
        name: CRON_JOB_NAMES.surveys,
        expression: cronExpressions.surveys,
        handler: () => this.notificationsQueue.addSchedulerJob(NotificationQueueJobType.SCHEDULE_SURVEYS),
      },
      {
        name: CRON_JOB_NAMES.articles,
        expression: cronExpressions.articles,
        handler: () => this.notificationsQueue.addSchedulerJob(NotificationQueueJobType.SCHEDULE_ARTICLES),
      },
      {
        name: CRON_JOB_NAMES.globalActivity,
        expression: cronExpressions.globalActivity,
        handler: () => this.notificationsQueue.addSchedulerJob(NotificationQueueJobType.SCHEDULE_GLOBAL_ACTIVITY),
      },
    ];

    for (const jobConfig of jobs) {
      this.registerCronJob(jobConfig.name, jobConfig.expression, jobConfig.handler);
    }
  }

  private registerCronJob(
    name: string,
    expression: string,
    handler: () => Promise<unknown>,
  ): void {
    if (!expression) {
      this.logger.warn(`Cron expression for job "${name}" is not set. Skipping registration.`);
      return;
    }

    if (this.schedulerRegistry.doesExist('cron', name)) {
      this.schedulerRegistry.deleteCronJob(name);
      this.logger.log(`Removed existing cron job ${name}`);
    }

    const job = new CronJob(expression, async () => {
      this.logger.debug(`Executing notification cron job "${name}" (${expression})`);
      await handler();
    });

    this.schedulerRegistry.addCronJob(name, job);
    job.start();

    this.logger.log(`Registered notification cron job "${name}" with expression "${expression}"`);
  }

  private resolveCronExpressions(): NotificationCronConfig {
    try {
      return this.settingsService.getNotificationCronSettings();
    } catch (error) {
      this.logger.warn(
        'Unable to retrieve notification cron settings from SettingsService, falling back to NotificationsConfigService.',
        error,
      );
      return this.configService.settings.cronExpressions;
    }
  }
}


