import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
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
    private emailService: EmailService,
    private authService: AuthService,
    private jwtService: JwtService,
    private redisBlacklistService: RedisBlacklistService,
  ) {}

  async getProfile(userId: number): Promise<ProfileResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    return this.mapUserToProfileResponse(user);
  }

  @Transactional()
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<ProfileResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    // Update only provided fields
    if (updateProfileDto.firstName !== undefined) {
      user.firstName = updateProfileDto.firstName;
    }
    if (updateProfileDto.lastName !== undefined) {
      user.lastName = updateProfileDto.lastName;
    }
    if (updateProfileDto.avatarUrl !== undefined) {
      user.avatarUrl = updateProfileDto.avatarUrl;
    }
    if (updateProfileDto.theme !== undefined) {
      user.theme = updateProfileDto.theme;
    }

    const updatedUser = await this.usersRepository.save(user);
    return this.mapUserToProfileResponse(updatedUser);
  }

  @Transactional()
  async changeEmail(userId: number, changeEmailDto: ChangeEmailDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    // Check password
    if (!user.passwordHash) {
      throw AppException.validation(ErrorCode.PROFILE_PASSWORD_CHANGE_NOT_SUPPORTED, undefined, { userId });
    }

    const isPasswordValid = await bcrypt.compare(changeEmailDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppException.unauthorized(ErrorCode.PROFILE_INVALID_PASSWORD, undefined, { userId });
    }

    // Check if new email is already taken
    const existingUser = await this.usersRepository.findOne({ where: { email: changeEmailDto.newEmail } });
    if (existingUser && existingUser.id !== userId) {
      throw AppException.validation(ErrorCode.PROFILE_EMAIL_ALREADY_EXISTS, undefined, { 
        userId, 
        newEmail: changeEmailDto.newEmail 
      });
    }

    // Generate and send verification code
    await this.emailService.generateAndSendVerificationCode(
      userId, 
      user.email, 
      'email_change', 
      changeEmailDto.newEmail
    );

    return { message: 'Check your new email for confirmation code' };
  }

  async confirmEmailChange(email: string, code: string): Promise<{ message: string }> {
    return this.authService.confirmEmailChangeCode(email, code);
  }

  @Transactional()
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    // Check if account supports password change
    if (!user.passwordHash) {
      throw AppException.validation(ErrorCode.PROFILE_PASSWORD_CHANGE_NOT_SUPPORTED, undefined, { userId });
    }

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw AppException.unauthorized(ErrorCode.PROFILE_INVALID_PASSWORD, undefined, { userId });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

    // Update password
    await this.usersRepository.update(userId, {
      passwordHash: newPasswordHash,
    });

    return { message: 'Password successfully changed' };
  }

  @Transactional()
  async deleteAccount(userId: number, deleteAccountDto: DeleteAccountDto, accessToken?: string): Promise<{ message: string }> {
    if (!deleteAccountDto.confirm) {
      throw AppException.validation(ErrorCode.PROFILE_ACCOUNT_DELETION_NOT_CONFIRMED, undefined, { userId });
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    // Check password
    if (!user.passwordHash) {
      throw AppException.validation(ErrorCode.PROFILE_PASSWORD_CHANGE_NOT_SUPPORTED, undefined, { userId });
    }

    const isPasswordValid = await bcrypt.compare(deleteAccountDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppException.unauthorized(ErrorCode.PROFILE_INVALID_PASSWORD, undefined, { userId });
    }

    // Add access token to blacklist before deleting account
    if (accessToken) {
      try {
        const decoded = this.jwtService.decode(accessToken) as any;
        const expiresIn = decoded?.exp ? Math.floor((decoded.exp * 1000 - Date.now()) / 1000) : 3600;
        
        await this.redisBlacklistService.addToBlacklist(accessToken, userId, Math.max(expiresIn, 0));
        console.log(`Access token blacklisted for deleted user ${userId}, expires in ${expiresIn}s`);
      } catch (decodeError) {
        console.error('Failed to decode access token for blacklist during account deletion:', decodeError);
        // If decoding failed, add with default lifetime
        await this.redisBlacklistService.addToBlacklist(accessToken, userId, 3600);
      }
    }

    // Delete user
    await this.usersRepository.delete(userId);

    return { message: 'Account successfully deleted' };
  }


  private mapUserToProfileResponse(user: User): ProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      theme: user.theme as any,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

}
