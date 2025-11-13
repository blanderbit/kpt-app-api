<route lang="yaml">
name: settings
meta:
  layout: profile
</route>

<template>
  <v-container fluid>
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <div class="text-h6">Google Drive Synchronisation</div>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              prepend-icon="mdi-sync"
              @click="handleSyncAll"
            >
              Sync All
            </v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-row>
              <v-col
                v-for="item in googleSyncItems"
                :key="item.key"
                cols="12"
                md="6"
                lg="4"
              >
                <v-card variant="outlined">
                  <v-card-title class="d-flex align-center">
                    <v-icon class="me-2">mdi-cloud-sync</v-icon>
                    <span>{{ item.label }}</span>
                  </v-card-title>
                  <v-card-text>
                    <div class="text-caption text-grey">Last sync</div>
                    <div class="text-body-1 font-weight-medium">{{ item.lastSync }}</div>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                      variant="text"
                      color="primary"
                      prepend-icon="mdi-refresh"
                      @click="handleSync(item.key)"
                    >
                      Sync
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card variant="outlined">
          <v-card-title class="d-flex align-center">
            <v-icon class="me-2" color="primary">mdi-lightbulb-on-outline</v-icon>
            Suggested Activities
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="setting-line">
              <span>Count per user</span>
              <strong>{{ settings?.suggestedActivities.count ?? '-' }}</strong>
            </div>
            <div class="setting-line">
              <span>Generate daily suggestions</span>
              <code>{{ settings?.suggestedActivities.cron.generateDailySuggestions || '—' }}</code>
            </div>
            <div class="setting-line">
              <span>Cleanup old suggestions</span>
              <code>{{ settings?.suggestedActivities.cron.cleanupOldSuggestions || '—' }}</code>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" color="primary" @click="openDialog('suggested')">
              Edit
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card variant="outlined">
          <v-card-title class="d-flex align-center">
            <v-icon class="me-2" color="secondary">mdi-file-document-edit</v-icon>
            Articles
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="setting-line">
              <span>Count per user</span>
              <strong>{{ settings?.articles.count ?? '-' }}</strong>
            </div>
            <div class="setting-line">
              <span>Expiration (days)</span>
              <strong>{{ settings?.articles.expirationDays ?? '-' }}</strong>
            </div>
            <div class="setting-line">
              <span>Generate articles</span>
              <code>{{ settings?.articles.cron.generateArticles || '—' }}</code>
            </div>
            <div class="setting-line">
              <span>Cleanup articles</span>
              <code>{{ settings?.articles.cron.cleanupOldArticles || '—' }}</code>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn
              variant="text"
              color="primary"
              prepend-icon="mdi-refresh"
              @click="triggerGenerateArticles"
            >
              Generate Now
            </v-btn>
            <v-btn
              variant="text"
              color="secondary"
              prepend-icon="mdi-broom"
              @click="triggerCleanupArticles"
            >
              Cleanup
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn variant="text" color="primary" @click="openDialog('articles')">
              Edit
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card variant="outlined">
          <v-card-title class="d-flex align-center">
            <v-icon class="me-2" color="teal">mdi-clipboard-text</v-icon>
            Surveys
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="setting-line">
              <span>Count per user</span>
              <strong>{{ settings?.surveys.count ?? '-' }}</strong>
            </div>
            <div class="setting-line">
              <span>Expiration (days)</span>
              <strong>{{ settings?.surveys.expirationDays ?? '-' }}</strong>
            </div>
            <div class="setting-line">
              <span>Generate surveys</span>
              <code>{{ settings?.surveys.cron.generateSurveys || '—' }}</code>
            </div>
            <div class="setting-line">
              <span>Cleanup surveys</span>
              <code>{{ settings?.surveys.cron.cleanupOldSurveys || '—' }}</code>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn
              variant="text"
              color="primary"
              prepend-icon="mdi-refresh"
              @click="triggerGenerateSurveys"
            >
              Generate Now
            </v-btn>
            <v-btn
              variant="text"
              color="secondary"
              prepend-icon="mdi-broom"
              @click="triggerCleanupSurveys"
            >
              Cleanup
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn variant="text" color="primary" @click="openDialog('surveys')">
              Edit
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title class="d-flex align-center">
            <v-icon class="me-2" color="orange">mdi-bell-ring-outline</v-icon>
            Notification Reminders
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div
              v-for="item in notificationDisplayItems"
              :key="item.key"
              class="setting-line"
            >
              <span>{{ item.label }}</span>
              <code>{{ item.value || '—' }}</code>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" color="primary" @click="openDialog('notifications')">
              Edit
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Suggested Activities Dialog -->
    <v-dialog v-model="dialogs.suggested" persistent max-width="480">
      <v-card>
        <v-card-title>Edit Suggested Activities</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="forms.suggested.count"
            label="Count per user"
            type="number"
            min="1"
            variant="outlined"
          ></v-text-field>
          <v-combobox
            v-model="forms.suggested.cron.generateDailySuggestions"
            :items="cronOptions"
            label="Generate daily suggestions"
            class="cron-combobox"
            bg-color="surface"
            color="primary"
            variant="outlined"
            clearable
            allow-new
            :menu-props="cronMenuProps"
            placeholder="Enter cron expression or choose preset"
          ></v-combobox>
          <v-combobox
            v-model="forms.suggested.cron.cleanupOldSuggestions"
            :items="cronOptions"
            label="Cleanup old suggestions"
            class="cron-combobox"
            bg-color="surface"
            color="primary"
            variant="outlined"
            clearable
            allow-new
            :menu-props="cronMenuProps"
            placeholder="Enter cron expression or choose preset"
          ></v-combobox>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogs.suggested = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveSuggested">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Articles Dialog -->
    <v-dialog v-model="dialogs.articles" persistent max-width="520">
      <v-card>
        <v-card-title>Edit Articles Settings</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="forms.articles.count"
            label="Count per user"
            type="number"
            min="1"
            variant="outlined"
          ></v-text-field>
          <v-text-field
            v-model.number="forms.articles.expirationDays"
            label="Expiration (days)"
            type="number"
            min="1"
            variant="outlined"
          ></v-text-field>
          <v-combobox
            v-model="forms.articles.cron.generateArticles"
            :items="cronOptions"
            label="Generate articles"
            class="cron-combobox"
            bg-color="surface"
            color="primary"
            variant="outlined"
            clearable
            allow-new
            :menu-props="cronMenuProps"
            placeholder="Enter cron expression or choose preset"
          ></v-combobox>
          <v-combobox
            v-model="forms.articles.cron.cleanupOldArticles"
            :items="cronOptions"
            label="Cleanup articles"
            class="cron-combobox"
            bg-color="surface"
            color="primary"
            variant="outlined"
            clearable
            allow-new
            :menu-props="cronMenuProps"
            placeholder="Enter cron expression or choose preset"
          ></v-combobox>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogs.articles = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveArticles">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Surveys Dialog -->
    <v-dialog v-model="dialogs.surveys" persistent max-width="520">
      <v-card>
        <v-card-title>Edit Surveys Settings</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="forms.surveys.count"
            label="Count per user"
            type="number"
            min="1"
            variant="outlined"
          ></v-text-field>
          <v-text-field
            v-model.number="forms.surveys.expirationDays"
            label="Expiration (days)"
            type="number"
            min="1"
            variant="outlined"
          ></v-text-field>
          <v-combobox
            v-model="forms.surveys.cron.generateSurveys"
            :items="cronOptions"
            label="Generate surveys"
            class="cron-combobox"
            bg-color="surface"
            color="primary"
            variant="outlined"
            clearable
            allow-new
            :menu-props="cronMenuProps"
            placeholder="Enter cron expression or choose preset"
          ></v-combobox>
          <v-combobox
            v-model="forms.surveys.cron.cleanupOldSurveys"
            :items="cronOptions"
            label="Cleanup surveys"
            class="cron-combobox"
            bg-color="surface"
            color="primary"
            variant="outlined"
            clearable
            allow-new
            :menu-props="cronMenuProps"
            placeholder="Enter cron expression or choose preset"
          ></v-combobox>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogs.surveys = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveSurveys">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Notifications Dialog -->
    <v-dialog v-model="dialogs.notifications" persistent max-width="520">
      <v-card>
        <v-card-title>Edit Notification Reminders</v-card-title>
        <v-card-text>
          <v-alert
            type="info"
            variant="tonal"
            density="comfortable"
            class="mb-4"
          >
            Select a preset cron expression or enter a custom value (5 or 6 segments).
          </v-alert>
          <v-combobox
            v-for="field in notificationFieldList"
            :key="field.key"
            v-model="forms.notifications.cron[field.key]"
            :items="cronOptions"
            :label="field.label"
            class="cron-combobox mb-3"
            bg-color="surface"
            color="primary"
            variant="outlined"
            clearable
            hide-no-data
            allow-new
            :menu-props="cronMenuProps"
            placeholder="Enter cron expression or choose preset"
            :error="Boolean(notificationErrors[field.key])"
            :error-messages="notificationErrors[field.key]"
            hint="Select from presets or enter custom cron expression"
            persistent-hint
          ></v-combobox>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogs.notifications = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveNotifications">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  SettingsService,
  MoodTypesService,
  MoodSurveysService,
  OnboardingQuestionsService,
  ActivityTypesService,
  SocialNetworksService,
  ArticlesService,
  SurveysService,
  QueueService,
  BackupService,
  LanguagesService,
  formatDateTime,
} from '@api'
import type { SettingsResponse, UpdateSettingsPayload, UpdateNotificationCronPayload } from '@api'
import {
  settingsSchema,
} from '@workers/resolver-worker'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { showSuccessToast } from '@workers/toast-worker'

