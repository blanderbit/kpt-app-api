import { Module } from '@nestjs/common';
import { OnboardingQuestionsController } from './onboarding-questions.controller';
import { OnboardingQuestionsPublicController } from './onboarding-questions.public.controller';
import { OnboardingQuestionsAdminService } from './onboarding-questions-admin.service';
import { OnboardingQuestionsModule } from '../../core/onboarding-questions';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [OnboardingQuestionsModule, SettingsModule],
  controllers: [OnboardingQuestionsController, OnboardingQuestionsPublicController],
  providers: [OnboardingQuestionsAdminService],
  exports: [OnboardingQuestionsAdminService],
})
export class OnboardingQuestionsAdminModule {}
