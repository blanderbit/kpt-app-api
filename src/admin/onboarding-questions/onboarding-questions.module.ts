import { Module } from '@nestjs/common';
import { OnboardingQuestionsController } from './onboarding-questions.controller';
import { OnboardingQuestionsAdminService } from './onboarding-questions-admin.service';
import { OnboardingQuestionsModule } from '../../core/onboarding-questions';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [OnboardingQuestionsModule, SettingsModule],
  controllers: [OnboardingQuestionsController],
  providers: [OnboardingQuestionsAdminService],
  exports: [OnboardingQuestionsAdminService],
})
export class OnboardingQuestionsAdminModule {}