type SyncKey = 'onboardingQuestions' | 'languages' | 'activityTypes' | 'socialNetworks' | 'moodTypes'
type DialogKey = 'suggested' | 'articles' | 'surveys' | 'notifications'
type NotificationFieldKey = keyof SettingsResponse['notifications']['cron']

const route = useRoute()

const settings = ref<SettingsResponse | null>((route.meta.settings as SettingsResponse) || null)
const cronOptions = ref<string[]>(settings.value?.cronExpressions || [])
const cronMenuProps = { maxHeight: 320 }

const dialogs = reactive<Record<DialogKey, boolean>>({
  suggested: false,
  articles: false,
  surveys: false,
  notifications: false,
})

const forms = reactive({
  suggested: {
    count: 0,
    cron: {
      generateDailySuggestions: '',
      cleanupOldSuggestions: '',
    },
  },
  articles: {
    count: 0,
    expirationDays: 0,
    cron: {
      generateArticles: '',
      cleanupOldArticles: '',
    },
  },
  surveys: {
    count: 0,
    expirationDays: 0,
    cron: {
      generateSurveys: '',
      cleanupOldSurveys: '',
    },
  },
  notifications: {
    cron: {
      inactivity: '',
      mood: '',
      surveys: '',
      articles: '',
      globalActivity: '',
    },
  },
})

