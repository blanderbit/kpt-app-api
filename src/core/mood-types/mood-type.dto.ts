import { ApiProperty } from '@nestjs/swagger';

export class MoodTypeDto {
  @ApiProperty({
    description: 'Уникальный идентификатор типа настроения',
    example: 'happy',
  })
  id: string;

  @ApiProperty({
    description: 'Название типа настроения',
    example: 'Счастливый',
  })
  name: string;

  @ApiProperty({
    description: 'Описание типа настроения',
    example: 'Чувствую себя счастливым и довольным',
  })
  description: string;

  @ApiProperty({
    description: 'Эмодзи, представляющий настроение',
    example: '😊',
  })
  emoji: string;

  @ApiProperty({
    description: 'Цвет, ассоциированный с настроением',
    example: '#4CAF50',
  })
  color: string;

  @ApiProperty({
    description: 'Числовая оценка настроения (от -10 до 10)',
    example: 8,
    minimum: -10,
    maximum: 10,
  })
  score: number;

  @ApiProperty({
    description: 'Категория настроения',
    enum: ['positive', 'neutral', 'negative'],
    example: 'positive',
  })
  category: 'positive' | 'neutral' | 'negative';
}
