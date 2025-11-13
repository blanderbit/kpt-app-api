import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsIn } from 'class-validator';
import { SubscriptionPlanInterval } from '../enums/subscription-plan-interval.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

export class SubscriptionStatsQueryDto {
  @ApiPropertyOptional({ enum: SubscriptionPlanInterval, description: 'Plan interval to filter by' })
  @IsOptional()
  @IsEnum(SubscriptionPlanInterval)
  planInterval?: SubscriptionPlanInterval;

  @ApiPropertyOptional({ enum: SubscriptionStatus, description: 'Subscription status to filter by' })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ description: 'Product identifier to filter by' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ enum: ['linked', 'anonymous'], description: 'Linked status filter' })
  @IsOptional()
  @IsIn(['linked', 'anonymous'])
  linked?: 'linked' | 'anonymous';

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Start date (inclusive)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'End date (inclusive)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
