import { Module } from '@nestjs/common';
import { MoodTypesAdminController } from './mood-types-admin.controller';
import { MoodTypesAdminService } from './mood-types-admin.service';
import { MoodTypesModule } from '../../core/mood-types';
import { SettingsModule } from '../settings/settings.module';
import { LanguageModule } from '../languages/language.module';

@Module({
  imports: [MoodTypesModule, SettingsModule, LanguageModule],
  controllers: [MoodTypesAdminController],
  providers: [MoodTypesAdminService],
  exports: [MoodTypesAdminService],
})
export class MoodTypesAdminModule {}
