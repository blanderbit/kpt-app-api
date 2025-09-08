import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Activity } from '../activity/entities/activity.entity';
import { RateActivity } from '../activity/entities/rate-activity.entity';
import { MoodTracker } from '../mood-tracker/entities/mood-tracker.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, RateActivity, MoodTracker]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
