import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OnboardingQuestionsService } from './onboarding-questions.service';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';
import { SettingsModule } from '../../admin/settings/settings.module';

@Module({
  imports: [ConfigModule, forwardRef(() => SettingsModule)],
  providers: [OnboardingQuestionsService, GoogleDriveFilesService],
  exports: [OnboardingQuestionsService],
})
export class OnboardingQuestionsModule {}
