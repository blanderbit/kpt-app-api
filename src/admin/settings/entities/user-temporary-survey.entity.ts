import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../users/entities/user.entity';
import { Survey } from '../../survey/entities/survey.entity';

@Entity('user_temporary_surveys')
export class UserTemporarySurvey {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier' })
  id: number;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'Expiration date for this temporary survey', required: false })
  expiresAt: Date | null;

  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Survey, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'surveyId' })
  survey: Survey;

  // Relation IDs for indexing
  @RelationId((entity: UserTemporarySurvey) => entity.user)
  userId: number;

  @RelationId((entity: UserTemporarySurvey) => entity.survey)
  surveyId: number;
}

