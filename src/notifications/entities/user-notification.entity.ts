import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  INACTIVITY_REMINDER = 'inactivity-reminder',
  MISSING_MOOD = 'missing-mood',
  PENDING_SURVEY = 'pending-survey',
  UNREAD_ARTICLE = 'unread-article',
  GLOBAL_INACTIVITY_REMINDER = 'global-inactivity-reminder',
  SUGGESTED_ACTIVITIES_READY = 'suggested-activities-ready',
  CUSTOM_BROADCAST = 'custom-broadcast',
}

@Entity('user_notification_tracker')
@Index(['userId', 'type'], { unique: true })
export class UserNotificationTracker {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Primary identifier' })
  id: number;

  @Column({ name: 'user_id' })
  @ApiProperty({ description: 'User identifier' })
  userId: number;

  @Column({ type: 'varchar', length: 64 })
  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'Timestamp of the last successful delivery', required: false })
  lastSentAt: Date | null;

  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}


