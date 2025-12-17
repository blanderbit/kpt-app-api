<route lang="yaml">
meta:
  layout: profile
name: languages-edit
</route>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-pencil</v-icon>
            Edit Language: {{ languageToEdit?.name }} ({{ languageToEdit?.code }})
          </v-card-title>
          <v-card-text>
            <v-form ref="formRef" v-model="isValid">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    :model-value="languageToEdit?.code"
                    label="Language Code"
                    disabled
                    hint="Code cannot be changed"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.direction"
                    label="Text Direction"
                    :items="[
                      { title: 'Left to Right (LTR)', value: 'ltr' },
                      { title: 'Right to Left (RTL)', value: 'rtl' }
                    ]"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.name"
                    label="Language Name *"
                    placeholder="English"
                    :rules="nameRules"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.nativeName"
                    label="Native Name *"
                    placeholder="English"
                    :rules="nativeNameRules"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    :model-value="languageToEdit?.version"
                    label="Version"
                    disabled
                    hint="Version is auto-incremented"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.svgLogo"
                    label="SVG Logo"
                    placeholder="<svg>...</svg>"
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="formData.notes"
                    label="Notes"
                    placeholder="Additional notes about this language..."
                    rows="3"
                  ></v-textarea>
                </v-col>

                <v-col cols="12">
                  <v-label class="mb-2">Translations (JSON)</v-label>
                  <div style="height: 400px; border: 1px solid rgba(0,0,0,0.12); border-radius: 4px;">
                    <JsonEditor
                      v-model="translations"
                      mode="tree"
                      :navigationBar="false"
                    />
                  </div>
                  <div class="text-caption text-grey mt-1">
                    Edit translation keys and values
                  </div>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="goBack" variant="text">
              Cancel
            </v-btn>
            <v-btn 
              color="primary" 
              @click="handleUpdate" 
              :disabled="!isValid || !hasChanges"
            >
              Update Language
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LanguagesService, type Language } from '@api'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { showSuccessToast, showErrorToast } from '@workers/toast-worker'
import JsonEditor from 'vue3-ts-jsoneditor'

const route = useRoute()
const router = useRouter()

const isValid = ref(false)
const formRef = ref(null)

// Данные из резолвера
const cacheData = route.meta.languageCache as { languages: Language[], total: number }
const existingLanguages = ref<Language[]>(cacheData?.languages || [])

const languageId = route.params.id as string
const languageToEdit = ref<Language>(route.meta.language as Language)

const formData = ref({
  name: languageToEdit.value.name,
  nativeName: languageToEdit.value.nativeName,
  direction: languageToEdit.value.direction,
  notes: languageToEdit.value.notes || '',
  svgLogo: languageToEdit.value.svgLogo || ''
})

// Загружаем translations из данных языка (приходят с API)
const originalTranslations = (languageToEdit.value as any).translations || {}
const translations = ref(originalTranslations)

// Check if there are any changes
const hasChanges = computed(() => {
  const formChanged = formData.value.name !== languageToEdit.value.name ||
    formData.value.nativeName !== languageToEdit.value.nativeName ||
    formData.value.direction !== languageToEdit.value.direction ||
    formData.value.notes !== (languageToEdit.value.notes || '') ||
    formData.value.svgLogo !== (languageToEdit.value.svgLogo || '')
  
  // Check if translations changed (deep comparison using JSON.stringify)
  const translationsChanged = JSON.stringify(translations.value) !== JSON.stringify(originalTranslations)
  
  return formChanged || translationsChanged
})

// Validation rules (exclude current language from uniqueness check)
const nameRules = [
  (v: string) => !!v || 'Language name is required',
  (v: string) => !existingLanguages.value.some(lang => 
    lang.name === v && lang.id !== languageId
  ) || 'Language name already exists',
]

const nativeNameRules = [
  (v: string) => !!v || 'Native name is required',
  (v: string) => !existingLanguages.value.some(lang => 
    lang.nativeName === v && lang.id !== languageId
  ) || 'Native name already exists',
]

const handleUpdate = async () => {
  if (!formRef.value) return
  
  // Validate form
  const { valid } = await (formRef.value as any).validate()
  if (!valid) return

  if (!hasChanges.value) {
    showErrorToast('No changes detected!')
    return
  }

  await asyncGlobalSpinner(
    LanguagesService.update(languageId, {
      name: formData.value.name,
      nativeName: formData.value.nativeName,
      direction: formData.value.direction,
      notes: formData.value.notes || undefined,
      svgLogo: formData.value.svgLogo || undefined,
      translations: translations.value,
    }),
  )

  await asyncGlobalSpinner(LanguagesService.sync())

  showSuccessToast('Language updated successfully.')
  router.push('/profile/languages')
}

const goBack = () => {
  router.push('/profile/languages')
}

</script>

