<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <div>
          <h2>Mood Types</h2>
          <div class="text-caption text-grey-darken-1">
            Last Drive sync: {{ lastDriveSyncText }}
          </div>
        </div>
        <v-btn color="primary" @click="handleSync">
          <v-icon start>mdi-sync</v-icon>
          Sync with Google Drive
        </v-btn>
      </v-col>
    </v-row>

    <!-- Statistics Cards -->
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
            <div class="text-caption text-grey">Average Score</div>
            <div class="text-h4">{{ statsSummary.averageScore }}</div>
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
    </v-row>

    <!-- Category Filter -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <v-select
              v-model="selectedCategory"
              :items="categoryOptions"
              label="Filter by Category"
              clearable
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Mood Types Cards -->
    <v-row>
      <v-col cols="12" md="6" lg="4" v-for="moodType in moodTypes" :key="moodType.id">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center mb-3">
              <span class="text-h2 mr-3">{{ moodType.emoji }}</span>
              <div>
                <div class="text-h6">{{ moodType.name }}</div>
                <v-chip 
                  :color="categoryColors[moodType.category]" 
                  size="small"
                  class="mt-1"
                >
                  {{ moodType.category }}
                </v-chip>
              </div>
            </div>
            <div class="text-body-2 text-grey mb-2">{{ moodType.description }}</div>
            <div class="d-flex justify-space-between align-center">
              <div class="text-caption text-grey">Score</div>
              <div class="text-h6" :style="{ color: moodType.color }">{{ moodType.score }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- No Data -->
    <v-row v-if="!moodTypes.length">
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          No mood types found. Try syncing with Google Drive.
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>
<route lang="yaml">
name: mood-types
meta:
  layout: profile
</route>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { MoodTypesService, SettingsService, type MoodType, type MoodTypeStats, type SettingsResponse } from '@api'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { showSuccessToast, showErrorToast } from '@workers/toast-worker'

const route = useRoute()

const allMoodTypes = ref<MoodType[]>([])
const moodTypes = computed(() => {
  if (!selectedCategory.value) {
    return allMoodTypes.value
  }
  return allMoodTypes.value.filter((type) => type.category === selectedCategory.value)
})
const stats = ref<MoodTypeStats | null>(null)
const selectedCategory = ref<string | null>(null)
const settings = ref<SettingsResponse | null>(null)

const moodTypesData = route.meta.moodTypes as MoodType[]
const moodTypesStatsData = route.meta.moodTypesStats as MoodTypeStats
const settingsData = route.meta.settings as SettingsResponse

allMoodTypes.value = moodTypesData || []
stats.value = moodTypesStatsData || null
settings.value = settingsData || null

const statsSummary = computed(() => {
  const totalCount = stats.value?.totalCount ?? 0
  const categoryCounts = stats.value?.categoryCounts ?? {}
  const categoriesCount = Object.keys(categoryCounts).length
  const averageScore = stats.value?.averageScore ?? 0

  return {
    totalCount,
    categoriesCount,
    averageScore,
  }
})

const categoryOptions = [
  { title: 'Positive', value: 'positive' },
  { title: 'Neutral', value: 'neutral' },
  { title: 'Negative', value: 'negative' },
]

const categoryColors: Record<string, string> = {
  positive: 'success',
  neutral: 'warning',
  negative: 'error',
}

const lastDriveSyncText = computed(() => settings.value?.googleDriveSync?.moodTypes ?? 'Not synced yet')

const loadMoodTypes = async () => {
  const [types, statsData, settingsData] = (await asyncGlobalSpinner(
    MoodTypesService.getAll(),
    MoodTypesService.getStats(),
    SettingsService.getSettings(),
  )) as [MoodType[], MoodTypeStats, SettingsResponse]

  allMoodTypes.value = types
  stats.value = statsData
  settings.value = settingsData
}

const handleSync = async () => {
  await asyncGlobalSpinner(MoodTypesService.syncWithDrive())
  await loadMoodTypes()
  showSuccessToast('Synchronization completed successfully.')
}
</script>