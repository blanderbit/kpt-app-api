<route lang="yaml">
meta:
  layout: profile
name: languages
</route>

<template>
  <v-container fluid>
    <!-- Statistics Cards -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card color="primary" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ statistics?.totalLanguages || 0 }}</div>
            <div class="text-caption">Total Languages</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="success" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ statistics?.activeLanguages || 0 }}</div>
            <div class="text-caption">Active Languages</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="info" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ statistics?.totalKeys || 0 }}</div>
            <div class="text-caption">Total Keys</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="warning" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ statistics?.averageCompletionRate || 0 }}%</div>
            <div class="text-caption">Avg Completion</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Actions Row -->
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <div class="button-group">        
         <v-btn color="grey" variant="outlined" @click="goToArchived">
           <v-icon start>mdi-archive</v-icon>
           View Archived Languages
         </v-btn>
    
         <v-btn color="primary" @click="goToCreate">
           <v-icon start>mdi-plus</v-icon>
           Create Language
         </v-btn>
        <v-btn color="info" @click="openDownloadDialog">
           <v-icon start>mdi-download</v-icon>
           Download Template
         </v-btn>
        <v-btn color="success" @click="handleSync">
           <v-icon start>mdi-sync</v-icon>
           Sync from Google Drive
         </v-btn>
       </div>
     </v-col>
   </v-row>

    <!-- Languages Table -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-translate</v-icon>
            Languages
            <v-spacer></v-spacer>
            <span class="text-caption text-grey">
              Last sync: {{ formatLastSyncDate(lastSyncDate) }}
            </span>
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="searchQuery"
              label="Search by code, name, or native name"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              clearable
              class="mb-4"
              hide-details
            ></v-text-field>
            <v-data-table
              :headers="headers"
              :items="filteredLanguages"
              :items-per-page="-1"
              hide-default-footer
            >
              <template v-slot:item.code="{ item }">
                <v-chip size="small" color="primary" variant="outlined">
                  {{ item.code }}
                </v-chip>
              </template>
              
              <template v-slot:item.direction="{ item }">
                <v-chip size="small" :color="item.direction === 'rtl' ? 'warning' : 'info'" variant="tonal">
                  {{ item.direction.toUpperCase() }}
                </v-chip>
              </template>

              <template v-slot:item.isActive="{ item }">
                <v-switch
                  :model-value="item.isActive"
                  @update:model-value="handleSetActive(item.id, $event)"
                  color="success"
                  hide-details
                  density="compact"
                ></v-switch>
              </template>

              <template v-slot:item.isDefault="{ item }">
                <v-chip 
                  v-if="item.isDefault" 
                  size="small" 
                  color="success"
                >
                  Default
                </v-chip>
                <v-btn
                  v-else
                  size="small"
                  variant="text"
                  @click="handleSetDefault(item.id)"
                >
                  Set Default
                </v-btn>
              </template>

              <template v-slot:item.completionRate="{ item }">
                <div class="d-flex align-center">
                  <v-progress-linear
                    :model-value="item.completionRate"
                    height="8"
                    rounded
                    :color="item.completionRate > 80 ? 'success' : item.completionRate > 50 ? 'warning' : 'error'"
                    class="mr-2"
                    style="width: 100px;"
                  ></v-progress-linear>
                  <span class="text-caption">{{ item.completionRate }}%</span>
                </div>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  size="small"
                  color="primary"
                  variant="text"
                  @click="goToUpdate(item.id)"
                  class="mr-1"
                >
                  <v-icon size="small">mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  size="small"
                  color="error"
                  variant="text"
                  @click="openArchiveDialog(item)"
                >
                  <v-icon size="small">mdi-archive</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="isArchiveDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Archive Language</v-card-title>
        <v-card-text>
          <p>
            Are you sure you want to archive
            "<strong>{{ archiveLanguage?.name }}</strong>" ({{ archiveLanguage?.code }})?
          </p>
          <v-textarea
            v-model="archiveReason"
            label="Reason (optional)"
            rows="3"
            density="comfortable"
            auto-grow
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeArchiveDialog">Cancel</v-btn>
          <v-btn color="error" @click="confirmArchive">Archive</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isDownloadDialogOpen" max-width="420">
      <v-card>
        <v-card-title>Download Template</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="downloadCode"
            label="Language code (e.g. en, ru)"
            density="comfortable"
            autofocus
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDownloadDialog">Cancel</v-btn>
          <v-btn color="primary" @click="confirmDownloadTemplate">Download</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LanguagesService, SettingsService } from '@api'
import type { Language, LanguageStatistics, LanguageCache, SettingsResponse } from '@api'
import { asyncGlobalSpinner, startGlobalSpinner, finishGlobalSpinner } from '@workers/loading-worker'
import { showSuccessToast, showErrorToast } from '@workers/toast-worker'

const route = useRoute()
const router = useRouter()

const cacheData = route.meta.languageCache as LanguageCache
const statisticsData = route.meta.languageStatistics as LanguageStatistics
const settingsData = route.meta.settings as SettingsResponse | undefined

const languages = ref<Language[]>(cacheData?.languages ?? [])
const lastSyncDate = ref<string | null>(settingsData?.googleDriveSync?.languages ?? null)
const statistics = ref<LanguageStatistics>(statisticsData)
const searchQuery = ref<string>('')

