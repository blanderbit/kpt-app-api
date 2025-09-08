import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { RedisBlacklistService } from '../redis-blacklist.service';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class BlacklistGuard implements CanActivate {
  constructor(private readonly redisBlacklistService: RedisBlacklistService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw AppException.unauthorized(
        ErrorCode.AUTH_TOKEN_NOT_FOUND,
        'Authentication token not found in request'
      );
    }

    // Check if token is in blacklist
    const isBlacklisted = await this.redisBlacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      throw AppException.unauthorized(
        ErrorCode.AUTH_TOKEN_REVOKED,
        'Authentication token has been revoked'
      );
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
