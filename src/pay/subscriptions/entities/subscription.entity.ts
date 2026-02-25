import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SubscriptionProvider } from '../enums/subscription-provider.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { SubscriptionPlanInterval } from '../enums/subscription-plan-interval.enum';

@Entity('subscriptions')
@Index(['userEmail', 'productId', 'status'])
@Index('IDX_subscriptions_original_transaction_id', ['originalTransactionId'], { unique: true })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId?: number;

  @Column({ length: 255, nullable: true })
  userEmail?: string;

  @Column({ length: 255, nullable: true })
  appUserId?: string;

  @Column({ type: 'enum', enum: SubscriptionProvider, default: SubscriptionProvider.REVENUECAT })
  provider: SubscriptionProvider;

  @Column({ length: 255, nullable: true })
  externalSubscriptionId?: string;

  /** iOS original_transaction_id; stable key for upsert across product changes */
  @Column({ length: 255, nullable: true })
  originalTransactionId?: string;

  /** Last webhook event_timestamp_ms; used to ignore out-of-order events */
  @Column({ type: 'bigint', nullable: true })
  lastEventTimestampMs?: string;

  @Column({ length: 255, nullable: true })
  productId?: string;

  @Column({ length: 255, nullable: true })
  environment?: string;

  /**
   * Store/source of the subscription in RevenueCat (e.g. APP_STORE, PLAY_STORE, STRIPE, PADDLE).
   * Used to decide how cancellation should be handled (server-side vs only in store).
   */
  @Column({ length: 32, nullable: true })
  store?: string;

  @Column({ type: 'enum', enum: SubscriptionPlanInterval, default: SubscriptionPlanInterval.UNKNOWN })
  planInterval: SubscriptionPlanInterval;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @Column({ type: 'datetime', nullable: true })
  periodStart?: Date;

  @Column({ type: 'datetime', nullable: true })
  periodEnd?: Date;

  @Column({ type: 'datetime', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: string;

  @Column({ length: 8, nullable: true })
  currency?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceInUsd?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
