import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueueInfoDto {
  @ApiProperty({ description: 'Queue name' })
  name: string;

  @ApiProperty({ description: 'Number of waiting jobs' })
  waiting: number;

  @ApiProperty({ description: 'Number of active jobs' })
  active: number;

  @ApiProperty({ description: 'Number of completed jobs' })
  completed: number;

  @ApiProperty({ description: 'Number of failed jobs' })
  failed: number;

  @ApiProperty({ description: 'Number of delayed jobs' })
  delayed: number;

  @ApiProperty({ description: 'Is queue paused' })
  paused: boolean;

  @ApiProperty({ description: 'Has error loading stats' })
  hasError: boolean;

  @ApiProperty({ description: 'Error message if hasError is true', required: false })
  errorMessage?: string;
}

export class QueueListResponseDto {
  @ApiProperty({ type: [QueueInfoDto], description: 'List of queues' })
  queues: QueueInfoDto[];

  @ApiProperty({ description: 'Total number of queues' })
  total: number;
}

export class GetQueuesQueryDto {
  @ApiProperty({ 
    description: 'Page number', 
    required: false, 
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Items per page', 
    required: false, 
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class QueueStatsExtendedDto {
  @ApiProperty({ description: 'Number of waiting jobs' })
  waiting: number;

  @ApiProperty({ description: 'Number of active jobs' })
  active: number;

  @ApiProperty({ description: 'Number of completed jobs' })
  completed: number;

  @ApiProperty({ description: 'Number of failed jobs' })
  failed: number;

  @ApiProperty({ description: 'Number of delayed jobs' })
  delayed: number;

  @ApiProperty({ description: 'Total number of jobs' })
  total: number;

  @ApiProperty({ description: 'Is queue paused' })
  isPaused: boolean;
}

export class ClearJobsResponseDto {
  @ApiProperty({ description: 'Number of jobs cleared' })
  cleared: number;
}

