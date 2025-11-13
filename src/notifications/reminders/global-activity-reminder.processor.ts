import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Activity } from '../../profile/activity/entities/activity.entity';
import { MoodTracker } from '../../profile/mood-tracker/entities/mood-tracker.entity';
import { UserSurvey } from '../../admin/survey/entities/user-survey.entity';
import { UserHiddenArticle } from '../../admin/articles/entities/user-hidden-article.entity';
import { NotificationsDeliveryService } from '../notifications-delivery.service';
import { NotificationType } from '../entities/user-notification.entity';
import { NotificationProcessingStats } from '../types/notification-processing-stats';
import { ReminderProcessor } from './reminder-processor.interface';
import { GlobalActivityReminderNotification } from './models/global-activity-reminder.notification';

interface ActivityRecord {
  userId: number;
  timestamp: Date | null;
}

const INACTIVITY_THRESHOLDS = [180, 30, 14];

@Injectable()
export class GlobalActivityReminderProcessor implements ReminderProcessor {
  private readonly logger = new Logger(GlobalActivityReminderProcessor.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(MoodTracker)
    private readonly moodTrackerRepository: Repository<MoodTracker>,
    @InjectRepository(UserSurvey)
    private readonly userSurveyRepository: Repository<UserSurvey>,
    @InjectRepository(UserHiddenArticle)
    private readonly userHiddenArticleRepository: Repository<UserHiddenArticle>,
    private readonly deliveryService: NotificationsDeliveryService,
  ) {}

  async execute(userIds: number[], now: Date): Promise<NotificationProcessingStats[]> {
    const stats: NotificationProcessingStats = {
      type: NotificationType.GLOBAL_INACTIVITY_REMINDER,
      attempted: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    };

    if (!userIds || userIds.length === 0) {
      return [stats];
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .select('user.id', 'userId')
      .addSelect('user.updatedAt', 'updatedAt')
      .addSelect('user.createdAt', 'createdAt')
      .where('user.id IN (:...userIds)', { userIds })
      .getRawMany<{ userId: number; updatedAt: Date; createdAt: Date }>();

    const userMap = new Map<number, Date>();
    users.forEach((record) => {
      const fallbackDate = record.updatedAt || record.createdAt;
      if (fallbackDate) {
        userMap.set(Number(record.userId), new Date(fallbackDate));
      }
    });

    const activityMap = await this.buildMaxTimestampMap(
      this.activityRepository,
      'activity',
      userIds,
    );
    const moodMap = await this.buildMaxTimestampMap(this.moodTrackerRepository, 'mood', userIds);
    const surveyMap = await this.buildMaxTimestampMap(this.userSurveyRepository, 'survey', userIds);
    const articleMap = await this.buildMaxTimestampMap(
      this.userHiddenArticleRepository,
      'article',
      userIds,
    );

    for (const userId of userIds) {
      const lastActivity = this.resolveLastActivity(
        userMap.get(userId),
        activityMap.get(userId),
        moodMap.get(userId),
        surveyMap.get(userId),
        articleMap.get(userId),
      );

      if (!lastActivity) {
        continue;
      }

      const gapDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      const threshold = INACTIVITY_THRESHOLDS.find((days) => gapDays >= days);
      if (!threshold) {
        continue;
      }

      stats.attempted += 1;

      if (await this.deliveryService.wasSentRecently(userId, NotificationType.GLOBAL_INACTIVITY_REMINDER)) {
        stats.skipped += 1;
        continue;
      }

      const notification = GlobalActivityReminderNotification.create(gapDays, threshold);
      const sent = await this.deliveryService.sendNotification(userId, notification.type, notification.payload);

      if (sent) {
        stats.sent += 1;
      } else {
        stats.failed += 1;
      }
    }

    if (stats.attempted === 0) {
      this.logger.verbose('No users matched global activity reminder criteria for current batch');
    }

    return [stats];
  }

  private async buildMaxTimestampMap(
    repository: Repository<any>,
    alias: string,
    userIds: number[],
  ): Promise<Map<number, Date>> {
    const qb = repository
      .createQueryBuilder(alias)
      .select(`${alias}.userId`, 'userId')
      .addSelect(`MAX(${alias}.updatedAt)`, 'timestamp')
      .where(`${alias}.userId IN (:...userIds)`, { userIds })
      .groupBy(`${alias}.userId`);

    if (alias === 'article') {
      qb.select(`${alias}.userId`, 'userId').addSelect(`MAX(${alias}.createdAt)`, 'timestamp');
    }

    const records = await qb.getRawMany<ActivityRecord>();
    const map = new Map<number, Date>();
    records.forEach((record) => {
      if (record.timestamp) {
        map.set(Number(record.userId), new Date(record.timestamp));
      }
    });
    return map;
  }

  private resolveLastActivity(
    profileUpdatedAt?: Date,
    activityUpdatedAt?: Date,
    moodUpdatedAt?: Date,
    surveyUpdatedAt?: Date,
    articleUpdatedAt?: Date,
  ): Date | null {
    const timestamps = [
      profileUpdatedAt,
      activityUpdatedAt,
      moodUpdatedAt,
      surveyUpdatedAt,
      articleUpdatedAt,
    ].filter((value): value is Date => value instanceof Date);

    if (timestamps.length === 0) {
      return null;
    }

    return timestamps.reduce((latest, current) => (current > latest ? current : latest));
  }
}
