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
import { Activity } from './activity.entity';

@Entity('rate_activities')
export class RateActivity {
  @ApiProperty({ description: 'Unique rating identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Satisfaction level (0-100)' })
  @Column({ type: 'int', default: 0 })
  satisfactionLevel: number;

  @ApiProperty({ description: 'Difficulty level (0-100)' })
  @Column({ type: 'int', default: 0 })
  hardnessLevel: number;

  @ApiProperty({ description: 'Record creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Activity, (activity) => activity.rateActivities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityId' })
  activity: Activity;

  @RelationId((rateActivity: RateActivity) => rateActivity.activity)
  activityId: number;
}
