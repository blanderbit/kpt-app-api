import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

const PENDING_LINK_KEY_PREFIX = 'subscription_pending_link:';
const TTL_SECONDS = 48 * 3600; // 48 hours

export interface PendingLinkPayload {
  userId: number;
  email?: string;
}

@Injectable()
export class SubscriptionPendingLinkService {
  private readonly logger = new Logger(SubscriptionPendingLinkService.name);

  constructor(
    @InjectQueue('suggested-activity') private readonly queue: Queue,
  ) {}

  private get redis() {
    return this.queue.client;
  }

  /**
   * Save appUserId → userId (and email) for later linking when webhook arrives.
   * Called on register/login when appUserId is present (e.g. $RCAnonymousID:...).
   */
  async save(appUserId: string, userId: number, email?: string): Promise<void> {
    if (!appUserId?.trim()) return;
    const key = PENDING_LINK_KEY_PREFIX + appUserId;
    const value: PendingLinkPayload = { userId, email };
    await this.redis.setex(key, TTL_SECONDS, JSON.stringify(value));
    this.logger.log(
      `Pending link saved: appUserId=${appUserId.substring(0, 30)}... → userId=${userId}, TTL=${TTL_SECONDS}s`,
    );
  }

  /**
   * Get pending link by appUserId and remove the key (one-time use).
   * Returns null if key does not exist or expired.
   */
  async getAndConsume(appUserId: string): Promise<PendingLinkPayload | null> {
    if (!appUserId?.trim()) return null;
    const key = PENDING_LINK_KEY_PREFIX + appUserId;
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try {
      const payload = JSON.parse(raw) as PendingLinkPayload;
      if (typeof payload.userId !== 'number') return null;
      await this.redis.del(key);
      this.logger.log(
        `Pending link consumed: appUserId=${appUserId.substring(0, 30)}... → userId=${payload.userId}`,
      );
      return payload;
    } catch {
      await this.redis.del(key);
      return null;
    }
  }
}
