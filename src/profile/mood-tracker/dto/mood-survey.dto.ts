import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateMoodSurveyDto {
  @ApiProperty({
    description: 'Survey title',
    example: 'Daily Mood Assessment',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Language code for the mood survey',
    example: 'en',
    required: false,
  })
  @IsOptional()
  @IsString()
  language?: string;
}

export class UpdateMoodSurveyDto {
  @ApiProperty({
    description: 'Survey title',
    required: false,
    example: 'Updated Daily Mood Assessment',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Language code for the mood survey',
    example: 'en',
    required: false,
  })
  @IsOptional()
  @IsString()
  language?: string;
}

export class MoodSurveyResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the mood survey',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Survey title',
    example: 'Daily Mood Assessment',
  })
  title: string;

  @ApiProperty({
    description: 'Language code for the mood survey',
    example: 'en',
    nullable: true,
  })
  language: string | null;

  @ApiProperty({
    description: 'Whether the survey is archived',
    example: false,
  })
  isArchived: boolean;

  @ApiProperty({
    description: 'User who created the survey',
    example: 'admin@example.com',
    nullable: true,
  })
  createdBy: string;

  @ApiProperty({
    description: 'User who last updated the survey',
    example: 'admin@example.com',
    nullable: true,
  })
  updatedBy: string;

  @ApiProperty({
    description: 'Survey creation timestamp',
    example: '2023-12-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Survey last update timestamp',
    example: '2023-12-01T10:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Survey archival timestamp',
    example: '2023-12-01T10:00:00.000Z',
    nullable: true,
  })
  archivedAt: Date | null;

  @ApiProperty({
    description: 'User who archived the survey',
    example: 'admin@example.com',
    nullable: true,
  })
  archivedBy: string | null;

  @ApiProperty({
    description: 'Number of mood tracker responses linked to this survey',
    example: 12,
  })
  responsesCount: number;
}

export class ArchiveMoodSurveyDto {
  @ApiProperty({
    description: 'Reason for archiving the survey',
    required: false,
    example: 'Survey is no longer relevant',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
