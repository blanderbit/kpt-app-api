import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ExternalSignup } from './entities/external-signup.entity';
import { User } from '../users/entities/user.entity';
import { ExternalSignupService } from './external-signup.service';
import { ExternalSignupController } from './external-signup.controller';
import { CleanupExternalSignupsCron } from './cron/cleanup-external-signups.cron';
import { jwtConfig } from '../config/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExternalSignup, User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || jwtConfig.secret,
      signOptions: { expiresIn: jwtConfig.expiresIn },
    }),
    ScheduleModule,
  ],
  controllers: [ExternalSignupController],
  providers: [ExternalSignupService, CleanupExternalSignupsCron],
  exports: [ExternalSignupService],
})
export class ExternalSignupModule {}
