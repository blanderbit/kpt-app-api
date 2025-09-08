import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { LanguageModule } from './languages/language.module';
import { TooltipModule } from './tooltips/tooltip.module';
import { jwtConfig } from '../config/jwt.config';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
    LanguageModule,
    TooltipModule,
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
