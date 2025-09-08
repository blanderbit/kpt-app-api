import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityTypesService } from './activity-types.service';
import { Activity } from './entities/activity.entity';
import { RateActivity } from './entities/rate-activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, RateActivity]),
  ],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityTypesService],
  exports: [ActivityService, ActivityTypesService],
})
export class ActivityModule {}
