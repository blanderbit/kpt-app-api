import { NotificationType } from '../../entities/user-notification.entity';
import { ReminderNotification } from './reminder-notification.interface';

export class ArticleReminderNotification {
  static create(daysPending: number): ReminderNotification {
    return {
      type: NotificationType.UNREAD_ARTICLE,
      payload: {
        title: 'Новый материал ждет вас',
        body: `Обратите внимание на непрочитанные статьи. Материал ожидает вас уже ${daysPending} дней.`,
      },
    };
  }
}
