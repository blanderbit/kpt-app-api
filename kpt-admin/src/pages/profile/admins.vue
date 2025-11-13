<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <h2>Admin Users</h2>
      </v-col>
    </v-row>

    <!-- Statistics Cards -->
    <v-row class="mb-4">
      <v-col cols="12" md="3" v-for="stat in stats" :key="stat.title">
        <v-card>
          <v-card-text>
            <div class="text-caption text-grey">{{ stat.title }}</div>
            <div class="text-h4">{{ stat.value }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Users Table -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            Admin Users ({{ paginationTotalCount }})
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="users"
              hide-default-footer
            >
              <template v-slot:item.avatarUrl="{ item }">
                <v-avatar size="32" v-if="item.avatarUrl">
                  <v-img :src="item.avatarUrl" />
                </v-avatar>
                <v-avatar size="32" v-else>
                  <v-icon>mdi-account</v-icon>
                </v-avatar>
              </template>

              <template v-slot:item.theme="{ item }">
                <v-chip :color="item.theme === 'dark' ? 'grey-darken-2' : 'grey-lighten-2'" size="small">
                  {{ item.theme }}
                </v-chip>
              </template>

              <template v-slot:item.createdAt="{ item }">
                {{ new Date(item.createdAt).toLocaleDateString() }}
              </template>

              <template v-slot:item.updatedAt="{ item }">
                {{ new Date(item.updatedAt).toLocaleDateString() }}
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

<route lang="yaml">
name: admins
meta:
  layout: profile
</route>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AdminsService, type User, type AdminAdminsStats, type PaginationMeta } from '@api'
import { PaginationWorker } from '@workers/pagination-worker'
import { DEFAULT_PAGE_SIZE, normalizePageSize } from '@workers/pagination-worker/pagination.helpers'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { FilterPatch } from '@api/filter.patch'
import { showSuccessToast } from '@workers/toast-worker'

const route = useRoute()
const router = useRouter()

const adminStats = route.meta.adminStats as AdminAdminsStats | undefined
const adminUsers = route.meta.adminUsers as { data: User[]; meta?: PaginationMeta }

const adminStatsData = ref<AdminAdminsStats | null>(adminStats ?? null)

const stats = computed(() => [
  {
    title: 'Total Admins',
    value: adminStatsData.value?.totalAdmins ?? 0,
  },
])

const normalizedInitialLimit = normalizePageSize(route.query.limit, DEFAULT_PAGE_SIZE)

const {
  paginationElements: users,
  paginationPage,
  paginationTotalCount,
  paginationClearData,
  paginationLastPage,
  paginationLoad,
} = PaginationWorker<User>({
  notToConcatElements: true,
  paginationDataRequest: (page) => {
    const rawFilters = getRawFilters() as { limit?: number }
    const limit = normalizePageSize(rawFilters.limit, normalizedInitialLimit)
    return AdminsService.getUsers({
      roles: '$eq:admin',
      page,
      limit,
    })
  },
})

const initialPage = Number(route.query.page ?? adminUsers?.meta?.currentPage ?? 1) || 1

users.value = Array.isArray(adminUsers.data) ? adminUsers.data : []
paginationTotalCount.value = adminUsers.meta?.totalItems ?? adminUsers.data.length
paginationLastPage.value = adminUsers.meta?.totalPages ?? 1
paginationPage.value = adminUsers.meta?.currentPage ?? initialPage

interface LoadPageOptions {
  reset?: boolean
  force?: boolean
}

const loadPage = async (pageNumber: number, { reset = false, force = false }: LoadPageOptions = {}) => {
  if (reset) {
    paginationClearData()
  }

  await asyncGlobalSpinner(
    paginationLoad({
      pageNumber,
      forceUpdate: force,
    })
  )
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

const handlePageChange = (page: number) => {
  filters.value.page.value = page
}

const handleFilterChange = () => {
  filters.value.page.value = 1
}

const headers = [
  { title: 'Avatar', key: 'avatarUrl', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'First Name', key: 'firstName', sortable: false },
  { title: 'Created', key: 'createdAt', sortable: false },
]

const refreshAdminStats = async () => {
  const data = await loadPage(Number(filters.value.page.value) || 1, {
    reset: true,
    force: true,
  })
  showSuccessToast('Admin statistics updated successfully.')
}


</script>