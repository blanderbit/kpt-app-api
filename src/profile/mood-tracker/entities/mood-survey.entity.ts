import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { MoodTracker } from './mood-tracker.entity';
import { Expose } from 'class-transformer';

@Entity('mood_surveys')
export class MoodSurvey {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the mood survey' })
  id: number;

  @Column({ length: 255 })
  @ApiProperty({ description: 'Survey title' })
  title: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  @ApiProperty({ description: 'Language code for the mood survey', example: 'en' })
  language: string | null;

  @Column({ default: false })
  @ApiProperty({ description: 'Whether the survey is archived' })
  isArchived: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: 'User who created the survey', required: false })
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: 'User who last updated the survey', required: false })
  updatedBy: string;

  @CreateDateColumn()
  @ApiProperty({ description: 'Survey creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Survey last update timestamp' })
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'Survey archival timestamp', required: false })
  archivedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: 'User who archived the survey', required: false })
  archivedBy: string | null;

  // Связь с записями настроения
  @ManyToMany(() => MoodTracker, (moodTracker) => moodTracker.moodSurveys)
  @ApiProperty({ description: 'Mood tracker entries using this survey', type: () => [MoodTracker] })
  moodTrackers: MoodTracker[];

  @Expose() 
  responsesCount?: number;
}
