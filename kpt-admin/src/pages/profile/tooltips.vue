<route lang="yaml">
name: tooltips
meta:
  layout: profile
</route>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center header-title">
            <div class="d-flex align-center">
              <v-icon left>mdi-help-circle</v-icon>
              Tooltips Management
            </div>
            <v-spacer />
            <v-btn color="primary" @click="openCreateDialog">
              <v-icon left>mdi-plus</v-icon>
              Add Tooltip
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-row class="mb-4" dense>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="search"
                  label="Search tooltips..."
                  append-inner-icon="mdi-magnify"
                  density="comfortable"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedType"
                  :items="typeFilterItems"
                  label="Filter by Type"
                  item-title="title"
                  item-value="value"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedPage"
                  :items="pageFilterItems"
                  label="Filter by Page"
                  item-title="title"
                  item-value="value"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedLanguage"
                  :items="languageFilterItems"
                  label="Filter by Language"
                  item-title="title"
                  item-value="value"
                  density="comfortable"
                  clearable
                >
                  <template v-slot:item="{ item, props }">
                    <v-list-item v-bind="props">
                      <template v-if="item.value === null">
                        <v-list-item-title>All Languages</v-list-item-title>
                      </template>
                    </v-list-item>
                  </template>
                  <template v-slot:selection="{ item }">
                    <span v-if="item.value === null">All Languages</span>
                    <span v-else>{{ item.title }}</span>
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <v-data-table
              :headers="headers"
              :items="tableItems"
              :search="search"
              item-value="id"
              :items-per-page="-1"
              hide-default-footer
              class="elevation-1"
            >
              <template #item.type="{ item }">
                <v-chip color="primary" variant="tonal" size="small">
                  {{ formatLabel(item.type) }}
                </v-chip>
              </template>
              <template #item.page="{ item }">
                {{ formatLabel(item.page) }}
              </template>
              <template #item.language="{ item }">
                {{ item.language || '—' }}
              </template>
              <template #item.description="{ item }">
                {{ item.description || '—' }}
              </template>
              <template #item.closedCount="{ item }">
                {{ item.closedCount ?? 0 }}
              </template>
              <template #item.updatedAtFormatted="{ item }">
                {{ item.updatedAtFormatted }}
              </template>
              <template #item.actions="{ item }">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="primary"
                  @click="openEditDialog(item)"
                >
                  <v-icon size="small">mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="error"
                  @click="openDeleteDialog(item)"
                >
                  <v-icon size="small">mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="isDialogOpen" max-width="640">
      <v-card>
        <v-card-title>{{ isEditMode ? 'Edit Tooltip' : 'Create Tooltip' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.type"
                  :items="typeSelectItems"
                  label="Type"
                  item-title="title"
                  item-value="value"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.page"
                  :items="pageSelectItems"
                  label="Page"
                  item-title="title"
                  item-value="value"
                  density="comfortable"
                  :rules="[requiredRule]"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.language"
                  :items="languageSelectItems"
                  label="Language"
                  item-title="title"
                  item-value="value"
                  density="comfortable"
                  clearable
                />
              </v-col>
              <!-- Content type selection removed; type is chosen directly -->
              <v-col cols="12">
                <v-text-field
                  v-model="form.title"
                  label="Title"
                  density="comfortable"
                  :rules="[requiredRule]"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="form.description"
                  label="Description"
                  rows="3"
                  density="comfortable"
                  :rules="[requiredRule]"
                  required
                />
              </v-col>
              <v-col cols="12" v-if="hasDuplicateCombination">
                <v-alert type="warning" variant="tonal" class="mb-4">
                  Tooltip with the selected page and type already exists. Please edit the existing tooltip instead of creating a new one.
                </v-alert>
              </v-col>
              <template v-if="form.type === 'textWithLink'">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.linkLabel"
                    label="Link Label"
                    density="comfortable"
                    :rules="[requiredRule]"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.linkUrl"
                    label="Link URL"
                    density="comfortable"
                    :rules="[requiredRule, urlRule]"
                    required
                  />
                </v-col>
              </template>
              <template v-if="form.type === 'swipe'">
                <v-col cols="12">
                  <v-alert type="info" variant="tonal" class="mb-4">
                    Add at least one slide. Optional links include label and URL.
                  </v-alert>
                </v-col>
                <v-col cols="12" v-for="(slide, index) in form.slides" :key="index">
                  <v-card variant="outlined" class="pa-4 mb-4">
                    <div class="d-flex justify-space-between align-center mb-3">
                      <span class="text-subtitle-2">Slide {{ index + 1 }}</span>
                      <v-btn
                        icon
                        variant="text"
                        size="small"
                        color="error"
                        @click="removeSlide(index)"
                        :disabled="form.slides.length === 1"
                      >
                        <v-icon size="small">mdi-close</v-icon>
                      </v-btn>
                    </div>
                    <v-text-field
                      v-model="slide.title"
                      label="Slide Title"
                      density="comfortable"
                      :rules="[requiredRule]"
                      required
                    />
                    <v-textarea
                      v-model="slide.description"
                      label="Slide Description"
                      rows="3"
                      density="comfortable"
                      :rules="[requiredRule]"
                      required
                    />
                    <v-row dense>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="slide.linkLabel"
                          label="Link Label"
                          density="comfortable"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="slide.linkUrl"
                          label="Link URL"
                          density="comfortable"
                          :rules="[urlRule]"
                        />
                      </v-col>
                    </v-row>
                  </v-card>
                </v-col>
                <v-col cols="12">
                  <v-btn variant="text" color="primary" @click="addSlide">
                    <v-icon start>mdi-plus</v-icon>
                    Add Slide
                  </v-btn>
                </v-col>
              </template>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveTooltip" :disabled="hasDuplicateCombination">
            {{ isEditMode ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isDeleteDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Delete Tooltip</v-card-title>
        <v-card-text>
          Are you sure you want to delete
          "<strong>{{ tooltipToDelete ? extractTitle(tooltipToDelete.json) : '' }}</strong>"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="error" @click="confirmDeleteTooltip">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  TooltipsService,
  LanguagesService,
  type Tooltip,
  type TooltipType,
  type TooltipPage,
  type TooltipJson,
  type TextTooltipJson,
  type SwipeTooltipJson,
  type TooltipTableItem,
  type CreateTooltipPayload,
  type Language,
} from '@api'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { showSuccessToast, showErrorToast } from '@workers/toast-worker'
import type { VForm } from '@/types/vuetify'

interface SlideForm {
  title: string
  description: string
  linkLabel: string
  linkUrl: string
}

interface TooltipFormState {
  id: number | null
  type: TooltipType
  page: TooltipPage | ''
  language: string | ''
  title: string
  description: string
  linkLabel: string
  linkUrl: string
  slides: SlideForm[]
}

const route = useRoute()

const search = ref('')
const selectedType = ref<TooltipType | 'all'>('all')
const selectedPage = ref<TooltipPage | 'all'>('all')
const selectedLanguage = ref<string | null>(null)

const tooltips = ref<TooltipTableItem[]>(((route.meta.tooltips as TooltipTableItem[]) ?? []).slice())
const tooltipTypes = ref<TooltipType[]>((route.meta.tooltipTypes as TooltipType[]) ?? [])
const tooltipPages = ref<TooltipPage[]>((route.meta.tooltipPages as TooltipPage[]) ?? [])
const languagesData = route.meta.languages.languages as Language[] | undefined

const languageFilterItems = computed(() => {
  const options: Array<{ title: string; value: string | null }> = [
    { title: 'All Languages', value: null },
  ]
  if (Array.isArray(languagesData)) {
    languagesData.forEach((lang) => {
      options.push({ title: `${lang.name} (${lang.code})`, value: lang.code })
    })
  }
  return options
})

const languageSelectItems = computed(() => {
  const options: Array<{ title: string; value: string }> = []
  if (Array.isArray(languagesData)) {
    languagesData.forEach((lang) => {
      options.push({ title: `${lang.name} (${lang.code})`, value: lang.code })
    })
  }
  return options
})

const isDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const tooltipToDelete = ref<Tooltip | null>(null)
const formRef = ref<VForm | null>(null)

const defaultSlide = (): SlideForm => ({
  title: '',
  description: '',
  linkLabel: '',
  linkUrl: '',
})

const form = reactive<TooltipFormState>({
  id: null,
  type: 'text',
  page: '',
  language: '',
  title: '',
  description: '',
  linkLabel: '',
  linkUrl: '',
  slides: [defaultSlide()],
})

const isEditMode = computed(() => form.id !== null)

const headers = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'Type', key: 'type', sortable: false },
  { title: 'Page', key: 'page', sortable: false },
  { title: 'Language', key: 'language', sortable: false },
  { title: 'Title', key: 'title', sortable: false },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Closed', key: 'closedCount', sortable: false },
  { title: 'Updated', key: 'updatedAtFormatted', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const ensureTypeOptions = () =>
  tooltipTypes.value.length ? tooltipTypes.value : (['text', 'textWithLink', 'swipe'] as TooltipType[])

const formatLabel = (value: string | number) =>
  String(value)
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const extractTitle = (json: TooltipJson | undefined): string => {
  if (!json || typeof json !== 'object') return ''
  if ('title' in json && typeof json.title === 'string') return json.title
  return ''
}

const extractDescription = (json: TooltipJson | undefined): string => {
  if (!json || typeof json !== 'object') return ''
  if ('description' in json && typeof json.description === 'string') {
    return json.description
  }
  if ('description' in (json as TextTooltipJson) && typeof (json as TextTooltipJson).description === 'string') {
    return (json as TextTooltipJson).description
  }
  const swipe = json as SwipeTooltipJson
  const slides = (swipe.slides ?? swipe.steps) ?? []
  if (Array.isArray(slides) && slides.length && typeof slides[0]?.description === 'string') {
    return slides[0].description
  }
  return ''
}

const typeSelectItems = computed(() =>
  ensureTypeOptions().map((type) => ({
    title: formatLabel(type),
    value: type,
  })),
)

const pageSelectItems = computed(() =>
  tooltipPages.value.map((page) => ({
    title: formatLabel(page),
    value: page,
  })),
)

const typeFilterItems = computed(() => [
  { title: 'All Types', value: 'all' },
  ...typeSelectItems.value,
])

const pageFilterItems = computed(() => [
  { title: 'All Pages', value: 'all' },
  ...pageSelectItems.value,
])

const tableItems = computed(() => tooltips.value)

const requiredRule = (value: string) => (!!value && !!value.toString().trim()) || 'This field is required'
const urlRule = (value: string) => {
  if (!value) return true
  try {
    // eslint-disable-next-line no-new
    new URL(value)
    return true
  } catch {
    return 'Enter a valid URL'
  }
}

const resetForm = () => {
  form.id = null
  form.type = 'text'
  form.title = ''
  form.description = ''
  form.linkLabel = ''
  form.linkUrl = ''
  form.slides = [defaultSlide()]
  form.page = tooltipPages.value[0] ?? ''
  form.language = ''
  formRef.value?.resetValidation()
}

const ensureDefaultPage = () => {
  if (!tooltipPages.value.length) {
    form.page = ''
    return
  }
  if (!form.page || !tooltipPages.value.includes(form.page as TooltipPage)) {
    form.page = tooltipPages.value[0]
  }
}

const addSlide = () => {
  form.slides.push(defaultSlide())
}

const removeSlide = (index: number) => {
  if (form.slides.length === 1) return
  form.slides.splice(index, 1)
  if (!form.slides.length) {
    form.slides.push(defaultSlide())
  }
}

const duplicateTooltip = computed(() => {
  if (!form.page) return null
  return tooltips.value.find(
    (tooltip) =>
      tooltip.page === form.page &&
      tooltip.type === form.type &&
      (form.id === null || tooltip.id !== form.id),
  )
})

const hasDuplicateCombination = computed(() => !!duplicateTooltip.value)

watch(
  () => form.type,
  (type) => {
    if (type === 'swipe') {
      if (!form.slides.length) {
        form.slides = [defaultSlide()]
      }
      form.linkLabel = ''
      form.linkUrl = ''
    } else if (type === 'text') {
      form.linkLabel = ''
      form.linkUrl = ''
    }
  },
  { immediate: true },
)

watch([selectedType, selectedPage, selectedLanguage], () => {
  loadTooltips()
})

const populateForm = (tooltip: Tooltip) => {
  form.id = tooltip.id
  form.type = tooltip.type
  form.page = tooltip.page
  form.language = tooltip.language || ''
  form.title = extractTitle(tooltip.json)
  form.description = extractDescription(tooltip.json)
  form.linkLabel = ''
  form.linkUrl = ''
  form.slides = [defaultSlide()]

  if (tooltip.type === 'swipe') {
    const json = (tooltip.json ?? {}) as SwipeTooltipJson
    const slides = json?.slides ?? json?.steps ?? []
    const slideItems = Array.isArray(slides) ? slides : []
    form.slides =
      slideItems.length > 0
        ? slideItems.map((slide) => ({
            title: slide.title ?? '',
            description: slide.description ?? '',
            linkLabel: slide.link?.label ?? '',
            linkUrl: slide.link?.url ?? '',
          }))
        : [defaultSlide()]
    if (json.title) {
      form.title = json.title
    }
    form.description = typeof json.description === 'string' ? json.description : ''
  } else {
    const json = tooltip.json as TextTooltipJson
    const hasLink = !!json.link
    form.type = tooltip.type === 'textWithLink' || hasLink ? 'textWithLink' : 'text'
    form.description = json.description ?? ''
    if (hasLink) {
      form.linkLabel = json.link?.label ?? ''
      form.linkUrl = json.link?.url ?? ''
    } else {
      form.linkLabel = ''
      form.linkUrl = ''
    }
    form.slides = [defaultSlide()]
  }
}

const loadTooltips = async () => {
  const params: { type?: TooltipType; page?: TooltipPage; language?: string } = {};
  if (selectedType.value !== 'all') {
    params.type = selectedType.value as TooltipType;
  }
  if (selectedPage.value !== 'all') {
    params.page = selectedPage.value as TooltipPage;
  }
  if (selectedLanguage.value) {
    params.language = selectedLanguage.value;
  }
  const [tooltipsResponse] = (await asyncGlobalSpinner(TooltipsService.getTooltipTableItems(params))) as [TooltipTableItem[]]
  tooltips.value = tooltipsResponse;
}

const buildTextTooltipPayload = (): TooltipJson => {
  const title = form.title.trim()
  if (!title) {
    throw new Error('Title is required.')
  }
  const description = form.description.trim()
  if (!description) {
    throw new Error('Description is required.')
  }

  const payload: TextTooltipJson = {
    title,
    description,
  }

  if (form.type === 'textWithLink') {
    const label = form.linkLabel.trim()
    const url = form.linkUrl.trim()
    if (!label || !url) {
      throw new Error('Link label and URL are required.')
    }
    payload.link = { label, url }
  }

  return payload
}

const buildSwipeTooltipPayload = (): TooltipJson => {
  const title = form.title.trim()
  if (!title) {
    throw new Error('Title is required.')
  }
  const description = form.description.trim()
  if (!description) {
    throw new Error('Description is required.')
  }
  const slides = form.slides.map((slide) => ({
    title: slide.title.trim(),
    description: slide.description.trim(),
    linkLabel: slide.linkLabel.trim(),
    linkUrl: slide.linkUrl.trim(),
  }))

  if (!slides.length) {
    throw new Error('Add at least one slide.')
  }

  const normalizedSlides = slides.map((slide) => {
    if (!slide.title || !slide.description) {
      throw new Error('Each slide requires a title and description.')
    }
    return {
      title: slide.title,
      description: slide.description,
      ...(slide.linkLabel && slide.linkUrl ? { link: { label: slide.linkLabel, url: slide.linkUrl } } : {}),
    }
  })

  const payload: SwipeTooltipJson = {
    title,
    description,
    steps: normalizedSlides,
  }

  return payload
}

const buildTooltipPayload = (): CreateTooltipPayload => {
  const page = form.page as TooltipPage
  if (!page) {
    throw new Error('Please select a page.')
  }

  const json =
    form.type === 'swipe' ? buildSwipeTooltipPayload() : buildTextTooltipPayload()

  return {
    type: form.type,
    page,
    json,
    language: form.language || undefined,
  }
}

const openCreateDialog = () => {
  resetForm()
  ensureDefaultPage()
  isDialogOpen.value = true
}

const openEditDialog = (tooltip: TooltipTableItem) => {
  populateForm(tooltip)
  isDialogOpen.value = true
}

const closeDialog = () => {
  isDialogOpen.value = false
  nextTick(() => {
    resetForm()
  })
}

const saveTooltip = async () => {
  const validationResult = await formRef.value?.validate?.()
  if (validationResult === false || (typeof validationResult === 'object' && validationResult?.valid === false)) {
    return
  }
  if (hasDuplicateCombination.value) {
    showErrorToast('Tooltip for the selected page and type already exists.')
    return
  }
  try {
    const payload = buildTooltipPayload()
    if (isEditMode.value && form.id !== null) {
      await asyncGlobalSpinner(TooltipsService.updateTooltip(form.id, payload))
      showSuccessToast('Tooltip updated successfully.')
    } else {
      await asyncGlobalSpinner(TooltipsService.createTooltip(payload))
      showSuccessToast('Tooltip created successfully.')
    }
    await loadTooltips()
    closeDialog()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save tooltip.'
    showErrorToast(message)
  }
}

const openDeleteDialog = (tooltip: TooltipTableItem) => {
  tooltipToDelete.value = tooltip
  isDeleteDialogOpen.value = true
}

const closeDeleteDialog = () => {
  isDeleteDialogOpen.value = false
  tooltipToDelete.value = null
}

const confirmDeleteTooltip = async () => {
  if (!tooltipToDelete.value) return

  await asyncGlobalSpinner(TooltipsService.deleteTooltip(tooltipToDelete.value.id))
  showSuccessToast('Tooltip deleted successfully.')
  await loadTooltips()
  closeDeleteDialog()
}

ensureDefaultPage()
</script>

<style scoped>
@media (max-width: 600px) {
  .header-title {
    flex-direction: column;
    align-items: stretch !important;
    gap: 12px;
    margin-bottom: 16px;
  }

  .header-title .v-spacer {
    display: none;
  }
}
</style>

