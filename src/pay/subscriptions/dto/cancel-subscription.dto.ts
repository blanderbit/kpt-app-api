import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CancelSubscriptionDto {
  @ApiProperty({ description: 'Subscription identifier', example: 'e9ed5e7f-9f93-4a8c-8f5f-8c2a3dd1c4f1' })
  @IsUUID()
  subscriptionId: string;

  @ApiProperty({ description: 'Optional cancellation reason', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Reason cannot be empty', each: false })
  reason?: string;
}
