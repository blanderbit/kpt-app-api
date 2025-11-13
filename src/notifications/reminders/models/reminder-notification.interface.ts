import { NotificationType } from '../../entities/user-notification.entity';
import { NotificationPayload } from '../../types/notification-payload';

export interface ReminderNotification {
  type: NotificationType;
  payload: NotificationPayload;
}
