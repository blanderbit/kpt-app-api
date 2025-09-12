import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoodTrackerController } from './mood-tracker.controller';
import { MoodTrackerService } from './mood-tracker.service';
import { MoodTypesModule } from '../../core/mood-types';
import { MoodTracker } from './entities/mood-tracker.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MoodTracker]),
    MoodTypesModule,
  ],
  controllers: [MoodTrackerController],
  providers: [MoodTrackerService],
  exports: [MoodTrackerService],
})
export class MoodTrackerModule {}
