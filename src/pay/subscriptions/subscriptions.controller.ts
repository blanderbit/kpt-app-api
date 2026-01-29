import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Req, Headers, UnauthorizedException, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionSummaryDto } from './dto/subscription-summary.dto';
import { RevenueCatWebhookPayload } from './dto/revenuecat-webhook.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Subscription } from './entities/subscription.entity';
import { ConfigService } from '@nestjs/config';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('revenuecat/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'RevenueCat webhook endpoint' })
  @ApiBearerAuth()
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
  async handleRevenueCatWebhook(
    @Body() payload: RevenueCatWebhookPayload,
    @Headers('authorization') authorization?: string,
  ): Promise<{ success: boolean }> {
    const expectedAuth = (this.configService.get<string>('REVENUECAT_WEBHOOK_AUTH') || '').trim();
    const expectedToken = expectedAuth.toLowerCase().startsWith('bearer ')
      ? expectedAuth.slice(7).trim()
      : expectedAuth;

    if (expectedToken) {
      const providedAuth = (authorization || '').trim();
      const bearerMatch = /^Bearer\s+(.+)$/i.exec(providedAuth);
      const providedToken = bearerMatch?.[1]?.trim();
      if (!providedToken || providedToken !== expectedToken) {
        throw new UnauthorizedException('Invalid webhook authorization');
      }
    } else if (expectedAuth && (authorization || '').trim() !== expectedAuth) {
      throw new UnauthorizedException('Invalid webhook authorization');
    }

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

  @Get('latest/summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get localized latest subscription summary for current user' })
  @ApiOkResponse({ description: 'Latest subscription summary for current user', type: SubscriptionSummaryDto })
  @ApiQuery({
    name: 'lang',
    description: 'Language code for localized labels',
    required: false,
    example: 'en',
  })
  async getLatestSubscriptionSummary(
    @Req() req: any,
    @Query('lang') language?: string,
  ): Promise<SubscriptionSummaryDto | null> {
    const userId = req?.user?.sub;
    return this.subscriptionsService.getLatestSubscriptionSummary(userId, language);
  }
}
