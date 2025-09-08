import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoodTrackerController } from './mood-tracker.controller';
import { MoodTrackerService } from './mood-tracker.service';
import { MoodTypesService } from './mood-types.service';
import { MoodTracker } from './entities/mood-tracker.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MoodTracker]),
  ],
  controllers: [MoodTrackerController],
  providers: [MoodTrackerService, MoodTypesService],
  exports: [MoodTrackerService, MoodTypesService],
})
export class MoodTrackerModule {}
