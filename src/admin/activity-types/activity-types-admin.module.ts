import { Module } from '@nestjs/common';
import { ActivityTypesAdminController } from './activity-types-admin.controller';
import { ActivityTypesAdminService } from './activity-types-admin.service';
import { ActivityTypesModule } from '../../core/activity-types';

@Module({
  imports: [ActivityTypesModule],
  controllers: [ActivityTypesAdminController],
  providers: [ActivityTypesAdminService],
  exports: [ActivityTypesAdminService],
})
export class ActivityTypesAdminModule {}
