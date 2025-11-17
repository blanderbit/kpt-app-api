<route lang="yaml">
name: surveys
meta:
  layout: profile
</route>

<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <div class="d-flex align-center">
          <h2 class="mr-4">Surveys ({{ paginationTotalCount }})</h2>
          <v-tabs v-model="activeTab" density="comfortable">
            <v-tab value="active">
              <v-icon start size="18">mdi-playlist-check</v-icon>
              Active
            </v-tab>
            <v-tab value="archived">
              <v-icon start size="18">mdi-archive</v-icon>
              Archived
            </v-tab>
            <v-tab value="available">
              <v-icon start size="18">mdi-clipboard-text-outline</v-icon>
              Available
            </v-tab>
          </v-tabs>
        </div>

        <v-btn color="primary" @click="showCreateDialog = true">
          <v-icon start>mdi-plus</v-icon>
          Create Survey
        </v-btn>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="surveys"
              hide-default-footer
            >
              <template v-slot:item.createdAt="{ item }">
                {{ formatDateTime(item.createdAt) }}
              </template>

              <template v-slot:item.updatedAt="{ item }">
                {{ formatDateTime(item.updatedAt) }}
              </template>

              <template v-slot:item.questions="{ item }">
                <div v-if="item.questions && item.questions.length > 0" class="questions-column">
                  <div v-for="(question, qIndex) in item.questions" :key="qIndex" class="question-item mb-3">
                    <div class="font-weight-medium mb-1">
                      {{ qIndex + 1 }}. {{ question.text }}
                    </div>
                    <div v-if="question.options && question.options.length > 0" class="ml-4">
                      <div v-for="(option, oIndex) in question.options" :key="oIndex" class="text-caption text-grey-darken-1">
                        • {{ option.text }}
                      </div>
                    </div>
                  </div>
                </div>
                <span v-else class="text-grey">No questions</span>
              </template>

              <template v-slot:item.files="{ item }">
                <v-btn
                  v-if="item.files[0]?.fileUrl"
                  size="small"
                  variant="text"
                  color="primary"
                  :href="item.files[0].fileUrl"
                  target="_blank"
                  rel="noopener"
                >
                  <v-icon start size="small">mdi-file-download</v-icon>
                  Download
                </v-btn>
                <span v-else class="text-grey">No file</span>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  v-if="activeTab === 'available'"
                  size="small"
                  color="primary"
                  variant="text"
                  class="mr-2"
                  @click="editSurvey(item)"
                >
                  <v-icon size="small">mdi-pencil</v-icon>
                  Edit
                </v-btn>
                <v-btn
                  v-if="activeTab !== 'active'"
                  size="small"
                  color="error"
                  variant="text"
                  class="mr-1"
                  @click="openDeleteDialog(item)"
                >
                  <v-icon size="small">mdi-delete</v-icon>
                  Delete
                </v-btn>
                <v-btn
                  v-if="activeTab === 'available'"
                  size="small"
                  color="success"
                  variant="text"
                  class="mr-1"
                  @click="activateSurvey(item)"
                >
                  <v-icon size="small">mdi-play-circle</v-icon>
                  Activate
                </v-btn>
                <v-btn
                  v-if="activeTab !== 'available'"
                  size="small"
                  color="secondary"
                  variant="text"
                  class="mr-1"
                  @click="viewSurveyStats(item)"
                >
                  <v-icon size="small">mdi-chart-bar</v-icon>
                  Stats
                </v-btn>
                <v-btn
                  v-if="activeTab === 'active'"
                  size="small"
                  color="warning"
                  variant="text"
                  class="mr-1"
                  @click="closeSurvey(item)"
                >
                  <v-icon size="small">mdi-archive-lock</v-icon>
                  Close
                </v-btn>
                <v-btn
                  v-if="activeTab === 'archived'"
                  size="small"
                  color="primary"
                  variant="text"
                  @click="duplicateSurvey(item)"
                >
                  <v-icon size="small">mdi-content-copy</v-icon>
                  Duplicate
                </v-btn>
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

    <v-row v-if="!surveys.length">
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          No surveys found. Create your first survey to get started.
        </v-alert>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="800px" persistent>
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
              class="mb-4"
            />
            
            <v-textarea
              v-model="surveyForm.description"
              label="Description"
              rows="3"
              class="mb-4"
            />

            <v-file-input
              :model-value="surveyForm.file ? [surveyForm.file] : []"
              @update:model-value="handleSurveyFileInput"
              label="Attachment (optional)"
              prepend-icon="mdi-paperclip"
              density="comfortable"
              variant="outlined"
              class="mb-4"
              :multiple="false"
              show-size
              counter
              accept="image/jpeg,image/png,video/mp4"
            />

            <v-alert
              v-if="surveyForm.file"
              type="info"
              class="mb-4"
            >
              <div class="mb-1"><strong>Selected file:</strong> {{ surveyForm.file.name }}</div>
              <div class="text-caption">{{ formatFileSize(surveyForm.file.size) }}</div>
            </v-alert>

            <v-alert
              v-if="currentSurveyFile && !surveyForm.removeExistingFile"
              type="info"
              class="mb-4"
            >
              <div class="mb-2"><strong>Current file:</strong> {{ currentSurveyFile.fileName }}</div>
              <div class="mb-2 text-caption">{{ formatFileSize(currentSurveyFile.size) }}</div>
              <div class="d-flex flex-wrap" style="gap: 8px;">
                <v-btn
                  v-if="currentSurveyFile.fileUrl"
                  variant="text"
                  color="primary"
                  size="small"
                  :href="currentSurveyFile.fileUrl"
                  target="_blank"
                  rel="noopener"
                >
                  <v-icon start size="small">mdi-file-download</v-icon>
                  Download
                </v-btn>
                <v-btn
                  variant="text"
                  color="error"
                  size="small"
                  @click="surveyForm.removeExistingFile = true; surveyForm.file = null"
                >
                  <v-icon start size="small">mdi-trash-can</v-icon>
                  Remove file
                </v-btn>
              </div>
            </v-alert>

            <v-alert
              v-else-if="currentSurveyFile && surveyForm.removeExistingFile"
              type="warning"
              class="mb-4"
            >
              <div class="mb-2">The current attachment will be removed after saving.</div>
              <v-btn
                variant="text"
                color="primary"
                size="small"
                @click="surveyForm.removeExistingFile = false"
              >
                <v-icon start size="small">mdi-undo</v-icon>
                Keep file
              </v-btn>
            </v-alert>
 
            <div class="mb-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <h3>Questions</h3>
                <v-btn size="small" color="primary" @click="addQuestion">
                  <v-icon start>mdi-plus</v-icon>
                  Add Question
                </v-btn>
              </div>

              <div v-for="(question, index) in surveyForm.questions" :key="index" class="mb-4">
                <v-card variant="outlined" class="pa-4">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <h4>Question {{ index + 1 }}</h4>
                    <v-btn size="small" color="error" variant="text" @click="removeQuestion(index)">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>

                  <v-text-field
                    v-model="question.text"
                    label="Question Text"
                    :rules="[v => !!v || 'Question text is required']"
                    class="mb-3"
                  />

                  <v-select
                    v-model="question.type"
                    :items="questionTypeOptions"
                    label="Question Type"
                    :rules="[v => !!v || 'Question type is required']"
                    class="mb-3"
                  />

                  <!-- Options always available -->
                  <div>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <strong>Options</strong>
                      <v-btn size="small" @click="addOption(index)">
                        <v-icon size="small">mdi-plus</v-icon>
                        Add Option
                      </v-btn>
                    </div>

                    <div v-for="(option, optIndex) in question.options" :key="optIndex" class="d-flex mb-2">
                      <v-text-field
                        v-model="option.text"
                        label="Option Text"
                        density="compact"
                        hide-details
                        class="mr-2"
                      />
                      <v-btn size="small" color="error" variant="text" @click="removeOption(index, optIndex)">
                        <v-icon size="small">mdi-delete</v-icon>
                      </v-btn>
                    </div>
                  </div>
                </v-card>
              </div>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveSurvey" :disabled="!formValid">
            {{ editingSurvey ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteDialog" max-width="480px">
      <v-card>
        <v-card-title class="text-h6">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete survey "<strong>{{ surveyToDelete?.title }}</strong>"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="error" @click="confirmDeleteSurvey">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showStatsDialog" max-width="720px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-chart-bar</v-icon>
          Survey Statistics
        </v-card-title>
        <v-card-text>
          <v-skeleton-loader
            v-if="statsLoading"
            type="article"
            class="py-4"
          />

          <div v-else-if="surveyStatistics" class="stats-content">
            <v-row class="mb-4">
              <v-col cols="12" md="4">
                <v-card variant="tonal">
                  <v-card-text class="text-center">
                    <div class="text-caption text-grey">Total Responses</div>
                    <div class="text-h5 font-weight-bold">
                      {{ surveyStatistics.totalResponses }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="tonal">
                  <v-card-text class="text-center">
                    <div class="text-caption text-grey">Responded Users</div>
                    <div class="text-h5 font-weight-bold">
                      {{ surveyStatistics.respondedUsers }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="tonal">
                  <v-card-text class="text-center">
                    <div class="text-caption text-grey">Active Assignments</div>
                    <div class="text-h5 font-weight-bold">
                      {{ surveyStatistics.activeAssignments }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <div v-if="surveyStatistics.questionStats.length">
              <h3 class="text-subtitle-1 mb-3">Most Popular Answers</h3>
              <v-expansion-panels variant="accordion">
                <v-expansion-panel
                  v-for="question in surveyStatistics.questionStats"
                  :key="question.questionId"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex flex-column">
                      <span class="font-weight-medium">{{ question.questionText }}</span>
                      <span class="text-caption text-grey">
                        Type: {{ question.type }}
                      </span>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-alert
                      v-if="!question.answers.length"
                      type="info"
                      variant="tonal"
                      density="compact"
                    >
                      No responses yet for this question.
                    </v-alert>
                    <v-list v-else density="compact">
                      <v-list-item
                        v-for="answer in question.answers"
                        :key="`${question.questionId}-${answer.value}`"
                      >
                        <template #prepend>
                          <v-avatar color="primary" size="28" class="mr-2">
                            <span class="text-body-2">{{ answer.percentage }}%</span>
                          </v-avatar>
                        </template>
                        <v-list-item-title>{{ answer.label }}</v-list-item-title>
                        <v-list-item-subtitle>
                          <span class="text-grey">
                            Selected {{ answer.count }} time{{ answer.count === 1 ? '' : 's' }}
                          </span>
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </div>

          <v-alert
            v-else
            type="info"
            variant="tonal"
          >
            No statistics available for this survey yet.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showStatsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
 
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  SurveysService,
  type Survey,
  type SurveyQuestion,
  type CreateSurveyDto,
  type PaginationMeta,
  type PaginatedResponse,
  formatDateTime,
  formatFileSize,
  type SurveyStatistics,
  type UpdateSurveyDto,
} from '@api'
import { PaginationWorker } from '@workers/pagination-worker'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { FilterPatch } from '@api/filter.patch'
import { SMALL_PAGE_SIZE, normalizePageSize } from '@workers/pagination-worker/pagination.helpers'
import { showSuccessToast, showErrorToast } from '@workers/toast-worker'
import { validateFiles } from '@workers/file-validation'

const ALLOWED_FILE_TYPES = [/^image\/(jpeg|png)$/i, /^video\/mp4$/i]

interface SurveyFormState {
  title: string
  description: string
  questions: SurveyQuestion[]
  file: File | null
  removeExistingFile: boolean
}

const route = useRoute()
const router = useRouter()

const activeTab = ref<'active' | 'archived' | 'available'>((() => {
  const statusQuery = route.query['filter.status']
  if (typeof statusQuery === 'string') {
    const extractedStatus = statusQuery.replace('$eq:', '')
    if (['active', 'archived', 'available'].includes(extractedStatus)) {
      return extractedStatus as 'active' | 'archived' | 'available'
    }
  }
  return 'active'
})())
const showStatsDialog = ref(false)
const surveyStatistics = ref<SurveyStatistics | null>(null)
const statsLoading = ref(false)
const showCreateDialog = ref(false)
const editingSurvey = ref<Survey | null>(null)
const form = ref<any>(null)
const formValid = ref(false)
const showDeleteDialog = ref(false)
const surveyToDelete = ref<Survey | null>(null)

const currentSurveyFile = computed(() => editingSurvey.value?.files?.[0] ?? null)

const surveyForm = ref<SurveyFormState>({
  title: '',
  description: '',
  questions: [],
  file: null,
  removeExistingFile: false,
})

watch(
  () => surveyForm.value.file,
  (file) => {
    if (file && editingSurvey.value?.files?.length) {
      surveyForm.value.removeExistingFile = true
    }
  },
)

const handleSurveyFileInput = (value: File | File[] | null) => {
  if (Array.isArray(value)) {
    surveyForm.value.file = value.length > 0 ? value[0] : null
  } else {
    surveyForm.value.file = value
  }
}

const {
  paginationElements: surveys,
  paginationPage,
  paginationTotalCount,
  paginationClearData,
  paginationLoad,
  paginationLastPage,
} = PaginationWorker<Survey>({
  paginationDataRequest: async (pageNumber) => {
    const rawFilters = getRawFilters?.() ?? {}
    const limitFromFilters = Number(
      typeof rawFilters.limit !== 'undefined'
        ? rawFilters.limit
        : filters.value.limit?.value ?? normalizedInitialLimit
    ) || normalizedInitialLimit

    return SurveysService.getSurveys({
      ...rawFilters,
      page: pageNumber,
      limit: limitFromFilters,
      'filter.status': `$eq:${activeTab.value}`,
    })
  },
  notToConcatElements: true,
})

const surveysResponse = route.meta.surveys as PaginatedResponse<Survey>
const initialMeta: PaginationMeta = surveysResponse.meta ?? {}
const initialSurveys = Array.isArray(surveysResponse.data) ? surveysResponse.data : []
const normalizedInitialLimit = normalizePageSize(route.query.limit, SMALL_PAGE_SIZE)

const initialPage = Number(route.query.page ?? initialMeta.currentPage ?? 1) || 1

surveys.value = initialSurveys
paginationTotalCount.value = initialMeta.totalItems ?? initialSurveys.length
paginationLastPage.value = initialMeta.totalPages ?? 1
paginationPage.value = initialMeta.currentPage ?? initialPage

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
    }),
  )
}

