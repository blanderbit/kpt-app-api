<route lang="yaml">
name: users-stats
meta:
  layout: profile
</route>

<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <div class="d-flex align-center">
              <v-icon left>mdi-chart-line</v-icon>
              Users Statistics
            </div>
            <v-btn
              icon
              variant="text"
              @click="showFilters = !showFilters"
            >
              <v-icon>{{ showFilters ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-btn>
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters Sidebar -->
    <v-navigation-drawer
      v-model="showFilters"
      location="right"
      temporary
      width="400"
      class="filters-drawer"
    >
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Filters</span>
        <v-btn icon variant="text" @click="showFilters = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text>
        <v-form>
          <!-- Date Range -->
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="filters.dateFrom"
                label="Date From"
                type="date"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="filters.dateTo"
                label="Date To"
                type="date"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- Registration Method -->
          <v-select
            v-model="filters.registrationMethod"
            label="Registration Method"
            :items="registrationMethods"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="compact"
            clearable
            class="mb-4"
            :return-object="false"
          ></v-select>

          <!-- Age -->
          <v-text-field
            v-model="filters.age"
            label="Age"
            variant="outlined"
            density="compact"
            hint="e.g., 25-30"
            persistent-hint
            class="mb-4"
          ></v-text-field>

          <!-- Social Networks -->
          <v-select
            v-model="filters.socialNetwork"
            label="Social Network"
            :items="socialNetworkOptions"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="compact"
            clearable
            class="mb-4"
            :return-object="false"
          ></v-select>

          <!-- Theme -->
          <v-select
            v-model="filters.theme"
            label="Theme"
            :items="themeOptions"
            variant="outlined"
            density="compact"
            clearable
            class="mb-4"
          ></v-select>

          <!-- Mood Tracker Specific Filters -->
          <v-divider class="my-4"></v-divider>
          <div class="text-subtitle-2 mb-2">Mood Tracker Filters</div>
          
          <v-text-field
            v-model.number="filters.days"
            label="Minimum Days"
            type="number"
            variant="outlined"
            density="compact"
            hint="Minimum number of days tracked"
            persistent-hint
            class="mb-4"
          ></v-text-field>

          <v-select
            v-model="filters.moodType"
            label="Mood Type"
            :items="moodTypeOptions"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="compact"
            clearable
            class="mb-4"
            :return-object="false"
          ></v-select>

          <!-- Action Buttons -->
          <v-row>
            <v-col cols="6">
              <v-btn
                block
                variant="outlined"
                @click="resetFilters"
              >
                Reset
              </v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn
                block
                color="primary"
                @click="applyFilters"
              >
                Apply
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-navigation-drawer>

    <!-- Statistics Cards -->
    <v-row>
      <!-- Registered Users -->
      <v-col cols="12" md="6" lg="4">
        <v-card class="stat-card">
          <v-card-title class="d-flex align-center">
            <v-icon left color="primary">mdi-account-plus</v-icon>
            Registered Users
          </v-card-title>
          <v-card-text>
            <div class="text-h4 font-weight-bold">{{ stats.registeredUsers || 0 }}</div>
            <div class="text-caption text-grey">Users registered in the selected period</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Inactive Users -->
      <v-col cols="12" md="6" lg="4">
        <v-card class="stat-card">
          <v-card-title class="d-flex align-center">
            <v-icon left color="warning">mdi-account-off</v-icon>
            Inactive Users
          </v-card-title>
          <v-card-text>
            <div class="text-h4 font-weight-bold">{{ stats.inactiveUsers || 0 }}</div>
            <div class="text-caption text-grey">Users inactive for 30+ days</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Survey Responded Users -->
      <v-col cols="12" md="6" lg="4">
        <v-card class="stat-card">
          <v-card-title class="d-flex align-center">
            <v-icon left color="success">mdi-clipboard-text</v-icon>
            Survey Responded Users
          </v-card-title>
          <v-card-text>
            <div class="text-h4 font-weight-bold">{{ stats.surveyRespondedUsers || 0 }}</div>
            <div class="text-caption text-grey">Users who answered surveys</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Article Visited Users -->
      <v-col cols="12" md="6" lg="4">
        <v-card class="stat-card">
          <v-card-title class="d-flex align-center">
            <v-icon left color="info">mdi-book-open</v-icon>
            Article Visited Users
          </v-card-title>
          <v-card-text>
            <div class="text-h4 font-weight-bold">{{ stats.articleVisitedUsers || 0 }}</div>
            <div class="text-caption text-grey">Users who visited articles</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Mood Tracked Users -->
      <v-col cols="12" md="6" lg="4">
        <v-card class="stat-card">
          <v-card-title class="d-flex align-center">
            <v-icon left color="purple">mdi-emoticon-happy</v-icon>
            Mood Tracked Users
          </v-card-title>
          <v-card-text>
            <div class="text-h4 font-weight-bold">{{ stats.moodTrackedUsers || 0 }}</div>
            <div class="text-caption text-grey">Users who tracked their mood</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Overall stats summary -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card class="stat-summary-card">
          <v-card-title class="d-flex align-center">
            <v-icon left color="primary">mdi-information-outline</v-icon>
            Overall Overview
          </v-card-title>
          <v-card-text>
            <p class="stats-paragraph">
              Total users: <strong>{{ overallStats.totalUsers || 0 }}</strong>
              - Verified: <strong>{{ overallStats.verifiedUsers || 0 }}</strong>
              - Unverified: <strong>{{ overallStats.unverifiedUsers || 0 }}</strong>
            </p>
            <p class="stats-paragraph">
              Users this month: <strong>{{ overallStats.usersThisMonth || 0 }}</strong>
              - Users last month: <strong>{{ overallStats.usersLastMonth || 0 }}</strong>
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { StatsService, AdminsService, SocialNetworksService } from '@api'
import type { AdminUsersStats, SocialNetwork } from '@api'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { showErrorToast } from '@workers/toast-worker'

type StatsState = {
  registeredUsers: number
  inactiveUsers: number
  surveyRespondedUsers: number
  articleVisitedUsers: number
  moodTrackedUsers: number
}

type FilterParams = {
  dateFrom: string | null
  dateTo: string | null
  registrationMethod: string | null
  age: string | null
  socialNetwork: string | null
  theme: string | null
  days: number | null
  moodType: string | null
}

const route = useRoute()

const showFilters = ref(false)

const stats = reactive<StatsState>({
  registeredUsers: 0,
  inactiveUsers: 0,
  surveyRespondedUsers: 0,
  articleVisitedUsers: 0,
  moodTrackedUsers: 0,
})

const overallStats = reactive<AdminUsersStats>({
  totalUsers: 0,
  verifiedUsers: 0,
  unverifiedUsers: 0,
  usersThisMonth: 0,
  usersLastMonth: 0,
})

const filters = reactive<FilterParams>({
  dateFrom: null,
  dateTo: null,
  registrationMethod: null,
  age: null,
  socialNetwork: null,
  theme: null,
  days: null,
  moodType: null,
})

const registrationMethods = [
  { title: 'Firebase', value: 'firebase' },
  { title: 'Email', value: 'email' },
]

const moodTypeOptions = [
  { title: 'Good', value: 'good' },
  { title: 'Neutral', value: 'neutral' },
  { title: 'Bad', value: 'bad' },
]

const socialNetworkOptions = ref<Array<{ title: string; value: string }>>([])

const themeOptions = [
  { title: 'Light', value: 'light' },
  { title: 'Dark', value: 'dark' },
]

const assignStats = (data: Partial<StatsState>) => {
  if (data.registeredUsers !== undefined) stats.registeredUsers = data.registeredUsers
  if (data.inactiveUsers !== undefined) stats.inactiveUsers = data.inactiveUsers
  if (data.surveyRespondedUsers !== undefined) stats.surveyRespondedUsers = data.surveyRespondedUsers
  if (data.articleVisitedUsers !== undefined) stats.articleVisitedUsers = data.articleVisitedUsers
  if (data.moodTrackedUsers !== undefined) stats.moodTrackedUsers = data.moodTrackedUsers
}

const assignOverallStats = (data?: AdminUsersStats | null) => {
  if (!data) return
  overallStats.totalUsers = data.totalUsers ?? 0
  overallStats.verifiedUsers = data.verifiedUsers ?? 0
  overallStats.unverifiedUsers = data.unverifiedUsers ?? 0
  overallStats.usersThisMonth = data.usersThisMonth ?? 0
  overallStats.usersLastMonth = data.usersLastMonth ?? 0
}

const assignSocialNetworks = (networks?: SocialNetwork[] | null) => {
  if (!networks) {
    socialNetworkOptions.value = []
    return
  }
  socialNetworkOptions.value = networks.map((network) => ({
    title: network.name,
    value: network.id,
  }))
}

const buildStatsParams = () => {
  const socialNetworksParam = filters.socialNetwork ? [filters.socialNetwork] : undefined

  return {
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    registrationMethod: filters.registrationMethod || undefined,
    age: filters.age || undefined,
    socialNetworks: socialNetworksParam,
    theme: filters.theme || undefined,
  }
}

const buildMoodParams = () => ({
  ...buildStatsParams(),
  days: filters.days || undefined,
  moodType: filters.moodType || undefined,
})

const loadInitialData = async () => {
  const meta = route.meta as {
    registeredUsers?: { count: number }
    inactiveUsers?: { count: number }
    surveyRespondedUsers?: { count: number }
    articleVisitedUsers?: { count: number }
    moodTrackedUsers?: { count: number }
    userStats?: AdminUsersStats
    socialNetworks?: SocialNetwork[]
  }

  assignStats({
    registeredUsers: meta.registeredUsers?.count ?? stats.registeredUsers,
    inactiveUsers: meta.inactiveUsers?.count ?? stats.inactiveUsers,
    surveyRespondedUsers: meta.surveyRespondedUsers?.count ?? stats.surveyRespondedUsers,
    articleVisitedUsers: meta.articleVisitedUsers?.count ?? stats.articleVisitedUsers,
    moodTrackedUsers: meta.moodTrackedUsers?.count ?? stats.moodTrackedUsers,
  })

  if (meta.userStats) {
    assignOverallStats(meta.userStats)
  }
  if (meta.socialNetworks) {
    assignSocialNetworks(meta.socialNetworks)
  }

  const params = buildStatsParams()
  const moodParams = buildMoodParams()

  const [
    registeredUsers,
    inactiveUsers,
    surveyRespondedUsers,
    articleVisitedUsers,
    moodTrackedUsers,
    userStats,
    socialNetworks,
  ] = (await asyncGlobalSpinner(
    StatsService.getRegisteredUsersCount(params),
    StatsService.getInactiveUsersCount(params),
    StatsService.getSurveyRespondedUsersCount(params),
    StatsService.getArticleVisitedUsersCount(params),
    StatsService.getMoodTrackedUsersCount(moodParams),
    AdminsService.getUsersStats(),
    SocialNetworksService.getAll(),
  )) as [
    { count: number },
    { count: number },
    { count: number },
    { count: number },
    { count: number },
    AdminUsersStats,
    SocialNetwork[],
  ]

  assignStats({
    registeredUsers: registeredUsers?.count || 0,
    inactiveUsers: inactiveUsers?.count || 0,
    surveyRespondedUsers: surveyRespondedUsers?.count || 0,
    articleVisitedUsers: articleVisitedUsers?.count || 0,
    moodTrackedUsers: moodTrackedUsers?.count || 0,
  })

  assignOverallStats(userStats)
  assignSocialNetworks(socialNetworks)
}

const applyFilters = async () => {
  const params = buildStatsParams()
  const moodParams = buildMoodParams()

  const [registeredUsers, inactiveUsers, surveyRespondedUsers, articleVisitedUsers, moodTrackedUsers] =
    (await asyncGlobalSpinner(
      StatsService.getRegisteredUsersCount(params),
      StatsService.getInactiveUsersCount(params),
      StatsService.getSurveyRespondedUsersCount(params),
      StatsService.getArticleVisitedUsersCount(params),
      StatsService.getMoodTrackedUsersCount(moodParams),
    )) as [
      { count: number },
      { count: number },
      { count: number },
      { count: number },
      { count: number },
    ]

  assignStats({
    registeredUsers: registeredUsers?.count || 0,
    inactiveUsers: inactiveUsers?.count || 0,
    surveyRespondedUsers: surveyRespondedUsers?.count || 0,
    articleVisitedUsers: articleVisitedUsers?.count || 0,
    moodTrackedUsers: moodTrackedUsers?.count || 0,
  })
}

const resetFilters = () => {
  filters.dateFrom = null
  filters.dateTo = null
  filters.registrationMethod = null
  filters.age = null
  filters.socialNetwork = null
  filters.theme = null
  filters.days = null
  filters.moodType = null
  loadInitialData().catch((error) => {
    console.error('Failed to reload users stats', error)
    showErrorToast('Не удалось обновить статистику пользователей.')
  })
}

onMounted(() => {
  loadInitialData().catch((error) => {
    console.error('Failed to load users stats', error)
    showErrorToast('Не удалось загрузить статистику пользователей.')
  })
})

</script>

<style scoped>
.stat-card {
  height: 100%;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.filters-drawer {
  z-index: 1000;
}

.stats-summary-card {
  line-height: 1.6;
}

.stats-paragraph {
  margin-bottom: 0.5rem;
}
</style>
