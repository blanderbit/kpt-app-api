import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserDevice } from './entities/user-device.entity';
import { NotificationType, UserNotificationTracker } from './entities/user-notification.entity';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationsConfigService } from './notifications.config';
import { NotificationsQueueService, PushDeliveryJob } from './queue';
import { NotificationPayload } from './types/notification-payload';

@Injectable()
export class NotificationsDeliveryService {
  private readonly logger = new Logger(NotificationsDeliveryService.name);

  constructor(
    @InjectRepository(UserDevice)
    private readonly userDeviceRepository: Repository<UserDevice>,
    @InjectRepository(UserNotificationTracker)
    private readonly notificationTrackerRepository: Repository<UserNotificationTracker>,
    private readonly firebaseService: FirebaseService,
    private readonly configService: NotificationsConfigService,
    private readonly notificationsQueue: NotificationsQueueService,
  ) {}

  async sendNotificationIfAllowed(
    userId: number,
    type: NotificationType,
    payload: NotificationPayload,
    cooldownHours?: number,
  ): Promise<boolean> {
    if (cooldownHours && (await this.wasSentRecently(userId, type, cooldownHours))) {
      return false;
    }

    return this.sendNotification(userId, type, payload);
  }

  async wasSentRecently(
    userId: number,
    type: NotificationType,
    cooldownHours?: number,
  ): Promise<boolean> {
    const settings = this.configService.settings;
    const hours = cooldownHours ?? settings.resendCooldownHours;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const tracker = await this.notificationTrackerRepository.findOne({
      where: { userId, type },
    });

    if (!tracker || !tracker.lastSentAt) {
      return false;
    }

    return tracker.lastSentAt >= since;
  }

  async sendNotification(
    userId: number,
    type: NotificationType,
    payload: NotificationPayload,
  ): Promise<boolean> {
    await this.notificationsQueue.addPushDeliveryJob(userId, type, payload);

    return true;
  }

  async deliverNotification(job: PushDeliveryJob): Promise<void> {
    const { userId, notificationType, payload } = job;

    const devices = await this.userDeviceRepository.find({
      where: { userId, isActive: true },
    });

    if (devices.length === 0) {
      this.logger.debug(`Skipping notification ${notificationType} for user ${userId}: no active devices`);
      return;
    }

    const tokens = devices.map((device) => device.token);

    try {
      const response = await this.firebaseService.sendMulticastNotification(tokens, {
        title: payload.title,
        body: payload.body,
        data: payload.data,
      });

      const tokensToDeactivate: string[] = [];

      response.responses.forEach((item, index) => {
        if (!item.success) {
          tokensToDeactivate.push(tokens[index]);
          const errorCode = item.error?.code ?? 'unknown';
          this.logger.warn(
            `Failed to send notification ${notificationType} for user ${userId} to token ${tokens[index]}: ${errorCode}`,
          );
        }
      });
      this.logger.debug(
        `Successfully sent notification ${notificationType} for user ${userId} to ${tokens.length} tokens`,
      );
      if (response.successCount === 0) {
        if (tokensToDeactivate.length > 0) {
          await this.deactivateTokens(tokensToDeactivate);
        }
        return;
      }

      await this.upsertTracker(userId, notificationType, new Date());

      if (tokensToDeactivate.length > 0) {
        await this.deactivateTokens(tokensToDeactivate);
      }

      await this.userDeviceRepository.update(
        { userId, token: In(tokens) },
        { lastUsedAt: new Date() },
      );
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to send notification ${notificationType} for user ${userId}: ${message}`,
        stack,
      );

      await this.deactivateTokens(tokens);

      throw error instanceof Error ? error : new Error(message);
    }
  }

  private async upsertTracker(userId: number, type: NotificationType, lastSentAt: Date): Promise<void> {
    let tracker = await this.notificationTrackerRepository.findOne({ where: { userId, type } });

    if (!tracker) {
      tracker = this.notificationTrackerRepository.create({ userId, type, lastSentAt });
    } else {
      tracker.lastSentAt = lastSentAt;
    }

    await this.notificationTrackerRepository.save(tracker);
  }

  private async deactivateTokens(tokens: string[]): Promise<void> {
    if (!tokens.length) {
      return;
    }

    await this.userDeviceRepository.delete({ token: In(tokens) });
  }
}