const { getRawFilters, filters } = FilterPatch({
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
    await loadPage(Number(filters.value.page.value) || 1, {
      reset: true,
      force: true,
    })
  },
})

filters.value.page.value = initialPage
filters.value.limit.value = normalizedInitialLimit

const headers = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'Title', key: 'title', sortable: false },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Questions', key: 'questions', sortable: false },
  { title: 'File', key: 'files', sortable: false },
  { title: 'Created By', key: 'createdBy', sortable: false },
  { title: 'Created At', key: 'createdAt', sortable: false },
  { title: 'Updated At', key: 'updatedAt', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, width: '320px' },
]

const handlePageChange = (page: number) => {
  filters.value.page.value = page
}

const loadSurveys = async (options: { reset?: boolean; force?: boolean } = {}) => {
  const reset = options.reset ?? true
  const force = options.force ?? true
  await loadPage(Number(filters.value.page.value) || 1, {
    reset,
    force,
  })
}

const questionTypeOptions = [
  { title: 'Single choice', value: 'single' },
  { title: 'Multiple choice', value: 'multiple' },
]

const addQuestion = () => {
  surveyForm.value.questions = surveyForm.value.questions || []
  surveyForm.value.questions.push({
    id: `q${Date.now()}`,
    text: '',
    type: 'single',
    options: [],
  })
}

