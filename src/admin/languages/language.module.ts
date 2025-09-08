import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LanguageController } from './language.controller';
import { LanguageService } from './services/language.service';
import { GoogleDriveService } from './services/google-drive.service';

@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [LanguageController],
  providers: [LanguageService, GoogleDriveService],
  exports: [LanguageService, GoogleDriveService],
})
export class LanguageModule {}
