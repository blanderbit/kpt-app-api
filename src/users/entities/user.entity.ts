import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Activity } from '../../profile/activity/entities/activity.entity';
import { MoodTracker } from '../../profile/mood-tracker/entities/mood-tracker.entity';

@Entity('users')
export class User {
  @ApiProperty({ description: 'Unique user identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User email address' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'Password hash' })
  @Column({ nullable: true })
  passwordHash: string;

  @ApiProperty({ description: 'User first name' })
  @Column({ nullable: true })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @Column({ nullable: true })
  lastName: string;

  @ApiProperty({ description: 'Avatar URL' })
  @Column({ nullable: true })
  avatarUrl: string;

  @ApiProperty({ description: 'Whether email is verified' })
  @Column({ default: false })
  emailVerified: boolean;


  @ApiProperty({ description: 'Google ID' })
  @Column({ nullable: true })
  googleId: string;

  @ApiProperty({ description: 'Firebase UID' })
  @Column({ nullable: true })
  firebaseUid: string;

  @ApiProperty({ description: 'Apple ID' })
  @Column({ nullable: true })
  appleId: string;

  @ApiProperty({ description: 'Application theme' })
  @Column({ default: 'light' })
  theme: string;

  @Column({ type: 'varchar', length: 255, default: 'user' })
  roles: string;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Activity, (activity) => activity.user, { cascade: true })
  activities: Activity[];

  @OneToMany(() => MoodTracker, (moodTracker) => moodTracker.user, { cascade: true })
  moodTrackers: MoodTracker[];
}
