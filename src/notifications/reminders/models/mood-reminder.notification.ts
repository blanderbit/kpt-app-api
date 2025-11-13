import { NotificationType } from '../../entities/user-notification.entity';
import { ReminderNotification } from './reminder-notification.interface';

export class MoodReminderNotification {
  static create(): ReminderNotification {
    return {
      type: NotificationType.MISSING_MOOD,
      payload: {
        title: 'Не забудьте про ваше настроение',
        body: 'Пора отметить свое настроение за сегодня. Это займет всего минуту!',
      },
    };
  }
}
