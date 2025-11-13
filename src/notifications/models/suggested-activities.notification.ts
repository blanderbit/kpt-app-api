import { NotificationType } from '../entities/user-notification.entity';
import { ReminderNotification } from '../reminders/models/reminder-notification.interface';

export class SuggestedActivitiesNotification {
  static create(): ReminderNotification {
    return {
      type: NotificationType.SUGGESTED_ACTIVITIES_READY,
      payload: {
        title: 'Новые активности готовы',
        body: 'Мы обновили список рекомендованных активностей. Загляните, чтобы выбрать подходящие!',
      },
    };
  }
}
