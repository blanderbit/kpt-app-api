import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsObject, IsNotEmpty, IsOptional, IsNumberString } from 'class-validator';

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
    description: 'User age',
    example: '25-30',
    required: false,
  })
  @IsOptional()
  @IsString()
  age?: string;

  @ApiProperty({
    description: 'How user usually tracks tasks and goals',
    example: 'I use apps and paper notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  taskTrackingMethod?: string;

  @ApiProperty({
    description: 'Number of recommendations to generate',
    example: '5',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  count?: string;
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
    description: 'Confidence score for this recommendation (0-1)',
    example: 0.85,
  })
  confidenceScore: number;

  @ApiProperty({
    description: 'Reasoning for this specific recommendation',
    example: 'Based on your preference for energy-boosting activities and current mood, this meditation practice is recommended.',
  })
  reasoning: string;
}

export class ActivityRecommendationsResponseDto {
  @ApiProperty({
    description: 'List of activity recommendations',
    type: [ActivityRecommendationDto],
  })
  recommendations: ActivityRecommendationDto[];

  @ApiProperty({
    description: 'Overall reasoning for all recommendations',
    example: 'These activities are tailored to your preferences and current state of mind.',
  })
  overallReasoning: string;

  @ApiProperty({
    description: 'Total number of recommendations generated',
    example: 5,
  })
  totalCount: number;
}
