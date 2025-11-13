<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h2>Mood Surveys</h2>
        <v-btn color="primary" @click="showCreateDialog = true">
          <v-icon start>mdi-plus</v-icon>
          Create Survey
        </v-btn>
      </v-col>
    </v-row>

    <!-- Tabs -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-tabs v-model="activeTab" color="primary">
            <v-tab value="active">
              Active Surveys ({{ activeSurveys.length }})
            </v-tab>
            <v-tab value="archived">
              Archived Surveys ({{ archivedSurveys.length }})
            </v-tab>
          </v-tabs>

          <v-tabs-window v-model="activeTab">
            <!-- Active Surveys Tab -->
            <v-tabs-window-item value="active">
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="activeSurveys"
              :items-per-page="-1"
              hide-default-footer
            >
                  <template v-slot:item.createdAt="{ item }">
                    {{ item.createdAt }}
              </template>
                  
                  <template v-slot:item.updatedAt="{ item }">
                    {{ item.updatedAt }}
              </template>

                  <template v-slot:item.responsesCount="{ item }">
                    {{ item.responsesCount }}
                  </template>
                  
              <template v-slot:item.actions="{ item }">
                    <v-btn
                      size="small"
                      color="primary"
                      variant="text"
                      @click="editSurvey(item)"
                  class="mr-2"
                    >
                      <v-icon size="small">mdi-pencil</v-icon>
                      Edit
                    </v-btn>
                    <v-btn
                      size="small"
                      color="warning"
                      variant="text"
                      @click="openArchiveDialog(item)"
                    >
                      <v-icon size="small">mdi-archive</v-icon>
                      Archive
                    </v-btn>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-tabs-window-item>

            <!-- Archived Surveys Tab -->
            <v-tabs-window-item value="archived">
              <v-card-text>
                <v-data-table
                  :headers="archivedHeaders"
                  :items="archivedSurveys"
                  :items-per-page="-1"
                  hide-default-footer
                >
                  <template v-slot:item.createdAt="{ item }">
                    {{ item.createdAt }}
                  </template>
                  
                  <template v-slot:item.archivedAt="{ item }">
                    {{ item.archivedAt || '—' }}
                  </template>

                  <template v-slot:item.responsesCount="{ item }">
                    {{ item.responsesCount }}
                  </template>
                  
                  <template v-slot:item.actions="{ item }">
                    <v-btn
                      size="small"
                      color="success"
                      variant="text"
                      @click="openRestoreDialog(item)"
                    >
                      <v-icon size="small">mdi-restore</v-icon>
                      Restore
                    </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="500px">
      <v-card>
        <v-card-title>
          {{ editingSurvey ? 'Edit Survey' : 'Create New Survey' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-text-field
              v-model="surveyForm.title"
              label="Survey Title"
              :rules="[v => !!v || 'Title is required']"
              required
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="closeDialog">Cancel</v-btn>
          <v-btn 
            color="primary" 
            @click="saveSurvey"
            :disabled="!formValid"
          >
            {{ editingSurvey ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- No Data -->
    <v-row v-if="(activeTab === 'active' && !activeSurveys.length) || (activeTab === 'archived' && !archivedSurveys.length)">
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          {{ activeTab === 'active' ? 'No active surveys found.' : 'No archived surveys found.' }}
        </v-alert>
      </v-col>
    </v-row>

    <v-dialog v-model="showArchiveDialog" max-width="480">
      <v-card>
        <v-card-title>Archive Survey</v-card-title>
        <v-card-text>
          Archiving "{{ surveyToHandle?.title }}" will remove it from the active list. Continue?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeArchiveDialog">Cancel</v-btn>
          <v-btn color="warning" @click="confirmArchiveSurvey">Archive</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showRestoreDialog" max-width="480">
      <v-card>
        <v-card-title>Restore Survey</v-card-title>
        <v-card-text>
          Restore "{{ surveyToHandle?.title }}" to the active list?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeRestoreDialog">Cancel</v-btn>
          <v-btn color="success" @click="confirmRestoreSurvey">Restore</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<route lang="yaml">
name: mood-surveys
meta:
  layout: profile
</route>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { MoodSurveysService, type MoodSurvey } from '@api'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { showSuccessToast, showErrorToast } from '@workers/toast-worker'


const route = useRoute()

const activeTab = ref('active')
const showCreateDialog = ref(false)
const editingSurvey = ref<MoodSurvey | null>(null)
const formValid = ref(false)

const surveyForm = ref({
  title: ''
})

// Data from resolver
const activeSurveysData = route.meta.activeSurveys as MoodSurvey[]
const archivedSurveysData = route.meta.archivedSurveys as MoodSurvey[]

const activeSurveys = ref<MoodSurvey[]>(activeSurveysData || [])
const archivedSurveys = ref<MoodSurvey[]>(archivedSurveysData || [])

const stats = computed(() => {
  const activeCount = activeSurveys.value.length
  const archivedCount = archivedSurveys.value.length
  const total = activeCount + archivedCount

  return [
    { title: 'Active Surveys', value: activeCount },
    { title: 'Archived Surveys', value: archivedCount },
    { title: 'Total Surveys', value: total },
  ]
})

const headers = [
  { title: 'Title', key: 'title', sortable: false },
  { title: 'Created By', key: 'createdBy', sortable: false },
  { title: 'Created At', key: 'createdAt', sortable: false },
  { title: 'Responses', key: 'responsesCount', sortable: false },
  { title: 'Updated By', key: 'updatedBy', sortable: false },
  { title: 'Updated At', key: 'updatedAt', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const archivedHeaders = [
  { title: 'Title', key: 'title', sortable: false },
  { title: 'Created By', key: 'createdBy', sortable: false },
  { title: 'Created At', key: 'createdAt', sortable: false },
  { title: 'Responses', key: 'responsesCount', sortable: false },
  { title: 'Archived By', key: 'archivedBy', sortable: false },
  { title: 'Archived At', key: 'archivedAt', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const loadSurveys = async () => {
  const [active, archived] = (await asyncGlobalSpinner(
    MoodSurveysService.getAll(),
    MoodSurveysService.getArchived(),
  )) as [MoodSurvey[], MoodSurvey[]]

  activeSurveys.value = active
  archivedSurveys.value = archived
}

const editSurvey = (survey: MoodSurvey) => {
  editingSurvey.value = survey
  surveyForm.value.title = survey.title
  showCreateDialog.value = true
}

const closeDialog = () => {
  showCreateDialog.value = false
  editingSurvey.value = null
  surveyForm.value.title = ''
}

const saveSurvey = async () => {
  if (!surveyForm.value.title.trim()) return

  if (editingSurvey.value) {
    await asyncGlobalSpinner(
      MoodSurveysService.update(editingSurvey.value.id, { title: surveyForm.value.title.trim() }),
    )
    showSuccessToast('Survey updated successfully.')
  } else {
    await asyncGlobalSpinner(
      MoodSurveysService.create({ title: surveyForm.value.title.trim() }),
    )
    showSuccessToast('Survey created successfully.')
  }

  closeDialog()
  await loadSurveys()
}

const showArchiveDialog = ref(false)
const showRestoreDialog = ref(false)
const surveyToHandle = ref<MoodSurvey | null>(null)

const openArchiveDialog = (survey: MoodSurvey) => {
  surveyToHandle.value = survey
  showArchiveDialog.value = true
}

const openRestoreDialog = (survey: MoodSurvey) => {
  surveyToHandle.value = survey
  showRestoreDialog.value = true
}

const closeArchiveDialog = () => {
  showArchiveDialog.value = false
  surveyToHandle.value = null
}

const closeRestoreDialog = () => {
  showRestoreDialog.value = false
  surveyToHandle.value = null
}

const confirmArchiveSurvey = async () => {
  if (!surveyToHandle.value) return
  await asyncGlobalSpinner(MoodSurveysService.archive(surveyToHandle.value.id))
  await loadSurveys()
  showSuccessToast('Survey archived successfully.')
  closeArchiveDialog()
}

const confirmRestoreSurvey = async () => {
  if (!surveyToHandle.value) return
  await asyncGlobalSpinner(MoodSurveysService.restore(surveyToHandle.value.id))
  await loadSurveys()
  showSuccessToast('Survey restored successfully.')
  closeRestoreDialog()
}
</script>