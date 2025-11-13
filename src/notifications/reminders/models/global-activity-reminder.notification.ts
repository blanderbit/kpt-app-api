import { NotificationType } from '../../entities/user-notification.entity';
import { ReminderNotification } from './reminder-notification.interface';

export class GlobalActivityReminderNotification {
  static create(gapDays: number, thresholdDays: number): ReminderNotification {
    let title = 'Давайте вернёмся к привычкам';
    let body: string;

    if (thresholdDays >= 180) {
      body = 'Вы не взаимодействовали с приложением уже полгода. Загляните, чтобы обновить цели и посмотреть прогресс.';
    } else if (thresholdDays >= 30) {
      body = 'Прошёл месяц без активности. Возвращайтесь — у нас уже есть новые идеи и рекомендации для вас.';
    } else {
      body = 'Две недели без активностей — самое время вернуться и сделать следующий шаг к своим целям!';
    }

    return {
      type: NotificationType.GLOBAL_INACTIVITY_REMINDER,
      payload: {
        title,
        body,
        data: {
          daysWithoutActivity: String(gapDays),
        },
      },
    };
  }
}
