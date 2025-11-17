import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { SuggestedActivity } from './entities/suggested-activity.entity';
import { SuggestedActivityController } from './controllers/suggested-activity.controller';
import { SuggestedActivityService } from './services/suggested-activity.service';
import { ChatGPTModule } from '../core/chatgpt';
import { Activity } from '../profile/activity/entities/activity.entity';
import { RateActivity } from '../profile/activity/entities/rate-activity.entity';
import { ActivityModule } from '../profile/activity/activity.module';
import { ActivityTypesModule } from '../core/activity-types';
import { SuggestedActivityCronService } from './cron/suggested-activity-cron.service';
import { SuggestedActivityProcessor } from './queue/suggested-activity.processor';
import { SuggestedActivityQueueService } from './queue/suggested-activity-queue.service';
import { UsersModule } from '../users/users.module';
import { SettingsModule } from '../admin/settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SuggestedActivity, Activity, RateActivity]),
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'suggested-activity',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
    UsersModule,
    ActivityModule,
    forwardRef(() => ActivityTypesModule),
    ChatGPTModule,
    forwardRef(() => SettingsModule),
    NotificationsModule,
  ],
  controllers: [SuggestedActivityController],
  providers: [
    SuggestedActivityQueueService,
    SuggestedActivityService, 
    SuggestedActivityProcessor,
    SuggestedActivityCronService,
  ],
  exports: [SuggestedActivityService, SuggestedActivityQueueService, SuggestedActivityCronService, BullModule],
})
export class SuggestedActivityModule {}
