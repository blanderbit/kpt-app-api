import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../auth.service';

@Injectable()
export class CleanupVerificationCodesCron {
  private readonly logger = new Logger(CleanupVerificationCodesCron.name);

  constructor(private readonly authService: AuthService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCleanupExpiredCodes() {
    try {
      this.logger.log('Starting cleanup of expired verification codes...');
      await this.authService.cleanupExpiredCodes();
      this.logger.log('Successfully cleaned up expired verification codes');
    } catch (error) {
      this.logger.error('Failed to cleanup expired verification codes:', error);
    }
  }
}
