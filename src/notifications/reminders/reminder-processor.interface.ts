import { NotificationProcessingStats } from '../types/notification-processing-stats';

export interface ReminderProcessor {
  execute(userIds: number[], now: Date): Promise<NotificationProcessingStats[]>;
}


