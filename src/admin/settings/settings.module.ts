import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { UserTemporaryArticle } from './entities/user-temporary-article.entity';
import { UserTemporarySurvey } from './entities/user-temporary-survey.entity';
import { Article } from '../articles/entities/article.entity';
import { Survey } from '../survey/entities/survey.entity';
import { User } from '../../users/entities/user.entity';
import { SuggestedActivityModule } from '../../suggested-activity/suggested-activity.module';
import { UsersModule } from '../../users/users.module';
import { LanguageModule } from '../languages/language.module';
import { GoogleDriveModule } from '../../core/google-drive';
import { CommonModule } from '../../common/common.module';
import { TemporaryItemsQueueService } from './queue/temporary-items-queue.service';
import { TemporaryItemsProcessor } from './queue/temporary-items.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserTemporaryArticle,
      UserTemporarySurvey,
      Article,
      Survey,
      User,
    ]),
    ScheduleModule,
    forwardRef(() => SuggestedActivityModule),
    forwardRef(() => UsersModule),
    forwardRef(() => LanguageModule),
    GoogleDriveModule,
    CommonModule,
    BullModule.registerQueue({
      name: 'temporary-items',
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
  ],
  controllers: [SettingsController],
  providers: [
    SettingsService,
    TemporaryItemsQueueService,
    TemporaryItemsProcessor,
  ],
  exports: [SettingsService, TemporaryItemsQueueService],
})
export class SettingsModule {}
