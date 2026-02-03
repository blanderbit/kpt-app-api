import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { VerificationCode } from '../auth/entities/verification-code.entity';
import { UpdateProfileDto, ChangeEmailDto, ChangePasswordDto, DeleteAccountDto, ProfileResponseDto } from './dto/profile.dto';
import { EmailService } from '../email/email.service';
import { AuthService } from '../auth/auth.service';
import { RedisBlacklistService } from '../auth/redis-blacklist.service';
import { ErrorCode } from '../common/error-codes';
import { AppException } from '../common/exceptions/app.exception';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(VerificationCode)
    private verificationCodesRepository: Repository<VerificationCode>,
    private emailService: EmailService,
    private authService: AuthService,
    private jwtService: JwtService,
    private redisBlacklistService: RedisBlacklistService,
  ) {}

  async sendVerificationEmail(email: string): Promise<{ message: string }> {
    // Find user by email
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw AppException.notFound(ErrorCode.AUTH_USER_NOT_FOUND, 'User not found');
    }

    // Check if user was created via Google or Apple
    if (user.googleId || user.firebaseUid) {
      throw AppException.forbidden(ErrorCode.PROFILE_SOCIAL_ACCOUNT_RESTRICTION, 'Cannot send verification email for social media accounts');
    }

    // Check if email is already verified
    if (user.emailVerified) {
      throw AppException.validation(ErrorCode.AUTH_EMAIL_ALREADY_VERIFIED, 'Email is already verified');
    }

    // Generate and send verification code
    await this.emailService.generateAndSendVerificationCode(user.id, email, 'email_verification');

    return { message: 'Verification email sent successfully' };
  }

  async getProfile(user: User): Promise<ProfileResponseDto> {
    return this.mapUserToProfileResponse(user);
  }

  @Transactional()
  async updateProfile(user: User, updateProfileDto: UpdateProfileDto): Promise<ProfileResponseDto> {
    const updatedUser = await this.usersRepository.save({
      ...user,
      ...updateProfileDto
    });
    return this.mapUserToProfileResponse(updatedUser);
  }

  @Transactional()
  async changeEmail(user: User, changeEmailDto: ChangeEmailDto): Promise<{ message: string }> {
    // Check if user was created via Google or Apple
    if (user.googleId || user.firebaseUid) {
      throw AppException.forbidden(ErrorCode.PROFILE_SOCIAL_ACCOUNT_RESTRICTION, 'Cannot change email for social media accounts');
    }

    // Check password
    if (!user.passwordHash) {
      throw AppException.validation(ErrorCode.PROFILE_PASSWORD_CHANGE_NOT_SUPPORTED, undefined, { userId: user.id });
    }

    const isPasswordValid = await bcrypt.compare(changeEmailDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppException.unauthorized(ErrorCode.PROFILE_INVALID_PASSWORD, undefined, { userId: user.id });
    }

    // Check if new email is already taken
    const existingUser = await this.usersRepository.findOne({ 
      where: { email: changeEmailDto.newEmail }
    });
    if (existingUser && existingUser.id !== user.id) {
      throw AppException.validation(ErrorCode.PROFILE_EMAIL_ALREADY_EXISTS, undefined, { 
        userId: user.id, 
        newEmail: changeEmailDto.newEmail 
      });
    }

    // Generate and send verification code
    await this.emailService.generateAndSendVerificationCode(
      user.id, 
      changeEmailDto.newEmail, 
      'email_change', 
      changeEmailDto.newEmail
    );

    return { 
      message: 'Check your new email for confirmation code'
    };
  }

  async confirmEmailChange(code: string): Promise<{ message: string }> {
    return this.authService.confirmEmailChangeCode(code);
  }

  @Transactional()
  async changePassword(user: User, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {

    // Check if user was created via Google or Apple
    if (user.googleId || user.firebaseUid) {
      throw AppException.forbidden(ErrorCode.PROFILE_SOCIAL_ACCOUNT_RESTRICTION, 'Cannot change password for social media accounts');
    }

    // Check if account supports password change
    if (!user.passwordHash) {
      throw AppException.validation(ErrorCode.PROFILE_PASSWORD_CHANGE_NOT_SUPPORTED, undefined, { userId: user.id });
    }

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw AppException.unauthorized(ErrorCode.PROFILE_INVALID_PASSWORD, undefined, { userId: user.id });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

    // Update password
    await this.usersRepository.update(user.id, {
      passwordHash: newPasswordHash,
    });

    return { message: 'Password successfully changed' };
  }

  @Transactional()
  async deleteAccount(user: User, deleteAccountDto: DeleteAccountDto, accessToken?: string): Promise<{ message: string }> {
    if (!deleteAccountDto.confirm) {
      throw AppException.validation(ErrorCode.PROFILE_ACCOUNT_DELETION_NOT_CONFIRMED, undefined, { userId: user.id });
    }

    // Add access token to blacklist before deleting account
    if (accessToken) {
      try {
        const decoded = this.jwtService.decode(accessToken) as any;
        const expiresIn = decoded?.exp ? Math.floor((decoded.exp * 1000 - Date.now()) / 1000) : 3600;
        
        await this.redisBlacklistService.addToBlacklist(accessToken, user.id, Math.max(expiresIn, 0));
        console.log(`Access token blacklisted for deleted user ${user.id}, expires in ${expiresIn}s`);
      } catch (decodeError) {
        console.error('Failed to decode access token for blacklist during account deletion:', decodeError);
        // If decoding failed, add with default lifetime
        await this.redisBlacklistService.addToBlacklist(accessToken, user.id, 3600);
      }
    }

    // Delete user (database will automatically delete all related activities and mood trackers due to CASCADE)
    await this.usersRepository.delete(user.id);

    return { message: 'Account successfully deleted' };
  }


  @Transactional()
  async verifyEmailCode(email: string, code: string): Promise<{ message: string }> {
    // Find verification code
    const verificationCode = await this.verificationCodesRepository.findOne({
      where: { 
        email, 
        code,
        type: 'email_verification',
        isUsed: false 
      },
    });

    if (!verificationCode) {
      throw AppException.validation(ErrorCode.AUTH_EMAIL_VERIFICATION_INVALID, 'Invalid verification code');
    }

    // Check if code is expired
    if (new Date() > verificationCode.expiresAt) {
      throw AppException.validation(ErrorCode.AUTH_EMAIL_VERIFICATION_EXPIRED, 'Verification code has expired');
    }

    // Mark code as used
    await this.verificationCodesRepository.update(verificationCode.id, {
      isUsed: true,
    });

    // Update user email verification status
    await this.usersRepository.update(verificationCode.userId, {
      emailVerified: true,
    });

    return { message: 'Email successfully verified' };
  }

  private mapUserToProfileResponse(user: User): ProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      avatarUrl: user.avatarUrl,
      theme: user.theme as any,
      language: user.language,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      initSatisfactionLevel: user.initSatisfactionLevel ?? null,
      initHardnessLevel: user.initHardnessLevel ?? null,
    };
  }
}
