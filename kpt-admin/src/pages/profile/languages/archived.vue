<route lang="yaml">
meta:
  layout: profile
name: languages-archived
</route>

<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <div>
          <h2>Archived Languages</h2>
          <p class="text-caption text-grey">Languages that have been archived</p>
        </div>
        <div>
          <v-btn @click="goBack" variant="text" class="mr-2">
            <v-icon start>mdi-arrow-left</v-icon>
            Back to Languages
          </v-btn>
          <v-btn color="success" @click="handleSync">
            <v-icon start>mdi-sync</v-icon>
            Sync Archived
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Archived Languages Table -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-archive</v-icon>
            Archived Languages ({{ languages.length }})
            <v-spacer></v-spacer>
            <span class="text-caption text-grey">
              Last sync: {{ lastSyncDate ? new Date(lastSyncDate).toLocaleString() : 'Never' }}
            </span>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="languages"
              items-per-page="10"
            >
              <template v-slot:item.code="{ item }">
                <v-chip size="small" color="grey" variant="outlined">
                  {{ item.code }}
                </v-chip>
              </template>
              
              <template v-slot:item.direction="{ item }">
                <v-chip size="small" :color="item.direction === 'rtl' ? 'warning' : 'info'" variant="tonal">
                  {{ item.direction.toUpperCase() }}
                </v-chip>
              </template>

              <template v-slot:item.completionRate="{ item }">
                <div class="d-flex align-center">
                  <v-progress-linear
                    :model-value="item.completionRate"
                    height="8"
                    rounded
                    color="grey"
                    class="mr-2"
                    style="width: 100px;"
                  ></v-progress-linear>
                  <span class="text-caption">{{ item.completionRate }}%</span>
                </div>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  size="small"
                  color="success"
                  variant="text"
                  @click="openRestoreDialog(item)"
                  class="mr-1"
                >
                  <v-icon size="small">mdi-restore</v-icon>
                  Restore
                </v-btn>
                <v-btn
                  size="small"
                  color="error"
                  variant="text"
                  @click="openDeleteDialog(item)"
                >
                  <v-icon size="small">mdi-delete-forever</v-icon>
                  Delete
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="isRestoreDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Restore Language</v-card-title>
        <v-card-text>
          Are you sure you want to restore
          "<strong>{{ restoreLanguage?.name }}</strong>" ({{ restoreLanguage?.code }}) from archive?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeRestoreDialog">Cancel</v-btn>
          <v-btn color="success" @click="confirmRestore">Restore</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isDeleteDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Delete Language Permanently</v-card-title>
        <v-card-text>
          <p class="mb-4">
            This will permanently delete "<strong>{{ deleteLanguage?.name }}</strong>" ({{ deleteLanguage?.code }}) and cannot be undone.
          </p>
          <p>Are you sure you want to proceed?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="error" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LanguagesService } from '@api'
import type { Language, LanguageCache } from '@api'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { showSuccessToast } from '@workers/toast-worker'

const route = useRoute()
const router = useRouter()

// Данные из резолвера
const archivedData = route.meta.archivedLanguagesCache as { languages: Language[], total: number, lastSyncDate: string | null }
const languages = ref<Language[]>(archivedData?.languages || [])
const lastSyncDate = ref<string | null>(archivedData?.lastSyncDate || null)

const headers = [
  { title: 'Code', key: 'code', sortable: false },
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Native Name', key: 'nativeName', sortable: false },
  { title: 'Direction', key: 'direction', sortable: false },
  { title: 'Keys', key: 'totalKeys', sortable: false },
  { title: 'Translations', key: 'totalTranslations', sortable: false },
  { title: 'Completion', key: 'completionRate', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const isRestoreDialogOpen = ref(false)
const restoreLanguage = ref<Language | null>(null)
const isDeleteDialogOpen = ref(false)
const deleteLanguage = ref<Language | null>(null)

const loadData = async (showToast = false) => {
  const [response] = await asyncGlobalSpinner(LanguagesService.getArchivedCache()) as LanguageCache
  languages.value = response.languages
  lastSyncDate.value = response.lastSyncDate

  if (showToast) {
    showSuccessToast('Archived languages refreshed.')
  }
}

const handleSync = async () => {
  const [result] = await asyncGlobalSpinner(LanguagesService.syncArchived()) as LanguageCache & { message: string; syncedAt: string }

  languages.value = result.languages
  lastSyncDate.value = result.lastSyncDate
  showSuccessToast(result.message || 'Archived languages synced successfully.')
  await loadData()
}

const openRestoreDialog = (language: Language) => {
  restoreLanguage.value = language
  isRestoreDialogOpen.value = true
}

const closeRestoreDialog = () => {
  restoreLanguage.value = null
  isRestoreDialogOpen.value = false
}

const confirmRestore = async () => {
  if (!restoreLanguage.value) return

  await asyncGlobalSpinner(
    LanguagesService.restore(restoreLanguage.value.id),
  )

  const archivedResponse = await asyncGlobalSpinner(
    LanguagesService.syncArchived(),
  ) as LanguageCache & { message: string; syncedAt: string }

  languages.value = archivedResponse.languages
  lastSyncDate.value = archivedResponse.lastSyncDate
  showSuccessToast('Language restored successfully.')
  closeRestoreDialog()
}

const openDeleteDialog = (language: Language) => {
  deleteLanguage.value = language
  isDeleteDialogOpen.value = true
}

const closeDeleteDialog = () => {
  deleteLanguage.value = null
  isDeleteDialogOpen.value = false
}

const confirmDelete = async () => {
  if (!deleteLanguage.value) return

  await asyncGlobalSpinner(
    LanguagesService.deleteArchived(deleteLanguage.value.id),
  )

  const [updatedArchive] = await asyncGlobalSpinner(
    LanguagesService.syncArchived(),
  ) as LanguageCache & { message: string; syncedAt: string }

  languages.value = updatedArchive.languages
  lastSyncDate.value = updatedArchive.lastSyncDate
  showSuccessToast('Language permanently deleted.')
  closeDeleteDialog()
}

const goBack = () => {
  router.push('/profile/languages')
}

</script>

