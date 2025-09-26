import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsNumber, IsArray } from 'class-validator';

export class CreateMoodTrackerDto {
  @ApiProperty({
    description: 'Тип настроения (ID из JSON конфигурации)',
    example: 'good',
  })
  @IsString()
  moodType: string;

  @ApiProperty({
    description: 'Дополнительные заметки о настроении',
    required: false,
    example: 'Сегодня был продуктивный день',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    description: 'ID опросников настроения',
    required: false,
    example: [1, 2, 3],
    type: [Number]
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  moodSurveyIds?: number[];
}

export class UpdateMoodTrackerDto {
  @ApiProperty({
    description: 'Тип настроения (ID из JSON конфигурации)',
    example: 'excellent',
    required: false,
  })
  @IsOptional()
  @IsString()
  moodType?: string;

  @ApiProperty({
    description: 'Дополнительные заметки о настроении',
    required: false,
    example: 'Обновил заметки о настроении',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    description: 'ID опросников настроения',
    required: false,
    example: [1, 2, 3],
    type: [Number]
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  moodSurveyIds?: number[];
}

export class MoodTrackerResponseDto {
  @ApiProperty({
    description: 'Уникальный идентификатор записи настроения',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Тип настроения (ID из JSON конфигурации)',
    example: 'good',
  })
  moodType: string;

  @ApiProperty({
    description: 'Детали типа настроения',
    example: {
      id: 'good',
      name: 'Хорошо',
      description: 'Хорошее настроение',
      emoji: '🙂',
      color: '#CDDC39',
      score: 8,
      category: 'positive'
    },
    nullable: true,
  })
  moodTypeDetails: any | null;

  @ApiProperty({
    description: 'Дополнительные заметки о настроении',
    example: 'Сегодня был продуктивный день',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Дата настроения',
    example: '2024-01-01',
  })
  moodDate: Date;

  @ApiProperty({
    description: 'Связанные опросники настроения',
    type: 'array',
    items: { type: 'object' },
    example: [
      { id: 1, title: 'Опросник настроения 1', isArchived: false },
      { id: 2, title: 'Опросник настроения 2', isArchived: false }
    ],
    nullable: true,
  })
  moodSurveys: any[] | null;

  @ApiProperty({
    description: 'Дата создания записи',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата обновления записи',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class MoodTrackerStatsDto {
  @ApiProperty({
    description: 'Общее количество записей настроения',
    example: 30,
  })
  totalEntries: number;

  @ApiProperty({
    description: 'Самый частый тип настроения',
    example: 'good',
  })
  mostFrequentMood: string;

  @ApiProperty({
    description: 'Количество записей за последние 7 дней',
    example: 7,
  })
  lastWeekEntries: number;

  @ApiProperty({
    description: 'Количество записей за последние 30 дней',
    example: 25,
  })
  lastMonthEntries: number;

  @ApiProperty({
    description: 'Среднее настроение за последние 7 дней',
    example: 'good',
  })
  averageMoodLastWeek: string;

  @ApiProperty({
    description: 'Среднее настроение за последние 30 дней',
    example: 'normal',
  })
  averageMoodLastMonth: string;
}
