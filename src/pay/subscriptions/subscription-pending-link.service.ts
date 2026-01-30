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
    this.logger.log(`[pending-link] save called: appUserId=${(appUserId ?? '').substring(0, 40)}, userId=${userId}`);
    if (!appUserId?.trim()) {
      this.logger.log(`[pending-link] save skipped: appUserId empty`);
      return;
    }
    const key = PENDING_LINK_KEY_PREFIX + appUserId;
    const value: PendingLinkPayload = { userId, email };
    this.logger.log(`[pending-link] save: writing Redis key=${key.substring(0, 50)}..., TTL=${TTL_SECONDS}s`);
    await this.redis.setex(key, TTL_SECONDS, JSON.stringify(value));
    this.logger.log(
      `[pending-link] save done: appUserId=${appUserId.substring(0, 30)}... → userId=${userId}, TTL=${TTL_SECONDS}s`,
    );
  }

  /**
   * Get pending link by appUserId and remove the key (one-time use).
   * Returns null if key does not exist or expired.
   */
  async getAndConsume(appUserId: string): Promise<PendingLinkPayload | null> {
    this.logger.log(`[pending-link] getAndConsume called: appUserId=${(appUserId ?? '').substring(0, 40)}`);
    if (!appUserId?.trim()) {
      this.logger.log(`[pending-link] getAndConsume skipped: appUserId empty`);
      return null;
    }
    const key = PENDING_LINK_KEY_PREFIX + appUserId;
    const raw = await this.redis.get(key);
    if (!raw) {
      this.logger.log(`[pending-link] getAndConsume: key not in Redis (expired or never saved), appUserId=${appUserId.substring(0, 35)}...`);
      return null;
    }
    try {
      const payload = JSON.parse(raw) as PendingLinkPayload;
      if (typeof payload.userId !== 'number') {
        this.logger.warn(`[pending-link] getAndConsume: payload userId not number, deleting key`);
        await this.redis.del(key);
        return null;
      }
      await this.redis.del(key);
      this.logger.log(
        `[pending-link] getAndConsume: consumed appUserId=${appUserId.substring(0, 30)}... → userId=${payload.userId}`,
      );
      return payload;
    } catch (e) {
      this.logger.warn(`[pending-link] getAndConsume: parse failed, key deleted, error=${(e as Error)?.message}`);
      await this.redis.del(key);
      return null;
    }
  }
}
