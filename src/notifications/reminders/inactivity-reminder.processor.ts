import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NotificationsConfigService } from '../notifications.config';
import { NotificationsDeliveryService } from '../notifications-delivery.service';
import { NotificationType } from '../entities/user-notification.entity';
import { ReminderProcessor } from './reminder-processor.interface';
import { NotificationProcessingStats } from '../types/notification-processing-stats';
import { InactivityReminderNotification } from './models/inactivity-reminder.notification';

@Injectable()
export class InactivityReminderProcessor implements ReminderProcessor {
  private readonly logger = new Logger(InactivityReminderProcessor.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: NotificationsConfigService,
    private readonly deliveryService: NotificationsDeliveryService,
  ) {}

  async execute(userIds: number[], now: Date): Promise<NotificationProcessingStats[]> {
    const settings = this.configService.settings;
    const inactivityThresholdDays = settings.inactivityThresholdDays;

    const stats: NotificationProcessingStats = {
      type: NotificationType.INACTIVITY_REMINDER,
      attempted: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    };

    if (inactivityThresholdDays <= 0 || userIds.length === 0) {
      return [stats];
    }

    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() - inactivityThresholdDays);
    threshold.setHours(23, 59, 59, 999);

    const rawData = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.activities', 'activity')
      .select('user.id', 'userId')
      .addSelect('MAX(activity.createdAt)', 'lastActivityAt')
      .addSelect('user.createdAt', 'userCreatedAt')
      .where('user.id IN (:...userIds)', { userIds })
      .groupBy('user.id')
      .addGroupBy('user.createdAt')
      .having(
        '(MAX(activity.createdAt) IS NULL AND user.createdAt <= :threshold) OR MAX(activity.createdAt) < :threshold',
        {
          threshold,
        },
      )
      .getRawMany<{ userId: number; lastActivityAt: Date | null; userCreatedAt: Date }>();

    for (const record of rawData) {
      const userId = Number(record.userId);
      stats.attempted += 1;

      const lastDate = record.lastActivityAt ? new Date(record.lastActivityAt) : new Date(record.userCreatedAt);

      if (await this.deliveryService.wasSentRecently(userId, NotificationType.INACTIVITY_REMINDER)) {
        stats.skipped += 1;
        continue;
      }

      const daysAgo = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      const notification = InactivityReminderNotification.create(daysAgo, inactivityThresholdDays);
      const sent = await this.deliveryService.sendNotification(userId, notification.type, notification.payload);

      if (sent) {
        stats.sent += 1;
      } else {
        stats.failed += 1;
      }
    }

    if (rawData.length === 0) {
      this.logger.verbose('No users matched inactivity reminder criteria for current batch');
    }

    return [stats];
  }
}


