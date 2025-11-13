import { NotificationType } from '../entities/user-notification.entity';
import { NotificationPayload } from '../types/notification-payload';

export enum NotificationQueueJobType {
  REMINDER_INACTIVITY = 'reminder-inactivity',
  REMINDER_MOOD = 'reminder-mood',
  REMINDER_SURVEYS = 'reminder-surveys',
  REMINDER_ARTICLES = 'reminder-articles',
  REMINDER_GLOBAL_ACTIVITY = 'reminder-global-activity',
  SCHEDULE_INACTIVITY = 'schedule-inactivity',
  SCHEDULE_MOOD = 'schedule-mood',
  SCHEDULE_SURVEYS = 'schedule-surveys',
  SCHEDULE_ARTICLES = 'schedule-articles',
  SCHEDULE_GLOBAL_ACTIVITY = 'schedule-global-activity',
  BROADCAST_CUSTOM = 'broadcast-custom',
  BROADCAST_CUSTOM_GLOBAL = 'broadcast-custom-global',
  PUSH_DELIVERY = 'push-delivery',
}

export interface NotificationQueueJob {
  type: NotificationQueueJobType;
}

export interface ReminderBatchJob extends NotificationQueueJob {
  userIds: number[];
  timestamp: string;
}

export interface PushDeliveryJob extends NotificationQueueJob {
  userId: number;
  notificationType: NotificationType;
  payload: NotificationPayload;
}

export interface BroadcastCustomJob extends NotificationQueueJob {
  batchUserIds: number[];
  payload: {
    title: string;
    body: string;
    data?: Record<string, string>;
  };
}

export interface BroadcastCustomGlobalJob extends NotificationQueueJob {
  payload: {
    title: string;
    body: string;
    data?: Record<string, string>;
  };
}
