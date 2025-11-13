import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, FindOptionsWhere } from 'typeorm';
import { NotificationsConfigService } from './notifications.config';
import type { NotificationsConfig } from './notifications.config';
import { UserDevice } from './entities/user-device.entity';
import { NotificationType, UserNotificationTracker } from './entities/user-notification.entity';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { CustomNotificationDto } from './dto/custom-notification.dto';
import { User } from '../users/entities/user.entity';
import { NotificationsQueueService } from './queue/notifications-queue.service';
import { NotificationQueueJobType } from './queue/job-types';
import { NotificationsDeliveryService } from './notifications-delivery.service';
import { NotificationProcessingStats } from './types/notification-processing-stats';
import { SuggestedActivitiesNotification } from './models/suggested-activities.notification';
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly processingLocks = new Set<string>();

  constructor(
    private readonly notificationsQueue: NotificationsQueueService,
    private readonly configService: NotificationsConfigService,
    private readonly deliveryService: NotificationsDeliveryService,
    @InjectRepository(UserDevice)
    private readonly userDeviceRepository: Repository<UserDevice>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserNotificationTracker)
    private readonly notificationTrackerRepository: Repository<UserNotificationTracker>,
  ) {}

  async registerDevice(userId: number, dto: RegisterDeviceTokenDto): Promise<UserDevice> {
    const normalizedToken = dto.token.trim();
    const existing = await this.userDeviceRepository.findOne({
      where: { userId, token: normalizedToken },
    });

    if (existing) {
      existing.platform = dto.platform ?? existing.platform;
      existing.deviceId = dto.deviceId ?? existing.deviceId;
      existing.isActive = true;
      existing.lastUsedAt = new Date();
      return this.userDeviceRepository.save(existing);
    }

    // Deactivate same deviceId for other users if provided
    if (dto.deviceId) {
      await this.userDeviceRepository.update(
        { deviceId: dto.deviceId, userId, token: Not(normalizedToken) },
        { isActive: false },
      );
    }

    const created = this.userDeviceRepository.create({
      userId,
      token: normalizedToken,
      platform: dto.platform ?? undefined,
      deviceId: dto.deviceId,
      isActive: true,
      lastUsedAt: new Date(),
    });

    return this.userDeviceRepository.save(created);
  }

  async processInactivityNotifications(): Promise<NotificationProcessingStats[]> {
    return this.runWithLock(
      'inactivity',
      async () => {
        const now = new Date();
        const batches = await this.processActiveUsersInBatches(
          [NotificationQueueJobType.REMINDER_INACTIVITY],
          now,
        );
        this.logger.debug(`Scheduled ${batches} inactivity reminder batches`);
        return [];
      },
      [],
    );
  }

  async processMoodNotifications(): Promise<NotificationProcessingStats[]> {
    return this.runWithLock(
      'mood',
      async () => {
        const now = new Date();
        const batches = await this.processActiveUsersInBatches(
          [NotificationQueueJobType.REMINDER_MOOD],
          now,
        );
        this.logger.debug(`Scheduled ${batches} mood reminder batches`);
        return [];
      },
      [],
    );
  }

  async processSurveyNotifications(): Promise<NotificationProcessingStats[]> {
    return this.runWithLock(
      'surveys',
      async () => {
        const now = new Date();
        const batches = await this.processActiveUsersInBatches(
          [NotificationQueueJobType.REMINDER_SURVEYS],
          now,
        );
        this.logger.debug(`Scheduled ${batches} survey reminder batches`);
        return [];
      },
      [],
    );
  }

  async processArticleNotifications(): Promise<NotificationProcessingStats[]> {
    return this.runWithLock(
      'articles',
      async () => {
        const now = new Date();
        const batches = await this.processActiveUsersInBatches(
          [NotificationQueueJobType.REMINDER_ARTICLES],
          now,
        );
        this.logger.debug(`Scheduled ${batches} article reminder batches`);
        return [];
      },
      [],
    );
  }

  async processGlobalActivityNotifications(): Promise<NotificationProcessingStats[]> {
    return this.runWithLock(
      'global-activity',
      async () => {
        const now = new Date();
        const batches = await this.processActiveUsersInBatches(
          [NotificationQueueJobType.REMINDER_GLOBAL_ACTIVITY],
          now,
        );
        this.logger.debug(`Scheduled ${batches} global activity reminder batches`);
        return [];
      },
      [],
    );
  }

  async removeDevice(userId: number, token: string): Promise<void> {
    await this.userDeviceRepository.delete({ userId, token });
  }

  async processScheduledNotifications(): Promise<NotificationProcessingStats[]> {
    return this.runWithLock(
      'all',
      async () => {
        const now = new Date();
        await this.processActiveUsersInBatches(
          [
            NotificationQueueJobType.REMINDER_INACTIVITY,
            NotificationQueueJobType.REMINDER_MOOD,
            NotificationQueueJobType.REMINDER_SURVEYS,
            NotificationQueueJobType.REMINDER_ARTICLES,
            NotificationQueueJobType.REMINDER_GLOBAL_ACTIVITY,
          ],
          now,
        );
        return [];
      },
      [],
    );
  }

  async notifySuggestedActivitiesGenerated(userId: number): Promise<void> {
    const notification = SuggestedActivitiesNotification.create();
    await this.deliveryService.sendNotificationIfAllowed(userId, notification.type, notification.payload, 12);
  }

  async broadcastCustomNotification(dto: CustomNotificationDto): Promise<{
    status: 'queued';
  }> {
    const payload = {
      title: dto.title,
      body: dto.body,
      data: dto.data,
    };

    await this.notificationsQueue.addBroadcastCustomGlobalJob(payload);

    this.logger.log(`Queued broadcast custom notification "${dto.title}" for background processing`);

    return { status: 'queued' } as const;
  }

  async dispatchBroadcastCustom(payload: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<void> {
    const settings = this.configService.settings;
    const pageSize = Math.max(1, settings.pagination.pageSize || 20);
    const delayMs = Math.max(0, settings.pagination.delayMs || 0);

    let offset = 0;
    let totalUsers = 0;

    while (true) {
      const usersPage = await this.userDeviceRepository.query(
        'SELECT DISTINCT user_id AS userId FROM user_devices WHERE isActive = 1 ORDER BY user_id ASC LIMIT ? OFFSET ?',
        [pageSize, offset],
      );

      if (!usersPage.length) {
        break;
      }

      const userIds = usersPage.map((record) => Number(record.userId)).filter(Boolean);
      totalUsers += userIds.length;

      await this.notificationsQueue.addBroadcastCustomJob(userIds, payload);
      this.logger.debug(
        `Queued broadcast totalUsers ${totalUsers} (size: ${userIds}) for notification "${payload.title}"`,
      );
      offset += pageSize;

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    this.logger.log(
      `Scheduled custom broadcast "${payload.title}" for ${totalUsers} users across`,
    );
  }

  private async runWithLock<T>(lockKey: string, handler: () => Promise<T>, fallback: T): Promise<T> {
    if (this.processingLocks.has(lockKey)) {
      this.logger.warn(`Notification processing "${lockKey}" already running, skipping current tick`);
      return fallback;
    }

    this.processingLocks.add(lockKey);

    try {
      return await handler();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Notification processing "${lockKey}" failed: ${message}`, stack);
      return fallback;
    } finally {
      this.processingLocks.delete(lockKey);
    }
  }

  private async iterateActiveUsers(
    iterator: (
      userId: number,
      index: number,
      settings: NotificationsConfig,
    ) => Promise<void>,
  ): Promise<void> {
    const settings = this.configService.settings;
    const pageSize = Math.max(1, settings.pagination.pageSize || 1);
    const delayMs = Math.max(0, settings.pagination.delayMs || 0);

    let offset = 0;
    let index = 0;

    while (true) {
      const usersPage = await this.userDeviceRepository
        .createQueryBuilder('device')
        .select('device.userId', 'userId')
        .where('device.isActive = :active', { active: true })
        .groupBy('device.userId')
        .orderBy('device.userId', 'ASC')
        .offset(offset)
        .limit(pageSize)
        .getRawMany<{ userId: number }>();

 
      if (!usersPage.length) {
        break;
      }

      const userIds = usersPage.map((record) => Number(record.userId)).filter(Boolean);
      for (const userId of userIds) {
        await iterator(userId, index, settings);
        index += 1;
      }

      offset += pageSize;

      if (delayMs > 0) {
        await this.sleep(delayMs);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async processActiveUsersInBatches(
    jobTypes: Array<
      | NotificationQueueJobType.REMINDER_INACTIVITY
      | NotificationQueueJobType.REMINDER_MOOD
      | NotificationQueueJobType.REMINDER_SURVEYS
      | NotificationQueueJobType.REMINDER_ARTICLES
      | NotificationQueueJobType.REMINDER_GLOBAL_ACTIVITY
    >,
    now: Date,
  ): Promise<number> {
    if (!jobTypes || jobTypes.length === 0) {
      return 0;
    }

    const { pagination } = this.configService.settings;
    const pageSize = Math.max(1, pagination.pageSize || 1);
    const delayMs = Math.max(0, pagination.delayMs || 0);

    let offset = 0;
    let processedUsers = 0;
    let scheduledBatches = 0;

    while (true) {
      const usersPage = await this.userDeviceRepository
        .createQueryBuilder('device')
        .select('device.userId', 'userId')
        .where('device.isActive = :active', { active: true })
        .groupBy('device.userId')
        .orderBy('device.userId', 'ASC')
        .offset(offset)
        .limit(pageSize)
        .getRawMany<{ userId: number }>();

      if (!usersPage.length) {
        if (processedUsers === 0) {
          this.logger.log('No active device tokens found for notifications');
        }
        break;
      }

      const userIds = usersPage.map((record) => Number(record.userId)).filter(Boolean);

      if (userIds.length === 0) {
        offset += pageSize;
        continue;
      }

      processedUsers += userIds.length;

      await Promise.all(
        jobTypes.map((type) => this.notificationsQueue.addReminderBatchJob(type, userIds, now)),
      );
      scheduledBatches += jobTypes.length;

      offset += pageSize;

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return scheduledBatches;
  }

  async getUserDeviceStatistics(): Promise<{
    totalUsers: number;
    usersWithDeviceToken: number;
    usersWithoutDeviceToken: number;
  }> {
    const totalUsersResult = await this.userRepository
      .createQueryBuilder('user')
      .select('COUNT(user.id)', 'count')
      .where('user.roles NOT LIKE :adminRole', { adminRole: '%admin%' })
      .getRawOne<{ count: string }>();

    const activeUsersResult = await this.userDeviceRepository.query(
      'SELECT COUNT(DISTINCT user_id) AS count FROM user_devices WHERE isActive = ?',
      [1],
    );

    const totalUsers = totalUsersResult?.count ? Number(totalUsersResult.count) : 0;
    const usersWithDeviceToken = activeUsersResult?.[0]?.count ? Number(activeUsersResult[0].count) : 0;
    const usersWithoutDeviceToken = Math.max(totalUsers - usersWithDeviceToken, 0);
 
    return {
      totalUsers,
      usersWithDeviceToken,
      usersWithoutDeviceToken,
    };
  }

  async getActiveDeviceTokens(
    userId?: number,
  ): Promise<{ userId: number; token: string; platform: string | null; lastUsedAt: Date | null }[]> {
    const where: FindOptionsWhere<UserDevice> = { isActive: true };

    if (typeof userId === 'number' && Number.isFinite(userId)) {
      where.userId = userId;
    }

    const devices = await this.userDeviceRepository.find({
      where,
      order: { userId: 'ASC', updatedAt: 'DESC' },
    });

    return devices.map((device) => ({
      userId: device.userId,
      token: device.token,
      platform: device.platform ?? null,
      lastUsedAt: device.lastUsedAt ?? null,
    }));
  }

  async getNotificationTracker(
    userId?: number,
  ): Promise<Array<{ userId: number; type: NotificationType; lastSentAt: Date | null }>> {
    const where: FindOptionsWhere<UserNotificationTracker> = {};

    if (typeof userId === 'number' && Number.isFinite(userId)) {
      where.userId = userId;
    }

    const trackers = await this.notificationTrackerRepository.find({
      where,
      order: { userId: 'ASC', type: 'ASC' },
    });

    return trackers.map((tracker) => ({
      userId: tracker.userId,
      type: tracker.type,
      lastSentAt: tracker.lastSentAt,
    }));
  }
}


