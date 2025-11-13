import { Global, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsAdminController } from './notifications-admin.controller';
import { NotificationsCronService } from './notifications.cron';
import { NotificationsConfigService } from './notifications.config';
import { UserDevice } from './entities/user-device.entity';
import { UserNotificationTracker } from './entities/user-notification.entity';
import { User } from '../users/entities/user.entity';
import { Activity } from '../profile/activity/entities/activity.entity';
import { MoodTracker } from '../profile/mood-tracker/entities/mood-tracker.entity';
import { UserTemporarySurvey } from '../admin/settings/entities/user-temporary-survey.entity';
import { UserSurvey } from '../admin/survey/entities/user-survey.entity';
import { UserTemporaryArticle } from '../admin/settings/entities/user-temporary-article.entity';
import { UserHiddenArticle } from '../admin/articles/entities/user-hidden-article.entity';
import { FirebaseModule } from '../firebase/firebase.module';
import { NotificationsQueueService } from './queue/notifications-queue.service';
import { NotificationsProcessor } from './queue/notifications.processor';
import { NotificationsDeliveryService } from './notifications-delivery.service';
import { InactivityReminderProcessor } from './reminders/inactivity-reminder.processor';
import { MoodReminderProcessor } from './reminders/mood-reminder.processor';
import { SurveyReminderProcessor } from './reminders/survey-reminder.processor';
import { ArticleReminderProcessor } from './reminders/article-reminder.processor';
import { GlobalActivityReminderProcessor } from './reminders/global-activity-reminder.processor';
import { SettingsModule } from '../admin/settings/settings.module';

@Global()
@Module({
  imports: [
    ScheduleModule,
    FirebaseModule,
    BullModule.registerQueue({
      name: 'notifications',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
    TypeOrmModule.forFeature([
      UserDevice,
      UserNotificationTracker,
      User,
      Activity,
      MoodTracker,
      UserTemporarySurvey,
      UserSurvey,
      UserTemporaryArticle,
      UserHiddenArticle,
    ]),
    forwardRef(() => SettingsModule),
  ],
  controllers: [NotificationsController, NotificationsAdminController],
  providers: [
    NotificationsService,
    NotificationsCronService,
    NotificationsConfigService,
    NotificationsQueueService,
    NotificationsProcessor,
    NotificationsDeliveryService,
    InactivityReminderProcessor,
    MoodReminderProcessor,
    SurveyReminderProcessor,
    ArticleReminderProcessor,
    GlobalActivityReminderProcessor,
  ],
  exports: [NotificationsService, NotificationsCronService, NotificationsConfigService],
})
export class NotificationsModule {}


