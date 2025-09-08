import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { TemplateService } from './template.service';
import { emailConfig } from '../config/email.config';
import { VerificationCode } from '../auth/entities/verification-code.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationCode]),
    MailerModule.forRoot({
      transport: {
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: emailConfig.auth,
      },
      defaults: {
        from: emailConfig.from,
      },
    }),
  ],
  providers: [EmailService, TemplateService],
  exports: [EmailService, TemplateService],
})
export class EmailModule {}
