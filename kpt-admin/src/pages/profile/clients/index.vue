<route lang="yaml">
name: clients
meta:
  layout: profile
</route>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-account-group</v-icon>
            Clients Management ({{ paginationTotalCount }})
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="clients"
              :loading="loading"
              hide-default-footer
              class="elevation-1"
            >
              <template v-slot:top>
                <v-row class="mb-4">
                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model="filters.search.value"
                      append-icon="mdi-magnify"
                      label="Search clients..."
                      single-line
                      hide-details
                      @update:model-value="handleSearchInput"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-select
                      v-model="filters['filter.emailVerified'].value"
                      :items="emailVerifiedOptions"
                      label="Email Verified"
                      clearable
                      density="comfortable"
                      variant="outlined"
                      hide-details
                      @update:model-value="handleFilterChange"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model="filters['filter.firstName'].value"
                      label="First Name"
                      clearable
                      density="comfortable"
                      variant="outlined"
                      hide-details
                      @update:model-value="handleFilterChange"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-select
                      v-model="filters['filter.theme'].value"
                      :items="themeOptions"
                      label="Theme"
                      clearable
                      density="comfortable"
                      variant="outlined"
                      hide-details
                      @update:model-value="handleFilterChange"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-select
                      v-model="filters['filter.language'].value"
                      :items="languageOptions"
                      label="Language"
                      clearable
                      density="comfortable"
                      variant="outlined"
                      hide-details
                      @update:model-value="handleFilterChange"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="1">
                    <v-text-field
                      v-model.number="filters['filter.initSatisfactionLevel'].value"
                      label="Init Satisfaction"
                      type="number"
                      min="0"
                      max="100"
                      clearable
                      density="comfortable"
                      variant="outlined"
                      hide-details
                      @update:model-value="handleFilterChange"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="1">
                    <v-text-field
                      v-model.number="filters['filter.initHardnessLevel'].value"
                      label="Init Hardness"
                      type="number"
                      min="0"
                      max="100"
                      clearable
                      density="comfortable"
                      variant="outlined"
                      hide-details
                      @update:model-value="handleFilterChange"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </template>
              <template v-slot:item.emailVerified="{ item }">
                <v-icon :color="item.emailVerified ? 'success' : 'error'">
                  {{ item.emailVerified ? 'mdi-check-circle' : 'mdi-close-circle' }}
                </v-icon>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn
                  small
                  color="primary"
                  @click="viewClient(item.id)"
                >
                  <v-icon left small>mdi-eye</v-icon>
                  View
                </v-btn>
              </template>
            </v-data-table>
            <VPagination
              v-if="paginationLastPage && paginationLastPage > 1"
              v-model="filters.page.value"
              :length="paginationLastPage"
              rounded="circle"
              variant="outlined"
              class="mt-3"
              active-color="blue_dark"
              @update:model-value="handlePageChange"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClientsService, type Client, type ClientsPaginatedResponse, type Language } from '@api'
import { PaginationWorker } from '@workers/pagination-worker'
import { DEFAULT_PAGE_SIZE, normalizePageSize } from '@workers/pagination-worker/pagination.helpers'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { FilterPatch } from '@api/filter.patch'

const route = useRoute()
const router = useRouter()

const loading = ref(false)

const clientsResponse = route.meta.clients as ClientsPaginatedResponse | undefined

const normalizedInitialLimit = normalizePageSize(route.query.limit, DEFAULT_PAGE_SIZE)

const {
  paginationElements: clients,
  paginationPage,
  paginationTotalCount,
  paginationClearData,
  paginationLastPage,
  paginationLoad,
} = PaginationWorker<Client>({
  notToConcatElements: true,
  paginationDataRequest: (page) => {
    const rawFilters = getRawFilters() as {
      search?: string
      limit?: number
      'filter.emailVerified'?: string
      'filter.firstName'?: string
      'filter.theme'?: string
      'filter.language'?: string
      'filter.initSatisfactionLevel'?: string | number
      'filter.initHardnessLevel'?: string | number
    }
    const limit = normalizePageSize(rawFilters.limit, normalizedInitialLimit)
    const params: any = {
      page,
      limit,
      search: rawFilters.search ? String(rawFilters.search) : undefined,
    }
    
    // Filters already have 'filter.' prefix, just pass them directly
    if (rawFilters['filter.emailVerified']) {
      // For boolean fields with FilterOperator.EQ, nestjs-paginate expects $eq:true or $eq:false
      const emailVerifiedValue = rawFilters['filter.emailVerified'] === 'true' ? 'true' : 'false'
      params['filter.emailVerified'] = `$eq:${emailVerifiedValue}`
    }
    if (rawFilters['filter.firstName']) {
      params['filter.firstName'] = `$ilike:${rawFilters['filter.firstName']}`
    }
    if (rawFilters['filter.theme']) {
      params['filter.theme'] = `$eq:${rawFilters['filter.theme']}`
    }
    if (rawFilters['filter.language']) {
      params['filter.language'] = `$eq:${rawFilters['filter.language']}`
    }
    if (rawFilters['filter.initSatisfactionLevel'] !== undefined && rawFilters['filter.initSatisfactionLevel'] !== '') {
      params['filter.initSatisfactionLevel'] = `$eq:${rawFilters['filter.initSatisfactionLevel']}`
    }
    if (rawFilters['filter.initHardnessLevel'] !== undefined && rawFilters['filter.initHardnessLevel'] !== '') {
      params['filter.initHardnessLevel'] = `$eq:${rawFilters['filter.initHardnessLevel']}`
    }
    
    return ClientsService.getClients(params)
  },
})

