import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsObject, IsNotEmpty, IsOptional, IsNumberString, IsNumber, Min, Max } from 'class-validator';

export class GenerateActivityRecommendationsDto {
  @ApiProperty({
    description: 'Social networks used by user',
    example: ['facebook', 'instagram', 'twitter'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  socialNetworks: string[];

  @ApiProperty({
    description: 'Onboarding questions and answers',
    example: { step1: 'more_energy', step2: 'burned_out' },
  })
  @IsObject()
  @IsNotEmpty()
  onboardingQuestionAndAnswers: object;

  @ApiProperty({
    description: 'How user feels today',
    example: 'good',
  })
  @IsString()
  @IsNotEmpty()
  feelingToday: string;

  @ApiProperty({
    description: 'Number of recommendations to generate',
    example: '3',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  count?: string;

  @ApiProperty({
    description: 'Satisfaction level (0-100)',
    example: 70,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  satisfactionLevel?: number;

  @ApiProperty({
    description: 'Hardness level (0-100)',
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  hardnessLevel?: number;
}

export class ActivityRecommendationDto {
  @ApiProperty({
    description: 'Name of the recommended activity',
    example: 'Morning Meditation',
  })
  activityName: string;

  @ApiProperty({
    description: 'Description of the activity',
    example: 'Start your day with 10 minutes of meditation to boost energy and focus.',
  })
  content: string;

  @ApiProperty({
    description: 'Activity type that best matches this activity',
    example: 'meditation',
    required: false,
  })
  @IsOptional()
  activityType?: string;
}

export class ActivityRecommendationsResponseDto {
  @ApiProperty({
    description: 'List of activity recommendations',
    type: [ActivityRecommendationDto],
  })
  recommendations: ActivityRecommendationDto[];

  @ApiProperty({
    description: 'Total number of recommendations generated',
    example: 5,
  })
  totalCount: number;
}
