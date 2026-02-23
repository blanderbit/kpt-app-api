import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExternalSignupService } from '../external-signup.service';

@Injectable()
export class CleanupExternalSignupsCron {
  private readonly logger = new Logger(CleanupExternalSignupsCron.name);

  constructor(private readonly externalSignupService: ExternalSignupService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanup() {
    try {
      this.logger.log('Starting cleanup of expired external signups...');
      const { deleted } = await this.externalSignupService.cleanupExpired(7);
      this.logger.log(`Cleanup completed, deleted ${deleted} record(s)`);
    } catch (error) {
      this.logger.error('Failed to cleanup external signups', (error as Error)?.stack);
    }
  }
}
