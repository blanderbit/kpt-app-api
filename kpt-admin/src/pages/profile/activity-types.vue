<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex flex-column flex-md-row justify-space-between align-start align-md-center">
        <div>
          <h2>Activity Types</h2>
          <div class="text-caption text-grey-darken-1">
            Last Drive sync: {{ lastDriveSyncText }}
          </div>
        </div>
        <v-btn color="primary" @click="handleSync" class="mt-2 mt-md-0">
          <v-icon start>mdi-sync</v-icon>
          Sync with Google Drive
        </v-btn>
      </v-col>
    </v-row>

    <!-- Statistics & Filter -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="text-caption text-grey">Total Count</div>
            <div class="text-h4">{{ statsSummary.totalCount }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="text-caption text-grey">Categories</div>
            <div class="text-h4">{{ statsSummary.categoriesCount }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <v-select
              v-model="selectedCategory"
              :items="categoryOptions"
              label="Filter by Category"
              clearable
              density="comfortable"
              @update:model-value="loadActivityTypes"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Activity Types Cards -->
    <v-row>
      <v-col cols="12" md="6" lg="4" v-for="activityType in activityTypes" :key="activityType.id">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center mb-3">
              <span class="text-h2 mr-3">{{ activityType.icon }}</span>
              <div>
                <div class="text-h6">{{ activityType.name }}</div>
                <v-chip 
                  color="primary" 
                  size="small"
                  class="mt-1"
                >
                  {{ activityType.category }}
                </v-chip>
              </div>
            </div>
            
            <div class="text-body-2 text-grey mb-3">{{ activityType.description }}</div>
            
            <!-- Keywords -->
            <div class="mb-3">
              <div class="text-caption text-grey mb-1">Keywords:</div>
              <div class="d-flex flex-wrap keywords-container">
                <v-chip 
                  v-for="keyword in activityType.keywords" 
                  :key="keyword"
                  size="x-small"
                  variant="outlined"
                  class="keyword-chip"
                >
                  {{ keyword }}
                </v-chip>
              </div>
            </div>
            
            <!-- Color indicator -->
            <div class="d-flex justify-space-between align-center">
              <div class="text-caption text-grey">Color</div>
              <div 
                class="color-indicator" 
                :style="{ backgroundColor: activityType.color }"
              ></div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- No Data -->
    <v-row v-if="!activityTypes.length">
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          No activity types found. Try syncing with Google Drive.
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<route lang="yaml">
name: activity-types
meta:
  layout: profile
</route>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ActivityTypesService, SettingsService } from '@api'
import type { ActivityType, ActivityTypeStats, SettingsResponse } from '@api'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { showSuccessToast } from '@workers/toast-worker'

const route = useRoute()

const activityTypes = ref<ActivityType[]>([])
const stats = ref<ActivityTypeStats | null>(null)
const selectedCategory = ref<string | null>(null)
const settings = ref<SettingsResponse | null>(null)

// Data from resolver
const activityTypesData = route.meta.activityTypes as ActivityType[]
const activityTypesStatsData = route.meta.activityTypesStats as ActivityTypeStats
const settingsData = route.meta.settings as SettingsResponse

activityTypes.value = activityTypesData || []
stats.value = activityTypesStatsData || null
settings.value = settingsData || null

const statsSummary = computed(() => {
  const categoryCounts = stats.value?.categoryCounts ?? stats.value?.typesByCategory ?? {}
  const totalCount = stats.value?.totalCount ?? stats.value?.totalTypes ?? 0
  const categoriesCount = stats.value?.totalCategories ?? Object.keys(categoryCounts).length

  return {
    totalCount,
    categoriesCount,
    categoryCounts,
  }
})

const categoryOptions = computed(() => {
  const categories = statsSummary.value.categoryCounts
  return Object.keys(categories).map(category => ({
    title: category,
    value: category
  }))
})

const lastDriveSyncText = computed(() => settings.value?.googleDriveSync?.activityTypes ?? 'Not synced yet')

const loadActivityTypes = async () => {
  const [items, statsData, settingsData] = await asyncGlobalSpinner(
    selectedCategory.value
      ? ActivityTypesService.getByCategory(selectedCategory.value)
      : ActivityTypesService.getAll(),
    ActivityTypesService.getStats(),
    SettingsService.getSettings(),
  ) as [ActivityType[], ActivityTypeStats, SettingsResponse]
  activityTypes.value = items
  stats.value = statsData
  settings.value = settingsData
}

const handleSync = async () => {
  await asyncGlobalSpinner(ActivityTypesService.syncWithDrive())

  await loadActivityTypes()

  showSuccessToast('Synchronization completed successfully.')
}
</script>

<style scoped>
.color-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #e0e0e0;
}

.keywords-container {
  gap: 6px;
}

.keyword-chip {
  margin: 0;
}
</style>