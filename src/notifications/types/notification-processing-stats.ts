import { NotificationType } from '../entities/user-notification.entity';

export interface NotificationProcessingStats {
  type: NotificationType;
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
}


