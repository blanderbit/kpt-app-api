import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import { SubscriptionProvider } from './enums/subscription-provider.enum';
import { RevenueCatWebhookPayload } from './dto/revenuecat-webhook.dto';
import { RevenueCatService } from './revenuecat.service';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { PaginateQuery, paginate, Paginated } from 'nestjs-paginate';
import { subscriptionsPaginationConfig } from './subscription.config';
import { SubscriptionPlanInterval } from './enums/subscription-plan-interval.enum';

export interface SubscriptionStatsFilters {
  planInterval?: SubscriptionPlanInterval;
  status?: SubscriptionStatus;
  productId?: string;
  startDate?: Date;
  endDate?: Date;
  isLinked?: boolean;
  userId?: number;
}

export interface SubscriptionStats {
  countByPlanInterval: Record<string, number>;
  countByStatus: Record<string, number>;
  totals: {
    month: { count: number; startDate: string };
    year: { count: number; startDate: string };
  };
  revenue: {
    month: { amount: number; currency: string; startDate: string };
    year: { amount: number; currency: string; startDate: string };
  };
  authBreakdown: {
    byPlanInterval: Array<{ planInterval: SubscriptionPlanInterval; linked: number; anonymous: number }>;
    month: { linked: number; anonymous: number; startDate: string };
    year: { linked: number; anonymous: number; startDate: string };
  };
}

