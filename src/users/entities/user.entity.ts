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

  @ApiProperty({ description: 'Application theme' })
  @Column({ default: 'light' })
  theme: string;

  @Column({ type: 'varchar', length: 255, default: 'user' })
  roles: string;

  @ApiProperty({ description: 'Whether user has an active paid subscription' })
  @Column({ default: false })
  hasPaidSubscription: boolean;

  @ApiProperty({ description: 'User metadata as JSON object', example: {} })
  @Column({ type: 'json', nullable: true })
  meta: object | null;

  @ApiProperty({ description: 'User age', example: '25' })
  @Column({ type: 'varchar', length: 100, default: '' })
  age: string;

  @ApiProperty({ description: 'Initial feeling when user registered', example: 'good' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  initialFeeling: string;

  @ApiProperty({ description: 'Initial satisfaction level (0-100)', example: 70 })
  @Column({ type: 'int', nullable: true })
  initSatisfactionLevel: number | null;

  @ApiProperty({ description: 'Initial hardness level (0-100)', example: 30 })
  @Column({ type: 'int', nullable: true })
  initHardnessLevel: number | null;

  @ApiProperty({ description: 'User language code', example: 'en', required: false })
  @Column({ type: 'varchar', length: 10, nullable: true, default: null })
  language: string | null;

  @ApiProperty({ description: 'Social networks used by user', example: 'facebook,instagram,twitter' })
  @Column({ type: 'text', nullable: true })
  socialNetworks: string;

  @ApiProperty({ description: 'How user tracks tasks and goals', example: 'I use apps and paper notes' })
  @Column({ type: 'text', nullable: true })
  taskTrackingMethod: string;

  /** Selected program (e.g. from external quiz flow): { id: number | string, name: string }. JSON column. */
  @ApiProperty({
    description: 'Selected program id and name (from quiz/checkout flow)',
    example: { id: 1, name: 'Stress and Anxiety Management' },
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  selectedProgram: { id: number | string; name: string } | null;

  /** Quiz Q&A snapshot from external signup (used to generate summary via POST /profile/generate-summary). */
  @ApiProperty({
    description: 'Quiz questions and answers from external signup',
    example: [{ questionText: 'How do you feel?', answerText: 'Stressed' }],
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  quizSnapshot: { questionText: string; answerText: string }[] | null;

  @ApiProperty({ description: 'Summary from external quiz (ChatGPT), generated via generate-summary endpoint', nullable: true })
  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @ApiProperty({ description: 'User came from external signup and needs onboarding', default: false })
  @Column({ default: false })
  needsOnboarding: boolean;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Activity, (activity) => activity.user, { onDelete: 'CASCADE' })
  activities: Activity[];

  @OneToMany(() => MoodTracker, (moodTracker) => moodTracker.user, { onDelete: 'CASCADE' })
  moodTrackers: MoodTracker[];
}
