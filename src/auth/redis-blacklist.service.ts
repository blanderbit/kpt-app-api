import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ErrorCode } from '../common/error-codes';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class RedisBlacklistService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisBlacklistService.name);

  constructor(
    @InjectQueue('suggested-activity') private readonly queue: Queue,
  ) {}

  /**
   * Get Redis client from Bull queue
   */
  private get redis() {
    return this.queue.client;
  }

  /**
   * Add token to blacklist
   * @param token JWT token to add to blacklist
   * @param userId User ID
   * @param expiresIn Token lifetime in seconds (default 1 hour)
   */
  async addToBlacklist(token: string, userId: number, expiresIn: number = 3600): Promise<void> {
    try {
      const key = `blacklist:${token}`;

      // Store token with user ID and expiration
      await this.redis.setex(key, expiresIn, JSON.stringify({
        userId,
        blacklistedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
      }));

      // Also store in user's blacklisted tokens set for tracking
      const userKey = `user:${userId}:blacklisted_tokens`;
      await this.redis.sadd(userKey, token);
      await this.redis.expire(userKey, expiresIn + 86400); // Keep user set for 24 hours after token expires

      this.logger.log(`Token blacklisted for user ${userId}, expires in ${expiresIn}s`);
    } catch (error) {
      this.logger.error(`Failed to add token to blacklist: ${error.message}`);
      throw AppException.internal(
        ErrorCode.AUTH_TOKEN_ADD_TO_BLACKLIST_FAILED,
        'Failed to add token to blacklist',
        { originalError: error.message }
      );
    }
  }

  /**
   * Check if token is in blacklist
   * @param token JWT token to check
   * @returns true if token is blacklisted, false if not
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const key = `blacklist:${token}`;

      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Failed to check token blacklist: ${error.message}`);
      // In case of error, consider token as valid to avoid blocking users
      return false;
    }
  }

  /**
   * Remove token from blacklist (e.g., for forced logout)
   * @param token JWT token to remove
   */
  async removeFromBlacklist(token: string): Promise<void> {
    try {
      const key = `blacklist:${token}`;

      // Get token data before deletion to remove from user's set
      const tokenData = await this.redis.get(key);
      if (tokenData) {
        try {
          const parsed = JSON.parse(tokenData);
          if (parsed.userId) {
            const userKey = `user:${parsed.userId}:blacklisted_tokens`;
            await this.redis.srem(userKey, token);
          }
        } catch (parseError) {
          this.logger.warn(`Failed to parse token data: ${parseError.message}`);
        }
      }

      // Remove token from blacklist
      await this.redis.del(key);

      this.logger.log(`Token removed from blacklist`);
    } catch (error) {
      this.logger.error(`Failed to remove token from blacklist: ${error.message}`);
      throw AppException.internal(
        ErrorCode.AUTH_TOKEN_REMOVE_FROM_BLACKLIST_FAILED,
        'Failed to remove token from blacklist',
        { originalError: error.message }
      );
    }
  }

  /**
   * Clean up all expired tokens from blacklist
   * This method can be run as a cron job
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      // Get all blacklist keys
      const keys = await this.redis.keys('blacklist:*');
      let cleanedCount = 0;

      for (const key of keys) {
        try {
          const ttl = await this.redis.ttl(key);
          if (ttl <= 0) {
            // Get token data before deletion
            const tokenData = await this.redis.get(key);
            if (tokenData) {
              try {
                const parsed = JSON.parse(tokenData);
                if (parsed.userId) {
                  // Remove from user's blacklisted tokens set
                  const userKey = `user:${parsed.userId}:blacklisted_tokens`;
                  const token = key.replace('blacklist:', '');
                  await this.redis.srem(userKey, token);
                }
              } catch (parseError) {
                this.logger.warn(`Failed to parse token data during cleanup: ${parseError.message}`);
              }
            }

            await this.redis.del(key);
            cleanedCount++;
          }
        } catch (keyError) {
          this.logger.warn(`Failed to process key ${key} during cleanup: ${keyError.message}`);
        }
      }

      this.logger.log(`Expired tokens cleanup completed. Cleaned ${cleanedCount} tokens`);
    } catch (error) {
      this.logger.error(`Failed to cleanup expired tokens: ${error.message}`);
      throw AppException.internal(
        ErrorCode.AUTH_BLACKLIST_CLEANUP_FAILED,
        'Failed to cleanup expired tokens',
        { originalError: error.message }
      );
    }
  }

  /**
   * Get blacklist statistics
   */
  async getBlacklistStats(): Promise<{
    totalTokens: number;
    totalUsers: number;
    estimatedSize: number;
  }> {
    try {
      const totalTokens = await this.redis.dbsize();
      const userKeys = await this.redis.keys('user:*:blacklisted_tokens');
      const totalUsers = userKeys.length;

      // Estimate memory usage (rough calculation)
      const estimatedSize = totalTokens * 256; // Assume average 256 bytes per token entry

      return {
        totalTokens,
        totalUsers,
        estimatedSize
      };
    } catch (error) {
      this.logger.error(`Failed to get blacklist stats: ${error.message}`);
      throw AppException.internal(
        ErrorCode.AUTH_BLACKLIST_CHECK_FAILED,
        'Failed to get blacklist stats',
        { originalError: error.message }
      );
    }
  }

  /**
   * Get all blacklisted tokens for a specific user
   * @param userId User ID
   */
  async getUserBlacklistedTokens(userId: number): Promise<string[]> {
    try {
      const userKey = `user:${userId}:blacklisted_tokens`;

      const tokens = await this.redis.smembers(userKey);
      return tokens;
    } catch (error) {
      this.logger.error(`Failed to get user blacklisted tokens: ${error.message}`);
      return [];
    }
  }

  /**
   * Force logout user from all devices (blacklist all their tokens)
   * @param userId User ID
   */
  async forceLogoutUser(userId: number): Promise<void> {
    try {
      const userKey = `user:${userId}:blacklisted_tokens`;

      // Get all tokens for user
      const tokens = await this.redis.smembers(userKey);

      // Remove all tokens from blacklist
      for (const token of tokens) {
        await this.redis.del(`blacklist:${token}`);
      }

      // Remove user's blacklisted tokens set
      await this.redis.del(userKey);

      this.logger.log(`Force logout completed for user ${userId}. Removed ${tokens.length} tokens`);
    } catch (error) {
      this.logger.error(`Failed to force logout user ${userId}: ${error.message}`);
      throw AppException.internal(
        ErrorCode.AUTH_TOKEN_REMOVE_FROM_BLACKLIST_FAILED,
        'Failed to force logout user',
        { originalError: error.message }
      );
    }
  }

  /**
   * Gracefully shutdown Redis connection
   */
  async onModuleDestroy(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
        this.logger.log('Redis connection closed gracefully');
      }
    } catch (error) {
      this.logger.error(`Error closing Redis connection: ${error.message}`);
    }
  }
}
