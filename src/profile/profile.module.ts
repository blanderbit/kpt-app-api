import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { User } from '../users/entities/user.entity';
import { VerificationCode } from '../auth/entities/verification-code.entity';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';
import { ActivityModule } from './activity/activity.module';
import { MoodTrackerModule } from './mood-tracker/mood-tracker.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { JwtModule } from '@nestjs/jwt';
import { ChatGPTModule } from '../core/chatgpt/chatgpt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, VerificationCode]),
    EmailModule,
    AuthModule,
    ActivityModule,
    MoodTrackerModule,
    AnalyticsModule,
    JwtModule,
    ChatGPTModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService, ActivityModule, MoodTrackerModule, AnalyticsModule],
})
export class ProfileModule {}
