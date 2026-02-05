import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoodTrackerController } from './mood-tracker.controller';
import { MoodTrackerService } from './mood-tracker.service';
import { PublicMoodSurveyController } from './controllers/public-mood-survey.controller';
import { MoodSurveyService } from './services/mood-survey.service';
import { MoodTypesModule } from '../../core/mood-types';
import { LanguageModule } from '../../admin/languages/language.module';
import { MoodTracker } from './entities/mood-tracker.entity';
import { MoodSurvey } from './entities/mood-survey.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MoodTracker, MoodSurvey]),
    MoodTypesModule,
    LanguageModule,
  ],
  controllers: [MoodTrackerController, PublicMoodSurveyController],
  providers: [MoodTrackerService, MoodSurveyService],
  exports: [MoodTrackerService, MoodSurveyService],
})
export class MoodTrackerModule {}
