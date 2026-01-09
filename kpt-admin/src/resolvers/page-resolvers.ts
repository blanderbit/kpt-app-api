import type { NavigationGuard, RouteLocationNormalized } from 'vue-router'
import { ResolverStore, routerAuthResolver, routerResolverByLoginPage } from '@workers/resolver-worker'
import {
  QueueService,
  LanguagesService,
  AdminsService,
  MoodTypesService,
  ActivityTypesService,
  SocialNetworksService,
  OnboardingQuestionsService,
  BackupService,
  MoodSurveysService,
  SurveysService,
  ArticlesService,
  ClientsService,
  StatsService,
  SettingsService,
  TooltipsService,
  NotificationsService,
  SubscriptionsService,
  type SubscriptionPlanInterval,
  type SubscriptionStatus,
  type SubscriptionFilters,
} from '@api'
import { DEFAULT_PAGE_SIZE, SMALL_PAGE_SIZE, normalizePageSize } from '@workers/pagination-worker/pagination.helpers'
import dayjs from 'dayjs'

export const resolverStore = new ResolverStore()

type QueryValue = RouteLocationNormalized['query'][string]

const normalizeQueryNumber = (value: QueryValue, fallback: number): number => {
  const candidate = Array.isArray(value) ? value[0] : value
  const parsed = Number(candidate ?? fallback)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

const normalizeQueryString = (value: QueryValue): string | undefined => {
  const candidate = Array.isArray(value) ? value[0] : value
  return typeof candidate === 'string' ? candidate : undefined
}

const normalizeQueryBoolean = (value: QueryValue): boolean | undefined => {
  const candidate = Array.isArray(value) ? value[0] : value

  if (typeof candidate === 'string') {
    if (candidate === 'true') return true
    if (candidate === 'false') return false
  }

  if (typeof candidate === 'boolean') {
    return candidate
  }

  return undefined
}

interface PageResolverConfig {
  componentName: string
  resolver: NavigationGuard
}

const createComponentResolver = (
  componentName: string,
  resolver: NavigationGuard,
): PageResolverConfig => ({ componentName, resolver })

export const pageLoadData: PageResolverConfig[] = [
  createComponentResolver(
    'login',
    routerResolverByLoginPage,
  ),
  createComponentResolver(
    'queue',
    routerAuthResolver.routeInterceptor(() => ({
      queueList: () => QueueService.getList(),
      queueNames: () => QueueService.getNames(),
    })),
  ),
  createComponentResolver(
    'settings',
    routerAuthResolver.routeInterceptor(() => ({
      settings: () => SettingsService.getSettings(),
    })),
  ),
  createComponentResolver(
    'languages',
    routerAuthResolver.routeInterceptor(() => ({
      languageCache: () => LanguagesService.getCache(),
      languageStatistics: () => LanguagesService.getStatistics(),
      settings: () => SettingsService.getSettings(),
    })),
  ),
  createComponentResolver(
    'languages-create',
    routerAuthResolver.routeInterceptor(() => ({
      languageCache: () => LanguagesService.getCache(),
    })),
  ),
  createComponentResolver(
    'languages-edit',
    routerAuthResolver.routeInterceptor((to) => ({
      languageCache: () => LanguagesService.getCache(),
      language: () => LanguagesService.getById(to.params.id as string),
    })),
  ),
  createComponentResolver(
    'languages-archived',
    routerAuthResolver.routeInterceptor(() => ({
      archivedLanguagesCache: () => LanguagesService.getArchivedCache(),
    })),
  ),
  createComponentResolver(
    'admins',
    routerAuthResolver.routeInterceptor((to) => {
      const page = normalizeQueryNumber(to.query.page, 1)
      const limit = normalizePageSize(to.query.limit, DEFAULT_PAGE_SIZE)
      const emailVerified = normalizeQueryBoolean(to.query.emailVerified)

      return {
        adminStats: () => AdminsService.getAdminsStats(),
        adminUsers: () => AdminsService.getUsers({
          roles: '$eq:admin',
          page,
          limit,
          emailVerified,
        }),
      }
    }),
  ),
  createComponentResolver(
    'mood-types',
    routerAuthResolver.routeInterceptor(() => ({
      moodTypes: () => MoodTypesService.getAll(),
      moodTypesStats: () => MoodTypesService.getStats(),
      settings: () => SettingsService.getSettings(),
    })),
  ),
  createComponentResolver(
    'activity-types',
    routerAuthResolver.routeInterceptor(() => ({
      activityTypes: () => ActivityTypesService.getAll(),
      activityTypesStats: () => ActivityTypesService.getStats(),
      settings: () => SettingsService.getSettings(),
    })),
  ),
  createComponentResolver(
    'social-networks',
    routerAuthResolver.routeInterceptor(() => ({
      socialNetworks: () => SocialNetworksService.getAll(),
      socialNetworksStats: () => SocialNetworksService.getStats(),
      settings: () => SettingsService.getSettings(),
    })),
  ),
  createComponentResolver(
    'onboarding-questions',
    routerAuthResolver.routeInterceptor(() => ({
      onboardingSteps: () => OnboardingQuestionsService.getAll(),
      onboardingStats: () => OnboardingQuestionsService.getStats(),
      settings: () => SettingsService.getSettings(),
    })),
  ),
  createComponentResolver(
    'backup',
    routerAuthResolver.routeInterceptor(() => ({
      backups: () => BackupService.getList(),
    })),
  ),
  createComponentResolver(
    'mood-surveys',
    routerAuthResolver.routeInterceptor((to) => {
      const page = normalizeQueryNumber(to.query.page, 1)
      const limit = normalizePageSize(to.query.limit, SMALL_PAGE_SIZE)
      const language = normalizeQueryString(to.query.language)

      return {
        activeSurveys: () => MoodSurveysService.getAll(language),
        archivedSurveys: () => MoodSurveysService.getArchived(language),
        languages: () => LanguagesService.getCache(),
      }
    }),
  ),
  createComponentResolver(
    'surveys',
    routerAuthResolver.routeInterceptor((to) => {
      const page = normalizeQueryNumber(to.query.page, 1)
      const limit = normalizePageSize(to.query.limit, SMALL_PAGE_SIZE)

      return {
        surveys: () => SurveysService.getSurveys({
          page,
          limit,
          'filter.status': to.query['filter.status'] || '$eq:active',
        }),
        languages: () => LanguagesService.getCache(),
      }
    }),
  ),
  createComponentResolver(
    'tooltips',
    routerAuthResolver.routeInterceptor(() => ({
      tooltips: () => TooltipsService.getTooltipTableItems(),
      tooltipTypes: () => TooltipsService.getTooltipTypes(),
      tooltipPages: () => TooltipsService.getPages(),
      languages: () => LanguagesService.getCache(),
    })),
  ),
  createComponentResolver(
    'articles',
    routerAuthResolver.routeInterceptor((to) => {
      const page = normalizeQueryNumber(to.query.page, 1)
      const limit = normalizePageSize(to.query.limit, SMALL_PAGE_SIZE)

      return {
        articles: () => ArticlesService.getArticles({
          page,
          limit,
          'filter.status': to.query['filter.status'] || `$eq:active`,
        }),
        languages: () => LanguagesService.getCache(),
      }
    }),
  ),
  createComponentResolver(
    'subscriptions',
    routerAuthResolver.routeInterceptor((to) => {
      const page = normalizeQueryNumber(to.query.page, 1)
      const limit = normalizePageSize(to.query.limit, DEFAULT_PAGE_SIZE)

      const stripEq = (value?: string): string | undefined =>
        value?.startsWith('$eq:') ? value.slice(4) : value

      const planInterval = stripEq(normalizeQueryString(to.query.planInterval)) as
        | SubscriptionPlanInterval
        | undefined
      const status = stripEq(normalizeQueryString(to.query.status)) as SubscriptionStatus | undefined
      const linked = normalizeQueryString(to.query.linked) as 'linked' | 'anonymous' | undefined
      const startDate = normalizeQueryString(to.query.startDate)
      const endDate = normalizeQueryString(to.query.endDate)

      const baseFilters: SubscriptionFilters = {
        planInterval,
        status,
        linked,
        startDate,
        endDate,
      }

      return {
        subscriptionStats: () => SubscriptionsService.getStats(baseFilters),
        subscriptions: () =>
          SubscriptionsService.getSubscriptions({
            ...baseFilters,
            page,
            limit,
          }),
      }
    }),
  ),
  createComponentResolver(
    'clients',
    routerAuthResolver.routeInterceptor((to) => {
      const page = normalizeQueryNumber(to.query.page, 1)
      const limit = normalizePageSize(to.query.limit, DEFAULT_PAGE_SIZE)
      const search = normalizeQueryString(to.query.search)
      
      // Extract filter parameters
      const emailVerified = normalizeQueryString(to.query['filter.emailVerified'])
      const firstName = normalizeQueryString(to.query['filter.firstName'])
      const theme = normalizeQueryString(to.query['filter.theme'])
      const initSatisfactionLevel = normalizeQueryString(to.query['filter.initSatisfactionLevel'])
      const initHardnessLevel = normalizeQueryString(to.query['filter.initHardnessLevel'])

      const params: any = {
        page,
        limit,
        search,
      }

      // Add filters if they exist
      if (emailVerified) {
        params['filter.emailVerified'] = emailVerified
      }
      if (firstName) {
        params['filter.firstName'] = firstName
      }
      if (theme) {
        params['filter.theme'] = theme
      }
      if (initSatisfactionLevel) {
        params['filter.initSatisfactionLevel'] = initSatisfactionLevel
      }
      if (initHardnessLevel) {
        params['filter.initHardnessLevel'] = initHardnessLevel
      }

      return {
        clients: () => ClientsService.getClients(params),
        languages: () => LanguagesService.getCache(),
      }
    }),
  ),
  createComponentResolver(
    'clients-id',
    routerAuthResolver.routeInterceptor((to) => {
      const clientId = Number.parseInt(String(to.params.id), 10)
      const today = dayjs().format('YYYY-MM-DD')
      const currentMonth = dayjs().month() + 1
      const currentYear = dayjs().year()
      const defaultStartDate = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
      const defaultEndDate = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
      
      const surveysPage = normalizeQueryNumber(to.query.surveysPage, 1)
      const surveysLimit = normalizePageSize(to.query.surveysLimit, SMALL_PAGE_SIZE)
      const articlesPage = normalizeQueryNumber(to.query.articlesPage, 1)
      const articlesLimit = normalizePageSize(to.query.articlesLimit, SMALL_PAGE_SIZE)
      const devicesPage = normalizeQueryNumber(to.query.devicesPage, 1)
      const devicesLimit = normalizePageSize(to.query.devicesLimit, SMALL_PAGE_SIZE)

      return {
        client: () => ClientsService.getClient(clientId),
        activities: () => ClientsService.getClientActivities(clientId, today),
        suggestedActivities: () => ClientsService.getClientSuggestedActivities(clientId),
        moodTracker: () => ClientsService.getClientMoodTrackerMonthly(clientId, currentYear, currentMonth),
        analytics: () => ClientsService.getClientAnalytics(clientId),
        surveys: () => ClientsService.getClientSurveys(clientId, { page: surveysPage, limit: surveysLimit }),
        articles: () => ClientsService.getClientArticles(clientId, { page: articlesPage, limit: articlesLimit }),
        notificationDevices: () => NotificationsService.getDevices(clientId, { page: devicesPage, limit: devicesLimit }),
        notificationTracker: () => NotificationsService.getNotificationTracker(clientId),
        articleAnalytics: () => ArticlesService.getUserArticlesAnalytics(clientId),
        clientSubscriptions: () =>
          SubscriptionsService.getUserSubscriptions(clientId, {
            page: normalizeQueryNumber(to.query.subscriptionsPage, 1),
            limit: normalizePageSize(to.query.subscriptionsLimit, DEFAULT_PAGE_SIZE),
          }),
        clientSubscriptionStats: () =>
          SubscriptionsService.getUserStats(clientId, {
            year: normalizeQueryNumber(to.query.subscriptionStatsYear, new Date().getFullYear()),
          }),
        clientLatestSubscription: () => SubscriptionsService.getUserLatestSubscription(clientId),
        moodSurveyAnswersStats: () => MoodSurveysService.getUserAnswersStats(clientId),
        closedTooltips: () => TooltipsService.getClosedTooltipsByUserId(clientId),
      }
    }),
  ),
  createComponentResolver(
    'notifications',
    routerAuthResolver.routeInterceptor(() => ({
      stats: () => NotificationsService.getStats(),
    })),
  ),
  createComponentResolver(
    'users-stats',
    routerAuthResolver.routeInterceptor(() => {
      const lastMonth = dayjs().subtract(1, 'month').startOf('month')
      const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month')

      const filters = {
        dateFrom: lastMonth.format('YYYY-MM-DD'),
        dateTo: lastMonthEnd.format('YYYY-MM-DD'),
      }

      return {
        registeredUsers: () => StatsService.getRegisteredUsersCount(filters),
        inactiveUsers: () => StatsService.getInactiveUsersCount(filters),
        surveyRespondedUsers: () => StatsService.getSurveyRespondedUsersCount(filters),
        articleVisitedUsers: () => StatsService.getArticleVisitedUsersCount(filters),
        moodTrackedUsers: () => StatsService.getMoodTrackedUsersCount(filters),
        userStats: () => AdminsService.getUsersStats(),
        socialNetworks: () => SocialNetworksService.getAll(),
      }
    }),
  ),
]

pageLoadData.forEach(({ componentName, resolver }) => {
  resolverStore.registerResolverByComponentName(componentName, resolver)
})

export type { PageResolverConfig }