const notificationErrors = reactive<Record<NotificationFieldKey, string>>({
  inactivity: '',
  mood: '',
  surveys: '',
  articles: '',
  globalActivity: '',
})

const labels: Record<SyncKey, string> = {
  onboardingQuestions: 'Onboarding Questions',
  languages: 'Languages',
  activityTypes: 'Activity Types',
  socialNetworks: 'Social Networks',
  moodTypes: 'Mood Types',
}

const notificationLabels: Record<NotificationFieldKey, string> = {
  inactivity: 'Inactivity reminder',
  mood: 'Mood reminder',
  surveys: 'Survey reminder',
  articles: 'Article reminder',
  globalActivity: 'Global activity reminder',
}

const googleSyncItems = computed(() => {
  if (!settings.value) {
    return []
  }
  return (Object.keys(labels) as SyncKey[]).map((key) => ({
    key,
    label: labels[key],
    lastSync: formatDateTime(settings.value?.googleDriveSync[key] || null),
  }))
})

const notificationFieldList = computed(() =>
  (Object.keys(notificationLabels) as NotificationFieldKey[]).map((key) => ({
    key,
    label: notificationLabels[key],
  })),
)

const notificationDisplayItems = computed(() => {
  if (!settings.value) {
    return []
  }

  return (Object.keys(notificationLabels) as NotificationFieldKey[]).map((key) => ({
    key,
    label: notificationLabels[key],
    value: settings.value?.notifications.cron[key] || '',
  }))
})

