import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../users/entities/user.entity';

// Типы настроения теперь определяются через JSON файл

@Entity('mood_trackers')
export class MoodTracker {
  @ApiProperty({ description: 'Уникальный идентификатор записи настроения' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ 
    description: 'Тип настроения (ID из JSON конфигурации)',
    example: 'good'
  })
  @Column({ type: 'varchar', length: 50 })
  moodType: string;

  @ApiProperty({ description: 'Дата настроения' })
  @Column({ type: 'date' })
  moodDate: Date;

  @ApiProperty({ 
    description: 'Дополнительные заметки о настроении',
    required: false,
    example: 'Сегодня был продуктивный день'
  })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ description: 'Дата создания записи' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления записи' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.moodTrackers)
  @JoinColumn({ name: 'userId' })
  user: User;
}
