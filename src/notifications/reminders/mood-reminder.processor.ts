import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MoodTracker } from '../../profile/mood-tracker/entities/mood-tracker.entity';
import { NotificationsConfigService } from '../notifications.config';
import { NotificationsDeliveryService } from '../notifications-delivery.service';
import { NotificationType } from '../entities/user-notification.entity';
import { ReminderProcessor } from './reminder-processor.interface';
import { NotificationProcessingStats } from '../types/notification-processing-stats';
import { MoodReminderNotification } from './models/mood-reminder.notification';

@Injectable()
export class MoodReminderProcessor implements ReminderProcessor {
  private readonly logger = new Logger(MoodReminderProcessor.name);

  constructor(
    @InjectRepository(MoodTracker)
    private readonly moodTrackerRepository: Repository<MoodTracker>,
    private readonly configService: NotificationsConfigService,
    private readonly deliveryService: NotificationsDeliveryService,
  ) {}

  async execute(userIds: number[], now: Date): Promise<NotificationProcessingStats[]> {
    const settings = this.configService.settings;
    const reminderHour = settings.moodReminderHour;

    const stats: NotificationProcessingStats = {
      type: NotificationType.MISSING_MOOD,
      attempted: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    };

    if (userIds.length === 0) {
      return [stats];
    }

    if (now.getHours() < reminderHour) {
      this.logger.debug(`Skipping mood reminders before configured hour ${reminderHour}`);
      return [stats];
    }

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString().slice(0, 10);

    const moods = await this.moodTrackerRepository
      .createQueryBuilder('mood')
      .select('mood.userId', 'userId')
      .where('mood.moodDate = :today', { today: todayIso })
      .andWhere('mood.userId IN (:...userIds)', { userIds })
      .getRawMany<{ userId: number }>();

    const usersWithMood = new Set(moods.map((record) => Number(record.userId)));

    for (const userId of userIds) {
      stats.attempted += 1;

      if (usersWithMood.has(userId)) {
        stats.skipped += 1;
        continue;
      }

      if (await this.deliveryService.wasSentRecently(userId, NotificationType.MISSING_MOOD)) {
        stats.skipped += 1;
        continue;
      }

      const notification = MoodReminderNotification.create();
      const sent = await this.deliveryService.sendNotification(userId, notification.type, notification.payload);

      if (sent) {
        stats.sent += 1;
      } else {
        stats.failed += 1;
      }
    }

    return [stats];
  }
}


