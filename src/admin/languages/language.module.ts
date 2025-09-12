import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LanguageController } from './language.controller';
import { LanguageService } from './services/language.service';
import { GoogleDriveModule } from '../../core/google-drive';

@Module({
  imports: [
    ConfigModule,
    GoogleDriveModule,
  ],
  controllers: [LanguageController],
  providers: [LanguageService],
  exports: [LanguageService],
})
export class LanguageModule {}
