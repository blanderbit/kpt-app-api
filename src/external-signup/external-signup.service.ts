import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ExternalSignup, ExternalSignupStatus } from './entities/external-signup.entity';
import { LessThan } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { StartSignupRequestDto, StartSignupResponseDto } from './dto/start-signup.dto';
import { SignupResultResponseDto } from './dto/signup-result.dto';
import { AppException } from '../common/exceptions/app.exception';
import { ErrorCode } from '../common/error-codes';

@Injectable()
export class ExternalSignupService {
  private readonly logger = new Logger(ExternalSignupService.name);

  constructor(
    @InjectRepository(ExternalSignup)
    private readonly externalSignupRepository: Repository<ExternalSignup>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async startSignup(dto: StartSignupRequestDto): Promise<StartSignupResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const meta = {
      programId: dto.programId,
      programName: dto.programName ?? null,
      quizSnapshot: dto.quiz?.length ? dto.quiz : null,
    };

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      if (existingUser.hasPaidSubscription) {
        throw AppException.conflict(
          ErrorCode.AUTH_USER_ALREADY_EXISTS,
          'This email is already registered with an active subscription. Please log in to the app.',
        );
      }
      // Existing user without active subscription: allow external signup (reactivation flow)
      const pendingSignup = await this.externalSignupRepository.findOne({
        where: { email, status: ExternalSignupStatus.PENDING_PAYMENT },
      });
      if (pendingSignup) {
        pendingSignup.meta = meta;
        pendingSignup.userId = existingUser.id;
        await this.externalSignupRepository.save(pendingSignup);
        this.logger.log(`[start-signup] updated existing external_signup id=${pendingSignup.id}, userId=${existingUser.id}, app_user_id=${pendingSignup.appUserId}`);
        return { appUserId: pendingSignup.appUserId };
      }
      const appUserId = `web_signup_${randomUUID().replace(/-/g, '')}`;
      const signup = this.externalSignupRepository.create({
        appUserId,
        email,
        meta,
        status: ExternalSignupStatus.PENDING_PAYMENT,
        userId: existingUser.id,
      });
      await this.externalSignupRepository.save(signup);
      this.logger.log(`[start-signup] created external_signup id=${signup.id}, userId=${existingUser.id} (reactivation), app_user_id=${appUserId}`);
      return { appUserId };
    }

    const pendingSignup = await this.externalSignupRepository.findOne({
      where: { email, status: ExternalSignupStatus.PENDING_PAYMENT },
    });

    if (pendingSignup) {
      pendingSignup.meta = meta;
      await this.externalSignupRepository.save(pendingSignup);
      this.logger.log(`[start-signup] updated existing external_signup id=${pendingSignup.id}, app_user_id=${pendingSignup.appUserId}`);
      return { appUserId: pendingSignup.appUserId };
    }

    const appUserId = `web_signup_${randomUUID().replace(/-/g, '')}`;

    const signup = this.externalSignupRepository.create({
      appUserId,
      email,
      meta,
      status: ExternalSignupStatus.PENDING_PAYMENT,
    });
    await this.externalSignupRepository.save(signup);

    this.logger.log(`[start-signup] created external_signup id=${signup.id}, app_user_id=${appUserId}`);

    const response: StartSignupResponseDto = { appUserId };
    // TODO: if Paddle API is used from backend, create transaction and set response.checkoutUrl
    return response;
  }

  async getSignupResult(appUserId: string): Promise<SignupResultResponseDto> {
    const signup = await this.externalSignupRepository.findOne({
      where: { appUserId, status: ExternalSignupStatus.PAID },
      relations: ['user'],
    });

    if (!signup || !signup.userId || !signup.user) {
      throw new NotFoundException(
        'Signup not found or payment not yet processed. Try again in a moment or use the app_user_id from start-signup.',
      );
    }

    const user = signup.user;
    const registrationLink =
      this.configService.get<string>('REGISTRATION_LINK_BASE') || 'https://app.plesury.com/onboarding';

    const payload = { email: user.email, sub: user.id, roles: user.roles };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      registrationLink,
      accessToken,
      refreshToken,
    };
  }

  async findPendingByAppUserId(appUserId: string): Promise<ExternalSignup | null> {
    return this.externalSignupRepository.findOne({
      where: { appUserId, status: ExternalSignupStatus.PENDING_PAYMENT },
    });
  }

  async updateAfterPayment(
    signup: ExternalSignup,
    data: {
      userId: number;
      paddleTransactionId?: string | null;
      paddleSubscriptionId?: string | null;
    },
  ): Promise<void> {
    signup.status = ExternalSignupStatus.PAID;
    signup.userId = data.userId;
    if (data.paddleTransactionId !== undefined) signup.paddleTransactionId = data.paddleTransactionId;
    if (data.paddleSubscriptionId !== undefined) signup.paddleSubscriptionId = data.paddleSubscriptionId;
    await this.externalSignupRepository.save(signup);
    this.logger.log(`[external-signup] updated id=${signup.id}, userId=${data.userId}`);
  }

  /**
   * Remove or expire old pending_payment and expired paid records. Default TTL 7 days for pending.
   */
  async cleanupExpired(pendingPaymentTtlDays: number = 7): Promise<{ deleted: number }> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - pendingPaymentTtlDays);

    const pending = await this.externalSignupRepository.find({
      where: { status: ExternalSignupStatus.PENDING_PAYMENT, createdAt: LessThan(cutoff) },
    });
    let deleted = 0;
    for (const row of pending) {
      await this.externalSignupRepository.delete(row.id);
      deleted++;
    }
    if (deleted > 0) {
      this.logger.log(`[external-signup] cleanup: deleted ${deleted} expired pending_payment records`);
    }
    return { deleted };
  }
}
