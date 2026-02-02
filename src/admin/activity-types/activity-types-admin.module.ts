import { Module } from '@nestjs/common';
import { ActivityTypesAdminController } from './activity-types-admin.controller';
import { ActivityTypesAdminService } from './activity-types-admin.service';
import { ActivityTypesModule } from '../../core/activity-types';
import { SettingsModule } from '../settings/settings.module';
import { LanguageModule } from '../languages/language.module';

@Module({
  imports: [ActivityTypesModule, SettingsModule, LanguageModule],
  controllers: [ActivityTypesAdminController],
  providers: [ActivityTypesAdminService],
  exports: [ActivityTypesAdminService],
})
export class ActivityTypesAdminModule {}
