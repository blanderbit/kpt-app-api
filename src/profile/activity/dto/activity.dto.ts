import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

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

  @ApiProperty({
    description: 'Whether activity is public',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
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

  @ApiProperty({
    description: 'Whether activity is public',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
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

  @ApiProperty({
    description: 'Publicity filter',
    required: false,
    example: true,
  })
  isPublic?: boolean;
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
    description: 'Whether activity is public',
    example: false,
  })
  isPublic: boolean;

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
