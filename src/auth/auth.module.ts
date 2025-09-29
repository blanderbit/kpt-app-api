import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../users/entities/user.entity';
import { VerificationCode } from './entities/verification-code.entity';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { SuggestedActivityModule } from '../suggested-activity/suggested-activity.module';
import { ChatGPTModule } from '../core/chatgpt';
import { jwtConfig } from '../config/jwt.config';
import { RedisBlacklistService } from './redis-blacklist.service';
import { BlacklistGuard } from './guards/blacklist.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CleanupVerificationCodesCron } from './cron/cleanup-verification-codes.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, VerificationCode]),
    PassportModule,
    JwtModule.register({
      secret: jwtConfig.secret,
      signOptions: { 
        expiresIn: jwtConfig.expiresIn
       },
    }),
    UsersModule,
    EmailModule,
    FirebaseModule,
    SuggestedActivityModule,
    ChatGPTModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RedisBlacklistService, BlacklistGuard, JwtAuthGuard, CleanupVerificationCodesCron],
  exports: [AuthService, JwtStrategy, JwtAuthGuard, BlacklistGuard, RedisBlacklistService],
})
export class AuthModule {}
