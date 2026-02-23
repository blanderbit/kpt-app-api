<route lang="yaml">
meta:
  layout: profile
name: programs
</route>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
            Programs Management
            <v-spacer></v-spacer>
            <div class="text-caption text-grey">
              Last sync: {{ formatLastSyncDate(lastSyncDate) }}
            </div>
          </v-card-title>
          <v-card-text>
            <v-row class="mb-4">
              <v-col cols="12" md="4">
                <v-card color="primary" variant="tonal">
                  <v-card-text class="text-center">
                    <div class="text-h4 font-weight-bold">{{ totalCount }}</div>
                    <div class="text-caption">Total Programs</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="8" class="d-flex align-center justify-end">
                <v-btn color="info" @click="handleSync" class="mr-2">
                  <v-icon start>mdi-sync</v-icon>
                  Sync from Google Drive
                </v-btn>
              </v-col>
            </v-row>

            <v-form ref="formRef" v-model="isValid">
              <v-row>
                <v-col cols="12">
                  <v-label class="mb-2">Programs (JSON)</v-label>
                  <div class="programs-json-editor-wrap">
                    <JsonEditor
                      v-model="programsData"
                      mode="tree"
                      :navigationBar="false"
                    />
                  </div>
                  <div class="text-caption text-grey mt-1">
                    Edit programs array. Each program must have a "name" field.
                  </div>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              color="primary" 
              @click="handleSave" 
              :disabled="!hasChanges"
              :loading="saving"
            >
              <v-icon start>mdi-content-save</v-icon>
              Save to Google Drive
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ProgramsService, type Program, type ProgramsResponse } from '@api'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { showSuccessToast, showErrorToast } from '@workers/toast-worker'
import JsonEditor from 'vue3-ts-jsoneditor'

const isValid = ref(true)
const formRef = ref(null)
const saving = ref(false)
const lastSyncDate = ref<string | null>(null)
const totalCount = ref(0)

// Original programs data from API
const originalProgramsData = ref<{ programs: Program[] }>({ programs: [] })
// Editable programs data for JSON editor
const programsData = ref<{ programs: Program[] }>({ programs: [] })

// Check if there are any changes
const hasChanges = computed(() => {
  return JSON.stringify(programsData.value) !== JSON.stringify(originalProgramsData.value)
})

const loadPrograms = async () => {
  try {
    const [response] = (await asyncGlobalSpinner(
      ProgramsService.getAll()
    )) as [ProgramsResponse]

    if (!response || !Array.isArray(response.programs)) {
      originalProgramsData.value = { programs: [] }
      programsData.value = { programs: [] }
      totalCount.value = 0
      lastSyncDate.value = response?.lastSyncDate ?? null
      return
    }

    originalProgramsData.value = { programs: response.programs }
    programsData.value = { programs: JSON.parse(JSON.stringify(response.programs)) }
    totalCount.value = response.totalCount ?? response.programs.length
    lastSyncDate.value = response.lastSyncDate ?? null
  } catch (error) {
    console.error('Failed to load programs:', error)
    showErrorToast('Failed to load programs.')
  }
}

const handleSync = async () => {
  try {
    await asyncGlobalSpinner(ProgramsService.syncWithDrive())
    await loadPrograms()
    showSuccessToast('Programs synced successfully from Google Drive.')
  } catch (error) {
    console.error('Failed to sync programs:', error)
    showErrorToast('Failed to sync programs from Google Drive.')
  }
}

const handleSave = async () => {
  if (!formRef.value) return

  // Validate JSON structure
  if (!programsData.value || !programsData.value.programs || !Array.isArray(programsData.value.programs)) {
    showErrorToast('Invalid JSON: programs must be an array')
    return
  }

  // Validate each program has a name
  for (const program of programsData.value.programs) {
    if (!program.name || typeof program.name !== 'string' || program.name.trim() === '') {
      showErrorToast('Invalid data: each program must have a non-empty name')
      return
    }
  }

  saving.value = true
  try {
    const [response] = (await asyncGlobalSpinner(
      ProgramsService.update(programsData.value.programs)
    )) as [{ success: boolean; message: string }]

    if (response?.success) {
      // Update original data to reflect saved state
      originalProgramsData.value = { programs: JSON.parse(JSON.stringify(programsData.value.programs)) }
      totalCount.value = programsData.value.programs.length
      showSuccessToast(response.message || 'Programs saved successfully.')
    } else {
      showErrorToast(response.message || 'Failed to save programs.')
    }
  } catch (error: any) {
    console.error('Failed to save programs:', error)
    // 400/4xx: interceptor already shows response message (e.g. duplicate id)
    if (!error?.response?.data?.message) {
      showErrorToast('Failed to save programs.')
    }
  } finally {
    saving.value = false
  }
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

onMounted(() => {
  loadPrograms()
})
</script>

<style scoped>
.programs-json-editor-wrap {
  min-height: 560px;
  max-height: 75vh;
  overflow: auto;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  padding-bottom: 24px;
}
.programs-json-editor-wrap :deep(.jsoneditor) {
  min-height: 540px;
}
</style>
