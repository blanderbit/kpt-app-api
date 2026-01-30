import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Not, IsNull } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionSummaryDto } from './dto/subscription-summary.dto';
import { User } from '../../users/entities/user.entity';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import { SubscriptionProvider } from './enums/subscription-provider.enum';
import { RevenueCatWebhookPayload } from './dto/revenuecat-webhook.dto';
import { RevenueCatService } from './revenuecat.service';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { PaginateQuery, paginate, Paginated } from 'nestjs-paginate';
import { subscriptionsPaginationConfig } from './subscription.config';
import { SubscriptionPlanInterval } from './enums/subscription-plan-interval.enum';
import { SettingsService } from '../../admin/settings/settings.service';
import { SubscriptionPendingLinkService } from './subscription-pending-link.service';

export interface SubscriptionStatsFilters {
  planInterval?: SubscriptionPlanInterval;
  status?: SubscriptionStatus;
  provider?: SubscriptionProvider;
  startDate?: Date;
  endDate?: Date;
  year?: number;
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

interface SubscriptionPlanCopy {
  name: string;
  description: string;
}


@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly revenueCatService: RevenueCatService,
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService: SettingsService,
    private readonly subscriptionPendingLinkService: SubscriptionPendingLinkService,
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

    let userId = this.resolveUserId(appUserId);
    if (userId === undefined) {
      userId = await this.findLinkedUserId(appUserId);
    }
    if (userId === undefined) {
      const pending = await this.subscriptionPendingLinkService.getAndConsume(appUserId);
      if (pending?.userId != null) {
        userId = pending.userId;
        this.logger.log(
          `[RevenueCat webhook] pending link used for app_user_id=${appUserId.substring(0, 30)}... → userId=${userId}`,
        );
      }
    }
    this.logger.log(
      `[RevenueCat webhook] app_user_id=${appUserId.substring(0, 30)}..., eventType=${event.type}, resolved userId=${userId ?? 'null'}`,
    );
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
      if (typeof userId === 'number') {
        await this.refreshUserPaidStatus(userId);
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

    if (typeof userId === 'number') {
      await this.refreshUserPaidStatus(userId);
    }
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

    // Prefer paid (REVENUECAT/STRIPE) over trial (NONE); then by createdAt DESC
    const qb = this.subscriptionRepository
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .orderBy("CASE WHEN s.provider = 'none' THEN 1 ELSE 0 END", 'ASC')
      .addOrderBy('s.createdAt', 'DESC');
    const list = await qb.take(1).getMany();
    return list[0] ?? null;
  }

