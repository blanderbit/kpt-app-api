import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { FirebaseModule } from './firebase/firebase.module';
import { ProfileModule } from './profile/profile.module';
import { SuggestedActivityModule } from './suggested-activity/suggested-activity.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
import { databaseConfig } from './config/database.config';
import bullConfig from './config/bull.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [bullConfig],
    }),
    TypeOrmModule.forRoot(databaseConfig),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
        db: parseInt(process.env.REDIS_DB || '0', 10),
      },
    }),
    AuthModule,
    UsersModule,
    EmailModule,
    FirebaseModule,
    ProfileModule,
    SuggestedActivityModule,
    AdminModule,
    CommonModule,
  ],
})
export class AppModule {}