const removeQuestion = (index: number) => {
  surveyForm.value.questions.splice(index, 1)
}

const addOption = (questionIndex: number) => {
  const question = surveyForm.value.questions![questionIndex]
  if (!question.options) {
    question.options = []
  }
  question.options.push({
    id: `opt${Date.now()}`,
    text: ''
  })
}

const removeOption = (questionIndex: number, optionIndex: number) => {
  surveyForm.value.questions[questionIndex].options.splice(optionIndex, 1)
}

const editSurvey = (survey: Survey) => {
  editingSurvey.value = survey
  surveyForm.value = {
    title: survey.title,
    description: survey.description ?? '',
    questions: (survey.questions ?? []).map(q => ({
      ...q,
      options: (q.options ?? []).map(o => ({ ...o })),
    })),
    file: null,
    removeExistingFile: false,
  }
  showCreateDialog.value = true
}

const closeDialog = () => {
  showCreateDialog.value = false
  editingSurvey.value = null
  formValid.value = false
  form.value?.reset?.()
  form.value?.resetValidation?.()
  surveyForm.value = {
    title: '',
    description: '',
    questions: [],
    file: null,
    removeExistingFile: false,
  }
}

const saveSurvey = async () => {
  const validationResult = await form.value?.validate?.()
  if (validationResult && validationResult.valid === false) {
    return
  }

  const filesValid = validateFiles(surveyForm.value.file ? [surveyForm.value.file] : undefined, {
    allowedPatterns: ALLOWED_FILE_TYPES,
    onError: showErrorToast,
  })

  if (!filesValid) {
    return
  }

  const normalizedQuestions = surveyForm.value.questions.map((q) => ({
    ...q,
    options: (q.options ?? []).map((o) => ({ ...o })),
  }))
 
   const trimmedTitle = surveyForm.value.title.trim()
   const trimmedDescription = surveyForm.value.description?.trim() ?? ''

  if (!trimmedTitle) {
    showErrorToast('Title is required.')
    return
  }

  const basePayload: CreateSurveyDto = {
    title: trimmedTitle,
    description: trimmedDescription ? trimmedDescription : undefined,
    questions: normalizedQuestions.length > 0 ? normalizedQuestions : undefined,
  }

  const selectedFile = surveyForm.value.file ?? undefined

  if (editingSurvey.value) {
    const updatePayload: UpdateSurveyDto = { ...basePayload }

    const existingFileId = editingSurvey.value.files?.[0]?.id
    if (existingFileId) {
      updatePayload.removeFileId = existingFileId
    }

    await asyncGlobalSpinner(SurveysService.updateSurvey(editingSurvey.value.id, updatePayload, selectedFile))
    showSuccessToast('Survey updated successfully.')
  } else {
    await asyncGlobalSpinner(SurveysService.createSurvey(basePayload, selectedFile))
    showSuccessToast('Survey created successfully.')
  }

  closeDialog()
  await loadSurveys({ reset: true })
}

