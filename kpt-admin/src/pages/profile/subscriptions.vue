<route lang="yaml">
name: subscriptions
meta:
  layout: profile
</route>

<template>
  <v-container fluid>
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between flex-wrap gap-3">
          <h2 class="text-h5 font-weight-medium mb-0">Subscriptions</h2>
          <v-btn color="primary" variant="flat" @click="refreshData" :loading="isRefreshing">
            <v-icon start>mdi-refresh</v-icon>
            Refresh
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12">
        <v-card elevation="0" variant="tonal">
          <v-card-title class="pb-0">Filters</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <v-select
                  v-model="filters.planInterval.value"
                  :items="planIntervalOptions"
                  label="Plan interval"
                  clearable
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  @update:model-value="handleFilterChange"
                ></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="filters.status.value"
                  :items="statusOptions"
                  label="Status"
                  clearable
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  @update:model-value="handleFilterChange"
                ></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="filters.linked.value"
                  :items="linkedOptions"
                  label="Auth type"
                  clearable
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  @update:model-value="handleFilterChange"
                ></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="filters.productId.value"
                  label="Product ID"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  clearable
                  @update:model-value="handleFilterChange"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="filters.startDate.value"
                  label="Start date"
                  type="date"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  @update:model-value="handleFilterChange"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="filters.endDate.value"
                  label="End date"
                  type="date"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  @update:model-value="handleFilterChange"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12" md="3" v-for="card in planIntervalCards" :key="`plan-${card.key}`">
        <v-card class="stat-card" elevation="0" variant="outlined">
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-2">
              <v-icon :color="card.color">{{ card.icon }}</v-icon>
              <span class="text-caption text-medium-emphasis">{{ card.label }}</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ card.value }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12" md="3" v-for="card in statusCards" :key="`status-${card.key}`">
        <v-card class="stat-card" elevation="0" variant="outlined">
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-2">
              <v-icon :color="card.color">{{ card.icon }}</v-icon>
              <span class="text-caption text-medium-emphasis">{{ card.label }}</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ card.value }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-card elevation="0" variant="outlined">
          <v-card-title>Totals</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6" v-for="card in totalCards" :key="card.key">
                <div class="stat-block pa-4">
                  <div class="text-caption text-medium-emphasis mb-1">{{ card.label }}</div>
                  <div class="text-h5 font-weight-bold">{{ card.value }}</div>
                  <div class="text-caption text-medium-emphasis">{{ card.startDate }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card elevation="0" variant="outlined">
          <v-card-title>Revenue (USD)</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6" v-for="card in revenueCards" :key="card.key">
                <div class="stat-block pa-4">
                  <div class="text-caption text-medium-emphasis mb-1">{{ card.label }}</div>
                  <div class="text-h5 font-weight-bold">{{ card.value }}</div>
                  <div class="text-caption text-medium-emphasis">{{ card.startDate }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12">
        <v-card elevation="0" variant="outlined">
          <v-card-title>Auth breakdown</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4" v-for="card in authPlanCards" :key="`auth-${card.key}`">
                <div class="stat-block pa-4">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-subtitle-2">{{ card.label }}</span>
                    <v-chip size="small" color="primary" variant="tonal">{{ card.total }}</v-chip>
                  </div>
                  <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                    <span>Linked</span>
                    <span>{{ card.linked }}</span>
                  </div>
                  <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                    <span>Anonymous</span>
                    <span>{{ card.anonymous }}</span>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="4" v-for="card in authSummaryCards" :key="`auth-summary-${card.key}`">
                <div class="stat-block pa-4">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-subtitle-2">{{ card.label }}</span>
                    <v-chip size="small" color="primary" variant="tonal">{{ card.total }}</v-chip>
                  </div>
                  <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                    <span>Linked</span>
                    <span>{{ card.linked }}</span>
                  </div>
                  <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                    <span>Anonymous</span>
                    <span>{{ card.anonymous }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis mt-2">{{ card.startDate }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="0" variant="outlined">
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Subscriptions</span>
            <v-chip color="primary" variant="tonal" size="small">
              Total: {{ paginationTotalCount }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="tableHeaders"
              :items="subscriptionsList"
              :items-per-page="pageSize"
              :page="paginationPage"
              item-key="id"
              class="elevation-0"
              density="compact"
              hide-default-footer
            >
              <template #item.user="{ item }">
                <div>
                  <div class="font-weight-medium">{{ item.userEmail || '—' }}</div>
                  <div class="text-caption text-medium-emphasis">
                    ID: {{ item.userId ?? '—' }} | App: {{ item.appUserId || '—' }}
                  </div>
                </div>
              </template>
              <template #item.planInterval="{ item }">
                <v-chip size="small" color="primary" variant="tonal">
                  {{ formatPlanInterval(item.planInterval) }}
                </v-chip>
              </template>
              <template #item.status="{ item }">
                <v-chip size="small" :color="statusColor(item.status)" variant="tonal">
                  {{ formatStatus(item.status) }}
                </v-chip>
              </template>
              <template #item.price="{ item }">
                <div class="text-right">
                  <div>{{ formatPrice(item) }}</div>
                  <div class="text-caption text-medium-emphasis" v-if="item.priceInUsd && item.priceInUsd !== item.price">
                    USD {{ item.priceInUsd }}
                  </div>
                </div>
              </template>
              <template #item.period="{ item }">
                <div>
                  <div>{{ item.periodStart || '—' }}</div>
                  <div class="text-caption text-medium-emphasis">{{ item.periodEnd || '—' }}</div>
                </div>
              </template>
              <template #item.timestamps="{ item }">
                <div>
                  <div>Created: {{ item.createdAt }}</div>
                  <div class="text-caption text-medium-emphasis">Updated: {{ item.updatedAt }}</div>
                  <div class="text-caption text-medium-emphasis" v-if="item.cancelledAt">
                    Cancelled: {{ item.cancelledAt }}
                  </div>
                </div>
              </template>
            </v-data-table>

            <div class="d-flex justify-end mt-4" v-if="paginationLastPage > 1">
              <v-pagination
                v-model="filters.page.value"
                :length="paginationLastPage"
                rounded="circle"
                active-color="primary"
                @update:model-value="handlePageChange"
              ></v-pagination>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import {
  SubscriptionsService,
  type SubscriptionModel,
  type SubscriptionStats,
  type SubscriptionPlanInterval,
  type SubscriptionStatus,
} from '@api'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { PaginationWorker } from '@workers/pagination-worker'
import { DEFAULT_PAGE_SIZE } from '@workers/pagination-worker/pagination.helpers'
import { FilterPatch } from '@api/filter.patch'

const route = useRoute()
const router = useRouter()

const defaultStartDate = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
const defaultEndDate = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')

const stripEq = (value?: string | null): string | undefined =>
  typeof value === 'string' && value.startsWith('$eq:') ? value.slice(4) : value ?? undefined

const initialStats = route.meta.subscriptionStats as SubscriptionStats | undefined
const initialSubscriptions = route.meta.subscriptions as
  | { data: SubscriptionModel[]; meta?: { itemsPerPage?: number; totalItems?: number; currentPage?: number; totalPages?: number } }
  | undefined

const stats = ref<SubscriptionStats>(
  initialStats ?? {
    countByPlanInterval: {},
    countByStatus: {},
    totals: {
      month: { count: 0, startDate: defaultStartDate },
      year: { count: 0, startDate: defaultStartDate },
    },
    revenue: {
      month: { amount: 0, currency: 'USD', startDate: defaultStartDate },
      year: { amount: 0, currency: 'USD', startDate: defaultStartDate },
    },
    authBreakdown: {
      byPlanInterval: [],
      month: { linked: 0, anonymous: 0, startDate: defaultStartDate },
      year: { linked: 0, anonymous: 0, startDate: defaultStartDate },
    },
  },
)

const initialPage = Number(route.query.page ?? initialSubscriptions?.meta?.currentPage ?? 1) || 1
const pageSize = initialSubscriptions?.meta?.itemsPerPage ?? DEFAULT_PAGE_SIZE

const planIntervalQuery = stripEq(route.query.planInterval as string | undefined)
const statusQuery = stripEq(route.query.status as string | undefined)
const productQuery = stripEq(route.query.productId as string | undefined)
const linkedQuery = route.query.linked as string | undefined
const startDateQuery = (route.query.startDate as string | undefined) ?? defaultStartDate
const endDateQuery = (route.query.endDate as string | undefined) ?? defaultEndDate

const {
  filters,
  getRawFilters,
} = FilterPatch({
  router,
  filters: {
    page: {
      type: Number,
      value: initialPage,
      default: initialPage,
    },
    planInterval: {
      type: String,
      value: (planIntervalQuery as SubscriptionPlanInterval | undefined) ?? '',
      default: '',
    },
    status: {
      type: String,
      value: (statusQuery as SubscriptionStatus | undefined) ?? '',
      default: '',
    },
    productId: {
      type: String,
      value: productQuery ?? '',
      default: '',
    },
    linked: {
      type: String,
      value: linkedQuery ?? '',
      default: '',
    },
    startDate: {
      type: String,
      value: startDateQuery,
      default: defaultStartDate,
    },
    endDate: {
      type: String,
      value: endDateQuery,
      default: defaultEndDate,
    },
  },
  afterUpdateFiltersCallBack: async () => {
    await reloadAll({ reset: true })
  },
})

const {
  paginationElements: subscriptionsList,
  paginationPage,
  paginationTotalCount,
  paginationLastPage,
  paginationClearData,
  paginationLoad,
} = PaginationWorker<SubscriptionModel>({
  notToConcatElements: true,
  paginationDataRequest: (page) => SubscriptionsService.getSubscriptions(buildQueryParams(page)),
})

subscriptionsList.value = Array.isArray(initialSubscriptions?.data) ? initialSubscriptions!.data : []
paginationTotalCount.value = initialSubscriptions?.meta?.totalItems ?? subscriptionsList.value.length
paginationLastPage.value = initialSubscriptions?.meta?.totalPages ?? 1
paginationPage.value = initialSubscriptions?.meta?.currentPage ?? initialPage

const isRefreshing = ref(false)

const planIntervalOptions = [
  { title: 'Monthly', value: 'monthly' },
  { title: 'Yearly', value: 'yearly' },
  { title: 'Unknown', value: 'unknown' },
]

const statusOptions = [
  { title: 'Active', value: 'active' },
  { title: 'Expired', value: 'expired' },
  { title: 'Cancelled', value: 'cancelled' },
  { title: 'Past due', value: 'past_due' },
  { title: 'Unknown', value: 'unknown' },
]

const linkedOptions = [
  { title: 'Linked accounts', value: 'linked' },
  { title: 'Anonymous accounts', value: 'anonymous' },
]

const planIntervalCards = computed(() => {
  const data = stats.value.countByPlanInterval ?? {}
  return [
    { key: 'monthly', label: 'Monthly', value: data.monthly ?? 0, icon: 'mdi-calendar-month', color: 'primary' },
    { key: 'yearly', label: 'Yearly', value: data.yearly ?? 0, icon: 'mdi-calendar-range', color: 'orange' },
    { key: 'unknown', label: 'Unknown', value: data.unknown ?? 0, icon: 'mdi-help-circle-outline', color: 'grey' },
  ]
})

const statusCards = computed(() => {
  const data = stats.value.countByStatus ?? {}
  return [
    { key: 'active', label: 'Active', value: data.active ?? 0, icon: 'mdi-check-circle', color: 'success' },
    { key: 'expired', label: 'Expired', value: data.expired ?? 0, icon: 'mdi-clock-alert', color: 'warning' },
    { key: 'cancelled', label: 'Cancelled', value: data.cancelled ?? 0, icon: 'mdi-cancel', color: 'error' },
    { key: 'past_due', label: 'Past due', value: data.past_due ?? 0, icon: 'mdi-alert-circle', color: 'error' },
  ]
})

const totalCards = computed(() => [
  {
    key: 'month',
    label: 'Last month',
    value: stats.value.totals.month.count,
    startDate: stats.value.totals.month.startDate,
  },
  {
    key: 'year',
    label: 'Last year',
    value: stats.value.totals.year.count,
    startDate: stats.value.totals.year.startDate,
  },
])

const revenueCards = computed(() => [
  {
    key: 'month',
    label: 'Last month',
    value: stats.value.revenue.month.amount.toFixed(2),
    startDate: stats.value.revenue.month.startDate,
  },
  {
    key: 'year',
    label: 'Last year',
    value: stats.value.revenue.year.amount.toFixed(2),
    startDate: stats.value.revenue.year.startDate,
  },
])

const authPlanCards = computed(() =>
  (stats.value.authBreakdown.byPlanInterval ?? []).map((entry) => ({
    key: entry.planInterval,
    label: formatPlanInterval(entry.planInterval),
    linked: entry.linked,
    anonymous: entry.anonymous,
    total: entry.linked + entry.anonymous,
  })),
)

const authSummaryCards = computed(() => [
  {
    key: 'month',
    label: 'Last month',
    linked: stats.value.authBreakdown.month.linked,
    anonymous: stats.value.authBreakdown.month.anonymous,
    total: stats.value.authBreakdown.month.linked + stats.value.authBreakdown.month.anonymous,
    startDate: stats.value.authBreakdown.month.startDate,
  },
  {
    key: 'year',
    label: 'Last year',
    linked: stats.value.authBreakdown.year.linked,
    anonymous: stats.value.authBreakdown.year.anonymous,
    total: stats.value.authBreakdown.year.linked + stats.value.authBreakdown.year.anonymous,
    startDate: stats.value.authBreakdown.year.startDate,
  },
])

const tableHeaders = [
  { title: 'Subscription ID', key: 'id', sortable: false },
  { title: 'User', key: 'user', sortable: false },
  { title: 'Plan', key: 'planInterval', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Product', key: 'productId', sortable: false },
  { title: 'Environment', key: 'environment', sortable: false },
  { title: 'Price', key: 'price', sortable: false },
  { title: 'Period', key: 'period', sortable: false },
  { title: 'Timestamps', key: 'timestamps', sortable: false },
]

const buildQueryParams = (pageOverride?: number) => {
  const rawFilters = getRawFilters()
  const page = pageOverride ?? Number(rawFilters.page ?? 1)
  const limit = pageSize

  const stripEq = (value?: unknown) => {
    if (typeof value !== 'string') return undefined
    const trimmed = value.trim()
    if (!trimmed) return undefined
    return trimmed.startsWith('$eq:') ? trimmed.slice(4) : trimmed
  }

  return {
    page,
    limit,
    planInterval: stripEq(rawFilters.planInterval) as SubscriptionPlanInterval | undefined,
    status: stripEq(rawFilters.status) as SubscriptionStatus | undefined,
    productId: stripEq(rawFilters.productId),
    linked: stripEq(rawFilters.linked) as 'linked' | 'anonymous' | undefined,
    startDate: stripEq(rawFilters.startDate),
    endDate: stripEq(rawFilters.endDate),
  }
}

const buildStatsParams = () => {
  const params = buildQueryParams(filters.value.page.value)
  delete params.page
  delete params.limit
  return params
}

const loadStats = async () => {
  const response = await SubscriptionsService.getStats(buildStatsParams())
  stats.value = response
}

const reloadAll = async ({ reset = false, force = false }: { reset?: boolean; force?: boolean } = {}) => {
  if (reset) {
    paginationClearData()
    filters.value.page.value = 1
  }

  await asyncGlobalSpinner(
    Promise.all([
      loadStats(),
      paginationLoad({
        pageNumber: Number(filters.value.page.value) || 1,
        forceUpdate: force,
      }),
    ]),
  )
}

const refreshData = async () => {
  try {
    isRefreshing.value = true
    await reloadAll({ force: true, reset: true })
  } finally {
    isRefreshing.value = false
  }
}

const handleFilterChange = () => {
  filters.value.page.value = 1
}

const handlePageChange = (page: number) => {
  filters.value.page.value = page
}

const formatPlanInterval = (value: SubscriptionPlanInterval | string | undefined) => {
  switch (value) {
    case 'monthly':
      return 'Monthly'
    case 'yearly':
      return 'Yearly'
    case 'unknown':
    default:
      return 'Unknown'
  }
}

const formatStatus = (value: SubscriptionStatus | string | undefined) => {
  switch (value) {
    case 'active':
      return 'Active'
    case 'expired':
      return 'Expired'
    case 'cancelled':
      return 'Cancelled'
    case 'past_due':
      return 'Past due'
    default:
      return 'Unknown'
  }
}

const statusColor = (value: SubscriptionStatus | string | undefined) => {
  switch (value) {
    case 'active':
      return 'success'
    case 'expired':
      return 'warning'
    case 'cancelled':
      return 'error'
    case 'past_due':
      return 'error'
    default:
      return 'grey'
  }
}

const formatPrice = (subscription: SubscriptionModel) => {
  if (subscription.price) {
    const currency = subscription.currency || ''
    return currency ? `${currency} ${subscription.price}` : subscription.price
  }
  if (subscription.priceInUsd) {
    return `USD ${subscription.priceInUsd}`
  }
  return '—'
}
</script>

<style scoped>
.stat-card {
  height: 100%;
}

.stat-block {
  border-radius: 12px;
  background-color: rgba(0, 0, 0, 0.02);
}
</style>

