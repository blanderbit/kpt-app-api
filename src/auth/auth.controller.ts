import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TemporaryItemsQueueService } from '../admin/settings/queue/temporary-items-queue.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { FirebaseAuthDto, FirebaseAuthResponseDto } from './dto/firebase-auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GenerateActivityRecommendationsDto, ActivityRecommendationsResponseDto } from './dto/generate-activity-recommendations.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { BlacklistGuard } from './guards/blacklist.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly temporaryItemsQueueService: TemporaryItemsQueueService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Регистрация пользователя',
    description: 'Создает нового пользователя и отправляет email для подтверждения',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Регистрация успешна. Проверьте email для подтверждения.',
        },
        userId: {
          type: 'number',
          description: 'ID созданного пользователя (для вызова Purchases.logIn(userId) в RevenueCat)',
          example: 233,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные или пользователь уже существует',
  })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    // Queue temporary items after TX commit (no delay needed)
    try {
      await this.temporaryItemsQueueService.addGenerateTemporaryArticlesJob(result.userId, 0);
      await this.temporaryItemsQueueService.addGenerateTemporarySurveysJob(result.userId, 0);
      this.logger.log(`Queued temporary items for new user ${result.userId} (after register)`);
    } catch (error) {
      this.logger.warn(`Failed to queue temporary items for new user ${result.userId}: ${error?.message ?? error}`);
    }
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Вход в систему',
    description: 'Аутентификация пользователя по email и паролю',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Успешный вход',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            firstName: { type: 'string', example: 'Иван' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Неверные учетные данные или email не подтвержден',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('firebase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Аутентификация через Firebase',
    description: 'Аутентификация пользователя через Firebase ID токен (Google/Apple OAuth)',
  })
  @ApiBody({ type: FirebaseAuthDto })
  @ApiResponse({
    status: 200,
    description: 'Успешная аутентификация через Firebase',
    type: FirebaseAuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Недействительный Firebase токен',
  })
  async authenticateWithFirebase(@Body() firebaseAuthDto: FirebaseAuthDto) {
    const result = await this.authService.authenticateWithFirebase(firebaseAuthDto);
    // Queue temporary items for new user after TX commit (no delay needed)
    if (result.isNewUser && result.user?.id) {
      try {
        await this.temporaryItemsQueueService.addGenerateTemporaryArticlesJob(result.user.id, 0);
        await this.temporaryItemsQueueService.addGenerateTemporarySurveysJob(result.user.id, 0);
        this.logger.log(`Queued temporary items for new Firebase user ${result.user.id} (after authenticateWithFirebase)`);
      } catch (error) {
        this.logger.warn(`Failed to queue temporary items for new Firebase user ${result.user.id}: ${error?.message ?? error}`);
      }
    }
    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Запрос восстановления пароля',
    description: 'Отправляет email для сброса пароля',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Email отправлен (если пользователь существует)',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Если пользователь с таким email существует, вы получите письмо для сброса пароля',
        },
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Сброс пароля',
    description: 'Изменяет пароль по токену из email',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Пароль успешно изменен',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Пароль успешно изменен',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Недействительный или истекший токен',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }


  @Post('refresh')
  @ApiOperation({
    summary: 'Обновление токенов',
    description: 'Обновляет пару access и refresh токенов используя refresh token',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Токены успешно обновлены. Старые токены добавлены в blacklist.',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Недействительный refresh token',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken, refreshTokenDto.accessToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, BlacklistGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Выход из системы',
    description: 'Выход пользователя из системы',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный выход',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Успешный выход из системы',
        },
      },
    },
  })
  async logout(@Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub;
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(userId, token);
  }

  @Post('generate-activity-recommendations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate personalized activity recommendations using ChatGPT',
    description: 'Generates personalized activity recommendations with categories, confidence scores, and reasoning based on user data',
  })
  @ApiBody({ type: GenerateActivityRecommendationsDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated activity recommendations',
    type: ActivityRecommendationsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 500,
    description: 'Error generating recommendations with ChatGPT',
  })
  async generateActivityRecommendations(@Body() generateRecommendationsDto: GenerateActivityRecommendationsDto): Promise<ActivityRecommendationsResponseDto> {
    return this.authService.generateActivityRecommendations(generateRecommendationsDto);
  }
}
