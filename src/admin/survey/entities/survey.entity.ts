import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserSurvey } from './user-survey.entity';
import { File } from '../../../common/entities/file.entity';

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'single' | 'multiple';
  options: {
    id: string;
    text: string;
  }[];
}

export enum SurveyStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  AVAILABLE = 'available',
}

@Entity('surveys')
export class Survey {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the survey' })
  id: number;

  @Column({ length: 255 })
  @ApiProperty({ description: 'Survey title' })
  title: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Survey description' })
  description: string;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: 'Survey questions with answer options' })
  questions: SurveyQuestion[] | null;

  @Column({ type: 'enum', enum: SurveyStatus, default: SurveyStatus.AVAILABLE })
  @ApiProperty({ description: 'Survey status', enum: SurveyStatus, default: SurveyStatus.AVAILABLE })
  status: SurveyStatus;

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

  // Связь с завершенными опросниками пользователей
  @OneToMany(() => UserSurvey, (userSurvey) => userSurvey.survey)
  @ApiProperty({ description: 'User survey completions', type: () => [UserSurvey] })
  userSurveys: UserSurvey[];

  @OneToMany(() => File, (file) => file.survey, { cascade: true })
  @ApiProperty({ description: 'Survey files', type: () => [File], required: false })
  files?: File[];
}

