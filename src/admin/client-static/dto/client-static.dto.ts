import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsArray, IsNumber, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ClientStaticFilterDto {
  @ApiProperty({
    description: 'Start date (YYYY-MM-DD)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: 'End date (YYYY-MM-DD)',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({
    description: 'Registration method: firebase or email',
    example: 'firebase',
    enum: ['firebase', 'email'],
    required: false,
  })
  @IsOptional()
  @IsString()
  registrationMethod?: 'firebase' | 'email';

  @ApiProperty({
    description: 'User age range',
    example: '25-30',
    required: false,
  })
  @IsOptional()
  @IsString()
  age?: string;

  @ApiProperty({
    description: 'Social networks (array)',
    example: ['facebook', 'instagram'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === 'string' && item.trim().length > 0);
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      return [value];
    }

    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  socialNetworks?: string[];

  @ApiProperty({
    description: 'Application theme',
    example: 'light',
    required: false,
  })
  @IsOptional()
  @IsString()
  theme?: string;
}

export class MoodTrackerFilterDto extends ClientStaticFilterDto {
  @ApiProperty({
    description: 'Number of days to track',
    example: 7,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  days?: number;

  @ApiProperty({
    description: 'Mood type',
    example: 'good',
    required: false,
  })
  @IsOptional()
  @IsString()
  moodType?: string;
}

export class ClientStaticCountResponseDto {
  @ApiProperty({
    description: 'Count of users',
    example: 150,
  })
  count: number;
}

