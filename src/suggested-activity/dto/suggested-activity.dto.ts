import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSuggestedActivityDto {
  @ApiProperty({ description: 'Suggested activity name' })
  @IsString()
  @IsNotEmpty()
  activityName: string;

  @ApiProperty({ description: 'Activity type' })
  @IsString()
  @IsNotEmpty()
  activityType: string;

  @ApiProperty({ description: 'Activity description' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Recommendation reasoning', required: false })
  @IsString()
  @IsOptional()
  reasoning?: string;

  @ApiProperty({ description: 'Confidence score for recommendation (0-100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  confidenceScore: number;

  @ApiProperty({ description: 'Date for which activity is suggested' })
  @IsDateString()
  suggestedDate: string;
}

export class SuggestedActivityResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  activityName: string;

  @ApiProperty()
  activityType: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ required: false })
  reasoning?: string;

  @ApiProperty()
  confidenceScore: number;

  @ApiProperty()
  isUsed: boolean;

  @ApiProperty()
  suggestedDate: Date;

  @ApiProperty({ required: false })
  usedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AddSuggestedActivityToActivitiesDto {
  @ApiProperty({ description: 'Suggested activity ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RefreshSuggestedActivitiesDto {
  @ApiProperty({ description: 'Date for refreshing recommendations (YYYY-MM-DD)', required: false })
  @IsDateString()
  @IsOptional()
  date?: string;
}

export class GenerateFromQuizDto {
  @ApiProperty({ description: 'Hardness/difficulty level (0-100)', example: 50, minimum: 0, maximum: 100 })
  @IsInt({ message: 'hardness must be an integer between 0 and 100' })
  @Min(0, { message: 'hardness must be between 0 and 100' })
  @Max(100, { message: 'hardness must be between 0 and 100' })
  hardness: number;

  @ApiProperty({ description: 'Satisfaction level (0-100)', example: 70, minimum: 0, maximum: 100 })
  @IsInt({ message: 'satisfaction must be an integer between 0 and 100' })
  @Min(0, { message: 'satisfaction must be between 0 and 100' })
  @Max(100, { message: 'satisfaction must be between 0 and 100' })
  satisfaction: number;

  @ApiProperty({ description: 'Number of suggested activities to generate (1-20)', example: 5, minimum: 1, maximum: 20 })
  @IsInt({ message: 'suggestedActivityCount must be an integer between 1 and 20' })
  @Min(1, { message: 'suggestedActivityCount must be between 1 and 20' })
  @Max(20, { message: 'suggestedActivityCount must be between 1 and 20' })
  suggestedActivityCount: number;
}