  async getLatestSubscriptionSummary(userId?: number, language?: string): Promise<SubscriptionSummaryDto | null> {
    const subscription = await this.getLatestSubscription(userId);
    if (!subscription) {
      return null;
    }

    const lang = this.normalizeLanguage(language);
    const planCopy = this.getPlanCopy(subscription.productId, subscription.planInterval, lang);
    const planIntervalLabel = this.getPlanIntervalLabel(subscription.planInterval, lang);
    const statusLabel = this.getStatusLabel(subscription.status, lang);

    const isPaid = subscription.provider !== SubscriptionProvider.NONE;

    return {
      productId: subscription.productId ?? undefined,
      planInterval: subscription.planInterval ?? SubscriptionPlanInterval.UNKNOWN,
      planIntervalLabel,
      name: planCopy?.name ?? subscription.productId ?? undefined,
      description: planCopy?.description,
      status: subscription.status ?? SubscriptionStatus.UNKNOWN,
      statusLabel,
      periodEnd: subscription.periodEnd ? subscription.periodEnd.toISOString() : undefined,
      isPaid,
    };
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

  private normalizeLanguage(language?: string): 'en' | 'ru' | 'uk' {
    if (!language) {
      return 'en';
    }
    const normalized = language.toLowerCase().trim();
    const primary = normalized.split(',')[0]?.split('-')[0]?.split('_')[0];
    if (primary === 'ru' || primary === 'uk' || primary === 'en') {
      return primary;
    }
    return 'en';
  }

  private getPlanCopy(
    productId: string | null | undefined,
    planInterval: SubscriptionPlanInterval | null | undefined,
    language: 'en' | 'ru' | 'uk',
  ): SubscriptionPlanCopy | undefined {
    const planKey = this.getPlanKey(productId, planInterval);
    if (!planKey) {
      return undefined;
    }

    const copy: Record<'en' | 'ru' | 'uk', Record<'monthly' | 'yearly', SubscriptionPlanCopy>> = {
      en: {
        monthly: {
          name: 'Monthly Premium',
          description: 'Full access to premium features with a monthly renewal.',
        },
        yearly: {
          name: 'Yearly Premium',
          description: 'Full access to premium features with the best annual value.',
        },
      },
      ru: {
        monthly: {
          name: 'Премиум на месяц',
          description: 'Полный доступ к премиум‑функциям с ежемесячным продлением.',
        },
        yearly: {
          name: 'Премиум на год',
          description: 'Полный доступ к премиум‑функциям с лучшей годовой ценой.',
        },
      },
      uk: {
        monthly: {
          name: 'Преміум на місяць',
          description: 'Повний доступ до преміум‑функцій із щомісячним поновленням.',
        },
        yearly: {
          name: 'Преміум на рік',
          description: 'Повний доступ до преміум‑функцій з найкращою річною ціною.',
        },
      },
    };

    return copy[language][planKey];
  }

  private getPlanKey(
    productId?: string | null,
    planInterval?: SubscriptionPlanInterval | null,
  ): 'monthly' | 'yearly' | undefined {
    if (productId) {
      const normalized = productId.toLowerCase();
      if (normalized.includes('year') || normalized.includes('annual')) {
        return 'yearly';
      }
      if (normalized.includes('month') || normalized.includes('monthly')) {
        return 'monthly';
      }
    }

    if (planInterval === SubscriptionPlanInterval.YEARLY) {
      return 'yearly';
    }
    if (planInterval === SubscriptionPlanInterval.MONTHLY) {
      return 'monthly';
    }

    return undefined;
  }

  private getPlanIntervalLabel(interval: SubscriptionPlanInterval, language: 'en' | 'ru' | 'uk'): string {
    const labels: Record<'en' | 'ru' | 'uk', Record<SubscriptionPlanInterval, string>> = {
      en: {
        [SubscriptionPlanInterval.MONTHLY]: 'Monthly',
        [SubscriptionPlanInterval.YEARLY]: 'Yearly',
        [SubscriptionPlanInterval.UNKNOWN]: 'Unknown',
      },
      ru: {
        [SubscriptionPlanInterval.MONTHLY]: 'Ежемесячный',
        [SubscriptionPlanInterval.YEARLY]: 'Ежегодный',
        [SubscriptionPlanInterval.UNKNOWN]: 'Неизвестно',
      },
      uk: {
        [SubscriptionPlanInterval.MONTHLY]: 'Щомісячний',
        [SubscriptionPlanInterval.YEARLY]: 'Щорічний',
        [SubscriptionPlanInterval.UNKNOWN]: 'Невідомо',
      },
    };

    return labels[language][interval] ?? labels[language][SubscriptionPlanInterval.UNKNOWN];
  }

  private getStatusLabel(status: SubscriptionStatus, language: 'en' | 'ru' | 'uk'): string {
    const labels: Record<'en' | 'ru' | 'uk', Record<SubscriptionStatus, string>> = {
      en: {
        [SubscriptionStatus.ACTIVE]: 'Active',
        [SubscriptionStatus.CANCELLED]: 'Cancelled',
        [SubscriptionStatus.EXPIRED]: 'Expired',
        [SubscriptionStatus.PAST_DUE]: 'Past due',
        [SubscriptionStatus.PENDING]: 'Pending',
        [SubscriptionStatus.UNKNOWN]: 'Unknown',
      },
      ru: {
        [SubscriptionStatus.ACTIVE]: 'Активна',
        [SubscriptionStatus.CANCELLED]: 'Отменена',
        [SubscriptionStatus.EXPIRED]: 'Истекла',
        [SubscriptionStatus.PAST_DUE]: 'Просрочена',
        [SubscriptionStatus.PENDING]: 'В ожидании',
        [SubscriptionStatus.UNKNOWN]: 'Неизвестно',
      },
      uk: {
        [SubscriptionStatus.ACTIVE]: 'Активна',
        [SubscriptionStatus.CANCELLED]: 'Скасована',
        [SubscriptionStatus.EXPIRED]: 'Минув термін',
        [SubscriptionStatus.PAST_DUE]: 'Прострочена',
        [SubscriptionStatus.PENDING]: 'В очікуванні',
        [SubscriptionStatus.UNKNOWN]: 'Невідомо',
      },
    };

    return labels[language][status] ?? labels[language][SubscriptionStatus.UNKNOWN];
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

  private async findLinkedUserId(appUserId: string): Promise<number | undefined> {
    const linked = await this.subscriptionRepository.findOne({
      select: ['userId'],
      where: {
        appUserId,
        userId: Not(IsNull()),
      },
      order: { updatedAt: 'DESC' },
    });

    return linked?.userId;
  }

  private mapRevenueCatStatus(eventType: string): SubscriptionStatus {
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'NON_RENEWING_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'SUBSCRIPTION_RESUMED':
        return SubscriptionStatus.ACTIVE;
      case 'CANCELLATION':
      case 'PRODUCT_CHANGE':
        return SubscriptionStatus.CANCELLED;
      case 'EXPIRATION':
        return SubscriptionStatus.EXPIRED;
      case 'BILLING_ISSUE':
      case 'SUBSCRIPTION_PAUSED':
        return SubscriptionStatus.PAST_DUE;
      default:
        return SubscriptionStatus.UNKNOWN;
    }
  }

  async linkSubscriptionsToUser(appUserId: string, userId: number, email?: string): Promise<number> {
    if (!appUserId || !appUserId.trim()) {
      return 0;
    }

    const result = await this.subscriptionRepository
      .createQueryBuilder()
      .update(Subscription)
      .set({ userId, userEmail: email || undefined })
      .where('appUserId = :appUserId', { appUserId })
      .execute();

    const affected = result.affected ?? 0;
    this.logger.log(
      `linkSubscriptionsToUser: appUserId=${appUserId.substring(0, 30)}... updated ${affected} row(s) for userId=${userId}`,
    );
    await this.refreshUserPaidStatus(userId);
    return affected;
  }

  private async refreshUserPaidStatus(userId: number): Promise<void> {
    const latestSubscription = await this.getLatestSubscription(userId);
    const hasPaidSubscription = this.isPaidSubscriptionActive(latestSubscription);

    await this.userRepository.update(userId, {
      hasPaidSubscription,
    });
  }

  private isPaidSubscriptionActive(subscription: Subscription | null): boolean {
    if (!subscription) {
      return false;
    }

    if (subscription.provider === SubscriptionProvider.NONE) {
      return false;
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      return false;
    }

    if (!subscription.periodEnd) {
      return true;
    }

    return subscription.periodEnd.getTime() > Date.now();
  }

  /**
   * Create trial subscription for user
   */
  async createTrialSubscription(
    userId: number,
    email: string | undefined,
  ): Promise<Subscription> {
    const settings = this.settingsService.getSettings();
    const trialMode = settings.trialMode;
    const periodDays = trialMode.periodDays;

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + periodDays);

    const subscription = this.subscriptionRepository.create({
      userId,
      userEmail: email,
      provider: SubscriptionProvider.NONE, // Trial subscription has no payment provider
      productId: 'trial',
      planInterval: SubscriptionPlanInterval.UNKNOWN,
      status: SubscriptionStatus.ACTIVE,
      periodStart: now,
      periodEnd,
      price: '0.00',
      currency: 'USD',
      priceInUsd: '0.00',
      metadata: {
        isTrial: true,
        trialPeriodDays: periodDays,
        trialActivitiesPerDay: trialMode.activitiesPerDay,
        trialArticlesAvailable: trialMode.articlesAvailable,
        trialSurveysAvailable: trialMode.surveysAvailable,
      },
    });

    return await this.subscriptionRepository.save(subscription);
  }

