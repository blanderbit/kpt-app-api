import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString, Min, Max } from 'class-validator';
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
