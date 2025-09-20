import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LanguageController } from './controllers/language.controller';
import { PublicLanguageController } from './controllers/public-language.controller';
import { LanguageService } from './services/language.service';
import { GoogleDriveModule } from '../../core/google-drive';

@Module({
  imports: [
    ConfigModule,
    GoogleDriveModule,
  ],
  controllers: [LanguageController, PublicLanguageController],
  providers: [LanguageService],
  exports: [LanguageService],
})
export class LanguageModule {}
