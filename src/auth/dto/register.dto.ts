import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsArray, IsObject, IsNumber, Min, Max } from 'class-validator';
import { CreateActivityDto } from '../../profile/activity/dto/activity.dto';

export class RegisterDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'User age',
    example: '25-30',
    required: false,
  })
  @IsOptional()
  @IsString()
  age?: string;

  @ApiProperty({
    description: 'How user feels today',
    example: 'good',
    required: false,
  })
  @IsOptional()
  @IsString()
  feelingToday?: string;

  @ApiProperty({
    description: 'Social networks user uses',
    example: ['facebook', 'instagram', 'twitter'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  socialNetworks?: string[];

  @ApiProperty({
    description: 'Onboarding questions and answers',
    example: { step1: 'more_energy', step2: 'burned_out' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  onboardingQuestionAndAnswers?: object;

  @ApiProperty({
    description: 'Initial activities for the user',
    type: [CreateActivityDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  activities?: CreateActivityDto[];

  @ApiProperty({
    description: 'How user usually tracks tasks and goals',
    example: 'I use a combination of apps and paper notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  taskTrackingMethod?: string;

  @ApiProperty({
    description: 'Initial satisfaction level (0-100)',
    example: 70,
    required: false,
  })
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
