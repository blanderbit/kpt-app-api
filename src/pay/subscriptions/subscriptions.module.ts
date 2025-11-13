import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsAdminController } from './subscriptions-admin.controller';
import { RevenueCatService } from './revenuecat.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription])],
  controllers: [SubscriptionsController, SubscriptionsAdminController],
  providers: [SubscriptionsService, RevenueCatService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