const resetNotificationErrors = () => {
  ;(Object.keys(notificationLabels) as NotificationFieldKey[]).forEach((key) => {
    notificationErrors[key] = ''
  })
}

const normalizeCron = (value: string) => value.replace(/\s+/g, ' ').trim()

const isCronFormatValid = (value: string) => {
  const parts = value.split(/\s+/)
  return parts.length === 5 || parts.length === 6
}

const applySettingsToForms = () => {
  if (!settings.value) return
  forms.suggested.count = settings.value.suggestedActivities.count
  forms.suggested.cron.generateDailySuggestions = settings.value.suggestedActivities.cron.generateDailySuggestions || ''
  forms.suggested.cron.cleanupOldSuggestions = settings.value.suggestedActivities.cron.cleanupOldSuggestions || ''

  forms.articles.count = settings.value.articles.count
  forms.articles.expirationDays = settings.value.articles.expirationDays
  forms.articles.cron.generateArticles = settings.value.articles.cron.generateArticles || ''
  forms.articles.cron.cleanupOldArticles = settings.value.articles.cron.cleanupOldArticles || ''

  forms.surveys.count = settings.value.surveys.count
  forms.surveys.expirationDays = settings.value.surveys.expirationDays
  forms.surveys.cron.generateSurveys = settings.value.surveys.cron.generateSurveys || ''
  forms.surveys.cron.cleanupOldSurveys = settings.value.surveys.cron.cleanupOldSurveys || ''

  forms.notifications.cron.inactivity = settings.value.notifications.cron.inactivity || ''
  forms.notifications.cron.mood = settings.value.notifications.cron.mood || ''
  forms.notifications.cron.surveys = settings.value.notifications.cron.surveys || ''
  forms.notifications.cron.articles = settings.value.notifications.cron.articles || ''
  forms.notifications.cron.globalActivity = settings.value.notifications.cron.globalActivity || ''
}

const loadSettings = async () => {
  const [data] = (await asyncGlobalSpinner(
    SettingsService.getSettings(),
  )) as [SettingsResponse]
  settings.value = data
  cronOptions.value = data.cronExpressions
  applySettingsToForms()
  return data
}

const syncActions: Record<SyncKey, () => Promise<any>> = {
  onboardingQuestions: () => OnboardingQuestionsService.syncWithDrive(),
  languages: () => LanguagesService.sync(),
  activityTypes: () => ActivityTypesService.syncWithDrive(),
  socialNetworks: () => SocialNetworksService.syncWithDrive(),
  moodTypes: () => MoodTypesService.syncWithDrive(),
}

const handleSync = async (key: SyncKey) => {
  await asyncGlobalSpinner(syncActions[key]())
  await loadSettings()
  showSuccessToast(`${labels[key]} synchronised successfully.`)
}

const handleSyncAll = async () => {
  const keys = Object.keys(syncActions) as SyncKey[]
  await asyncGlobalSpinner(...keys.map((syncKey) => syncActions[syncKey]()))
  await loadSettings()
  showSuccessToast('All synchronisations completed successfully.')
}

const openDialog = (dialog: DialogKey) => {
  applySettingsToForms()
  if (dialog === 'notifications') {
    resetNotificationErrors()
  }
  dialogs[dialog] = true
}

const saveSuggested = async () => {
  const payload: UpdateSettingsPayload = {
    suggestedActivities: {
      count: forms.suggested.count,
      cron: {
        generateDailySuggestions: forms.suggested.cron.generateDailySuggestions || null,
        cleanupOldSuggestions: forms.suggested.cron.cleanupOldSuggestions || null,
      },
    },
  }
  const [updated] = (await asyncGlobalSpinner(
    SettingsService.updateSettings(payload),
  )) as [SettingsResponse]
  settings.value = updated
  cronOptions.value = updated.cronExpressions
  applySettingsToForms()
  dialogs.suggested = false
  showSuccessToast('Suggested activities settings updated.')
}

