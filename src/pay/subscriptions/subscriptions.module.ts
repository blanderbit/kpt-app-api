import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Subscription } from './entities/subscription.entity';
import { User } from '../../users/entities/user.entity';
import { ExternalSignup } from '../../external-signup/entities/external-signup.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsAdminController } from './subscriptions-admin.controller';
import { RevenueCatService } from './revenuecat.service';
import { SubscriptionPendingLinkService } from './subscription-pending-link.service';
import { SettingsModule } from '../../admin/settings/settings.module';
import { LanguageModule } from '../../admin/languages/language.module';
import { ChatGPTModule } from '../../core/chatgpt/chatgpt.module';
import { EmailModule } from '../../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, User, ExternalSignup]),
    BullModule.registerQueue({ name: 'suggested-activity' }),
    forwardRef(() => SettingsModule),
    LanguageModule,
    ChatGPTModule,
    EmailModule,
  ],
  controllers: [SubscriptionsController, SubscriptionsAdminController],
  providers: [SubscriptionsService, RevenueCatService, SubscriptionPendingLinkService],
  exports: [SubscriptionsService, SubscriptionPendingLinkService],
})
export class SubscriptionsModule {}
