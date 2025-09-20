import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoodSurveyAdminController } from './mood-survey-admin.controller';
import { MoodSurveyAdminService } from './mood-survey-admin.service';
import { MoodSurvey } from '../../profile/mood-tracker/entities/mood-survey.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MoodSurvey])],
  controllers: [MoodSurveyAdminController],
  providers: [MoodSurveyAdminService],
  exports: [MoodSurveyAdminService],
})
export class MoodSurveyAdminModule {}
