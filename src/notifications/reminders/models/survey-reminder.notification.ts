import { NotificationType } from '../../entities/user-notification.entity';
import { ReminderNotification } from './reminder-notification.interface';

export class SurveyReminderNotification {
  static create(daysPending: number): ReminderNotification {
    return {
      type: NotificationType.PENDING_SURVEY,
      payload: {
        title: 'У вас есть непройденный опрос',
        body: `Опрос ждет вашего внимания уже ${daysPending} дней. Поделитесь своими ответами — это поможет улучшить рекомендации.`,
      },
    };
  }
}
