import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'
import { formatDateSafe } from '../utils/date'
import type { PaginatedResponse } from '../interfaces'

export type SubscriptionPlanInterval = 'monthly' | 'yearly' | 'unknown'
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'past_due' | 'unknown'

export interface SubscriptionModel {
  id: string
  userId?: number | null
  userEmail?: string | null
  appUserId?: string | null
  provider: string
  externalSubscriptionId?: string | null
  productId?: string | null
  environment?: string | null
  planInterval: SubscriptionPlanInterval
  status: SubscriptionStatus
  price?: string | null
  currency?: string | null
  priceInUsd?: string | null
  periodStart?: string | null
  periodEnd?: string | null
  cancelledAt?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface SubscriptionStats {
  countByPlanInterval: Record<string, number>
  countByStatus: Record<string, number>
  totals: {
    month: { count: number; startDate: string }
    year: { count: number; startDate: string }
  }
  revenue: {
    month: { amount: number; currency: string; startDate: string }
    year: { amount: number; currency: string; startDate: string }
  }
  authBreakdown: {
    byPlanInterval: Array<{ planInterval: SubscriptionPlanInterval; linked: number; anonymous: number }>
    month: { linked: number; anonymous: number; startDate: string }
    year: { linked: number; anonymous: number; startDate: string }
  }
}

export type SubscriptionProvider = 'revenuecat' | 'stripe' | 'none'

export interface SubscriptionFilters {
  planInterval?: SubscriptionPlanInterval | ''
  status?: SubscriptionStatus | ''
  provider?: SubscriptionProvider | ''
  linked?: 'linked' | 'anonymous'
  startDate?: string
  endDate?: string
}

export interface SubscriptionQueryParams extends SubscriptionFilters {
  page?: number
  limit?: number
}

const ensureNumber = (value: unknown): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : 0
}

const normalizeCountMap = (source?: Record<string, number | string>): Record<string, number> => {
  const result: Record<string, number> = {}

  Object.entries(source ?? {}).forEach(([key, value]) => {
    result[key] = ensureNumber(value)
  })

  return result
}

const normalizeStats = (stats?: SubscriptionStats | null): SubscriptionStats => {
  const defaultDate = new Date().toISOString()

  return {
    countByPlanInterval: normalizeCountMap(stats?.countByPlanInterval),
    countByStatus: normalizeCountMap(stats?.countByStatus),
    totals: {
      month: {
        count: ensureNumber(stats?.totals?.month?.count),
        startDate: stats?.totals?.month?.startDate ?? defaultDate,
      },
      year: {
        count: ensureNumber(stats?.totals?.year?.count),
        startDate: stats?.totals?.year?.startDate ?? defaultDate,
      },
    },
    revenue: {
      month: {
        amount: ensureNumber(stats?.revenue?.month?.amount),
        currency: stats?.revenue?.month?.currency ?? 'USD',
        startDate: stats?.revenue?.month?.startDate ?? defaultDate,
      },
      year: {
        amount: ensureNumber(stats?.revenue?.year?.amount),
        currency: stats?.revenue?.year?.currency ?? 'USD',
        startDate: stats?.revenue?.year?.startDate ?? defaultDate,
      },
    },
    authBreakdown: {
      byPlanInterval: (stats?.authBreakdown?.byPlanInterval ?? []).map((entry) => ({
        planInterval: entry.planInterval ?? 'unknown',
        linked: ensureNumber(entry.linked),
        anonymous: ensureNumber(entry.anonymous),
      })),
      month: {
        linked: ensureNumber(stats?.authBreakdown?.month?.linked),
        anonymous: ensureNumber(stats?.authBreakdown?.month?.anonymous),
        startDate: stats?.authBreakdown?.month?.startDate ?? defaultDate,
      },
      year: {
        linked: ensureNumber(stats?.authBreakdown?.year?.linked),
        anonymous: ensureNumber(stats?.authBreakdown?.year?.anonymous),
        startDate: stats?.authBreakdown?.year?.startDate ?? defaultDate,
      },
    },
  }
}