  private async computeStats(filters: SubscriptionStatsFilters): Promise<SubscriptionStats> {
    const baseQb = this.subscriptionRepository.createQueryBuilder('subscription');
    this.applyFilters(baseQb, filters);

    // If year is provided, use that year; otherwise use all-time stats
    let monthStart: Date;
    let yearStart: Date;
    
    if (filters.year) {
      // Use the specified year
      yearStart = new Date(filters.year, 0, 1); // January 1st of the year
      const yearEnd = new Date(filters.year, 11, 31, 23, 59, 59, 999); // December 31st of the year
      monthStart = new Date(filters.year, new Date().getMonth(), 1); // First day of current month in that year
      
      // Apply year filter to base query
      baseQb.andWhere('subscription.createdAt >= :yearStart', { yearStart });
      baseQb.andWhere('subscription.createdAt <= :yearEnd', { yearEnd });
    } else {
      // All-time stats - use current date as reference
      const now = new Date();
      monthStart = this.calculateRelativeStart(now, undefined, 'month');
      yearStart = this.calculateRelativeStart(now, undefined, 'year');
    }

    // Helper to create filtered query builder (filters are already applied to baseQb)
    const createFilteredQb = () => baseQb.clone();

    // Count by plan interval
    const planIntervalCounts = await Promise.all(
      Object.values(SubscriptionPlanInterval).map(async (interval) => {
        const qb = createFilteredQb();
        qb.andWhere('subscription.planInterval = :interval', { interval });
        const count = await qb.getCount();
        return { planInterval: interval, count };
      }),
    );

    // Count by status
    const statusCounts = await Promise.all(
      Object.values(SubscriptionStatus).map(async (status) => {
        const qb = createFilteredQb();
        qb.andWhere('subscription.status = :status', { status });
        const count = await qb.getCount();
        return { status, count };
      }),
    );

    // Month and year counts
    // If year filter is applied, month count is for the current month of that year
    // Otherwise, month count is for the last month
    const monthQb = createFilteredQb();
    if (filters.year) {
      const currentMonthStart = new Date(filters.year, new Date().getMonth(), 1);
      monthQb.andWhere('subscription.createdAt >= :monthStart', { monthStart: currentMonthStart });
    } else {
      monthQb.andWhere('subscription.createdAt >= :monthStart', { monthStart });
    }
    const monthCount = await monthQb.getCount();

    const yearQb = createFilteredQb();
    yearQb.andWhere('subscription.createdAt >= :yearStart', { yearStart });
    const yearCount = await yearQb.getCount();

    // Revenue calculations
    const monthRevenueQb = createFilteredQb();
    if (filters.year) {
      const currentMonthStart = new Date(filters.year, new Date().getMonth(), 1);
      monthRevenueQb
        .andWhere('subscription.createdAt >= :monthStart', { monthStart: currentMonthStart })
        .select('SUM(COALESCE(subscription.priceInUsd, subscription.price))', 'sum');
    } else {
      monthRevenueQb
        .andWhere('subscription.createdAt >= :monthStart', { monthStart })
        .select('SUM(COALESCE(subscription.priceInUsd, subscription.price))', 'sum');
    }
    const monthRevenueRaw = await monthRevenueQb.getRawOne();

    const yearRevenueQb = createFilteredQb();
    yearRevenueQb
      .andWhere('subscription.createdAt >= :yearStart', { yearStart })
      .select('SUM(COALESCE(subscription.priceInUsd, subscription.price))', 'sum');
    const yearRevenueRaw = await yearRevenueQb.getRawOne();

    // Auth breakdown by plan interval
    const planAuthBreakdown = await Promise.all(
      Object.values(SubscriptionPlanInterval).map(async (interval) => {
        const linkedQb = createFilteredQb();
        linkedQb
          .andWhere('subscription.planInterval = :interval', { interval })
          .andWhere('subscription.userId IS NOT NULL');
        const linked = await linkedQb.getCount();

        const anonymousQb = createFilteredQb();
        anonymousQb
          .andWhere('subscription.planInterval = :interval', { interval })
          .andWhere('subscription.userId IS NULL');
        const anonymous = await anonymousQb.getCount();

        return { planInterval: interval, linked, anonymous };
      }),
    );

    // Month auth breakdown
    const monthLinkedQb = createFilteredQb();
    if (filters.year) {
      const currentMonthStart = new Date(filters.year, new Date().getMonth(), 1);
      monthLinkedQb
        .andWhere('subscription.createdAt >= :monthStart', { monthStart: currentMonthStart })
        .andWhere('subscription.userId IS NOT NULL');
    } else {
      monthLinkedQb
        .andWhere('subscription.createdAt >= :monthStart', { monthStart })
        .andWhere('subscription.userId IS NOT NULL');
    }
    const monthLinked = await monthLinkedQb.getCount();

    const monthAnonymousQb = createFilteredQb();
    if (filters.year) {
      const currentMonthStart = new Date(filters.year, new Date().getMonth(), 1);
      monthAnonymousQb
        .andWhere('subscription.createdAt >= :monthStart', { monthStart: currentMonthStart })
        .andWhere('subscription.userId IS NULL');
    } else {
      monthAnonymousQb
        .andWhere('subscription.createdAt >= :monthStart', { monthStart })
        .andWhere('subscription.userId IS NULL');
    }
    const monthAnonymous = await monthAnonymousQb.getCount();

    // Year auth breakdown
    const yearLinkedQb = createFilteredQb();
    yearLinkedQb
      .andWhere('subscription.createdAt >= :yearStart', { yearStart })
      .andWhere('subscription.userId IS NOT NULL');
    const yearLinked = await yearLinkedQb.getCount();

    const yearAnonymousQb = createFilteredQb();
    yearAnonymousQb
      .andWhere('subscription.createdAt >= :yearStart', { yearStart })
      .andWhere('subscription.userId IS NULL');
    const yearAnonymous = await yearAnonymousQb.getCount();

    // Format start dates for response
    const monthStartDate = filters.year 
      ? new Date(filters.year, new Date().getMonth(), 1).toISOString()
      : monthStart.toISOString();
    const yearStartDate = yearStart.toISOString();
    const yearEndDate = filters.year 
      ? new Date(filters.year, 11, 31, 23, 59, 59, 999).toISOString()
      : null;

    return {
      countByPlanInterval: this.toPlanCountMap(planIntervalCounts),
      countByStatus: this.toStatusCountMap(statusCounts),
      totals: {
        month: { count: monthCount, startDate: monthStartDate },
        year: { count: yearCount, startDate: yearStartDate, ...(yearEndDate && { endDate: yearEndDate }) },
      },
      revenue: {
        month: {
          amount: this.formatNumber(monthRevenueRaw?.sum),
          currency: 'USD',
          startDate: monthStartDate,
        },
        year: {
          amount: this.formatNumber(yearRevenueRaw?.sum),
          currency: 'USD',
          startDate: yearStartDate,
          ...(yearEndDate && { endDate: yearEndDate }),
        },
      },
      authBreakdown: {
        byPlanInterval: planAuthBreakdown.map((row) => ({
          planInterval: row.planInterval ?? SubscriptionPlanInterval.UNKNOWN,
          linked: row.linked,
          anonymous: row.anonymous,
        })),
        month: {
          linked: monthLinked,
          anonymous: monthAnonymous,
          startDate: monthStartDate,
        },
        year: {
          linked: yearLinked,
          anonymous: yearAnonymous,
          startDate: yearStartDate,
          ...(yearEndDate && { endDate: yearEndDate }),
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

  private toPlanCountMap(raw: Array<{ planInterval: SubscriptionPlanInterval; count: number }>): Record<string, number> {
    const base: Record<string, number> = {
      [SubscriptionPlanInterval.MONTHLY]: 0,
      [SubscriptionPlanInterval.YEARLY]: 0,
      [SubscriptionPlanInterval.UNKNOWN]: 0,
    };

    raw.forEach((row) => {
      const key = row.planInterval || SubscriptionPlanInterval.UNKNOWN;
      base[key] = row.count ?? 0;
    });

    return base;
  }

  private toStatusCountMap(raw: Array<{ status: SubscriptionStatus; count: number }>): Record<string, number> {
    const result: Record<string, number> = {};
    Object.values(SubscriptionStatus).forEach((status) => {
      result[status] = 0;
    });

    raw.forEach((row) => {
      const status = row.status || SubscriptionStatus.UNKNOWN;
      result[status] = row.count ?? 0;
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
    if (filters.provider) {
      qb.andWhere('subscription.provider = :filterProvider', { filterProvider: filters.provider });
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
