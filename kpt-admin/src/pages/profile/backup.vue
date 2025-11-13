<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h2>Database Backup</h2>
        <v-btn color="primary" @click="createBackup">
          <v-icon start>mdi-backup-restore</v-icon>
          Create Backup
        </v-btn>
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

    <!-- Backups Table -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            Database Backups ({{ backups.length }})
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="backups"
              :items-per-page="-1"
              hide-default-footer
            >
              <template v-slot:item.size="{ item }">
                {{ formatFileSize(+item.size) }}
              </template>
              
              <template v-slot:item.modifiedTime="{ item }">
                {{ item.modifiedTime }}
              </template>
              
              <template v-slot:item.actions="{ item }">
                <v-btn
                  size="small"
                  color="primary"
                  variant="text"
                  @click="downloadBackup(item)"
                  class="mr-2"
                >
                  <v-icon size="small">mdi-download</v-icon>
                  Download
                </v-btn>
                <v-btn
                  size="small"
                  color="warning"
                  variant="text"
                  @click="openRestoreDialog(item)"
                >
                  <v-icon size="small">mdi-restore</v-icon>
                  Restore
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- No Data -->
    <v-row v-if="!backups.length">
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          No backups found. Create your first backup to get started.
        </v-alert>
      </v-col>
    </v-row>

    <v-dialog v-model="showRestoreDialog" max-width="500px">
      <v-card>
        <v-card-title>Confirm Restore</v-card-title>
        <v-card-text>
          Restoring from backup "{{ backupToRestore?.name }}" will replace the current database. Continue?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeRestoreDialog">Cancel</v-btn>
          <v-btn color="warning" @click="confirmRestoreBackup">
            Restore
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<route lang="yaml">
name: backup
meta:
  layout: profile
</route>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { BackupService, type Backup, type BackupListResponse, formatFileSize } from '@api'
import { showSuccessToast, showErrorToast } from '@workers/toast-worker'
import { asyncGlobalSpinner } from '@workers/loading-worker'

const route = useRoute()

const backups = ref<Backup[]>([])

// Data from resolver
const backupData = route.meta.backups as BackupListResponse | undefined
backups.value = backupData?.backups ?? []

const latestBackup = computed(() => backups.value[0])

const stats = computed(() => [
  {
    title: 'Total Backups',
    value: backups.value.length
  },
  {
    title: 'Total Size',
    value: formatFileSize(backups.value.reduce((sum, backup) => sum + Number(backup.size ?? 0), 0))
  },
  {
    title: 'Latest Backup',
    value: latestBackup.value?.modifiedTime ?? 'None'
  }
])

const headers = [
  { title: 'File Name', key: 'name', sortable: false },
  { title: 'Size', key: 'size', sortable: false },
  { title: 'Created', key: 'modifiedTime', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const createBackup = async () => {
  const response = await asyncGlobalSpinner(BackupService.create())
  showSuccessToast(response.message || 'Backup created successfully.')
  await loadBackups()
}

const downloadBackup = async (backup: Backup) => {
  try {
    const blob = await BackupService.download(backup.id)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = backup.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    showErrorToast('Failed to download backup.')
  }
}

const showRestoreDialog = ref(false)
const backupToRestore = ref<Backup | null>(null)

const openRestoreDialog = (backup: Backup) => {
  backupToRestore.value = backup
  showRestoreDialog.value = true
}

const closeRestoreDialog = () => {
  showRestoreDialog.value = false
  backupToRestore.value = null
}

const confirmRestoreBackup = async () => {
  if (!backupToRestore.value) return

  const response = await asyncGlobalSpinner(BackupService.restore(backupToRestore.value.name))
  showSuccessToast(response.message || 'Database restored successfully.')
  await loadBackups()
  closeRestoreDialog()
}

const loadBackups = async () => {
  const [response] = await asyncGlobalSpinner(BackupService.getList())
  backups.value = response.backups ?? []
}
</script>