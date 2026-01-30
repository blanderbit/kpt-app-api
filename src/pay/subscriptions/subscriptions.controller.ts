import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Req, Headers, UnauthorizedException, Query, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(SubscriptionsController.name);

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
    const appUserId = payload?.event?.app_user_id ?? 'missing';
    const eventType = payload?.event?.type ?? 'missing';
    this.logger.log(
      `[RevenueCat webhook] request received: app_user_id=${String(appUserId).substring(0, 40)}, event_type=${eventType}`,
    );

    const expectedAuth = (this.configService.get<string>('REVENUECAT_WEBHOOK_AUTH') || '').trim();
    const expectedToken = expectedAuth.toLowerCase().startsWith('bearer ')
      ? expectedAuth.slice(7).trim()
      : expectedAuth;

    if (expectedToken) {
      const providedAuth = (authorization || '').trim();
      const bearerMatch = /^Bearer\s+(.+)$/i.exec(providedAuth);
      const providedToken = bearerMatch?.[1]?.trim();
      if (!providedToken || providedToken !== expectedToken) {
        this.logger.warn(`[webhook-controller] rejected: invalid or missing Authorization (app_user_id=${String(appUserId).substring(0, 40)})`);
        throw new UnauthorizedException('Invalid webhook authorization');
      }
    } else if (expectedAuth && (authorization || '').trim() !== expectedAuth) {
      this.logger.warn(`[webhook-controller] rejected: authorization mismatch (app_user_id=${String(appUserId).substring(0, 40)})`);
      throw new UnauthorizedException('Invalid webhook authorization');
    }

    this.logger.log(`[webhook-controller] auth OK, calling handleRevenueCatWebhook`);
    try {
      await this.subscriptionsService.handleRevenueCatWebhook(payload);
      this.logger.log(`[webhook-controller] handleRevenueCatWebhook completed OK: app_user_id=${String(appUserId).substring(0, 40)}, event_type=${eventType}`);
      return { success: true };
    } catch (err) {
      this.logger.error(`[webhook-controller] handleRevenueCatWebhook threw: ${(err as Error)?.message}`, (err as Error)?.stack);
      throw err;
    }
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
    const userId = req?.user?.id;
    return this.subscriptionsService.getLatestSubscription(userId);
  }

  @Get('latest/summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get localized latest subscription summary for current user' })
  @ApiOkResponse({
    description: 'Latest subscription summary for current user (subscription is null when user has none)',
    schema: {
      type: 'object',
      required: ['subscription'],
      properties: {
        subscription: { nullable: true, description: 'Latest subscription summary or null if none' },
      },
    },
  })
  @ApiQuery({
    name: 'lang',
    description: 'Language code for localized labels',
    required: false,
    example: 'en',
  })
  async getLatestSubscriptionSummary(
    @Req() req: any,
    @Query('lang') language?: string,
  ): Promise<{ subscription: SubscriptionSummaryDto | null }> {
    const userId = req?.user?.id;
    this.logger.log(`[summary] GET /subscriptions/latest/summary: userId=${userId ?? 'undefined'}, lang=${language ?? 'undefined'}`);
    const subscription = await this.subscriptionsService.getLatestSubscriptionSummary(userId, language);
    this.logger.log(
      `[summary] GET /subscriptions/latest/summary: returning subscription=${subscription ? `isPaid=${subscription.isPaid}, productId=${subscription.productId ?? 'null'}` : 'null'} for userId=${userId}`,
    );
    return { subscription: subscription ?? null };
  }
}
