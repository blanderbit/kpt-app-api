import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationQueueJobType,
  ReminderBatchJob,
  PushDeliveryJob,
  BroadcastCustomJob,
  BroadcastCustomGlobalJob,
} from './job-types';
import { InactivityReminderProcessor } from '../reminders/inactivity-reminder.processor';
import { MoodReminderProcessor } from '../reminders/mood-reminder.processor';
import { SurveyReminderProcessor } from '../reminders/survey-reminder.processor';
import { ArticleReminderProcessor } from '../reminders/article-reminder.processor';
import { GlobalActivityReminderProcessor } from '../reminders/global-activity-reminder.processor';
import { NotificationsDeliveryService } from '../notifications-delivery.service';
import { NotificationsQueueService } from './notifications-queue.service';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from '../entities/user-notification.entity';

@Processor('notifications')
@Injectable()
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly inactivityReminderProcessor: InactivityReminderProcessor,
    private readonly moodReminderProcessor: MoodReminderProcessor,
    private readonly surveyReminderProcessor: SurveyReminderProcessor,
    private readonly articleReminderProcessor: ArticleReminderProcessor,
    private readonly globalActivityReminderProcessor: GlobalActivityReminderProcessor,
    private readonly deliveryService: NotificationsDeliveryService,
    private readonly notificationsQueue: NotificationsQueueService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process(NotificationQueueJobType.REMINDER_INACTIVITY)
  async handleInactivityReminder(job: Job<ReminderBatchJob>) {
    const userIds = job.data?.userIds || [];
    this.logger.debug(
      `Processing inactivity reminder batch job ${job.id} for ${userIds.length} users`,
    );
    if (userIds.length === 0) {
      return;
    }
    const timestamp = job.data?.timestamp ? new Date(job.data.timestamp) : new Date();
    return this.inactivityReminderProcessor.execute(userIds, timestamp);
  }

  @Process(NotificationQueueJobType.REMINDER_MOOD)
  async handleMoodReminder(job: Job<ReminderBatchJob>) {
    const userIds = job.data?.userIds || [];
    this.logger.debug(
      `Processing mood reminder batch job ${job.id} for ${userIds.length} users`,
    );
    if (userIds.length === 0) {
      return;
    }
    const timestamp = job.data?.timestamp ? new Date(job.data.timestamp) : new Date();
    return this.moodReminderProcessor.execute(userIds, timestamp);
  }

  @Process(NotificationQueueJobType.REMINDER_SURVEYS)
  async handleSurveyReminder(job: Job<ReminderBatchJob>) {
    const userIds = job.data?.userIds || [];
    this.logger.debug(
      `Processing survey reminder batch job ${job.id} for ${userIds.length} users`,
    );
    if (userIds.length === 0) {
      return;
    }
    const timestamp = job.data?.timestamp ? new Date(job.data.timestamp) : new Date();
    return this.surveyReminderProcessor.execute(userIds, timestamp);
  }

  @Process(NotificationQueueJobType.REMINDER_ARTICLES)
  async handleArticleReminder(job: Job<ReminderBatchJob>) {
    const userIds = job.data?.userIds || [];
    this.logger.debug(
      `Processing article reminder batch job ${job.id} for ${userIds.length} users`,
    );
    if (userIds.length === 0) {
      return;
    }
    const timestamp = job.data?.timestamp ? new Date(job.data.timestamp) : new Date();
    return this.articleReminderProcessor.execute(userIds, timestamp);
  }

  @Process(NotificationQueueJobType.REMINDER_GLOBAL_ACTIVITY)
  async handleGlobalActivityReminder(job: Job<ReminderBatchJob>) {
    const userIds = job.data?.userIds || [];
    this.logger.debug(
      `Processing global activity reminder batch job ${job.id} for ${userIds.length} users`,
    );
    if (userIds.length === 0) {
      return;
    }
    const timestamp = job.data?.timestamp ? new Date(job.data.timestamp) : new Date();
    return this.globalActivityReminderProcessor.execute(userIds, timestamp);
  }

  @Process(NotificationQueueJobType.PUSH_DELIVERY)
  async handlePushDelivery(job: Job<PushDeliveryJob>) {
    this.logger.debug(
      `Processing push delivery job ${job.id} for user ${job.data.userId} type ${job.data.notificationType}`,
    );
    await this.deliveryService.deliverNotification(job.data);
  }

  @Process(NotificationQueueJobType.BROADCAST_CUSTOM)
  async handleBroadcastCustom(job: Job<BroadcastCustomJob>) {
    const userIds = job.data?.batchUserIds ?? [];
    if (!userIds.length) {
      this.logger.debug(`Broadcast custom job ${job.id} has empty userIds, skipping.`);
      return;
    }

    const payload = job.data?.payload;
    if (!payload) {
      this.logger.warn(`Broadcast custom job ${job.id} missing payload`);
      return;
    }

    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        const success = await this.deliveryService.sendNotificationIfAllowed(
          userId,
          NotificationType.CUSTOM_BROADCAST,
          {
            title: payload.title,
            body: payload.body,
            data: payload.data,
          },
        );
        if (success) {
          sent += 1;
        } else {
          failed += 1;
        }
      } catch (error) {
        failed += 1;
        this.logger.error(`Failed to queue custom broadcast for user ${userId}: ${error instanceof Error ? error.message : error}`);
      }
    }

    this.logger.debug(
      `Processed broadcast custom job ${job.id}: sent=${sent}, failed=${failed}, total=${userIds.length}`,
    );
  }

  @Process(NotificationQueueJobType.BROADCAST_CUSTOM_GLOBAL)
  async handleBroadcastCustomGlobal(job: Job<BroadcastCustomGlobalJob>) {
    const payload = job.data?.payload;
    if (!payload) {
      this.logger.warn(`Broadcast custom global job ${job.id} missing payload`);
      return;
    }
    await this.notificationsService.dispatchBroadcastCustom(payload);
  }

  @Process(NotificationQueueJobType.SCHEDULE_INACTIVITY)
  async scheduleInactivity() {
    this.logger.debug('Processing scheduled inactivity notifications job');
    await this.notificationsService.processInactivityNotifications();
  }

  @Process(NotificationQueueJobType.SCHEDULE_MOOD)
  async scheduleMood() {
    this.logger.debug('Processing scheduled mood notifications job');
    await this.notificationsService.processMoodNotifications();
  }

  @Process(NotificationQueueJobType.SCHEDULE_SURVEYS)
  async scheduleSurveys() {
    this.logger.debug('Processing scheduled survey notifications job');
    await this.notificationsService.processSurveyNotifications();
  }

  @Process(NotificationQueueJobType.SCHEDULE_ARTICLES)
  async scheduleArticles() {
    this.logger.debug('Processing scheduled article notifications job');
    await this.notificationsService.processArticleNotifications();
  }

  @Process(NotificationQueueJobType.SCHEDULE_GLOBAL_ACTIVITY)
  async scheduleGlobalActivity() {
    this.logger.debug('Processing scheduled global activity notifications job');
    await this.notificationsService.processGlobalActivityNotifications();
  }
}


