<route lang="yaml">
name: articles
meta:
  layout: profile
</route>

<style scoped>
:deep(.ql-editor) {
  min-height: 250px;
  font-size: 14px;
}

:deep(.ql-container) {
  font-family: inherit;
}

:deep(.ql-toolbar) {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  border-bottom: 1px solid rgba(0,0,0,0.12);
}

:deep(.ql-container) {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}
</style>

<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h2>Articles ({{ paginationTotalCount }})</h2>
        <v-btn color="primary" @click="showCreateDialog = true">
          <v-icon start>mdi-plus</v-icon>
          Create Article
        </v-btn>
      </v-col>
    </v-row>

    <!-- Status Tabs -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-tabs v-model="activeTab" density="compact" color="primary" class="px-2">
            <v-tab
              v-for="tab in articleTabs"
              :key="tab.value"
              :value="tab.value"
              class="text-none"
            >
              <v-icon size="small" class="mr-2">{{ tab.icon }}</v-icon>
              {{ tab.label }}
            </v-tab>
          </v-tabs>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-select
          v-model="filters['filter.language'].value"
          :items="languageOptions"
          label="Language"
          clearable
          density="comfortable"
          variant="outlined"
          hide-details
          @update:model-value="handleFilterChange"
        ></v-select>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="articles"
              :items-length="paginationTotalCount"
              hide-default-footer
            >
              <template v-slot:item.text="{ item }">
                {{ truncateText(item.text, 100) }}
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip
                  size="small"
                  :color="statusColor(item.status)"
                  variant="tonal"
                >
                  {{ statusLabel(item.status) }}
                </v-chip>
              </template>

              <template v-slot:item.files="{ item }">
                <v-chip
                  v-if="item.files && item.files.length > 0"
                  size="small"
                  color="success"
                  variant="tonal"
                >
                  <v-icon start size="small">mdi-file</v-icon>
                  {{ item.files.length }} file(s)
                </v-chip>
                <v-chip v-else size="small" color="grey" variant="tonal">No Files</v-chip>
              </template>

              <template v-slot:item.updatedAt="{ item }">
                {{ item.updatedAt }}
              </template>

              <template v-slot:item.actions="{ item }">
                <div class="d-flex flex-wrap align-center" style="gap: 6px;">
                  <v-btn
                    v-if="item.status === 'available'"
                    size="small"
                    color="primary"
                    variant="text"
                    @click="editArticle(item)"
                  >
                    <v-icon size="small">mdi-pencil</v-icon>
                    Edit
                  </v-btn>

                  <v-btn
                    v-if="item.status === 'active' || item.status === 'archived'"
                    size="small"
                    color="secondary"
                    variant="text"
                    @click="openStatisticsDialog(item)"
                  >
                    <v-icon size="small">mdi-chart-bar</v-icon>
                    Stats
                  </v-btn>

                  <v-btn
                    v-if="item.status === 'active'"
                    size="small"
                    color="error"
                    variant="text"
                    @click="handleCloseArticle(item)"
                  >
                    <v-icon size="small">mdi-archive</v-icon>
                    Close
                  </v-btn>

                  <v-btn
                    v-if="item.status === 'available'"
                    size="small"
                    color="success"
                    variant="text"
                    @click="handleActivateArticle(item)"
                  >
                    <v-icon size="small">mdi-check-circle</v-icon>
                    Activate
                  </v-btn>

                  <v-btn
                    v-if="item.status === 'archived'"
                    size="small"
                    color="primary"
                    variant="text"
                    @click="handleDuplicateArticle(item)"
                  >
                    <v-icon size="small">mdi-content-copy</v-icon>
                    Duplicate
                  </v-btn>

                  <v-btn
                    v-if="item.status !== 'active'"
                    size="small"
                    color="error"
                    variant="text"
                    @click="deleteArticle(item)"
                  >
                    <v-icon size="small">mdi-delete</v-icon>
                    Delete
                  </v-btn>
                </div>
              </template>
            </v-data-table>

            <v-alert v-if="articles.length === 0" type="info" variant="tonal" class="mt-4">
              No articles found for the selected status.
            </v-alert>

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

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title>
          {{ editingArticle ? 'Edit Article' : 'Create New Article' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-text-field
              v-model="articleForm.title"
              label="Article Title"
              :rules="[v => !!v || 'Title is required']"
              required
              class="mb-4"
            />

            <v-select
              v-model="articleForm.language"
              :items="languageOptions"
              label="Language *"
              :rules="[v => !!v || 'Language is required']"
              required
              density="comfortable"
              variant="outlined"
              class="mb-4"
            ></v-select>

            <v-label class="mb-2">Article Text *</v-label>
            <div
              class="mb-4"
              style="border: 1px solid rgba(0,0,0,0.12); border-radius: 4px; overflow: hidden; min-height: 300px;"
            >
              <QuillEditor
                v-model:content="articleForm.text"
                content-type="html"
                theme="snow"
                :toolbar="quillToolbar"
                style="height: 300px;"
              />
            </div>
            <div
              v-if="!articleForm.text || articleForm.text.trim() === '' || articleForm.text === '<p><br></p>'"
              class="text-caption text-error mb-4"
            >
              Text is required
            </div>

            <v-file-input
              :model-value="articleForm.file ? [articleForm.file] : []"
              @update:model-value="handleArticleFileInput"
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
              v-if="articleForm.file"
              type="info"
              class="mb-4"
            >
              <div class="mb-1"><strong>Selected file:</strong> {{ articleForm.file.name }}</div>
              <div class="text-caption">{{ formatFileSize(articleForm.file.size) }}</div>
            </v-alert>

            <v-alert
              v-if="currentArticleFile && !articleForm.removeExistingFile"
              type="info"
              class="mb-4"
            >
              <div class="mb-2"><strong>Current file:</strong> {{ currentArticleFile.fileName }}</div>
              <div class="mb-2 text-caption">{{ formatFileSize(currentArticleFile.size) }}</div>
              <div class="d-flex flex-wrap" style="gap: 8px;">
                <v-btn
                  v-if="currentArticleFile.fileUrl"
                  variant="text"
                  color="primary"
                  size="small"
                  :href="currentArticleFile.fileUrl"
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
                  @click="articleForm.removeExistingFile = true; articleForm.file = null"
                >
                  <v-icon start size="small">mdi-trash-can</v-icon>
                  Remove file
                </v-btn>
              </div>
            </v-alert>

            <v-alert
              v-else-if="currentArticleFile && articleForm.removeExistingFile"
              type="warning"
              class="mb-4"
            >
              <div class="mb-2">The current attachment will be removed after saving.</div>
              <v-btn
                variant="text"
                color="primary"
                size="small"
                @click="articleForm.removeExistingFile = false"
              >
                <v-icon start size="small">mdi-undo</v-icon>
                Keep file
              </v-btn>
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveArticle">
            {{ editingArticle ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500px">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete article "{{ articleToDelete?.title }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="confirmDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Article Statistics Dialog -->
    <v-dialog v-model="showStatisticsDialog" max-width="460px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-chart-bar</v-icon>
          Article Statistics
        </v-card-title>
        <v-card-text>
          <div class="text-subtitle-1 font-weight-medium mb-4">{{ statisticsArticleTitle }}</div>

          <v-progress-linear
            v-if="statisticsLoading"
            indeterminate
            color="primary"
            class="mb-2"
          />

          <template v-else-if="articleStatistics">
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Assigned Users (current)</v-list-item-title>
                <v-list-item-subtitle>{{ articleStatistics.assignedUsers }}</v-list-item-subtitle>
              </v-list-item>
              <v-divider class="my-2" />
              <v-list-item>
                <v-list-item-title>Hidden by Users</v-list-item-title>
                <v-list-item-subtitle>{{ articleStatistics.hiddenUsers }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </template>

          <v-alert v-else type="info" variant="tonal">
            No statistics available.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showStatisticsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArticlesService,
  type Article,
  type ArticleStatus,
  type ArticleStatistics,
  type CreateArticleDto,
  type UpdateArticleDto,
  type PaginatedArticles,
  type PaginationMeta,
  type Language,
  formatFileSize,
} from '@api'
import { PaginationWorker } from '@workers/pagination-worker'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { FilterPatch } from '@api/filter.patch'
import { SMALL_PAGE_SIZE, normalizePageSize } from '@workers/pagination-worker/pagination.helpers'
import type { VForm } from '@/types/vuetify'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { showSuccessToast, showErrorToast } from '@workers/toast-worker'
import { validateFiles } from '@workers/file-validation'

const ALLOWED_FILE_TYPES = [/^image\/(jpeg|png)$/i, /^video\/mp4$/i]
const articleTabs: Array<{ value: ArticleStatus; label: string; icon: string }> = [
  { value: 'active', label: 'Active', icon: 'mdi-playlist-check' },
  { value: 'archived', label: 'Archived', icon: 'mdi-archive' },
  { value: 'available', label: 'Available', icon: 'mdi-timer-sand' },
]
const quillToolbar = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  ['link', 'image'],
  ['clean'],
]

const route = useRoute()
const router = useRouter()

const initialStatus = (() => {
  const statusQuery = route.query['filter.status']
  if (typeof statusQuery === 'string') {
    const extractedStatus = statusQuery.replace('$eq:', '')
    if (articleTabs.some((tab) => tab.value === extractedStatus)) {
      return extractedStatus as ArticleStatus
    }
  }
  return 'active' as ArticleStatus
})()

const activeTab = ref<ArticleStatus>(initialStatus)

const articlesData = route.meta.articles as PaginatedArticles | undefined
const initialMeta: PaginationMeta = articlesData?.meta ?? {}
const initialArticles = Array.isArray(articlesData?.data) ? (articlesData?.data as Article[]) : []

const normalizedInitialLimit = normalizePageSize(route.query.limit, SMALL_PAGE_SIZE)

const {
  paginationElements: articles,
  paginationPage,
  paginationTotalCount,
  paginationClearData,
  paginationLastPage,
  paginationLoad,
} = PaginationWorker<Article>({
  notToConcatElements: true,
  paginationDataRequest: async (pageNumber) => {
    const rawFilters = getRawFilters?.() ?? {}
    const limitFromFilters = Number(
      typeof rawFilters.limit !== 'undefined'
        ? rawFilters.limit
        : filters.value.limit?.value ?? normalizedInitialLimit,
    ) || normalizedInitialLimit

    const params: Record<string, unknown> = {
      ...rawFilters,
      page: pageNumber,
      limit: limitFromFilters,
      'filter.status': `$eq:${activeTab.value}`,
    }
    
    if (rawFilters['filter.language']) {
      params['filter.language'] = `$eq:${rawFilters['filter.language']}`
    }
    
    return ArticlesService.getArticles(params)
  },
})

const initialPage = Number(route.query.page ?? initialMeta.currentPage ?? 1) || 1

articles.value = initialArticles
paginationTotalCount.value = initialMeta.totalItems ?? initialArticles.length
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

const initialLanguage = route.query['filter.language'] as string | undefined
const stripEq = (value?: string | null): string | undefined =>
  typeof value === 'string' && value.startsWith('$eq:') ? value.slice(4) : value ?? undefined

const {
  getRawFilters,
  filters,
} = FilterPatch({
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
    'filter.language': {
      type: String,
      value: stripEq(initialLanguage) ?? '',
      default: '',
    },
  },
  afterUpdateFiltersCallBack: async () => {
    paginationClearData()
    await loadPage(Number(filters.value.page.value) || 1, {
      reset: true,
      force: true,
    })
  },
})

filters.value.page.value = initialPage
filters.value.limit.value = normalizedInitialLimit
filters.value['filter.language'].value = stripEq(initialLanguage) ?? ''

const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const showStatisticsDialog = ref(false)
const statisticsLoading = ref(false)
const articleStatistics = ref<ArticleStatistics | null>(null)
const statisticsArticleTitle = ref('')
const articleToDelete = ref<Article | null>(null)
const editingArticle = ref<Article | null>(null)
const form = ref<VForm | null>(null)
const formValid = ref(false)
const currentArticleFile = computed(() => editingArticle.value?.files?.[0] ?? null)

const articleForm = ref<{
  title: string
  text: string
  language: string
  file: File | null
  removeExistingFile: boolean
}>({
  title: '',
  text: '',
  language: '',
  file: null,
  removeExistingFile: false,
})

const languagesData = route.meta.languages as { languages: Language[] } | undefined
const languages = ref<Language[]>(languagesData?.languages ?? [])
const languageOptions = computed(() => {
  return languages.value
    .filter(lang => lang.isActive)
    .map(lang => ({
      title: `${lang.name} (${lang.code})`,
      value: lang.code,
    }))
})

const headers = [
  { title: 'ID', key: 'id', align: 'start', sortable: false },
  { title: 'Title', key: 'title', sortable: false },
  { title: 'Language', key: 'language', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Updated', key: 'updatedAt', sortable: false },
  { title: 'Files', key: 'files', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const statusLabel = (status: ArticleStatus): string => {
  switch (status) {
    case 'active':
      return 'Active'
    case 'archived':
      return 'Archived'
    case 'available':
      return 'Available'
    default:
      return status
  }
}

const statusColor = (status: ArticleStatus): string => {
  switch (status) {
    case 'active':
      return 'success'
    case 'archived':
      return 'error'
    case 'available':
      return 'info'
    default:
      return 'primary'
  }
}

const handlePageChange = (page: number) => {
  filters.value.page.value = page
}

const handleArticleFileInput = (value: File | File[] | null) => {
  if (Array.isArray(value)) {
    articleForm.value.file = value.length > 0 ? value[0] : null
  } else {
    articleForm.value.file = value
  }
}

const loadArticles = async (options: { reset?: boolean; force?: boolean } = {}) => {
  const reset = options.reset ?? true
  const force = options.force ?? true
  await loadPage(Number(filters.value.page.value) || 1, {
    reset,
    force,
  })
}

const editArticle = (article: Article) => {
  if (article.status !== 'available') {
    showErrorToast('Only available articles can be edited.')
    return
  }

  editingArticle.value = article
  articleForm.value = {
    title: article.title,
    text: article.text,
    language: article.language || '',
    file: null,
    removeExistingFile: false,
  }
  showCreateDialog.value = true
}

const closeDialog = () => {
  showCreateDialog.value = false
  editingArticle.value = null
  form.value?.reset?.()
  form.value?.resetValidation?.()
  formValid.value = false
  articleForm.value = {
    title: '',
    text: '',
    language: '',
    file: null,
    removeExistingFile: false,
  }
}

const saveArticle = async () => {
  if (!articleForm.value.title || !articleForm.value.title.trim()) {
    showErrorToast('Title is required.')
    return
  }

  const textContent = articleForm.value.text
    ? articleForm.value.text.replace(/<[^>]*>/g, '').trim()
    : ''

  if (!textContent) {
    showErrorToast('Article text is required.')
    return
  }

  const filesValid = validateFiles(articleForm.value.file ? [articleForm.value.file] : undefined, {
    allowedPatterns: ALLOWED_FILE_TYPES,
    onError: showErrorToast,
  })

  if (!filesValid) {
    return
  }

  const selectedFile = articleForm.value.file ?? undefined

  if (editingArticle.value) {
    const updateData: UpdateArticleDto & { removeFileId?: number } = {}
    if (articleForm.value.title !== editingArticle.value.title) {
      updateData.title = articleForm.value.title
    }
    if (articleForm.value.text !== editingArticle.value.text) {
      updateData.text = articleForm.value.text
    }

    const existingFileId = editingArticle.value.files?.[0]?.id
    if (existingFileId) {
      if (selectedFile) {
        updateData.removeFileId = existingFileId
      } else if (articleForm.value.removeExistingFile) {
        updateData.removeFileId = existingFileId
      }
    }

    await asyncGlobalSpinner(
      ArticlesService.updateArticle(
        editingArticle.value.id,
        updateData,
        selectedFile ? [selectedFile] : undefined,
      ),
    )
    showSuccessToast('Article updated successfully.')
  } else {
    if (!articleForm.value.language) {
      showErrorToast('Language is required.')
      return
    }
    const createDto: CreateArticleDto = {
      title: articleForm.value.title,
      text: articleForm.value.text,
      language: articleForm.value.language,
    }
    await asyncGlobalSpinner(
      ArticlesService.createArticle(createDto, selectedFile ? [selectedFile] : undefined),
    )
    showSuccessToast('Article created successfully.')
    activeTab.value = 'available'
  }

  await loadArticles({ reset: true })
  closeDialog()
}

const deleteArticle = (article: Article) => {
  if (article.status === 'active') {
    showErrorToast('Active articles cannot be deleted. Close the article first.')
    return
  }
  articleToDelete.value = article
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!articleToDelete.value) return

  await asyncGlobalSpinner(ArticlesService.deleteArticle(articleToDelete.value.id))
  await loadArticles({ reset: true })
  showSuccessToast('Article deleted successfully.')
  showDeleteDialog.value = false
  articleToDelete.value = null
}

const handleCloseArticle = async (article: Article) => {
  if (article.status !== 'active') {
    return
  }
  await asyncGlobalSpinner(ArticlesService.closeArticle(article.id))
  showSuccessToast('Article archived successfully.')
  activeTab.value = 'archived'
  await loadArticles({ reset: true })
}

const handleActivateArticle = async (article: Article) => {
  if (article.status !== 'available') {
    return
  }
  await asyncGlobalSpinner(ArticlesService.activateArticle(article.id))
  showSuccessToast('Article activated successfully.')
  activeTab.value = 'active'
  await loadArticles({ reset: true })
}

const handleDuplicateArticle = async (article: Article) => {
  await asyncGlobalSpinner(ArticlesService.duplicateArticle(article.id))
  showSuccessToast('Article duplicated successfully.')
  activeTab.value = 'available'
  await loadArticles({ reset: true })
}

const openStatisticsDialog = async (article: Article) => {
  statisticsArticleTitle.value = article.title
  showStatisticsDialog.value = true
  statisticsLoading.value = true
  articleStatistics.value = null

  try {
    articleStatistics.value = await ArticlesService.getArticleStatistics(article.id)
  } catch (error) {
    showStatisticsDialog.value = false
    showErrorToast('Failed to load article statistics.')
  } finally {
    statisticsLoading.value = false
  }
}

watch(
  () => articleForm.value.file,
  (file) => {
    if (file && editingArticle.value?.files?.length) {
      articleForm.value.removeExistingFile = true
    }
  },
)

watch(activeTab, async () => {
  filters.value.page.value = 1
  await router.replace({
    query: {
      ...route.query,
      'filter.status': `$eq:${activeTab.value}`,
      page: filters.value.page.value,
    },
  })

  await loadArticles({ reset: true })
})

const truncateText = (text: string, length: number) => {
  if (text.length <= length) return text
  return `${text.substring(0, length)}...`
}
</script>

