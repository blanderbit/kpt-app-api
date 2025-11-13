import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { RevenueCatWebhookPayload } from './dto/revenuecat-webhook.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Subscription } from './entities/subscription.entity';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('revenuecat/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'RevenueCat webhook endpoint' })
  @ApiBody({
    description: 'RevenueCat webhook payload',
    schema: {
      type: 'object',
      properties: {
        event: {
          type: 'object',
          additionalProperties: true,
        },
      },
      required: ['event'],
    },
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleRevenueCatWebhook(@Body() payload: RevenueCatWebhookPayload): Promise<{ success: boolean }> {
    await this.subscriptionsService.handleRevenueCatWebhook(payload);
    return { success: true };
  }

  @Post('revenuecat/cancel')
  @ApiOperation({ summary: 'Request cancellation of a RevenueCat subscription' })
  @ApiBody({ type: CancelSubscriptionDto })
  @ApiOkResponse({ description: 'Cancellation request processed' })
  async cancelSubscription(@Body() dto: CancelSubscriptionDto): Promise<{ success: boolean }> {
    await this.subscriptionsService.requestCancellation(dto);
    return { success: true };
  }

  @Get('latest')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get latest subscription for current user' })
  @ApiOkResponse({ description: 'Latest subscription for current user', type: Subscription, isArray: false })
  async getLatestSubscription(@Req() req: any) {
    const userId = req?.user?.sub;
    return this.subscriptionsService.getLatestSubscription(userId);
  }
}
