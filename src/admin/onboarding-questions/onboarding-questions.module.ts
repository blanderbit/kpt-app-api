import { Module } from '@nestjs/common';
import { OnboardingQuestionsController } from './onboarding-questions.controller';
import { OnboardingQuestionsPublicController } from './onboarding-questions.public.controller';
import { OnboardingQuestionsAdminService } from './onboarding-questions-admin.service';
import { OnboardingQuestionsModule } from '../../core/onboarding-questions';
import { SettingsModule } from '../settings/settings.module';
import { LanguageModule } from '../languages/language.module';

@Module({
  imports: [OnboardingQuestionsModule, SettingsModule, LanguageModule],
  controllers: [OnboardingQuestionsController, OnboardingQuestionsPublicController],
  providers: [OnboardingQuestionsAdminService],
  exports: [OnboardingQuestionsAdminService],
})
export class OnboardingQuestionsAdminModule {}
