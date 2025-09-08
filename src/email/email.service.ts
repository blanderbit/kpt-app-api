import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { TemplateService } from './template.service';
import { emailServiceConfig, EmailSubject } from './email.config';
import { VerificationCode } from '../auth/entities/verification-code.entity';
import { ErrorCode } from '../common/error-codes';
import { AppException } from '../common/exceptions/app.exception';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class EmailService {
  constructor(
    private mailerService: MailerService,
    private templateService: TemplateService,
    @InjectRepository(VerificationCode)
    private verificationCodesRepository: Repository<VerificationCode>,
  ) {}

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    // Render HTML template
    const htmlContent = await this.templateService.renderTemplate('email-verification', {
      code,
      email,
    });
    
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: EmailSubject.VERIFICATION,
        html: htmlContent,
      });
    } catch (error) {
      throw AppException.internal(
        ErrorCode.EMAIL_SEND_FAILED,
        `Failed to send verification email: ${error.message}`
      );
    }
  }

  async sendPasswordResetEmail(email: string, code: string): Promise<void> {
    // Render HTML template
    const htmlContent = await this.templateService.renderTemplate('password-reset', {
      code,
      email,
    });
    
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: EmailSubject.PASSWORD_RESET,
        html: htmlContent,
      });
    } catch (error) {
      throw AppException.internal(
        ErrorCode.EMAIL_SEND_FAILED,
        `Failed to send password reset email: ${error.message}`
      );
    }
  }

  async sendEmailChangeConfirmation(email: string, code: string): Promise<void> {
    // Render HTML template
    const htmlContent = await this.templateService.renderTemplate('email-change-confirmation', {
      code,
      email,
    });
    
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: EmailSubject.EMAIL_CHANGE_CONFIRMATION,
        html: htmlContent,
      });
    } catch (error) {
      throw AppException.internal(
        ErrorCode.EMAIL_SEND_FAILED,
        `Failed to send email change confirmation: ${error.message}`
      );
    }
  }

  @Transactional()
  async generateAndSendVerificationCode(userId: number, email: string, type: 'email_verification' | 'password_reset' | 'email_change' = 'email_verification', tempEmail?: string): Promise<void> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Create verification code record
    const verificationCode = this.verificationCodesRepository.create({
      code,
      type,
      userId,
      email,
      tempEmail,
      expiresAt,
    });

    await this.verificationCodesRepository.save(verificationCode);

    // Send email with code
    if (type === 'email_verification') {
      await this.sendVerificationEmail(email, code);
    } else if (type === 'password_reset') {
      await this.sendPasswordResetEmail(email, code);
    } else if (type === 'email_change') {
      await this.sendEmailChangeConfirmation(email, code);
    }
  }
}
