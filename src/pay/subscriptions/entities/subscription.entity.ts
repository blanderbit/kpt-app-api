import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SubscriptionProvider } from '../enums/subscription-provider.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { SubscriptionPlanInterval } from '../enums/subscription-plan-interval.enum';

@Entity('subscriptions')
@Index(['userEmail', 'productId', 'status'])
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

  @Column({ length: 255, nullable: true })
  productId?: string;

  @Column({ length: 255, nullable: true })
  environment?: string;

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
