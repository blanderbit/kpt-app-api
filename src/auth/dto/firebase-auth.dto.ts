import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsObject, ValidateIf, IsNumber, Min, Max } from 'class-validator';
import { CreateActivityDto } from '../../profile/activity/dto/activity.dto';

export enum AuthType {
  LOGIN = 'login',
  REGISTER = 'register'
}

export class FirebaseAuthDto {
  @ApiProperty({
    description: 'Firebase ID token',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiProperty({
    description: 'Type of authentication',
    enum: AuthType,
    example: AuthType.LOGIN,
  })
  @IsEnum(AuthType)
  authType: AuthType;

  // Registration fields (required when authType is 'register')
  @ApiProperty({
    description: 'User age (required for registration)',
    example: '25-30',
    required: false,
  })
  @ValidateIf((o) => o.authType === AuthType.REGISTER)
  @IsString()
  @IsNotEmpty()
  age?: string;

  @ApiProperty({
    description: 'How user feels today (required for registration)',
    example: 'good',
    required: false,
  })
  @ValidateIf((o) => o.authType === AuthType.REGISTER)
  @IsString()
  @IsNotEmpty()
  feelingToday?: string;

  @ApiProperty({
    description: 'Social networks user uses (required for registration)',
    example: ['facebook', 'instagram', 'twitter'],
    required: false,
  })
  @ValidateIf((o) => o.authType === AuthType.REGISTER)
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  socialNetworks?: string[];

  @ApiProperty({
    description: 'Onboarding questions and answers (required for registration)',
    example: { step1: 'more_energy', step2: 'burned_out' },
    required: false,
  })
  @ValidateIf((o) => o.authType === AuthType.REGISTER)
  @IsObject()
  @IsNotEmpty()
  onboardingQuestionAndAnswers?: object;

  @ApiProperty({
    description: 'Initial activities for the user (required for registration)',
    type: [CreateActivityDto],
    required: false,
  })
  @ValidateIf((o) => o.authType === AuthType.REGISTER)
  @IsArray()
  @IsNotEmpty()
  activities?: CreateActivityDto[];

  @ApiProperty({
    description: 'How user usually tracks tasks and goals (required for registration)',
    example: 'I use a combination of apps and paper notes',
    required: false,
  })
  @ValidateIf((o) => o.authType === AuthType.REGISTER)
  @IsString()
  @IsNotEmpty()
  taskTrackingMethod?: string;

  @ApiProperty({
    description: 'Initial satisfaction level (0-100)',
    example: 70,
    required: false,
  })
  @ValidateIf((o) => o.authType === AuthType.REGISTER)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  initSatisfactionLevel?: number;

  @ApiProperty({
    description: 'Initial hardness level (0-100)',
    example: 30,
    required: false,
  })
  @ValidateIf((o) => o.authType === AuthType.REGISTER)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  initHardnessLevel?: number;

  @ApiProperty({
    description: 'RevenueCat app user identifier',
    required: false,
  })
  @IsOptional()
  @IsString()
  appUserId?: string;
}

export class FirebaseAuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'number', description: 'User ID' },
      email: { type: 'string', description: 'User email' },
      firstName: { type: 'string', description: 'User first name', nullable: true },
      avatarUrl: { type: 'string', description: 'User avatar URL', nullable: true },
      firebaseUid: { type: 'string', description: 'Firebase user ID' }
    }
  })
  user: {
    id: number;
    email: string;
    firstName?: string;
    avatarUrl?: string;
    firebaseUid: string;
  };
}
