import { Module } from '@nestjs/common';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  exports: [SubscriptionsModule],
})
export class PayModule {}
