<route lang="yaml">
name: onboarding-questions
meta:
  layout: profile
</route>

<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <div>
          <h2>Onboarding Questions</h2>
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
      <v-col cols="12" md="2" v-for="stat in statsSummary" :key="stat.title">
        <v-card>
          <v-card-text>
            <div class="text-caption text-grey">{{ stat.title }}</div>
            <div class="text-h4">{{ stat.value }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filter -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <v-select
              v-model="selectedFilter"
              :items="filterOptions"
              label="Show"
              clearable
              @update:model-value="loadOnboardingQuestions"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Onboarding Steps -->
    <v-row>
      <v-col cols="12" v-for="step in onboardingSteps" :key="step.stepName">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">{{ INPUT_TYPE_ICONS[step.inputType] ?? INPUT_TYPE_ICONS.default }}</v-icon>
            {{ step.stepQuestion }}
            <v-spacer />
            <v-chip :color="step.required ? 'error' : 'success'" size="small">
              {{ step.required ? 'Required' : 'Optional' }}
            </v-chip>
          </v-card-title>
          <v-card-subtitle class="text-grey">Step: {{ step.stepName }}</v-card-subtitle>
          <v-card-text>
            <div class="text-body-1 mb-3">Available Answers ({{ step.answers.length }}):</div>
            <v-row>
              <v-col
                cols="12"
                md="6"
                lg="4"
                v-for="answer in step.answers"
                :key="answer.id"
              >
                <v-card variant="outlined" class="answer-card">
                  <v-card-text>
                    <div class="d-flex align-center mb-2">
                      <div class="answer-icon mr-3" v-html="answer.icon"></div>
                      <div class="text-h6">{{ answer.text }}</div>
                    </div>
                    <div class="text-body-2 text-grey mb-2">{{ answer.subtitle }}</div>
                    <v-chip size="x-small" color="primary" variant="outlined">
                      {{ answer.id }}
                    </v-chip>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- No Data -->
    <v-row v-if="!onboardingSteps.length">
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          No onboarding questions found. Try syncing with Google Drive.
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { OnboardingQuestionsService, SettingsService, type OnboardingStep, type OnboardingQuestionsStats, type SettingsResponse } from '@api'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { showSuccessToast, showErrorToast } from '@workers/toast-worker'

const INPUT_TYPE_ICONS: Record<string, string> = {
  single: 'mdi-radiobox-marked',
  multiple: 'mdi-checkbox-marked',
  text: 'mdi-text',
  default: 'mdi-help-circle',
}

const route = useRoute()

const onboardingSteps = ref<OnboardingStep[]>([])
const stats = ref<OnboardingQuestionsStats | null>(null)
const selectedFilter = ref<string | null>('all')
const settings = ref<SettingsResponse | null>(null)

const onboardingStepsData = route.meta.onboardingSteps as OnboardingStep[]
const onboardingStatsData = route.meta.onboardingStats as OnboardingQuestionsStats
const settingsData = route.meta.settings as SettingsResponse | undefined

onboardingSteps.value = onboardingStepsData || []
stats.value = onboardingStatsData || null
settings.value = settingsData || null

const lastDriveSyncText = computed(() => settings.value?.googleDriveSync?.onboardingQuestions ?? 'Not synced yet')

const filterOptions = [
  { title: 'All Steps', value: 'all' },
  { title: 'Required Only', value: 'required' },
  { title: 'Optional Only', value: 'optional' },
]

const statsSummary = computed(() => [
  { title: 'Total Steps', value: stats.value?.totalSteps ?? 0 },
  { title: 'Total Answers', value: stats.value?.totalAnswers ?? 0 },
  { title: 'Avg Answers/Step', value: stats.value?.averageAnswersPerStep ?? 0 },
  { title: 'Required Steps', value: stats.value?.requiredSteps ?? 0 },
  { title: 'Optional Steps', value: stats.value?.optionalSteps ?? 0 },
])

const loadOnboardingQuestions = async () => {
  const filterRequest =
    selectedFilter.value === 'required'
      ? OnboardingQuestionsService.getRequired()
      : selectedFilter.value === 'optional'
        ? OnboardingQuestionsService.getOptional()
        : OnboardingQuestionsService.getAll()

  const [steps, statsData, settingsData] = (await asyncGlobalSpinner(
    filterRequest,
    OnboardingQuestionsService.getStats(),
    SettingsService.getSettings(),
  )) as [OnboardingStep[], OnboardingQuestionsStats, SettingsResponse]

  onboardingSteps.value = steps
  stats.value = statsData
  settings.value = settingsData
}

const handleSync = async () => {
  await asyncGlobalSpinner(OnboardingQuestionsService.syncWithDrive())
  await loadOnboardingQuestions()
  showSuccessToast('Synchronization completed successfully.')
}
</script>

<style scoped>
.answer-card {
  height: 100%;
}

.answer-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
