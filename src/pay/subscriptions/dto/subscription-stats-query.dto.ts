import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsIn, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { SubscriptionPlanInterval } from '../enums/subscription-plan-interval.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { SubscriptionProvider } from '../enums/subscription-provider.enum';

export class SubscriptionStatsQueryDto {
  @ApiPropertyOptional({ enum: SubscriptionPlanInterval, description: 'Plan interval to filter by' })
  @IsOptional()
  @IsEnum(SubscriptionPlanInterval)
  planInterval?: SubscriptionPlanInterval;

  @ApiPropertyOptional({ enum: SubscriptionStatus, description: 'Subscription status to filter by' })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ enum: SubscriptionProvider, description: 'Subscription provider to filter by' })
  @IsOptional()
  @IsEnum(SubscriptionProvider)
  provider?: SubscriptionProvider;

  @ApiPropertyOptional({ enum: ['linked', 'anonymous'], description: 'Linked status filter' })
  @IsOptional()
  @IsIn(['linked', 'anonymous'])
  linked?: 'linked' | 'anonymous';

  @ApiPropertyOptional({ type: Number, description: 'Year to filter statistics (if not provided, returns all-time stats)' })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt()
  year?: number;
}
