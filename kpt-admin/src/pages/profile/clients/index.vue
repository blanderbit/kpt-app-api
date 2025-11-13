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
                <v-text-field
                  v-model="filters.search.value"
                  append-icon="mdi-magnify"
                  label="Search clients..."
                  single-line
                  hide-details
                  @update:model-value="handleSearchInput"
                ></v-text-field>
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
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClientsService, type Client, type ClientsPaginatedResponse } from '@api'
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
    const rawFilters = getRawFilters() as { search?: string; limit?: number }
    const limit = normalizePageSize(rawFilters.limit, normalizedInitialLimit)
    return ClientsService.getClients({
      page,
      limit,
      search: rawFilters.search ? String(rawFilters.search) : undefined,
    })
  },
})

const initialPage = Number(route.query.page ?? clientsResponse?.meta?.currentPage ?? 1) || 1
const initialSearch = typeof route.query.search === 'string' ? route.query.search : ''

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

const handlePageChange = (page: number) => {
  filters.value.page.value = page
}

const handleSearchInput = () => {
  filters.value.page.value = 1
}

const headers = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'First Name', key: 'firstName', sortable: false },
  { title: 'Email Verified', key: 'emailVerified', sortable: false },
  { title: 'Theme', key: 'theme', sortable: false },
  { title: 'Created At', key: 'createdAt', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const viewClient = (id: number) => {
  router.push(`/profile/clients/${id}`)
}
</script>
