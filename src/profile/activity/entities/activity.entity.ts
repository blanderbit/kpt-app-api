import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../users/entities/user.entity';
import { RateActivity } from './rate-activity.entity';

@Entity('activities')
export class Activity {
  @ApiProperty({ description: 'Unique activity identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Activity name' })
  @Column()
  activityName: string;

  @ApiProperty({ description: 'Activity type (determined by AI)' })
  @Column({ default: 'general' })
  activityType: string;

  @ApiProperty({ description: 'Activity content as string' })
  @Column({ type: 'text', nullable: true })
  content: string;

  @ApiProperty({ description: 'Activity position for ordering' })
  @Column({ type: 'int', default: 0 })
  position: number;

  @ApiProperty({ description: 'Whether activity is public' })
  @Column({ default: false })
  isPublic: boolean;

  @ApiProperty({ description: 'Activity status' })
  @Column({ 
    type: 'enum', 
    enum: ['active', 'closed'], 
    default: 'active' 
  })
  status: 'active' | 'closed';

  @ApiProperty({ description: 'Activity closing date', required: false })
  @Column({ nullable: true })
  closedAt: Date;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.activities)
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  @OneToMany(() => RateActivity, (rateActivity) => rateActivity.activity)
  rateActivities: RateActivity[];
}