const stripEq = (value?: string | null): string | undefined =>
  typeof value === 'string' && value.startsWith('$eq:') ? value.slice(4) : value ?? undefined

const stripIlike = (value?: string | null): string | undefined =>
  typeof value === 'string' && value.startsWith('$ilike:') ? value.slice(7) : value ?? undefined

const initialPage = Number(route.query.page ?? clientsResponse?.meta?.currentPage ?? 1) || 1
const initialSearch = typeof route.query.search === 'string' ? route.query.search : ''
// For boolean filter, extract value from $eq: prefix
const initialEmailVerified = stripEq(route.query['filter.emailVerified'] as string | undefined) ?? ''
const initialFirstName = stripIlike(route.query['filter.firstName'] as string | undefined) ?? ''
const initialTheme = stripEq(route.query['filter.theme'] as string | undefined) ?? ''
const initialLanguage = stripEq(route.query['filter.language'] as string | undefined) ?? ''
const initialInitSatisfactionLevel = stripEq(route.query['filter.initSatisfactionLevel'] as string | undefined) ?? ''
const initialInitHardnessLevel = stripEq(route.query['filter.initHardnessLevel'] as string | undefined) ?? ''

const languagesData = route.meta.languages as { languages: Language[] } | undefined
const languages = ref<Language[]>(languagesData?.languages ?? [])
const languageOptions = computed(() => {
  return languages.value
    .filter(lang => lang.isActive)
    .map(lang => ({
      title: `${lang.name} (${lang.code})`,
      value: lang.code,
    }))
})

if (clientsResponse) {
  clients.value = Array.isArray(clientsResponse.data) ? clientsResponse.data : []
  paginationTotalCount.value = clientsResponse.meta?.totalItems ?? clientsResponse.data?.length ?? 0
  paginationLastPage.value = clientsResponse.meta?.totalPages ?? 1
  paginationPage.value = clientsResponse.meta?.currentPage ?? initialPage
}

interface LoadPageOptions {
  reset?: boolean
  force?: boolean
}

const loadPage = async (pageNumber: number, { reset = false, force = false }: LoadPageOptions = {}) => {
  if (reset) {
    paginationClearData()
  }

  loading.value = true
  try {
    await asyncGlobalSpinner(
      paginationLoad({
        pageNumber,
        forceUpdate: force,
      })
    )
  } finally {
    loading.value = false
  }
}

const {
  getRawFilters,
  filters,
} = FilterPatch({
  router,
  filters: {
    page: {
      type: Number,
      value: paginationPage.value || initialPage,
      default: Number(route.query.page) || 1,
    },
    search: {
      type: String,
      value: initialSearch,
      default: '',
    },
    limit: {
      type: Number,
      value: normalizedInitialLimit,
      default: normalizedInitialLimit,
    },
    'filter.emailVerified': {
      type: String,
      value: initialEmailVerified,
      default: '',
    },
    'filter.firstName': {
      type: String,
      value: initialFirstName,
      default: '',
    },
    'filter.theme': {
      type: String,
      value: initialTheme,
      default: '',
    },
    'filter.language': {
      type: String,
      value: initialLanguage,
      default: '',
    },
    'filter.initSatisfactionLevel': {
      type: [String, Number],
      value: initialInitSatisfactionLevel,
      default: '',
    },
    'filter.initHardnessLevel': {
      type: [String, Number],
      value: initialInitHardnessLevel,
      default: '',
    },
  },
  afterUpdateFiltersCallBack: async () => {
    paginationClearData()
    await loadPage(Number(filters.value.page.value) || 1, {
      reset: true,
      force: true,
    })
  },
})

filters.value.page.value = initialPage
filters.value.search.value = initialSearch
filters.value.limit.value = normalizedInitialLimit
filters.value['filter.emailVerified'].value = initialEmailVerified
filters.value['filter.firstName'].value = initialFirstName
filters.value['filter.theme'].value = initialTheme
filters.value['filter.language'].value = initialLanguage
filters.value['filter.initSatisfactionLevel'].value = initialInitSatisfactionLevel
filters.value['filter.initHardnessLevel'].value = initialInitHardnessLevel

const emailVerifiedOptions = [
  { title: 'Verified', value: 'true' },
  { title: 'Not Verified', value: 'false' },
]

const themeOptions = [
  { title: 'Light', value: 'light' },
  { title: 'Dark', value: 'dark' },
]

const handlePageChange = (page: number) => {
  filters.value.page.value = page
}

const handleSearchInput = () => {
  filters.value.page.value = 1
}

const handleFilterChange = () => {
  filters.value.page.value = 1
}

const headers = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'First Name', key: 'firstName', sortable: false },
  { title: 'Email Verified', key: 'emailVerified', sortable: false },
  { title: 'Theme', key: 'theme', sortable: false },
  { title: 'Language', key: 'language', sortable: false },
  { title: 'Init Satisfaction', key: 'initSatisfactionLevel', sortable: false },
  { title: 'Init Hardness', key: 'initHardnessLevel', sortable: false },
  { title: 'Created At', key: 'createdAt', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const viewClient = (id: number) => {
  router.push(`/profile/clients/${id}`)
}
</script>
