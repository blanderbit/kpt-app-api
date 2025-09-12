import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityTypesModule } from '../../core/activity-types';
import { Activity } from './entities/activity.entity';
import { RateActivity } from './entities/rate-activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, RateActivity]),
    ActivityTypesModule,
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
