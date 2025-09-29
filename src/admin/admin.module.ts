import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { LanguageModule } from './languages/language.module';
import { TooltipModule } from './tooltips/tooltip.module';
import { MoodTypesAdminModule } from './mood-types/mood-types-admin.module';
import { ActivityTypesAdminModule } from './activity-types/activity-types-admin.module';
import { MoodSurveyAdminModule } from './mood-survey/mood-survey-admin.module';
import { SocialNetworksAdminModule } from './social-networks/social-networks.module';
import { OnboardingQuestionsAdminModule } from './onboarding-questions/onboarding-questions.module';
import { jwtConfig } from '../config/jwt.config';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
    LanguageModule,
    TooltipModule,
    MoodTypesAdminModule,
    ActivityTypesAdminModule,
    MoodSurveyAdminModule,
    SocialNetworksAdminModule,
    OnboardingQuestionsAdminModule,
    JwtModule.register(jwtConfig),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
  ],
  exports: [
    AdminService,
  ],
})
export class AdminModule {}
