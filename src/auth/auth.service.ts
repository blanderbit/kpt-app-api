import { Injectable } from '@nestjs/common';
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
import { ErrorCode } from '../common/error-codes';
import { AppException } from '../common/exceptions/app.exception';
import { GenerateActivityRecommendationsDto, ActivityRecommendationsResponseDto, ActivityRecommendationDto } from './dto/generate-activity-recommendations.dto';

@Injectable()
export class AuthService {
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
  ) {}

  @Transactional()
  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { 
      email, 
      password, 
      firstName, 
      age, 
      feelingToday, 
      socialNetworks, 
      onboardingQuestionAndAnswers, 
      activities, 
      taskTrackingMethod 
    } = registerDto;

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
    const user = this.usersRepository.create(userData);
    await this.usersRepository.save(user);

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

    return { message: 'Registration successful. You can now send verification email when needed.' };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> {
    const { email, password } = loginDto;

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
  async authenticateWithFirebase(firebaseAuthDto: FirebaseAuthDto): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> {
    try {
      // Verify Firebase ID token
      const decodedToken = await this.firebaseService.verifyIdToken(firebaseAuthDto.idToken);
      
      // Get user information from Firebase
      const firebaseUser = await this.firebaseService.getUserByUid(decodedToken.uid);
      
      // Find user in our database
      let user = await this.usersRepository.findOne({ 
        where: { email: decodedToken.email } 
      });
      
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
        user = Array.isArray(savedUser) ? savedUser[0] : savedUser;

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
      }
      
      // Ensure user exists (should not be null at this point)
      if (!user) {
        throw AppException.internal(ErrorCode.AUTH_FIREBASE_AUTH_FAILED, 'User creation failed');
      }
      
      // Generate JWT tokens
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
        age, 
        taskTrackingMethod,
        count = '5'
      } = generateRecommendationsDto;

      const activityCount = parseInt(count, 10) || 5;

      // Create comprehensive patterns object for ChatGPT
      const patterns = {
        socialNetworks,
        onboardingQuestionAndAnswers,
        feelingToday,
        age: age || 'not specified',
        taskTrackingMethod: taskTrackingMethod || 'not specified',
        timestamp: new Date().toISOString(),
        preferences: {
          energyLevel: this.determineEnergyLevel(feelingToday),
          socialActivity: this.determineSocialActivity(socialNetworks),
          productivityStyle: this.determineProductivityStyle(taskTrackingMethod || '')
        }
      };

      // Generate activity recommendations using ChatGPT
      const recommendations: ActivityRecommendationDto[] = [];
      
      for (let i = 0; i < activityCount; i++) {
        try {
          const activityContent = await this.chatGPTService.generateActivityContent(
            'recommendation',
            patterns,
            i
          );

          // Generate reasoning for this specific recommendation
          const reasoning = await this.chatGPTService.generateReasoning(
            { ...patterns, activityIndex: i, activityName: activityContent.activityName },
            'recommendation',
            0.8
          );

          // Determine category based on activity content
          const category = this.categorizeActivity(activityContent.activityName, activityContent.content);

          // Calculate confidence score based on various factors
          const confidenceScore = this.calculateConfidenceScore(patterns, activityContent);

          recommendations.push({
            activityName: activityContent.activityName,
            content: activityContent.content,
            category,
            confidenceScore,
            reasoning: reasoning || 'This activity is recommended based on your preferences and current state.'
          });
        } catch (error) {
          console.error(`Error generating recommendation ${i}:`, error);
          // Continue with other recommendations even if one fails
        }
      }

      // Generate overall reasoning for all recommendations
      let overallReasoning = 'These activities are tailored to your preferences and current state of mind.';
      try {
        overallReasoning = await this.chatGPTService.generateReasoning(
          { ...patterns, recommendations: recommendations.map(r => r.activityName) },
          'overall_recommendation',
          0.9
        );
      } catch (error) {
        console.error('Error generating overall reasoning:', error);
        // Use default reasoning if ChatGPT fails
      }

      return {
        recommendations,
        overallReasoning,
        totalCount: recommendations.length
      };
    } catch (error) {
      console.error('Error generating activity recommendations:', error);
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_CHATGPT_API_ERROR, 'Failed to generate activity recommendations');
    }
  }

  /**
   * Determine energy level based on feeling
   */
  private determineEnergyLevel(feelingToday: string): string {
    const lowEnergyFeelings = ['tired', 'exhausted', 'burned_out', 'drained'];
    const highEnergyFeelings = ['energetic', 'excited', 'motivated', 'pumped'];
    
    if (lowEnergyFeelings.some(feeling => feelingToday.toLowerCase().includes(feeling))) {
      return 'low';
    } else if (highEnergyFeelings.some(feeling => feelingToday.toLowerCase().includes(feeling))) {
      return 'high';
    }
    return 'medium';
  }

  /**
   * Determine social activity preference based on social networks
   */
  private determineSocialActivity(socialNetworks: string[]): string {
    const professionalNetworks = ['linkedin', 'github', 'stackoverflow'];
    const socialPlatforms = ['facebook', 'instagram', 'twitter', 'tiktok', 'snapchat'];
    
    const hasProfessional = socialNetworks.some(network => 
      professionalNetworks.some(prof => network.toLowerCase().includes(prof))
    );
    const hasSocial = socialNetworks.some(network => 
      socialPlatforms.some(soc => network.toLowerCase().includes(soc))
    );

    if (hasProfessional && hasSocial) return 'mixed';
    if (hasProfessional) return 'professional';
    if (hasSocial) return 'social';
    return 'minimal';
  }

  /**
   * Determine productivity style based on task tracking method
   */
  private determineProductivityStyle(taskTrackingMethod: string): string {
    if (!taskTrackingMethod) return 'flexible';
    
    const method = taskTrackingMethod.toLowerCase();
    if (method.includes('app') || method.includes('digital')) return 'digital';
    if (method.includes('paper') || method.includes('notebook')) return 'analog';
    if (method.includes('both') || method.includes('mix')) return 'hybrid';
    return 'flexible';
  }

  /**
   * Categorize activity based on name and content
   */
  private categorizeActivity(activityName: string, content: string): string {
    const text = `${activityName} ${content}`.toLowerCase();
    
    if (text.includes('meditation') || text.includes('mindfulness') || text.includes('breathing')) {
      return 'wellness';
    } else if (text.includes('exercise') || text.includes('workout') || text.includes('fitness')) {
      return 'fitness';
    } else if (text.includes('read') || text.includes('learn') || text.includes('study')) {
      return 'learning';
    } else if (text.includes('social') || text.includes('meet') || text.includes('connect')) {
      return 'social';
    } else if (text.includes('work') || text.includes('project') || text.includes('task')) {
      return 'productivity';
    } else if (text.includes('creative') || text.includes('art') || text.includes('music')) {
      return 'creative';
    }
    
    return 'general';
  }

  /**
   * Calculate confidence score for recommendation
   */
  private calculateConfidenceScore(patterns: any, activityContent: { activityName: string; content: string }): number {
    let score = 0.5; // Base score
    
    // Increase score based on feeling match
    if (patterns.feelingToday && activityContent.content.toLowerCase().includes(patterns.feelingToday.toLowerCase())) {
      score += 0.2;
    }
    
    // Increase score based on social network alignment
    if (patterns.socialNetworks && patterns.socialNetworks.length > 0) {
      score += 0.1;
    }
    
    // Increase score based on onboarding answers
    if (patterns.onboardingQuestionAndAnswers && Object.keys(patterns.onboardingQuestionAndAnswers).length > 0) {
      score += 0.1;
    }
    
    // Increase score based on age appropriateness
    if (patterns.age && patterns.age !== 'not specified') {
      score += 0.1;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }
}
