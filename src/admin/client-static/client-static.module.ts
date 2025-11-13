import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientStaticController } from './client-static.controller';
import { ClientStaticService } from './client-static.service';
import { User } from '../../users/entities/user.entity';
import { UserSurvey } from '../survey/entities/user-survey.entity';
import { UserHiddenArticle } from '../articles/entities/user-hidden-article.entity';
import { MoodTracker } from '../../profile/mood-tracker/entities/mood-tracker.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserSurvey,
      UserHiddenArticle,
      MoodTracker,
    ]),
  ],
  controllers: [ClientStaticController],
  providers: [ClientStaticService],
  exports: [ClientStaticService],
})
export class ClientStaticModule {}

