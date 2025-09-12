import { Module } from '@nestjs/common';
import { MoodTypesAdminController } from './mood-types-admin.controller';
import { MoodTypesAdminService } from './mood-types-admin.service';
import { MoodTypesModule } from '../../core/mood-types';

@Module({
  imports: [MoodTypesModule],
  controllers: [MoodTypesAdminController],
  providers: [MoodTypesAdminService],
  exports: [MoodTypesAdminService],
})
export class MoodTypesAdminModule {}