const openDeleteDialog = (survey: Survey) => {
  surveyToDelete.value = survey
  showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  surveyToDelete.value = null
}

const confirmDeleteSurvey = async () => {
  if (!surveyToDelete.value) return

  await asyncGlobalSpinner(
    SurveysService.deleteSurvey(surveyToDelete.value.id),
  )
  showSuccessToast('Survey deleted successfully')
  closeDeleteDialog()
  loadSurveys({ reset: true })
}

const viewSurveyStats = async (survey: Survey) => {
  statsLoading.value = true
  showStatsDialog.value = true
  surveyStatistics.value = null

  try {
    surveyStatistics.value = await SurveysService.getSurveyStatistics(survey.id)
  } catch (error) {
    showStatsDialog.value = false
  } finally {
    statsLoading.value = false
  }
}

const closeSurvey = async (survey: Survey) => {
  await asyncGlobalSpinner(SurveysService.closeSurvey(survey.id))
  showSuccessToast('Survey closed successfully.')
  activeTab.value = 'archived'
  await loadSurveys({ reset: true })
}

const duplicateSurvey = async (survey: Survey) => {
  const duplicated = await asyncGlobalSpinner(SurveysService.duplicateSurvey(survey.id))
  showSuccessToast(`Survey duplicated: "${duplicated.title}".`)
  activeTab.value = 'available'
  await loadSurveys({ reset: true })
}

const activateSurvey = async (survey: Survey) => {
  await asyncGlobalSpinner(SurveysService.activateSurvey(survey.id))
  showSuccessToast('Survey activated successfully.')
  activeTab.value = 'active'
  await loadSurveys({ reset: true })
}
 
 watch(activeTab, async () => {
   filters.value.page.value = 1
   await router.replace({
     query: {
       ...route.query,
       'filter.status': `$eq:${activeTab.value}`,
     },
   })
  
  await loadSurveys({ reset: true })
 })

</script>

<style scoped>
.questions-column {
  max-height: 200px;
  overflow-y: auto;
  padding-right: 8px;
}

.question-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 8px;
}

.question-item:last-child {
  border-bottom: none;
}

.stats-content .text-h5 {
  line-height: 1.2;
}

.stats-content .v-card {
  height: 100%;
}
</style>