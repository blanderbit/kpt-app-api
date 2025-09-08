import { ApiProperty } from '@nestjs/swagger';

export class QueueStatsDto {
  @ApiProperty({ description: 'Number of waiting jobs' })
  waiting: number;

  @ApiProperty({ description: 'Number of active jobs' })
  active: number;

  @ApiProperty({ description: 'Number of completed jobs' })
  completed: number;

  @ApiProperty({ description: 'Number of failed jobs' })
  failed: number;

  @ApiProperty({ description: 'Total number of jobs' })
  total: number;
}

export class QueueStatusDto {
  @ApiProperty({ description: 'Queue status', enum: ['active', 'idle', 'error'] })
  status: string;

  @ApiProperty({ description: 'Status retrieval timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'Queue statistics' })
  stats: QueueStatsDto;

  @ApiProperty({ description: 'Error (if any)', required: false })
  error?: string;
}

export class QueueActionResponseDto {
  @ApiProperty({ description: 'Operation result message' })
  message: string;

  @ApiProperty({ description: 'Queue status after operation' })
  status: string;
}

export class QueueClearResponseDto {
  @ApiProperty({ description: 'Operation result message' })
  message: string;
}
