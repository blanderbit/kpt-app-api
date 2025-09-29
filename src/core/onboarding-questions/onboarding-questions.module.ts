import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OnboardingQuestionsService } from './onboarding-questions.service';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';

@Module({
  imports: [ConfigModule],
  providers: [OnboardingQuestionsService, GoogleDriveFilesService],
  exports: [OnboardingQuestionsService],
})
export class OnboardingQuestionsModule {}
