import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserHiddenArticle } from '../../admin/articles/entities/user-hidden-article.entity';
import { NotificationsConfigService } from '../notifications.config';
import { NotificationsDeliveryService } from '../notifications-delivery.service';
import { NotificationType } from '../entities/user-notification.entity';
import { ReminderProcessor } from './reminder-processor.interface';
import { NotificationProcessingStats } from '../types/notification-processing-stats';
import { ArticleReminderNotification } from './models/article-reminder.notification';

@Injectable()
export class ArticleReminderProcessor implements ReminderProcessor {
  private readonly logger = new Logger(ArticleReminderProcessor.name);

  constructor(
    @InjectRepository(UserHiddenArticle)
    private readonly userHiddenArticleRepository: Repository<UserHiddenArticle>,
    private readonly configService: NotificationsConfigService,
    private readonly deliveryService: NotificationsDeliveryService,
  ) {}

  async execute(userIds: number[], now: Date): Promise<NotificationProcessingStats[]> {
    const settings = this.configService.settings;
    const thresholdDays = settings.articleReminderDays;

    const stats: NotificationProcessingStats = {
      type: NotificationType.UNREAD_ARTICLE,
      attempted: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    };

    if (thresholdDays <= 0 || userIds.length === 0) {
      return [stats];
    }

    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() - thresholdDays);

    const lastHiddenRaw = await this.userHiddenArticleRepository
      .createQueryBuilder('hidden')
      .select('hidden.userId', 'userId')
      .addSelect('MAX(hidden.createdAt)', 'lastHiddenAt')
      .where('hidden.userId IN (:...userIds)', { userIds })
      .groupBy('hidden.userId')
      .getRawMany<{ userId: number; lastHiddenAt: Date }>();

    const lastHiddenMap = new Map<number, Date>();
    lastHiddenRaw.forEach((record) => {
      if (record.lastHiddenAt) {
        lastHiddenMap.set(Number(record.userId), new Date(record.lastHiddenAt));
      }
    });

    for (const userId of userIds) {
      const lastHidden = lastHiddenMap.get(userId);
      const shouldNotify = !lastHidden || lastHidden < threshold;

      if (!shouldNotify) {
        continue;
      }

      stats.attempted += 1;

      if (await this.deliveryService.wasSentRecently(userId, NotificationType.UNREAD_ARTICLE)) {
        stats.skipped += 1;
        continue;
      }

      const gapDays = lastHidden
        ? Math.floor((now.getTime() - lastHidden.getTime()) / (1000 * 60 * 60 * 24))
        : thresholdDays;

      const notification = ArticleReminderNotification.create(Math.max(gapDays, thresholdDays));
      const sent = await this.deliveryService.sendNotification(userId, notification.type, notification.payload);

      if (sent) {
        stats.sent += 1;
      } else {
        stats.failed += 1;
      }
    }

    if (stats.attempted === 0) {
      this.logger.verbose('No users matched article reminder criteria for current batch');
    }

    return [stats];
  }
}


