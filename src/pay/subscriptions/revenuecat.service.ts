import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

declare const fetch: (input: string, init?: Record<string, any>) => Promise<Response>;

declare interface Response {
  ok: boolean;
  status: number;
  statusText: string;
}

@Injectable()
export class RevenueCatService {
  private readonly logger = new Logger(RevenueCatService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('REVENUECAT_API_KEY') || '';
    this.baseUrl = this.configService.get<string>('REVENUECAT_API_URL') || 'https://api.revenuecat.com/v1';
  }

  async cancelSubscription(appUserId: string, productId: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn('RevenueCat API key not configured; skipping external cancellation');
      return;
    }

    try {
      const url = `${this.baseUrl}/subscribers/${encodeURIComponent(appUserId)}/products/${encodeURIComponent(productId)}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.warn(`RevenueCat cancellation returned status ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to cancel RevenueCat subscription: ${error?.message || error}`);
      throw error;
    }
  }
}
