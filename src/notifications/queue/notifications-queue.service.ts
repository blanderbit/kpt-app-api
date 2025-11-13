import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NotificationType } from '../entities/user-notification.entity';
import { NotificationPayload } from '../types/notification-payload';
import {
  NotificationQueueJobType,
  NotificationQueueJob,
  ReminderBatchJob,
  PushDeliveryJob,
  BroadcastCustomJob,
  BroadcastCustomGlobalJob,
} from './job-types';

@Injectable()
export class NotificationsQueueService {
  private readonly logger = new Logger(NotificationsQueueService.name);

  constructor(
    @InjectQueue('notifications')
    private readonly queue: Queue<NotificationQueueJob>,
  ) {}

  private async enqueue(type: NotificationQueueJobType, data: Partial<NotificationQueueJob> = {}): Promise<void> {
    await this.queue.add(
      type,
      { type, ...data },
      {
        jobId: `${type}:${Date.now()}:${Math.random()}`,
      },
    );
    this.logger.debug(`Enqueued notifications job ${type}`);
  }

  async addReminderBatchJob(
    type:
      | NotificationQueueJobType.REMINDER_INACTIVITY
      | NotificationQueueJobType.REMINDER_MOOD
      | NotificationQueueJobType.REMINDER_SURVEYS
      | NotificationQueueJobType.REMINDER_ARTICLES
      | NotificationQueueJobType.REMINDER_GLOBAL_ACTIVITY,
    userIds: number[],
    timestamp: Date,
  ): Promise<void> {
    if (!userIds || userIds.length === 0) {
      return;
    }

    await this.enqueue(type, {
      userIds,
      timestamp: timestamp.toISOString(),
    } as ReminderBatchJob);
  }

  async addPushDeliveryJob(
    userId: number,
    notificationType: NotificationType,
    payload: NotificationPayload,
  ): Promise<void> {
    await this.enqueue(NotificationQueueJobType.PUSH_DELIVERY, {
      userId,
      notificationType,
      payload,
    } as PushDeliveryJob);
  }

  async addBroadcastCustomJob(batchUserIds: number[], payload: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<void> {
    if (!batchUserIds.length) {
      return;
    }
    await this.enqueue(NotificationQueueJobType.BROADCAST_CUSTOM, {
      batchUserIds,
      payload,
    } as BroadcastCustomJob);
  }

  async addSchedulerJob(
    type:
      | NotificationQueueJobType.SCHEDULE_INACTIVITY
      | NotificationQueueJobType.SCHEDULE_MOOD
      | NotificationQueueJobType.SCHEDULE_SURVEYS
      | NotificationQueueJobType.SCHEDULE_ARTICLES
      | NotificationQueueJobType.SCHEDULE_GLOBAL_ACTIVITY,
  ): Promise<void> {
    await this.enqueue(type);
  }

  async addBroadcastCustomGlobalJob(payload: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<void> {
    await this.enqueue(NotificationQueueJobType.BROADCAST_CUSTOM_GLOBAL, {
      payload,
    } as BroadcastCustomGlobalJob);
  }
}
