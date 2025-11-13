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
import { Survey } from './survey.entity';

@Entity('user_surveys')
export class UserSurvey {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the user survey record' })
  id: number;

  @Column()
  @ApiProperty({ description: 'User ID' })
  userId: number;

  @Column()
  @ApiProperty({ description: 'Survey ID' })
  surveyId: number;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: 'User answers to the survey', required: false })
  answers: object | null;

  @CreateDateColumn()
  @ApiProperty({ description: 'Record creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Record last update timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Survey, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'surveyId' })
  survey: Survey;
}

