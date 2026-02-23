import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ExternalSignupStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  EXPIRED = 'expired',
  REGISTERED = 'registered',
}

/** Payload from quiz/signup; moved to user on payment, then meta is cleared. */
export interface ExternalSignupMeta {
  programId?: number | null;
  programName?: string | null;
  quizSnapshot?: { questionText: string; answerText: string }[] | null;
}

@Entity('external_signups')
export class ExternalSignup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 128 })
  appUserId: string;

  @Column({ length: 255 })
  email: string;

  @Column({ type: 'json', nullable: true })
  meta: ExternalSignupMeta | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: ExternalSignupStatus.PENDING_PAYMENT,
  })
  status: ExternalSignupStatus;

  @Column({ type: 'varchar', length: 128, nullable: true })
  paddleTransactionId: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  paddleSubscriptionId: string | null;

  @Column({ nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
