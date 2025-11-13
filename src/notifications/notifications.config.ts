import { Inject, Injectable, Optional, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CronExpression } from '@nestjs/schedule';
import { SettingsService, NotificationCronConfig } from '../admin/settings/settings.service';

export enum NotificationScheduleMode {
  HOURLY = 'hourly',
  HALF_DAY = 'half-day',
  CUSTOM = 'custom',
}

export interface NotificationsConfig {
  cronExpression: string;
  cronExpressions: {
    inactivity: string;
    mood: string;
    surveys: string;
    articles: string;
    globalActivity: string;
  };
  inactivityThresholdDays: number;
  moodReminderHour: number;
  surveyReminderDays: number;
  articleReminderDays: number;
  resendCooldownHours: number;
  broadcastBatchSize: number;
  pagination: {
    pageSize: number;
    delayMs: number;
  };
}

@Injectable()
export class NotificationsConfigService {
  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService?: SettingsService,
  ) {}

  get settings(): NotificationsConfig {
    const cronExpressionsFromSettings = this.getCronExpressionsFromSettings();

    return {
      cronExpression: this.resolveCronExpression(),
      cronExpressions:
        cronExpressionsFromSettings ?? {
          inactivity: this.getCronExpression('NOTIFICATIONS_INACTIVITY_CRON'),
          mood: this.getCronExpression('NOTIFICATIONS_MOOD_CRON'),
          surveys: this.getCronExpression('NOTIFICATIONS_SURVEY_CRON'),
          articles: this.getCronExpression('NOTIFICATIONS_ARTICLE_CRON'),
          globalActivity: this.getCronExpression('NOTIFICATIONS_GLOBAL_ACTIVITY_CRON'),
        },
      inactivityThresholdDays: this.getNumber('NOTIFICATIONS_INACTIVITY_DAYS', 3),
      moodReminderHour: this.getNumber('NOTIFICATIONS_MOOD_REMINDER_HOUR', 10),
      surveyReminderDays: this.getNumber('NOTIFICATIONS_SURVEY_REMINDER_DAYS', 3),
      articleReminderDays: this.getNumber('NOTIFICATIONS_ARTICLE_REMINDER_DAYS', 3),
      resendCooldownHours: this.getNumber('NOTIFICATIONS_RESEND_COOLDOWN_HOURS', 24),
      broadcastBatchSize: this.getNumber('NOTIFICATIONS_BROADCAST_BATCH_SIZE', 50),
      pagination: {
        pageSize: this.getNumber('NOTIFICATIONS_USERS_PAGE_SIZE', 20),
        delayMs: this.getNumber('NOTIFICATIONS_USERS_PAGE_DELAY_MS', 0),
      },
    };
  }

  private resolveCronExpression(): string {
    const mode = (this.configService.get<string>('NOTIFICATIONS_SCHEDULE_MODE') || '').toLowerCase();
    const customExpression = this.configService.get<string>('NOTIFICATIONS_CRON_EXPRESSION');

    if (customExpression) {
      return customExpression;
    }

    switch (mode) {
      case NotificationScheduleMode.HALF_DAY:
        return '0 0 */12 * * *'; // every 12 hours
      case NotificationScheduleMode.CUSTOM:
        return customExpression || CronExpression.EVERY_HOUR;
      case NotificationScheduleMode.HOURLY:
      default:
        return CronExpression.EVERY_HOUR;
    }
  }

  private getCronExpressionsFromSettings(): NotificationCronConfig | null {
    if (!this.settingsService) {
      return null;
    }

    try {
      return this.settingsService.getNotificationCronSettings();
    } catch (error) {
      return null;
    }
  }

  private getNumber(envKey: string, fallback: number): number {
    const raw = this.configService.get<string>(envKey);
    if (!raw) {
      return fallback;
    }

    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  private getCronExpression(envKey: string): string {
    const custom = this.configService.get<string>(envKey);
    if (custom && custom.trim().length > 0) {
      return custom;
    }
    return this.resolveCronExpression();
  }
}


