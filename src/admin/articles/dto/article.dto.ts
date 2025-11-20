import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { ArticleStatus } from '../entities/article.entity';

export class FileDto {
  @ApiProperty({ description: 'File ID' })
  id: number;

  @ApiProperty({ description: 'File URL' })
  fileUrl: string;

  @ApiProperty({ description: 'File key in storage' })
  fileKey: string;

  @ApiProperty({ description: 'File name' })
  fileName: string;

  @ApiProperty({ description: 'File MIME type' })
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;
}

export class CreateArticleDto {
  @ApiProperty({
    description: 'Article title',
    example: 'How to Improve Your Mental Health',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Article text content',
    example: 'Mental health is an important aspect of overall well-being...',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Language code for the article',
    example: 'en',
  })
  @IsString()
  @IsNotEmpty()
  language: string;
}

export class UpdateArticleDto {
  @ApiProperty({
    description: 'Article title',
    example: 'Updated Article Title',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Article text content',
    example: 'Updated content...',
    required: false,
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiProperty({
    description: 'Identifier of an attached file to remove',
    required: false,
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  @IsNumber()
  removeFileId?: number;
}

export class ArticleResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the article',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Article title',
    example: 'How to Improve Your Mental Health',
  })
  title: string;

  @ApiProperty({
    description: 'Article text content',
    example: 'Mental health is an important aspect of overall well-being...',
  })
  text: string;

  @ApiProperty({
    description: 'Article status',
    enum: ArticleStatus,
    example: ArticleStatus.AVAILABLE,
  })
  status: ArticleStatus;

  @ApiProperty({
    description: 'Associated files',
    type: [FileDto],
    required: false,
  })
  files?: FileDto[];

  @ApiProperty({
    description: 'Article creation timestamp',
    example: '2023-12-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User who last updated the article',
    example: 'admin@example.com',
    nullable: true,
  })
  updatedBy: string;

  @ApiProperty({
    description: 'Article last update timestamp',
    example: '2023-12-01T10:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Article archival timestamp',
    example: '2024-01-15T10:00:00.000Z',
    nullable: true,
  })
  archivedAt: Date | null;

  @ApiProperty({
    description: 'User who archived the article',
    example: 'admin@example.com',
    nullable: true,
  })
  archivedBy: string | null;

  @ApiProperty({
    description: 'Whether the article is hidden for the current user',
    example: false,
    required: false,
  })
  isHidden?: boolean;
}

export class ArticleStatisticsDto {
  @ApiProperty({ description: 'Total users currently assigned to the article' })
  assignedUsers: number;

  @ApiProperty({ description: 'Total users who have hidden the article' })
  hiddenUsers: number;
}

export class UserArticlesAnalyticsDto {
  @ApiProperty({ description: 'Total articles currently assigned to the user' })
  assignedArticles: number;

  @ApiProperty({ description: 'Total articles hidden by the user' })
  hiddenArticles: number;
}