const saveArticles = async () => {
  const payload: UpdateSettingsPayload = {
    articles: {
      count: forms.articles.count,
      expirationDays: forms.articles.expirationDays,
      cron: {
        generateArticles: forms.articles.cron.generateArticles || null,
        cleanupOldArticles: forms.articles.cron.cleanupOldArticles || null,
      },
    },
  }
  const [updated] = (await asyncGlobalSpinner(
    SettingsService.updateSettings(payload),
  )) as [SettingsResponse]
  settings.value = updated
  cronOptions.value = updated.cronExpressions
  applySettingsToForms()
  dialogs.articles = false
  showSuccessToast('Article settings updated.')
}

const saveSurveys = async () => {
  const payload: UpdateSettingsPayload = {
    surveys: {
      count: forms.surveys.count,
      expirationDays: forms.surveys.expirationDays,
      cron: {
        generateSurveys: forms.surveys.cron.generateSurveys || null,
        cleanupOldSurveys: forms.surveys.cron.cleanupOldSurveys || null,
      },
    },
  }
  const [updated] = (await asyncGlobalSpinner(
    SettingsService.updateSettings(payload),
  )) as [SettingsResponse]
  settings.value = updated
  cronOptions.value = updated.cronExpressions
  applySettingsToForms()
  dialogs.surveys = false
  showSuccessToast('Survey settings updated.')
}

const saveNotifications = async () => {
  resetNotificationErrors()

  const normalized = {} as UpdateNotificationCronPayload
  let hasError = false

  for (const key of Object.keys(notificationLabels) as NotificationFieldKey[]) {
    const rawValue = forms.notifications.cron[key] || ''
    const value = normalizeCron(rawValue)
    forms.notifications.cron[key] = value

    if (!value) {
      notificationErrors[key] = 'Cron expression is required'
      hasError = true
      continue
    }

    if (!isCronFormatValid(value)) {
      notificationErrors[key] = 'Cron expression must contain 5 or 6 space-separated segments'
      hasError = true
      continue
    }

    normalized[key] = value
  }

  if (hasError) {
    return
  }

  const [updated] = (await asyncGlobalSpinner(
    SettingsService.updateNotificationCron(normalized),
  )) as [SettingsResponse]
  settings.value = updated
  cronOptions.value = updated.cronExpressions
  applySettingsToForms()
  dialogs.notifications = false
  showSuccessToast('Notification reminder schedules updated.')
}

const triggerGenerateArticles = async () => {
  await asyncGlobalSpinner(SettingsService.triggerGenerateArticles())
  showSuccessToast('Article generation triggered.')
}

const triggerCleanupArticles = async () => {
  await asyncGlobalSpinner(SettingsService.triggerCleanupArticles())
  showSuccessToast('Article cleanup triggered.')
}

const triggerGenerateSurveys = async () => {
  await asyncGlobalSpinner(SettingsService.triggerGenerateSurveys())
  showSuccessToast('Survey generation triggered.')
}

const triggerCleanupSurveys = async () => {
  await asyncGlobalSpinner(SettingsService.triggerCleanupSurveys())
  showSuccessToast('Survey cleanup triggered.')
}

applySettingsToForms()
if (settings.value) {
  cronOptions.value = settings.value.cronExpressions
}
</script>

<style scoped>
.setting-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.75rem;
  line-height: 1.4;
}

.setting-line code {
  font-family: 'Fira Code', monospace;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.cron-combobox :deep(.v-field__input) {
  background-color: var(--v-theme-surface);
  min-height: 52px;
}

.cron-combobox :deep(input) {
  color: var(--v-theme-on-surface);
  caret-color: var(--v-theme-primary);
}

.cron-combobox :deep(input::placeholder) {
  color: currentColor;
  opacity: 0.6;
}

.cron-combobox :deep(.v-field--active .v-field__input > input) {
  opacity: 1 !important;
}
</style>

