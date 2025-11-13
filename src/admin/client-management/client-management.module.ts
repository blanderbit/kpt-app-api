import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientManagementController } from './client-management.controller';
import { ClientManagementService } from './client-management.service';
import { User } from '../../users/entities/user.entity';
import { Activity } from '../../profile/activity/entities/activity.entity';
import { SuggestedActivity } from '../../suggested-activity/entities/suggested-activity.entity';
import { MoodTracker } from '../../profile/mood-tracker/entities/mood-tracker.entity';
import { Survey } from '../survey/entities/survey.entity';
import { UserSurvey } from '../survey/entities/user-survey.entity';
import { Article } from '../articles/entities/article.entity';
import { UserHiddenArticle } from '../articles/entities/user-hidden-article.entity';
import { RateActivity } from '../../profile/activity/entities/rate-activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Activity,
      SuggestedActivity,
      MoodTracker,
      Survey,
      UserSurvey,
      Article,
      UserHiddenArticle,
      RateActivity,
    ]),
  ],
  controllers: [ClientManagementController],
  providers: [ClientManagementService],
  exports: [ClientManagementService],
})
export class ClientManagementModule {}
