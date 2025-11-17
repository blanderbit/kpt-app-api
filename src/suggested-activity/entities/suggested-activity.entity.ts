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
import { User } from '../../users/entities/user.entity';

@Entity('suggested_activities')
export class SuggestedActivity {
  @ApiProperty({ description: 'Unique identifier for the suggested activity' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User ID who owns this suggested activity' })
  @Column()
  userId: number;

  @ApiProperty({ description: 'Name of the suggested activity' })
  @Column()
  activityName: string;

  @ApiProperty({ description: 'Type of the suggested activity' })
  @Column()
  activityType: string;

  @ApiProperty({ description: 'Detailed description of the suggested activity' })
  @Column('text')
  content: string;

  @ApiProperty({ description: 'AI reasoning for why this activity was suggested', required: false })
  @Column('text', { nullable: true })
  reasoning: string;

  @ApiProperty({ description: 'Confidence score for the recommendation (0-100)', minimum: 0, maximum: 100 })
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  confidenceScore: number;

  @ApiProperty({ description: 'Whether this suggested activity has been used by the user' })
  @Column('boolean', { default: false })
  isUsed: boolean;

  @ApiProperty({ description: 'Date for which this activity was suggested' })
  @Column('datetime')
  suggestedDate: Date;

  @ApiProperty({ description: 'Timestamp when the activity was used', required: false })
  @Column('timestamp', { nullable: true })
  usedAt: Date;

  @ApiProperty({ description: 'Timestamp when the suggested activity was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp when the suggested activity was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'User who owns this suggested activity', type: () => User })
  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;
}
