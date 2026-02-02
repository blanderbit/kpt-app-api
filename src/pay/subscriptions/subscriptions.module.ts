import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Subscription } from './entities/subscription.entity';
import { User } from '../../users/entities/user.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsAdminController } from './subscriptions-admin.controller';
import { RevenueCatService } from './revenuecat.service';
import { SubscriptionPendingLinkService } from './subscription-pending-link.service';
import { SettingsModule } from '../../admin/settings/settings.module';
import { LanguageModule } from '../../admin/languages/language.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, User]),
    BullModule.registerQueue({ name: 'suggested-activity' }),
    forwardRef(() => SettingsModule),
    LanguageModule,
  ],
  controllers: [SubscriptionsController, SubscriptionsAdminController],
  providers: [SubscriptionsService, RevenueCatService, SubscriptionPendingLinkService],
  exports: [SubscriptionsService, SubscriptionPendingLinkService],
})
export class SubscriptionsModule {}
