import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSurvey } from '../../admin/survey/entities/user-survey.entity';
import { NotificationsConfigService } from '../notifications.config';
import { NotificationsDeliveryService } from '../notifications-delivery.service';
import { NotificationType } from '../entities/user-notification.entity';
import { ReminderProcessor } from './reminder-processor.interface';
import { NotificationProcessingStats } from '../types/notification-processing-stats';
import { SurveyReminderNotification } from './models/survey-reminder.notification';

@Injectable()
export class SurveyReminderProcessor implements ReminderProcessor {
  private readonly logger = new Logger(SurveyReminderProcessor.name);

  constructor(
    @InjectRepository(UserSurvey)
    private readonly userSurveyRepository: Repository<UserSurvey>,
    private readonly configService: NotificationsConfigService,
    private readonly deliveryService: NotificationsDeliveryService,
  ) {}

  async execute(userIds: number[], now: Date): Promise<NotificationProcessingStats[]> {
    const settings = this.configService.settings;
    const thresholdDays = settings.surveyReminderDays;

    const stats: NotificationProcessingStats = {
      type: NotificationType.PENDING_SURVEY,
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

    const lastSurveyRaw = await this.userSurveyRepository
      .createQueryBuilder('survey')
      .select('survey.userId', 'userId')
      .addSelect('MAX(survey.updatedAt)', 'lastSurveyAt')
      .where('survey.userId IN (:...userIds)', { userIds })
      .groupBy('survey.userId')
      .getRawMany<{ userId: number; lastSurveyAt: Date }>();

    const lastSurveyMap = new Map<number, Date>();
    lastSurveyRaw.forEach((record) => {
      if (record.lastSurveyAt) {
        lastSurveyMap.set(Number(record.userId), new Date(record.lastSurveyAt));
      }
    });

    for (const userId of userIds) {
      const lastSurvey = lastSurveyMap.get(userId);
      const shouldNotify = !lastSurvey || lastSurvey < threshold;

      if (!shouldNotify) {
        continue;
      }

      stats.attempted += 1;

      if (await this.deliveryService.wasSentRecently(userId, NotificationType.PENDING_SURVEY)) {
        stats.skipped += 1;
        continue;
      }

      const gapDays = lastSurvey
        ? Math.floor((now.getTime() - lastSurvey.getTime()) / (1000 * 60 * 60 * 24))
        : thresholdDays;

      const notification = SurveyReminderNotification.create(Math.max(gapDays, thresholdDays));
      const sent = await this.deliveryService.sendNotification(userId, notification.type, notification.payload);

      if (sent) {
        stats.sent += 1;
      } else {
        stats.failed += 1;
      }
    }

    if (stats.attempted === 0) {
      this.logger.verbose('No users matched survey reminder criteria for current batch');
    }

    return [stats];
  }
}


