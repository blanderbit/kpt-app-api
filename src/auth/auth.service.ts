import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { VerificationCode } from './entities/verification-code.entity';
import { RoleService } from '../users/services/role.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { FirebaseAuthDto, AuthType } from './dto/firebase-auth.dto';
import { EmailService } from '../email/email.service';
import { FirebaseService } from '../firebase/firebase.service';
import { RedisBlacklistService } from './redis-blacklist.service';
import { ChatGPTService } from '../core/chatgpt';
import { OnboardingQuestionsService } from '../core/onboarding-questions';
import { ActivityTypesService } from '../core/activity-types';
import { ErrorCode } from '../common/error-codes';
import { AppException } from '../common/exceptions/app.exception';
import { GenerateActivityRecommendationsDto, ActivityRecommendationsResponseDto, ActivityRecommendationDto } from './dto/generate-activity-recommendations.dto';
import { SubscriptionsService } from '../pay/subscriptions/subscriptions.service';
import { SubscriptionPendingLinkService } from '../pay/subscriptions/subscription-pending-link.service';
import { TemporaryItemsQueueService } from '../admin/settings/queue/temporary-items-queue.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(VerificationCode)
    private verificationCodesRepository: Repository<VerificationCode>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private firebaseService: FirebaseService,
    private redisBlacklistService: RedisBlacklistService,
    private roleService: RoleService,
    private chatGPTService: ChatGPTService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly subscriptionPendingLinkService: SubscriptionPendingLinkService,
    private readonly onboardingQuestionsService: OnboardingQuestionsService,
    private readonly activityTypesService: ActivityTypesService,
    private readonly temporaryItemsQueueService: TemporaryItemsQueueService,
  ) {}

  @Transactional()
  async register(registerDto: RegisterDto): Promise<{ message: string; userId: number }> {
    const { 
      email, 
      password, 
      firstName, 
      age, 
      feelingToday, 
      socialNetworks, 
      onboardingQuestionAndAnswers, 
      activities, 
      taskTrackingMethod,
      initSatisfactionLevel,
      initHardnessLevel,
      appUserId,
    } = registerDto;

    this.logger.log(
      `[Auth] register: appUserId=${appUserId ? `${appUserId.substring(0, 30)}...` : 'null'}`,
    );

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw AppException.validation(ErrorCode.AUTH_USER_ALREADY_EXISTS, 'User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Prepare user data
    const userData: any = {
      email,
      passwordHash,
      firstName,
      emailVerified: false,
      age: age || '',
      initialFeeling: feelingToday || null,
      initSatisfactionLevel: initSatisfactionLevel ?? null,
      initHardnessLevel: initHardnessLevel ?? null,
      socialNetworks: socialNetworks?.join(',') || null,
      taskTrackingMethod: taskTrackingMethod || null,
    };

    // Add onboarding data to meta
    if (onboardingQuestionAndAnswers) {
      userData.meta = {
        onboardingQuestionAndAnswers: onboardingQuestionAndAnswers
      };
    } else {
      userData.meta = {};
    }

    // Create user
    const user = (await this.usersRepository.save(this.usersRepository.create(userData))) as unknown as User;

    // If activities are provided, create them
    if (activities && activities.length > 0) {
      const activityRepository = this.usersRepository.manager.getRepository('Activity');
      
      // Create all activities at once
      const activitiesToCreate = activities.map((activityDto, index) => 
        activityRepository.create({
          ...activityDto,
          user,
          activityType: 'general', // Default activity type
          status: 'active',
          position: index, // Set position based on array index
        })
      );
      
      // Save all activities in one operation
      await activityRepository.save(activitiesToCreate);
    }

    if (appUserId) {
      this.logger.log(`[Auth] register: appUserId present, calling linkSubscriptionsToUser(appUserId=..., userId=${user.id})`);
      const linkUpdated = await this.subscriptionsService.linkSubscriptionsToUser(appUserId, user.id, email);
      this.logger.log(
        `[Auth] register: linkSubscriptionsToUser updated ${linkUpdated} row(s) for userId=${user.id}`,
      );
      this.logger.log(`[Auth] register: saving pending link appUserId→userId=${user.id}`);
      await this.subscriptionPendingLinkService.save(appUserId, user.id, email);

      // Do not auto-create trial: subscription is only set when user chooses one (e.g. via RevenueCat).
      this.logger.log(`[Auth] register: subscription from RevenueCat link only, no auto-trial for userId=${user.id}`);
    }
    // When no appUserId: user has no subscription until they choose one (e.g. in app via RevenueCat).

    // Temporary items jobs are queued in the controller after this method returns (after TX commit)

    return {
      message: 'Registration successful. You can now send verification email when needed.',
      userId: user.id,
    };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> {
    const { email, password, appUserId } = loginDto;

    // Find user
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw AppException.unauthorized(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid email or password');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppException.unauthorized(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid email or password');
    }

    // Link RevenueCat subscriptions (e.g. anonymous) to this user; do not auto-create trial
    if (appUserId) {
      this.logger.log(`[Auth] login: appUserId present, calling linkSubscriptionsToUser(appUserId=..., userId=${user.id})`);
      const linkUpdated = await this.subscriptionsService.linkSubscriptionsToUser(appUserId, user.id, user.email);
      this.logger.log(
        `[Auth] login: linkSubscriptionsToUser updated ${linkUpdated} row(s) for userId=${user.id}`,
      );
    }
    // When no appUserId or no subscription after link: user has no subscription until they choose one (e.g. via RevenueCat).

    // Generate tokens
    const payload = { email: user.email, sub: user.id, roles: user.roles };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Remove sensitive data
    const { passwordHash, ...userWithoutSensitiveData } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutSensitiveData,
    };
  }

  @Transactional()
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal information about user existence
      return { message: 'If a user with this email exists, you will receive a password reset code' };
    }

    // Generate and send password reset code
    await this.emailService.generateAndSendVerificationCode(user.id, email, 'password_reset');

    return { message: 'If a user with this email exists, you will receive a password reset code' };
  }

  @Transactional()
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { email, code, newPassword } = resetPasswordDto;

    // Find verification code
    const verificationCode = await this.verificationCodesRepository.findOne({
      where: { 
        email, 
        code,
        type: 'password_reset',
        isUsed: false 
      },
    });

    if (!verificationCode) {
      throw AppException.validation(ErrorCode.AUTH_PASSWORD_RESET_INVALID, 'Invalid or expired reset code');
    }

    // Check if code is expired
    if (new Date() > verificationCode.expiresAt) {
      throw AppException.validation(ErrorCode.AUTH_PASSWORD_RESET_INVALID, 'Reset code has expired');
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.usersRepository.update(verificationCode.userId, {
      passwordHash,
    });

    // Mark code as used
    await this.verificationCodesRepository.update(verificationCode.id, {
      isUsed: true,
    });

    return { message: 'Password successfully changed' };
  }


  async refreshToken(refreshToken: string, accessToken?: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken);
      
      // Find user
      const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw AppException.unauthorized(ErrorCode.AUTH_USER_NOT_FOUND, 'User not found');
      }

      // Check if refresh token is blacklisted
      const isBlacklisted = await this.redisBlacklistService.isBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw AppException.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, 'Refresh token has been revoked');
      }

      // Generate new token pair
      const newPayload = { email: user.email, sub: user.id, roles: user.roles };
      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      // Add old access token to blacklist if provided
      if (accessToken) {
        try {
          const decoded = this.jwtService.decode(accessToken) as any;
          const expiresIn = decoded?.exp ? Math.floor((decoded.exp * 1000 - Date.now()) / 1000) : 3600;
          
          await this.redisBlacklistService.addToBlacklist(accessToken, user.id, Math.max(expiresIn, 0));
          console.log(`Old access token blacklisted for user ${user.id}, expires in ${expiresIn}s`);
        } catch (decodeError) {
          console.error('Failed to decode access token for blacklist:', decodeError);
          // If decoding failed, add with default lifetime
          await this.redisBlacklistService.addToBlacklist(accessToken, user.id, 3600);
        }
      }

      // Add old refresh token to blacklist
      try {
        const decoded = this.jwtService.decode(refreshToken) as any;
        const expiresIn = decoded?.exp ? Math.floor((decoded.exp * 1000 - Date.now()) / 1000) : 7 * 24 * 60 * 60; // 7 days default
        
        await this.redisBlacklistService.addToBlacklist(refreshToken, user.id, Math.max(expiresIn, 0));
        console.log(`Old refresh token blacklisted for user ${user.id}, expires in ${expiresIn}s`);
      } catch (decodeError) {
        console.error('Failed to decode refresh token for blacklist:', decodeError);
        // If decoding failed, add with default lifetime (7 days)
        await this.redisBlacklistService.addToBlacklist(refreshToken, user.id, 7 * 24 * 60 * 60);
      }

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw AppException.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, 'Invalid refresh token');
    }
  }

  async logout(userId: number, token?: string): Promise<{ message: string }> {
    try {
      // Log user logout
      console.log(`User ${userId} logged out at ${new Date().toISOString()}`);
      
      if (token) {
        // Add access token to blacklist
        // Get token lifetime from JWT payload
        try {
          const decoded = this.jwtService.decode(token) as any;
          const expiresIn = decoded?.exp ? Math.floor((decoded.exp * 1000 - Date.now()) / 1000) : 3600;
          
          await this.redisBlacklistService.addToBlacklist(token, userId, Math.max(expiresIn, 0));
          console.log(`Access token blacklisted for user ${userId}, expires in ${expiresIn}s`);
        } catch (decodeError) {
          console.error('Failed to decode token for blacklist:', decodeError);
          // If decoding failed, add with default lifetime
          await this.redisBlacklistService.addToBlacklist(token, userId, 3600);
        }
      }
      
      // Can also add to database the time of last logout
      // await this.usersRepository.update(userId, { lastLogoutAt: new Date() })
      
      return { message: 'Successfully logged out' };
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if an error occurred, return success response
      // so user can continue working
      return { message: 'Successfully logged out' };
    }
  }

  @Transactional()
  async authenticateWithFirebase(firebaseAuthDto: FirebaseAuthDto): Promise<{ accessToken: string; refreshToken: string; user: Partial<User>; isNewUser?: boolean }> {
    try {
      // Verify Firebase ID token
      const decodedToken = await this.firebaseService.verifyIdToken(firebaseAuthDto.idToken);
      
      // Get user information from Firebase
      const firebaseUser = await this.firebaseService.getUserByUid(decodedToken.uid);
      
      // Find user in our database
      let user: User | null = await this.usersRepository.findOne({ 
        where: { email: decodedToken.email } 
      });
      let isNewUser = false;

      // Check if user exists but was not created via Firebase
      if (user && !user.firebaseUid) {
        throw AppException.validation(ErrorCode.AUTH_EMAIL_ALREADY_USED_NON_FIREBASE, 'This email is already registered with a regular account. Please use email/password login instead.');
      }
      
      if (!user) {
        // If user doesn't exist, create new one
        const userData: any = {
          email: firebaseUser.email,
          firebaseUid: decodedToken.uid,
          firstName: firebaseUser.displayName?.split(' ')[0] || undefined,
          avatarUrl: firebaseUser.photoURL || undefined,
          emailVerified: firebaseUser.emailVerified,
          roles: this.roleService.stringifyRoles(['user']),
        };

        // If this is a registration, add additional fields
        if (firebaseAuthDto.authType === AuthType.REGISTER) {
          userData.age = firebaseAuthDto.age || '';
          userData.initialFeeling = firebaseAuthDto.feelingToday || null;
          userData.initSatisfactionLevel = firebaseAuthDto.initSatisfactionLevel ?? null;
          userData.initHardnessLevel = firebaseAuthDto.initHardnessLevel ?? null;
          userData.socialNetworks = firebaseAuthDto.socialNetworks?.join(',') || null;
          userData.taskTrackingMethod = firebaseAuthDto.taskTrackingMethod || null;
          
          // Add onboarding data to meta
          if (firebaseAuthDto.onboardingQuestionAndAnswers) {
            userData.meta = {
              onboardingQuestionAndAnswers: firebaseAuthDto.onboardingQuestionAndAnswers
            };
          } else {
            userData.meta = {};
          }
        }

        const newUser = this.usersRepository.create(userData);
        const savedUser = await this.usersRepository.save(newUser);
        user = Array.isArray(savedUser) ? (savedUser[0] as User) : (savedUser as User);

        // If this is registration and activities are provided, create them
        if (firebaseAuthDto.authType === AuthType.REGISTER && firebaseAuthDto.activities && firebaseAuthDto.activities.length > 0) {
          const activityRepository = this.usersRepository.manager.getRepository('Activity');
          
          // Create all activities at once
          const activitiesToCreate = firebaseAuthDto.activities.map((activityDto, index) => 
            activityRepository.create({
              ...activityDto,
              user,
              activityType: 'general', // Default activity type
              status: 'active',
              position: index, // Set position based on array index
            })
          );
          
          // Save all activities in one operation
          await activityRepository.save(activitiesToCreate);
        }

        // Temporary items jobs are queued in the controller after this method returns (after TX commit) when isNewUser
      }
      
      // Ensure user exists (should not be null at this point)
      if (!user) {
        throw AppException.internal(ErrorCode.AUTH_FIREBASE_AUTH_FAILED, 'User creation failed');
      }

      const currentUser = user as User;
 
      // Generate JWT tokens
      const payload = { email: currentUser.email, sub: currentUser.id, roles: currentUser.roles };
      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
      
      // Remove sensitive data
      const { passwordHash, ...userWithoutSensitiveData } = currentUser;
      
      const response = {
        accessToken,
        refreshToken,
        user: userWithoutSensitiveData,
        isNewUser,
      };

      if (firebaseAuthDto.appUserId && currentUser.id) {
        this.logger.log(
          `[Auth] authenticateWithFirebase: appUserId present, calling linkSubscriptionsToUser(appUserId=..., userId=${currentUser.id})`,
        );
        const linkUpdated = await this.subscriptionsService.linkSubscriptionsToUser(
          firebaseAuthDto.appUserId,
          currentUser.id,
          firebaseUser.email || undefined,
        );
        this.logger.log(
          `[Auth] authenticateWithFirebase: linkSubscriptionsToUser updated ${linkUpdated} row(s) for userId=${currentUser.id}`,
        );
        this.logger.log(`[Auth] authenticateWithFirebase: saving pending link appUserId→userId=${currentUser.id}`);
        await this.subscriptionPendingLinkService.save(
          firebaseAuthDto.appUserId,
          currentUser.id,
          firebaseUser.email || undefined,
        );

        // Do not auto-create trial: subscription is only set when user chooses one (e.g. via RevenueCat).
        this.logger.log(`[Auth] authenticateWithFirebase: subscription from RevenueCat link only, no auto-trial for userId=${currentUser.id}`);
      }
      // When no appUserId: user has no subscription until they choose one (e.g. in app via RevenueCat).

      return response;
    } catch (error) {
      // Re-throw AppException errors to preserve custom error codes
      if (error instanceof AppException) {
        throw error;
      }
      
      // For other errors, use the generic Firebase auth failed error
      throw AppException.unauthorized(ErrorCode.AUTH_FIREBASE_AUTH_FAILED, 'Invalid Firebase token');
    }
  }



  @Transactional()
  async confirmEmailChangeCode(code: string): Promise<{ message: string }> {
    // Find verification code
    const verificationCode = await this.verificationCodesRepository.findOne({
      where: { 
        code,
        type: 'email_change',
      },
    });

    if (!verificationCode) {
      throw AppException.validation(ErrorCode.AUTH_EMAIL_VERIFICATION_INVALID, 'Invalid email change code');
    }
    
    if (verificationCode.isUsed) {
      throw AppException.validation(ErrorCode.AUTH_EMAIL_VERIFICATION_INVALID, 'Email change code has already been used');
    }

    // Check if code is expired
    if (new Date() > verificationCode.expiresAt) {
      throw AppException.validation(ErrorCode.AUTH_EMAIL_VERIFICATION_EXPIRED, 'Email change code has expired');
    }

    if (!verificationCode.tempEmail) {
      throw AppException.validation(ErrorCode.AUTH_EMAIL_VERIFICATION_INVALID, 'No temporary email found');
    }

    // Check if new email is already taken
    const existingUser = await this.usersRepository.findOne({ 
      where: { email: verificationCode.tempEmail } 
    });
    if (existingUser && existingUser.id !== verificationCode.userId) {
      throw AppException.validation(ErrorCode.PROFILE_EMAIL_ALREADY_EXISTS, 'Email is already taken');
    }

    // Update user email
    await this.usersRepository.update(verificationCode.userId, {
      email: verificationCode.tempEmail,
      emailVerified: true,
    });

    // Mark code as used
    await this.verificationCodesRepository.update(verificationCode.id, {
      isUsed: true,
    });

    return { message: 'Email successfully changed' };
  }
  
  @Transactional()
  async cleanupExpiredCodes(): Promise<void> {
    const now = new Date();
    await this.verificationCodesRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now })
      .execute();
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async forceLogoutAllDevices(userId: number): Promise<{ message: string }> {
    try {
      // Force logout user from all devices (blacklist all their tokens)
      await this.redisBlacklistService.forceLogoutUser(userId);
      
      console.log(`User ${userId} force logged out from all devices at ${new Date().toISOString()}`);
      
      return { message: 'Successfully logged out from all devices' };
    } catch (error) {
      console.error('Error during force logout:', error);
      throw AppException.internal(ErrorCode.AUTH_TOKEN_ADD_TO_BLACKLIST_FAILED, 'Failed to logout from all devices');
    }
  }

  /**
   * Generate personalized activity recommendations using ChatGPT
   */
  async generateActivityRecommendations(
    generateRecommendationsDto: GenerateActivityRecommendationsDto
  ): Promise<ActivityRecommendationsResponseDto> {
    try {
      const {
        socialNetworks,
        onboardingQuestionAndAnswers,
        feelingToday,
        count = '5',
        satisfactionLevel,
        hardnessLevel,
      } = generateRecommendationsDto;

      const activityCount = Math.max(1, parseInt(count, 10) || 5);

      const formattedOnboardingAnswers = this.formatOnboardingAnswers(onboardingQuestionAndAnswers);

      const activityTypes = this.activityTypesService.getAllActivityTypes();
      const activityTypeNames = activityTypes.map(type => type.id);

      const patterns = {
        socialNetworks,
        onboardingQuestionAndAnswers: formattedOnboardingAnswers,
        feelingToday,
        activityPreferences: this.extractActivityPreferences(onboardingQuestionAndAnswers),
        satisfactionLevel,
        hardnessLevel,
        timestamp: new Date().toISOString(),
      };
      
      const recommendations = await this.chatGPTService.generateActivityBatch(patterns, activityCount, activityTypeNames);

      return {
        recommendations,
        totalCount: recommendations.length,
      };
    } catch (error) {
      console.error('Error generating activity recommendations:', error);
      throw AppException.internal(
        ErrorCode.SUGGESTED_ACTIVITY_CHATGPT_API_ERROR,
        'Failed to generate activity recommendations',
      );
    }
  }

  private formatOnboardingAnswers(onboardingAnswers: object | undefined): Record<string, string> | undefined {
    if (!onboardingAnswers || typeof onboardingAnswers !== 'object') {
      return undefined;
    }

    const allSteps = this.onboardingQuestionsService.getAllOnboardingQuestions();
    const formatted: Record<string, string> = {};

    Object.entries(onboardingAnswers as Record<string, unknown>).forEach(([stepName, answerId]) => {
      if (!stepName || !answerId) {
        return;
      }

      const step = allSteps.find((s) => s.stepName === stepName);
      if (!step) {
        // If step not found, use raw values
        formatted[stepName] = String(answerId);
        return;
      }

      const answer = step.answers.find((a) => a.id === String(answerId));
      if (answer) {
        // Format: "Question: Answer text (subtitle)"
        formatted[step.stepQuestion] = `${answer.text}${answer.subtitle ? ` (${answer.subtitle})` : ''}`;
      } else {
        // If answer not found, use raw value
        formatted[step.stepQuestion] = String(answerId);
      }
    });

    return Object.keys(formatted).length > 0 ? formatted : undefined;
  }

  private extractActivityPreferences(onboardingAnswers: object | undefined): string[] {
    if (!onboardingAnswers || typeof onboardingAnswers !== 'object') {
      return [];
    }

    const allSteps = this.onboardingQuestionsService.getAllOnboardingQuestions();
    const preferences: string[] = [];

    Object.entries(onboardingAnswers as Record<string, unknown>).forEach(([stepName, answerId]) => {
      if (!stepName || !answerId) {
        return;
      }

      const step = allSteps.find((s) => s.stepName === stepName);
      if (!step) {
        return;
      }

      const answer = step.answers.find((a) => a.id === String(answerId));
      if (answer) {
        preferences.push(answer.text);
        if (answer.subtitle) {
          preferences.push(answer.subtitle);
        }
      }
    });

    return Array.from(new Set(preferences));
  }
}
