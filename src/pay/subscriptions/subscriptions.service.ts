import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Not, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionSummaryDto } from './dto/subscription-summary.dto';
import { User } from '../../users/entities/user.entity';
import { ExternalSignup, ExternalSignupStatus } from '../../external-signup/entities/external-signup.entity';
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
import { LanguageService } from '../../admin/languages/services/language.service';
import { ChatGPTService } from '../../core/chatgpt/chatgpt.service';
import { EmailService } from '../../email/email.service';

/** Get nested value by dot path, e.g. "subscription_summary.plan_interval.monthly" */
function getValueByPath(obj: Record<string, any>, pathKey: string): string | undefined {
  if (!obj || typeof pathKey !== 'string') return undefined;
  const parts = pathKey.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

/** Resolve a string that may be a translation key into the translated text */
function resolveText(
  value: string,
  translations: Record<string, any> | null,
): string {
  if (!value || typeof value !== 'string') return value || '';
  if (!translations) return value;
  const key = value.trim();
  if (!key.includes('.')) return value;
  const resolved = getValueByPath(translations, key);
  return resolved !== undefined ? resolved : value;
}

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

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ExternalSignup)
    private readonly externalSignupRepository: Repository<ExternalSignup>,
    private readonly revenueCatService: RevenueCatService,
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService: SettingsService,
    private readonly subscriptionPendingLinkService: SubscriptionPendingLinkService,
    private readonly emailService: EmailService,
    private readonly languageService: LanguageService,
    private readonly chatGPTService: ChatGPTService,
  ) {}

  async handleRevenueCatWebhook(payload: RevenueCatWebhookPayload): Promise<void> {
    this.logger.log(`[webhook] handleRevenueCatWebhook: payload received, event present=${!!payload?.event}`);
    const event = payload?.event;
    if (!event) {
      this.logger.warn('[webhook] handleRevenueCatWebhook: no event payload, exiting');
      return;
    }
    this.logger.log(`[webhook] handleRevenueCatWebhook: event.type=${event.type}, app_user_id present=${!!event.app_user_id}`);

    const appUserId = event.app_user_id;
    if (!appUserId && event.type !== 'TRANSFER') {
      this.logger.warn('[webhook] handleRevenueCatWebhook: missing app_user_id, exiting');
      return;
    }

    if (event.type === 'TRANSFER') {
      await this.handleTransferEvent(event);
      return;
    }

    this.logger.log(`[webhook] handleRevenueCatWebhook: app_user_id=${appUserId!.substring(0, 40)}`);

    await this.tryProcessExternalSignupPayment(appUserId!, event);

    const resolvedNumeric = this.resolveUserId(appUserId!);
    this.logger.log(`[webhook] handleRevenueCatWebhook: resolveUserId(appUserId)=${resolvedNumeric ?? 'undefined'}`);
    let userId: number | undefined = resolvedNumeric;
    if (userId === undefined) {
      const linkedUserId = await this.findLinkedUserId(appUserId!);
      this.logger.log(`[webhook] handleRevenueCatWebhook: findLinkedUserId(appUserId)=${linkedUserId ?? 'undefined'}`);
      userId = linkedUserId;
    }
    if (userId === undefined) {
      this.logger.log(`[webhook] handleRevenueCatWebhook: userId still undefined, checking pending link for appUserId=...`);
      const pending = await this.subscriptionPendingLinkService.getAndConsume(appUserId!);
      if (pending?.userId != null) {
        userId = pending.userId;
        this.logger.log(
          `[webhook] handleRevenueCatWebhook: pending link used → userId=${userId}`,
        );
      } else {
        this.logger.log(
          `[webhook] handleRevenueCatWebhook: no pending link, subscription will be created with userId=null`,
        );
      }
    }
    this.logger.log(
      `[webhook] handleRevenueCatWebhook: final resolved userId=${userId ?? 'null'}, eventType=${event.type}`,
    );

    await this.upsertSubscriptionFromWebhook(event, userId);

    const status = this.computeStatusFromPayload(event);
    if (status === SubscriptionStatus.PAST_DUE) {
      await this.revenueCatService
        .cancelSubscription(appUserId!, event.product_id || event.new_product_id || '')
        .catch((error) =>
          this.logger.warn(`Failed to cancel subscription after billing issue: ${error?.message || error}`),
        );
    }
    if (typeof userId === 'number') {
      this.logger.log(`[webhook] handleRevenueCatWebhook: calling refreshUserPaidStatus(userId=${userId})`);
      await this.refreshUserPaidStatus(userId);
    }
    this.logger.log(`[webhook] handleRevenueCatWebhook: done`);
  }

  /**
   * TRANSFER: update appUserId from transferred_from to transferred_to so link at registration finds rows.
   */
  private async handleTransferEvent(event: RevenueCatWebhookPayload['event']): Promise<void> {
    const fromIds = event.transferred_from;
    const toIds = event.transferred_to;
    if (!fromIds?.length || !toIds?.length) {
      this.logger.warn('[webhook] handleTransferEvent: missing transferred_from or transferred_to, skipping');
      return;
    }
    const toId = toIds[0];
    for (const fromId of fromIds) {
      const result = await this.subscriptionRepository
        .createQueryBuilder()
        .update(Subscription)
        .set({ appUserId: toId })
        .where('appUserId = :fromId', { fromId })
        .execute();
      this.logger.log(
        `[webhook] handleTransferEvent: updated appUserId ${fromId} -> ${toId}, affected ${result.affected ?? 0} row(s)`,
      );
    }
  }

  /**
   * If app_user_id is from external signup (pending_payment), create user, update signup, save pending link, link subscriptions.
   */
  private async tryProcessExternalSignupPayment(
    appUserId: string,
    event: RevenueCatWebhookPayload['event'],
  ): Promise<void> {
    const signup = await this.externalSignupRepository.findOne({
      where: { appUserId, status: ExternalSignupStatus.PENDING_PAYMENT },
    });
    if (!signup) return;

    this.logger.log(`[webhook] external signup found id=${signup.id}, creating user and linking`);

    const meta = signup.meta;
    const programName = meta?.programName ?? '';
    const selectedProgram =
      meta?.programId != null && programName
        ? { id: meta.programId, name: programName }
        : null;
    const quizSnapshot = meta?.quizSnapshot ?? undefined;

    // Temporary password: same rules as registration (min 6 chars), 12 alphanumeric
    const ALPHANUM = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const tempPasswordLength = 12;
    let temporaryPassword = '';
    const bytes = randomBytes(tempPasswordLength);
    for (let i = 0; i < tempPasswordLength; i++) {
      temporaryPassword += ALPHANUM[bytes[i]! % ALPHANUM.length];
    }
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const user = this.userRepository.create({
      email: signup.email,
      roles: 'user',
      selectedProgram,
      quizSnapshot,
      needsOnboarding: true,
      passwordHash,
    });
    await this.userRepository.save(user);

    await this.emailService.sendExternalSignupPasswordEmail(signup.email, temporaryPassword);

    signup.status = ExternalSignupStatus.PAID;
    signup.userId = user.id;
    signup.paddleTransactionId = event.transaction_id || event.original_transaction_id || null;
    signup.paddleSubscriptionId = event.original_transaction_id || null;
    signup.meta = null;
    await this.externalSignupRepository.save(signup);

    await this.subscriptionPendingLinkService.save(appUserId, user.id, user.email);
    await this.linkSubscriptionsToUser(appUserId, user.id, user.email);

    this.logger.log(`[webhook] external signup: user id=${user.id} created, signup updated, link saved`);
  }

  /**
   * Upsert subscription by original_transaction_id (or fallback key). Creates row if missing; updates only if event_timestamp_ms >= lastEventTimestampMs. Does not overwrite existing non-null userId with null.
   */
  private async upsertSubscriptionFromWebhook(
    event: RevenueCatWebhookPayload['event'],
    resolvedUserId: number | undefined,
  ): Promise<void> {
    const upsertKey = this.getUpsertKey(event);
    if (!upsertKey) {
      this.logger.warn('[webhook] upsertSubscriptionFromWebhook: no upsert key (original_transaction_id or app_user_id), skipping');
      return;
    }

    const appUserId = event.app_user_id!;
    const productId = event.new_product_id ?? event.product_id;
    const status = this.computeStatusFromPayload(event);
    const planInterval = this.determinePlanInterval(productId);
    const priceInfo = this.extractPriceInfo(event);
    const eventTs = event.event_timestamp_ms ?? (event.expiration_at_ms ? event.expiration_at_ms + 1 : Date.now());

    const existing = await this.subscriptionRepository.findOne({
      where: { originalTransactionId: upsertKey },
    });

    if (existing) {
      const lastTs = existing.lastEventTimestampMs ? parseInt(existing.lastEventTimestampMs, 10) : 0;
      if (eventTs < lastTs) {
        this.logger.log(`[webhook] upsertSubscriptionFromWebhook: ignoring out-of-order event (event_timestamp_ms=${eventTs} < lastEventTimestampMs=${lastTs})`);
        return;
      }
      const updatePayload: Partial<Subscription> = {
        appUserId,
        productId,
        environment: event.environment,
        store: event.store ?? existing.store,
        status,
        planInterval,
        periodStart: this.resolveDate(event.purchased_at_ms, event.purchased_at),
        periodEnd: this.resolveDate(event.expiration_at_ms, event.expiration_at),
        lastEventTimestampMs: String(eventTs),
        userEmail: event.subscriber_attributes?.email?.value || undefined,
        metadata: event,
        price: priceInfo.price,
        currency: priceInfo.currency,
        priceInUsd: priceInfo.priceInUsd,
        externalSubscriptionId: event.transaction_id || event.original_transaction_id || event.entitlement_id,
      };
      if (status !== SubscriptionStatus.ACTIVE) {
        updatePayload.cancelledAt = new Date();
      }
      if (typeof resolvedUserId === 'number') {
        updatePayload.userId = resolvedUserId;
      }
      await this.subscriptionRepository.update(existing.id, updatePayload);
      this.logger.log(
        `[webhook] upsertSubscriptionFromWebhook: updated subscription id=${existing.id}, status=${status}, productId=${productId}`,
      );
      return;
    }

    const userIdToSet = typeof resolvedUserId === 'number' ? resolvedUserId : undefined;
    const provider =
      appUserId.startsWith('web_signup_') ? SubscriptionProvider.PADDLE : SubscriptionProvider.REVENUECAT;
    const subscription = this.subscriptionRepository.create({
      userId: userIdToSet,
      userEmail: event.subscriber_attributes?.email?.value || undefined,
      appUserId,
      provider,
      store: event.store,
      externalSubscriptionId: event.transaction_id || event.original_transaction_id || event.entitlement_id,
      originalTransactionId: upsertKey,
      lastEventTimestampMs: String(eventTs),
      productId,
      environment: event.environment,
      planInterval,
      status,
      price: priceInfo.price,
      currency: priceInfo.currency,
      priceInUsd: priceInfo.priceInUsd,
      periodStart: this.resolveDate(event.purchased_at_ms, event.purchased_at),
      periodEnd: this.resolveDate(event.expiration_at_ms, event.expiration_at),
      cancelledAt: status !== SubscriptionStatus.ACTIVE ? new Date() : undefined,
      metadata: event,
    });
    await this.subscriptionRepository.save(subscription);
    this.logger.log(
      `[webhook] upsertSubscriptionFromWebhook: created subscription id=${subscription.id}, originalTransactionId=${upsertKey}, status=${status}, productId=${productId}`,
    );
  }

  /** Key for upsert: original_transaction_id (preferred) or fallback app_user_id:transaction_id/product_id for legacy events. */
  private getUpsertKey(event: RevenueCatWebhookPayload['event']): string | null {
    if (event.original_transaction_id) {
      return event.original_transaction_id;
    }
    const appUserId = event.app_user_id;
    if (!appUserId) return null;
    const suffix = event.transaction_id || event.product_id || event.new_product_id || 'unknown';
    return `${appUserId}:${suffix}`;
  }

  /**
   * Compute subscription status from payload. PRODUCT_CHANGE is not mapped to cancelled; status is derived from expiration_at_ms and event type.
   */
  private computeStatusFromPayload(event: RevenueCatWebhookPayload['event']): SubscriptionStatus {
    switch (event.type) {
      case 'CANCELLATION':
        return SubscriptionStatus.CANCELLED;
      case 'EXPIRATION':
        return SubscriptionStatus.EXPIRED;
      case 'BILLING_ISSUE':
      case 'SUBSCRIPTION_PAUSED':
        return SubscriptionStatus.PAST_DUE;
      default:
        break;
    }
    const expMs = event.expiration_at_ms;
    if (expMs != null && expMs < Date.now()) {
      return SubscriptionStatus.EXPIRED;
    }
    if (['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'NON_RENEWING_PURCHASE', 'UNCANCELLATION', 'SUBSCRIPTION_RESUMED'].includes(event.type)) {
      return SubscriptionStatus.ACTIVE;
    }
    return SubscriptionStatus.UNKNOWN;
  }

  async requestCancellation(dto: CancelSubscriptionDto): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({ where: { id: dto.subscriptionId } });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const store = subscription.store;
    if (store === 'APP_STORE' || store === 'PLAY_STORE') {
      this.logger.log(
        `[cancel] requestCancellation: store=${store}, subscriptionId=${subscription.id} – must be cancelled in the app store`,
      );
      // Не меняем локальный статус: ждём вебхук RevenueCat после реальной отмены в сторе.
      throw new Error('This subscription can only be cancelled in the app store (App Store / Google Play).');
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
    this.logger.log(`[getLatest] getLatestSubscription called: userId=${userId ?? 'undefined'}`);
    if (!userId) {
      this.logger.log(`[getLatest] getLatestSubscription: no userId, returning null`);
      return null;
    }
    // Prefer paid (REVENUECAT/STRIPE) over trial (NONE); then by createdAt DESC
    const qb = this.subscriptionRepository
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .orderBy("CASE WHEN s.provider = 'none' THEN 1 ELSE 0 END", 'ASC')
      .addOrderBy('s.createdAt', 'DESC');
    const list = await qb.take(1).getMany();
    const sub = list[0] ?? null;
    this.logger.log(`[getLatest] getLatestSubscription(userId=${userId}): returning subscriptionId=${sub?.id ?? 'null'}, provider=${sub?.provider ?? 'null'}, isPaid=${sub ? sub.provider !== SubscriptionProvider.NONE : 'n/a'}`);
    return sub;
  }

  async getLatestSubscriptionSummary(userId?: number, language?: string): Promise<SubscriptionSummaryDto | null> {
    this.logger.log(`[getLatest] getLatestSubscriptionSummary called: userId=${userId ?? 'undefined'}, lang=${language ?? 'undefined'}`);
    const subscription = await this.getLatestSubscription(userId);
    if (!subscription) {
      this.logger.log(`[getLatest] getLatestSubscriptionSummary(userId=${userId}): no subscription, returning null`);
      return null;
    }
    this.logger.log(`[getLatest] getLatestSubscriptionSummary(userId=${userId}): building summary for subscriptionId=${subscription.id}, isPaid=${subscription.provider !== SubscriptionProvider.NONE}, productId=${subscription.productId ?? 'null'}`);

    const lang = language?.trim().toLowerCase() || 'en';
    const translations = this.languageService.getTranslationsByCode(lang);

    const planInterval = subscription.planInterval ?? SubscriptionPlanInterval.UNKNOWN;
    const status = subscription.status ?? SubscriptionStatus.UNKNOWN;
    const planKey = this.getPlanKey(subscription.productId, subscription.planInterval);

    const planIntervalLabelKey = `subscription_summary.plan_interval.${planInterval}`;
    const statusLabelKey = `subscription_summary.status.${status}`;
    const nameKey = planKey ? `subscription_summary.plans.${planKey}.name` : undefined;
    const descriptionKey = planKey ? `subscription_summary.plans.${planKey}.description` : undefined;

    const planIntervalLabel = resolveText(planIntervalLabelKey, translations);
    const statusLabel = resolveText(statusLabelKey, translations);
    const name = nameKey ? resolveText(nameKey, translations) : (subscription.productId ?? undefined);
    const description = descriptionKey ? resolveText(descriptionKey, translations) : undefined;

    const isPaid = subscription.provider !== SubscriptionProvider.NONE;

    return {
      productId: subscription.productId ?? undefined,
      planInterval,
      planIntervalLabel,
      name: (name || subscription.productId) ?? undefined,
      description,
      status,
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
    this.logger.log(`[webhook] closeActiveSubscriptions: appUserId=${appUserId.substring(0, 35)}..., productId=${productId ?? 'null'}`);
    const qb = this.subscriptionRepository
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: SubscriptionStatus.EXPIRED, cancelledAt: new Date() })
      .where('appUserId = :appUserId', { appUserId })
      .andWhere('status = :status', { status: SubscriptionStatus.ACTIVE });

    if (productId) {
      qb.andWhere('productId = :productId', { productId });
    }

    const result = await qb.execute();
    this.logger.log(`[webhook] closeActiveSubscriptions: UPDATE affected ${result.affected ?? 0} row(s)`);
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
    this.logger.log(`[webhook] updateExistingSubscriptionStatus: appUserId=${appUserId.substring(0, 35)}..., productId=${productId ?? 'null'}, status=${status}, userId=${userId ?? 'null'}`);
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

  /**
   * Legacy mapping; webhook flow uses computeStatusFromPayload instead. PRODUCT_CHANGE is not mapped to CANCELLED.
   */
  private mapRevenueCatStatus(eventType: string): SubscriptionStatus {
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'NON_RENEWING_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'SUBSCRIPTION_RESUMED':
      case 'PRODUCT_CHANGE':
        return SubscriptionStatus.ACTIVE;
      case 'CANCELLATION':
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
    this.logger.log(`[link] linkSubscriptionsToUser called: appUserId=${(appUserId ?? '').substring(0, 40)}, userId=${userId}`);
    if (!appUserId || !appUserId.trim()) {
      this.logger.log(`[link] linkSubscriptionsToUser skipped: appUserId empty`);
      return 0;
    }
    this.logger.log(`[link] linkSubscriptionsToUser: executing UPDATE subscriptions SET userId=${userId} WHERE appUserId=...`);
    const result = await this.subscriptionRepository
      .createQueryBuilder()
      .update(Subscription)
      .set({ userId, userEmail: email || undefined })
      .where('appUserId = :appUserId', { appUserId })
      .execute();

    const affected = result.affected ?? 0;
    this.logger.log(
      `[link] linkSubscriptionsToUser: UPDATE affected ${affected} row(s) for appUserId=${appUserId.substring(0, 30)}... → userId=${userId}`,
    );
    this.logger.log(`[link] linkSubscriptionsToUser: calling refreshUserPaidStatus(userId=${userId})`);
    await this.refreshUserPaidStatus(userId);
    return affected;
  }

  private async refreshUserPaidStatus(userId: number): Promise<void> {
    this.logger.log(`[refresh] refreshUserPaidStatus: userId=${userId}`);
    const latestSubscription = await this.getLatestSubscription(userId);
    const hasPaidSubscription = this.isPaidSubscriptionActive(latestSubscription);
    this.logger.log(`[refresh] refreshUserPaidStatus: userId=${userId}, latestSubscriptionId=${latestSubscription?.id ?? 'null'}, hasPaidSubscription=${hasPaidSubscription}`);
    await this.userRepository.update(userId, {
      hasPaidSubscription,
    });
    this.logger.log(`[refresh] refreshUserPaidStatus: user ${userId} updated hasPaidSubscription=${hasPaidSubscription}`);
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
    this.logger.log(`[trial] createTrialSubscription called: userId=${userId}`);
    const settings = this.settingsService.getSettings();
    const trialMode = settings.trialMode;
    const periodDays = trialMode.periodDays;
    this.logger.log(`[trial] createTrialSubscription: periodDays=${periodDays}`);

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

    const saved = await this.subscriptionRepository.save(subscription);
    this.logger.log(`[trial] createTrialSubscription: saved subscriptionId=${saved.id} for userId=${userId}`);
    return saved;
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
