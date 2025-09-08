import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Activity } from './activity.entity';

@Entity('rate_activities')
export class RateActivity {
  @ApiProperty({ description: 'Unique rating identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Activity ID' })
  @Column()
  activityId: number;

  @ApiProperty({ description: 'Satisfaction level (0-100)' })
  @Column({ type: 'int', default: 0 })
  satisfactionLevel: number;

  @ApiProperty({ description: 'Difficulty level (0-100)' })
  @Column({ type: 'int', default: 0 })
  hardnessLevel: number;

  @ApiProperty({ description: 'Record creation date' })
  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Activity, (activity) => activity.rateActivities)
  @JoinColumn({ name: 'activityId' })
  activity: Activity;
}
