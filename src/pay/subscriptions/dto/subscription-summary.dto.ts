import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlanInterval } from '../enums/subscription-plan-interval.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

export class SubscriptionSummaryDto {
  @ApiProperty({ required: false, example: 'plesury.monthly' })
  productId?: string;

  @ApiProperty({ enum: SubscriptionPlanInterval, example: SubscriptionPlanInterval.MONTHLY })
  planInterval: SubscriptionPlanInterval;

  @ApiProperty({ example: 'Monthly' })
  planIntervalLabel: string;

  @ApiProperty({ required: false, example: 'Monthly Premium' })
  name?: string;

  @ApiProperty({ required: false, example: 'Full access to premium features with a monthly renewal.' })
  description?: string;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @ApiProperty({ example: 'Active' })
  statusLabel: string;

  @ApiProperty({ required: false, example: '2026-02-28T23:59:59.000Z' })
  periodEnd?: string;

  @ApiProperty({
    description: 'True if subscription is paid (RevenueCat/Store); false for backend-created trial',
    example: true,
  })
  isPaid: boolean;
}
