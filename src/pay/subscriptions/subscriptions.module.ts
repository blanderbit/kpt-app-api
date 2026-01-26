import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { User } from '../../users/entities/user.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsAdminController } from './subscriptions-admin.controller';
import { RevenueCatService } from './revenuecat.service';
import { SettingsModule } from '../../admin/settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, User]),
    forwardRef(() => SettingsModule),
  ],
  controllers: [SubscriptionsController, SubscriptionsAdminController],
  providers: [SubscriptionsService, RevenueCatService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
