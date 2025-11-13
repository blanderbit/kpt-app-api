import { NotificationType } from '../../entities/user-notification.entity';
import { ReminderNotification } from './reminder-notification.interface';

export class InactivityReminderNotification {
  static create(daysWithoutActivity: number, thresholdDays: number): ReminderNotification {
    return {
      type: NotificationType.INACTIVITY_REMINDER,
      payload: {
        title: 'Давно не было активностей',
        body: `Вы не создавали активности уже ${Math.max(daysWithoutActivity, thresholdDays)} дней. Добавьте новую, чтобы не терять прогресс!`,
      },
    };
  }
}
