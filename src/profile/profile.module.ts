import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { User } from '../users/entities/user.entity';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';
import { ActivityModule } from './activity/activity.module';
import { MoodTrackerModule } from './mood-tracker/mood-tracker.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    EmailModule,
    AuthModule,
    ActivityModule,
    MoodTrackerModule,
    AnalyticsModule,
    JwtModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService, ActivityModule, MoodTrackerModule, AnalyticsModule],
})
export class ProfileModule {}