interface PriceInfo {
  price?: string;
  currency?: string;
  priceInUsd?: string;
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly revenueCatService: RevenueCatService,
  ) {}

  async handleRevenueCatWebhook(payload: RevenueCatWebhookPayload): Promise<void> {
    const event = payload?.event;
    if (!event) {
      this.logger.warn('Received RevenueCat webhook without event payload');
      return;
    }

    const appUserId = event.app_user_id;
    if (!appUserId) {
      this.logger.warn('RevenueCat webhook missing app_user_id');
      return;
    }

    const userId = this.resolveUserId(appUserId);
    const status = this.mapRevenueCatStatus(event.type);
    const planInterval = this.determinePlanInterval(event.product_id);
    const priceInfo = this.extractPriceInfo(event);

    if ([SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELLED, SubscriptionStatus.PAST_DUE].includes(status)) {
      await this.updateExistingSubscriptionStatus(appUserId, event.product_id, status, event, userId, planInterval, priceInfo);

      if (status === SubscriptionStatus.PAST_DUE) {
        await this.revenueCatService
          .cancelSubscription(appUserId, event.product_id || '')
          .catch((error) =>
            this.logger.warn(`Failed to cancel subscription after billing issue: ${error?.message || error}`),
          );
      }
      return;
    }

    if (status === SubscriptionStatus.ACTIVE) {
      await this.closeActiveSubscriptions(appUserId, event.product_id);
    }

    const subscription = this.subscriptionRepository.create({
      userId,
      userEmail: event.subscriber_attributes?.email?.value || undefined,
      appUserId,
      provider: SubscriptionProvider.REVENUECAT,
      externalSubscriptionId: event.transaction_id || event.original_transaction_id || event.entitlement_id,
      productId: event.product_id,
      environment: event.environment,
      planInterval,
      status,
      price: priceInfo.price,
      currency: priceInfo.currency,
      priceInUsd: priceInfo.priceInUsd,
      periodStart: this.resolveDate(event.purchased_at_ms, event.purchased_at),
      periodEnd: this.resolveDate(event.expiration_at_ms, event.expiration_at),
      metadata: event,
    });

    await this.subscriptionRepository.save(subscription);
  }

  async requestCancellation(dto: CancelSubscriptionDto): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({ where: { id: dto.subscriptionId } });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.provider === SubscriptionProvider.REVENUECAT) {
      await this.revenueCatService
        .cancelSubscription(subscription.appUserId || '', subscription.productId || '')
        .catch((error) => {
          this.logger.warn(`RevenueCat cancellation request failed: ${error?.message || error}`);
        });
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    await this.subscriptionRepository.save(subscription);
  }

  async getSubscriptionsForUser(userId: number, query: PaginateQuery): Promise<Paginated<Subscription>> {
    const qb = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.userId = :userId', { userId })
      .orderBy('subscription.createdAt', 'DESC');

    return paginate(query, qb, subscriptionsPaginationConfig);
  }

  async getSubscriptionsWithFilter(query: PaginateQuery): Promise<Paginated<Subscription>> {
    const qb = this.subscriptionRepository.createQueryBuilder('subscription').orderBy('subscription.createdAt', 'DESC');

    return paginate(query, qb, subscriptionsPaginationConfig);
  }

  async getLatestSubscription(userId?: number): Promise<Subscription | null> {
    if (!userId) {
      return null;
    }

    return this.subscriptionRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getSubscriptionsStats(filters: SubscriptionStatsFilters = {}): Promise<SubscriptionStats> {
    return this.computeStats(filters);
  }

  async getUserSubscriptionStats(userId: number, filters: SubscriptionStatsFilters = {}): Promise<SubscriptionStats> {
    return this.computeStats({ ...filters, userId });
  }

  private async closeActiveSubscriptions(appUserId: string, productId?: string): Promise<void> {
    const qb = this.subscriptionRepository
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: SubscriptionStatus.EXPIRED, cancelledAt: new Date() })
      .where('appUserId = :appUserId', { appUserId })
      .andWhere('status = :status', { status: SubscriptionStatus.ACTIVE });

    if (productId) {
      qb.andWhere('productId = :productId', { productId });
    }

    await qb.execute();
  }

  private async updateExistingSubscriptionStatus(
    appUserId: string,
    productId: string | undefined,
    status: SubscriptionStatus,
    event: RevenueCatWebhookPayload['event'],
    userId: number | undefined,
    planInterval: SubscriptionPlanInterval,
    priceInfo: PriceInfo,
  ): Promise<void> {
    const updatePayload: Partial<Subscription> = {
      status,
      periodEnd: this.resolveDate(event.expiration_at_ms, event.expiration_at),
      metadata: event,
      userEmail: event.subscriber_attributes?.email?.value || undefined,
      planInterval,
    };

    if (typeof userId === 'number') {
      updatePayload.userId = userId;
    }

    if (status !== SubscriptionStatus.ACTIVE) {
      updatePayload.cancelledAt = new Date();
    }

    if (priceInfo.price !== undefined) {
      updatePayload.price = priceInfo.price;
    }
    if (priceInfo.currency !== undefined) {
      updatePayload.currency = priceInfo.currency;
    }
    if (priceInfo.priceInUsd !== undefined) {
      updatePayload.priceInUsd = priceInfo.priceInUsd;
    }

    const qb = this.subscriptionRepository
      .createQueryBuilder()
      .update(Subscription)
      .set(updatePayload)
      .where('appUserId = :appUserId', { appUserId });

    if (productId) {
      qb.andWhere('productId = :productId', { productId });
    }

    await qb.execute();
  }

  private determinePlanInterval(productId?: string): SubscriptionPlanInterval {
    if (!productId) {
      return SubscriptionPlanInterval.UNKNOWN;
    }

    const normalized = productId.toLowerCase();
    if (normalized.includes('year') || normalized.includes('annual')) {
      return SubscriptionPlanInterval.YEARLY;
    }
    if (normalized.includes('month') || normalized.includes('monthly')) {
      return SubscriptionPlanInterval.MONTHLY;
    }
    return SubscriptionPlanInterval.UNKNOWN;
  }

  private extractPriceInfo(event: RevenueCatWebhookPayload['event']): PriceInfo {
    const price = this.formatAmount(event.price);
    const priceInUsd = this.formatAmount(event.price_in_usd);
    const currency = event.currency || (priceInUsd ? 'USD' : undefined);

    return {
      price,
      currency,
      priceInUsd: priceInUsd ?? (currency === 'USD' ? price : undefined),
    };
  }

  private resolveDate(epochMs?: number, iso?: string): Date | undefined {
    if (epochMs) {
      return new Date(epochMs);
    }
    if (iso) {
      return new Date(iso);
    }
    return undefined;
  }

  private resolveUserId(appUserId: string): number | undefined {
    if (appUserId.startsWith('$RCAnonymousID')) {
      return undefined;
    }

    const numericId = parseInt(appUserId, 10);
    if (Number.isFinite(numericId)) {
      return numericId;
    }

    return undefined;
  }

  private mapRevenueCatStatus(eventType: string): SubscriptionStatus {
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
        return SubscriptionStatus.ACTIVE;
      case 'CANCELLATION':
      case 'PRODUCT_CHANGE':
        return SubscriptionStatus.CANCELLED;
      case 'EXPIRATION':
        return SubscriptionStatus.EXPIRED;
      case 'BILLING_ISSUE':
        return SubscriptionStatus.PAST_DUE;
      default:
        return SubscriptionStatus.UNKNOWN;
    }
  }

  async linkSubscriptionsToUser(appUserId: string, userId: number, email?: string): Promise<void> {
    if (!appUserId || appUserId.startsWith('$RCAnonymousID')) {
      return;
    }

    await this.subscriptionRepository
      .createQueryBuilder()
      .update(Subscription)
      .set({ userId, userEmail: email || undefined })
      .where('appUserId = :appUserId', { appUserId })
      .execute();
  }

  private async computeStats(filters: SubscriptionStatsFilters): Promise<SubscriptionStats> {
    const qb = this.subscriptionRepository.createQueryBuilder('subscription');
    this.applyFilters(qb, filters);

    const now = filters.endDate ? new Date(filters.endDate) : new Date();
    const monthStart = this.calculateRelativeStart(now, filters.startDate, 'month');
    const yearStart = this.calculateRelativeStart(now, filters.startDate, 'year');

    const [
      planCountsRaw,
      statusCountsRaw,
      monthCount,
      yearCount,
      monthRevenueRaw,
      yearRevenueRaw,
      planAuthRaw,
      monthAuthRaw,
      yearAuthRaw,
    ] = await Promise.all([
      qb
        .clone()
        .select('subscription.planInterval', 'planInterval')
        .addSelect('COUNT(*)', 'count')
        .groupBy('subscription.planInterval')
        .getRawMany(),
      qb
        .clone()
        .select('subscription.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('subscription.status')
        .getRawMany(),
      qb.clone().andWhere('subscription.createdAt >= :monthStart', { monthStart }).getCount(),
      qb.clone().andWhere('subscription.createdAt >= :yearStart', { yearStart }).getCount(),
      qb
        .clone()
        .andWhere('subscription.createdAt >= :monthStart', { monthStart })
        .select('SUM(COALESCE(subscription.priceInUsd, subscription.price))', 'sum')
        .getRawOne(),
      qb
        .clone()
        .andWhere('subscription.createdAt >= :yearStart', { yearStart })
        .select('SUM(COALESCE(subscription.priceInUsd, subscription.price))', 'sum')
        .getRawOne(),
      qb
        .clone()
        .select('subscription.planInterval', 'planInterval')
        .addSelect("SUM(CASE WHEN subscription.userId IS NULL THEN 1 ELSE 0 END)", 'anonymous')
        .addSelect("SUM(CASE WHEN subscription.userId IS NOT NULL THEN 1 ELSE 0 END)", 'linked')
        .groupBy('subscription.planInterval')
        .getRawMany(),
      qb
        .clone()
        .andWhere('subscription.createdAt >= :monthStart', { monthStart })
        .select("SUM(CASE WHEN subscription.userId IS NULL THEN 1 ELSE 0 END)", 'anonymous')
        .addSelect("SUM(CASE WHEN subscription.userId IS NOT NULL THEN 1 ELSE 0 END)", 'linked')
        .getRawOne(),
      qb
        .clone()
        .andWhere('subscription.createdAt >= :yearStart', { yearStart })
        .select("SUM(CASE WHEN subscription.userId IS NULL THEN 1 ELSE 0 END)", 'anonymous')
        .addSelect("SUM(CASE WHEN subscription.userId IS NOT NULL THEN 1 ELSE 0 END)", 'linked')
        .getRawOne(),
    ]);

    return {
      countByPlanInterval: this.toPlanCountMap(planCountsRaw),
      countByStatus: this.toStatusCountMap(statusCountsRaw),
      totals: {
        month: { count: monthCount, startDate: monthStart.toISOString() },
        year: { count: yearCount, startDate: yearStart.toISOString() },
      },
      revenue: {
        month: {
          amount: this.formatNumber(monthRevenueRaw?.sum),
          currency: 'USD',
          startDate: monthStart.toISOString(),
        },
        year: {
          amount: this.formatNumber(yearRevenueRaw?.sum),
          currency: 'USD',
          startDate: yearStart.toISOString(),
        },
      },
      authBreakdown: {
        byPlanInterval: planAuthRaw.map((row) => ({
          planInterval: (row.planInterval as SubscriptionPlanInterval) ?? SubscriptionPlanInterval.UNKNOWN,
          linked: this.formatNumber(row.linked),
          anonymous: this.formatNumber(row.anonymous),
        })),
        month: {
          linked: this.formatNumber(monthAuthRaw?.linked),
          anonymous: this.formatNumber(monthAuthRaw?.anonymous),
          startDate: monthStart.toISOString(),
        },
        year: {
          linked: this.formatNumber(yearAuthRaw?.linked),
          anonymous: this.formatNumber(yearAuthRaw?.anonymous),
          startDate: yearStart.toISOString(),
        },
      },
    };
  }

  private formatAmount(value?: number | string): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    const numeric = typeof value === 'string' ? parseFloat(value) : value;
    if (!Number.isFinite(numeric)) {
      return undefined;
    }

    return numeric.toFixed(2);
  }

  private toPlanCountMap(raw: Array<{ planInterval: SubscriptionPlanInterval; count: string }>): Record<string, number> {
    const base: Record<string, number> = {
      [SubscriptionPlanInterval.MONTHLY]: 0,
      [SubscriptionPlanInterval.YEARLY]: 0,
      [SubscriptionPlanInterval.UNKNOWN]: 0,
    };

    raw.forEach((row) => {
      const key = row.planInterval || SubscriptionPlanInterval.UNKNOWN;
      base[key] = this.formatNumber(row.count);
    });

    return base;
  }

  private toStatusCountMap(raw: Array<{ status: SubscriptionStatus; count: string }>): Record<string, number> {
    const result: Record<string, number> = {};
    Object.values(SubscriptionStatus).forEach((status) => {
      result[status] = 0;
    });

    raw.forEach((row) => {
      const status = row.status || SubscriptionStatus.UNKNOWN;
      result[status] = this.formatNumber(row.count);
    });

    return result;
  }

  private formatNumber(value: any): number {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : 0;
  }

  private calculateRelativeStart(endDate: Date, filterStartDate: Date | undefined, unit: 'month' | 'year'): Date {
    const start = new Date(endDate);
    if (unit === 'month') {
      start.setMonth(start.getMonth() - 1);
    } else {
      start.setFullYear(start.getFullYear() - 1);
    }
    if (filterStartDate && filterStartDate > start) {
      return filterStartDate;
    }
    return start;
  }

  private applyFilters(qb: SelectQueryBuilder<Subscription>, filters: SubscriptionStatsFilters): void {
    if (filters.userId !== undefined) {
      qb.andWhere('subscription.userId = :filterUserId', { filterUserId: filters.userId });
    }
    if (filters.planInterval) {
      qb.andWhere('subscription.planInterval = :filterPlanInterval', { filterPlanInterval: filters.planInterval });
    }
    if (filters.status) {
      qb.andWhere('subscription.status = :filterStatus', { filterStatus: filters.status });
    }
    if (filters.productId) {
      qb.andWhere('subscription.productId = :filterProductId', { filterProductId: filters.productId });
    }
    if (filters.isLinked === true) {
      qb.andWhere('subscription.userId IS NOT NULL');
    }
    if (filters.isLinked === false) {
      qb.andWhere('subscription.userId IS NULL');
    }
    if (filters.startDate) {
      qb.andWhere('subscription.createdAt >= :filterStartDate', { filterStartDate: filters.startDate });
    }
    if (filters.endDate) {
      qb.andWhere('subscription.createdAt <= :filterEndDate', { filterEndDate: filters.endDate });
    }
  }
}