const filteredLanguages = computed(() => {
  if (!searchQuery.value || !searchQuery.value.trim()) {
    return languages.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  
  return languages.value.filter((language) => {
    const code = (language.code || '').toLowerCase()
    const name = (language.name || '').toLowerCase()
    const nativeName = (language.nativeName || '').toLowerCase()
    
    return code.includes(query) || name.includes(query) || nativeName.includes(query)
  })
})

const headers = [
  { title: 'Code', key: 'code', sortable: false },
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Native Name', key: 'nativeName', sortable: false },
  { title: 'Direction', key: 'direction', sortable: false },
  { title: 'Active', key: 'isActive', sortable: false },
  { title: 'Default', key: 'isDefault', sortable: false },
  { title: 'Keys', key: 'totalKeys', sortable: false },
  { title: 'Translations', key: 'totalTranslations', sortable: false },
  { title: 'Completion', key: 'completionRate', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const isArchiveDialogOpen = ref(false)
const archiveLanguage = ref<Language | null>(null)
const archiveReason = ref('')

const isDownloadDialogOpen = ref(false)
const downloadCode = ref('')

const loadData = async (showToast: boolean = true) => {
  const [cacheResponse, statsResponse, settingsResponse] = (await asyncGlobalSpinner(
    LanguagesService.getCache(),
    LanguagesService.getStatistics(),
    SettingsService.getSettings(),
  )) as [LanguageCache, LanguageStatistics, SettingsResponse]

  languages.value = cacheResponse.languages
  lastSyncDate.value = settingsResponse?.googleDriveSync?.languages ?? null
  statistics.value = statsResponse

  if (showToast) {
    showSuccessToast('Languages refreshed.')
  }
}

const handleSync = async () => {
  const [syncResponse, settingsResponse] = (await asyncGlobalSpinner(
    LanguagesService.sync(),
    SettingsService.getSettings(),
  )) as [LanguageCache & { message: string; syncedAt: string }, SettingsResponse]

  languages.value = syncResponse.languages
  lastSyncDate.value = settingsResponse?.googleDriveSync?.languages ?? null
  
  const statsResponse = await LanguagesService.getStatistics()
  statistics.value = statsResponse

  showSuccessToast(syncResponse.message || 'Languages synced successfully.')
}

const handleSetActive = async (id: string, isActive: boolean) => {
  await asyncGlobalSpinner(LanguagesService.setActive(id, isActive))
  const target = languages.value.find((language) => language.id === id)
  if (target) {
    target.isActive = isActive
  }
  showSuccessToast(`Language ${isActive ? 'activated' : 'deactivated'}.`)
}

const handleSetDefault = async (id: string) => {
  await asyncGlobalSpinner(LanguagesService.setDefault(id))
  languages.value = languages.value.map((language) => ({
    ...language,
    isDefault: language.id === id,
  }))
  showSuccessToast('Default language updated.')
}

const openArchiveDialog = (language: Language) => {
  archiveLanguage.value = language
  archiveReason.value = ''
  isArchiveDialogOpen.value = true
}

const closeArchiveDialog = () => {
  isArchiveDialogOpen.value = false
  archiveLanguage.value = null
  archiveReason.value = ''
}

const confirmArchive = async () => {
  if (!archiveLanguage.value) return

  await asyncGlobalSpinner(LanguagesService.archive(archiveLanguage.value.id, archiveReason.value || undefined))

  const [cacheResponse, statsResponse, settingsResponse] = await asyncGlobalSpinner(
    LanguagesService.sync(),
    LanguagesService.getStatistics(),
    SettingsService.getSettings(),
  ) as [LanguageCache & { message: string; syncedAt: string }, LanguageStatistics, SettingsResponse]

  languages.value = cacheResponse.languages
  lastSyncDate.value = settingsResponse?.googleDriveSync?.languages ?? null
  statistics.value = statsResponse
  showSuccessToast('Language archived successfully.')
  closeArchiveDialog()
}

const openDownloadDialog = () => {
  downloadCode.value = ''
  isDownloadDialogOpen.value = true
}

const closeDownloadDialog = () => {
  isDownloadDialogOpen.value = false
  downloadCode.value = ''
}

const confirmDownloadTemplate = async () => {
  const code = downloadCode.value.trim()
  if (!code) {
    showErrorToast('Please enter a language code.')
    return
  }

  startGlobalSpinner()
  try {
    const blob = await LanguagesService.downloadTemplate(code)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${code}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    showSuccessToast('Template downloaded successfully.')
  } catch (error) {
    console.error(error)
    showErrorToast('Failed to download template.')
  } finally {
    finishGlobalSpinner()
    closeDownloadDialog()
  }
}

const goToCreate = () => {
  router.push('/profile/languages/create')
}

const goToUpdate = (id: string) => {
  router.push(`/profile/languages/edit/${id}`)
}

const goToArchived = () => {
  router.push('/profile/languages/archived')
}

const formatLastSyncDate = (date: string | null): string => {
  if (!date) {
    return 'Never'
  }
  
  // If date is already formatted (DD.MM.YYYY HH:mm format from settings), return as is
  if (date.includes('.') && date.includes(':')) {
    return date
  }
  
  // Otherwise, try to parse as ISO date
  try {
    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) {
      return 'Never'
    }
    return parsedDate.toLocaleString()
  } catch {
    return 'Never'
  }
}
</script>

<style scoped>
.button-group { display: flex; gap: 12px; }
</style>
