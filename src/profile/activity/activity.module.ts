import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityTypesModule } from '../../core/activity-types';
import { Activity } from './entities/activity.entity';
import { RateActivity } from './entities/rate-activity.entity';
import { ChatGPTModule } from '../../core/chatgpt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, RateActivity]),
    forwardRef(() => ActivityTypesModule),
    ChatGPTModule,
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
