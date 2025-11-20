import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LanguageController } from './controllers/language.controller';
import { PublicLanguageController } from './controllers/public-language.controller';
import { LanguageService } from './services/language.service';
import { GoogleDriveModule } from '../../core/google-drive';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    ConfigModule,
    GoogleDriveModule,
    forwardRef(() => SettingsModule),
  ],
  controllers: [LanguageController, PublicLanguageController],
  providers: [LanguageService],
  exports: [LanguageService],
})
export class LanguageModule {}
