import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsInt, Min, Max, Validate } from 'class-validator';
import { TotalEqualsHundredConstraint } from './rate-activity.dto';

export class CreateActivityDto {
  @ApiProperty({
    description: 'Activity name',
    example: 'Morning run',
  })
  @IsString()
  activityName: string;

  @ApiProperty({
    description: 'Activity content as string',
    required: false,
    example: 'Ran 5km in 30 minutes',
  })
  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdateActivityDto {
  @ApiProperty({
    description: 'Activity name',
    required: false,
    example: 'Evening run',
  })
  @IsOptional()
  @IsString()
  activityName?: string;

  @ApiProperty({
    description: 'Activity content as string',
    required: false,
    example: 'Evening run, 7km in 45 minutes',
  })
  @IsOptional()
  @IsString()
  content?: string;
}

export class ActivityFilterDto {
  @ApiProperty({
    description: 'Page number',
    required: false,
    example: 1,
  })
  page?: number;

  @ApiProperty({
    description: 'Number of activities per page',
    required: false,
    example: 10,
  })
  limit?: number;

  @ApiProperty({
    description: 'Status filter',
    required: false,
    enum: ['active', 'closed'],
    example: 'active',
  })
  status?: 'active' | 'closed';

}

export class ActivityResponseDto {
  @ApiProperty({
    description: 'Unique activity identifier',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: 'Activity name',
    example: 'Morning run',
  })
  activityName: string;

  @ApiProperty({
    description: 'Activity type (determined by AI)',
    example: 'fitness',
  })
  activityType: string;

  @ApiProperty({
    description: 'Activity content as string',
    example: 'Ran 5km in 30 minutes',
    nullable: true,
  })
  content: string;

  @ApiProperty({
    description: 'Activity position for ordering',
    example: 1,
  })
  position: number;


  @ApiProperty({
    description: 'Activity status',
    enum: ['active', 'closed'],
    example: 'active',
  })
  status: 'active' | 'closed';

  @ApiProperty({
    description: 'Activity closing date',
    example: '2024-01-01T00:00:00.000Z',
    nullable: true,
  })
  closedAt: Date | null;

  @ApiProperty({
    description: 'Activity archival date',
    example: '2024-01-01T00:00:00.000Z',
    nullable: true,
  })
  archivedAt: Date | null;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Rating activities',
    type: 'array',
    example: [],
  })
  rateActivities: any[];
}

export class ChangePositionDto {
  @ApiProperty({
    description: 'New position for the activity',
    example: 1,
  })
  @IsNumber()
  position: number;
}

export class CloseActivityDto {
  @ApiProperty({
    description: 'Satisfaction level (0-100)',
    example: 70,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @Validate(TotalEqualsHundredConstraint)
  satisfactionLevel: number;

  @ApiProperty({
    description: 'Difficulty level (0-100)',
    example: 30,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  hardnessLevel: number;
}
