import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray } from 'class-validator';

export class ActivityTypeDto {
  @ApiProperty({
    description: 'Unique identifier for the activity type',
    example: 'reading',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Display name of the activity type',
    example: 'Чтение',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the activity type',
    example: 'Чтение книг, статей, новостей',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Keywords associated with the activity type',
    example: ['книги', 'чтение', 'обучение'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @ApiProperty({
    description: 'Category of the activity type',
    example: 'education',
  })
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Icon representing the activity type',
    example: '📚',
  })
  @IsString()
  icon: string;

  @ApiProperty({
    description: 'Color associated with the activity type (hex code)',
    example: '#2196F3',
  })
  @IsString()
  color: string;
}