const formatDateField = (value?: string | null): string | null => {
  if (!value) {
    return value ?? null
  }
  return formatDateSafe(value) ?? value
}

const formatSubscription = (subscription: SubscriptionModel): SubscriptionModel => ({
  ...subscription,
  periodStart: formatDateField(subscription.periodStart),
  periodEnd: formatDateField(subscription.periodEnd),
  cancelledAt: formatDateField(subscription.cancelledAt),
  createdAt: formatDateField(subscription.createdAt) ?? subscription.createdAt,
  updatedAt: formatDateField(subscription.updatedAt) ?? subscription.updatedAt,
})

const buildQueryParams = (
  filters: SubscriptionQueryParams = {},
  options: { useFilterPrefix?: boolean } = {},
): Record<string, unknown> => {
  const { useFilterPrefix = true } = options
  const params: Record<string, unknown> = {}

  if (filters.page) {
    params.page = filters.page
  }
  if (filters.limit) {
    params.limit = filters.limit
  }

  const setFilter = (key: string, value: unknown, { useEqualityPrefix = false } = {}) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    const paramKey = useFilterPrefix ? `filter.${key}` : key
    if (useEqualityPrefix && useFilterPrefix) {
      params[paramKey] = `$eq:${value}`
    } else {
      params[paramKey] = value
    }
  }

  setFilter('planInterval', filters.planInterval, { useEqualityPrefix: true })
  setFilter('status', filters.status, { useEqualityPrefix: true })
  setFilter('provider', filters.provider, { useEqualityPrefix: true })
  setFilter('linked', filters.linked)
  setFilter('startDate', filters.startDate)
  setFilter('endDate', filters.endDate)

  return params
}

export class SubscriptionsService {
  static async getSubscriptions(params: SubscriptionQueryParams = {}): Promise<PaginatedResponse<SubscriptionModel>> {
    const response = await axios.get<PaginatedResponse<SubscriptionModel>, PaginatedResponse<SubscriptionModel>>(
      ApiBaseUrl.Subscriptions,
      {
        params: buildQueryParams(params),
      },
    )

    return {
      ...response,
      data: response.data.map(formatSubscription),
    }
  }

  static async getStats(filters: SubscriptionFilters = {}): Promise<SubscriptionStats> {
    const response = await axios.get<SubscriptionStats, SubscriptionStats>(`${ApiBaseUrl.Subscriptions}/stats`, {
      params: buildQueryParams(filters, { useFilterPrefix: false }),
    })

    return normalizeStats(response)
  }

  static async getUserSubscriptions(
    userId: number,
    params: SubscriptionQueryParams = {},
  ): Promise<PaginatedResponse<SubscriptionModel>> {
    const queryParams = {
      userId,
      ...buildQueryParams(params),
    }

    const response = await axios.get<PaginatedResponse<SubscriptionModel>, PaginatedResponse<SubscriptionModel>>(
      `${ApiBaseUrl.Subscriptions}/user`,
      {
        params: queryParams,
      },
    )

    return {
      ...response,
      data: response.data.map(formatSubscription),
    }
  }

  static async getUserStats(userId: number, filters: SubscriptionFilters = {}): Promise<SubscriptionStats> {
    const response = await axios.get<SubscriptionStats, SubscriptionStats>(
      `${ApiBaseUrl.Subscriptions}/user/${userId}/stats`,
      {
        params: buildQueryParams(filters, { useFilterPrefix: false }),
      },
    )

    return normalizeStats(response)
  }

  static async getUserLatestSubscription(userId: number): Promise<SubscriptionModel | null> {
    const latest = await axios.get<SubscriptionModel | null, SubscriptionModel | null>(
      `${ApiBaseUrl.Subscriptions}/user/${userId}/latest`,
    )

    return latest ? formatSubscription(latest) : null
  }
}

