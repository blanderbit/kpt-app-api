<route lang="yaml">
meta:
  layout: profile
name: languages-create
</route>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-plus</v-icon>
            Create New Language
          </v-card-title>
          <v-card-text>
            <v-form ref="formRef" v-model="isValid">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.code"
                    label="Language Code *"
                    placeholder="en"
                    hint="ISO 639-1 code (2 letters)"
                    :rules="codeRules"
                    required
                    @input="formData.code = formData.code.toLowerCase()"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.direction"
                    label="Text Direction *"
                    :items="[
                      { title: 'Left to Right (LTR)', value: 'ltr' },
                      { title: 'Right to Left (RTL)', value: 'rtl' }
                    ]"
                    required
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
                    v-model="formData.version"
                    label="Version"
                    placeholder="1.0.0"
                    hint="Version format: X.Y.Z"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.svgLogo"
                    label="SVG Logo *"
                    placeholder="<svg>...</svg>"
                    :rules="svgLogoRules"
                    required
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
                  <v-label class="mb-2">Translations (JSON) *</v-label>
                  <div style="height: 400px; border: 1px solid rgba(0,0,0,0.12); border-radius: 4px;">
                    <JsonEditor
                      v-model="translations"
                      mode="tree"
                      :navigationBar="false"
                    />
                  </div>
                  <div class="text-caption text-grey mt-1">
                    Enter translation keys and values. Example: {"welcome": "Welcome", "hello": "Hello"}
                  </div>
                </v-col>

                <v-col cols="12" md="6">
                  <v-switch
                    v-model="formData.isActive"
                    label="Active"
                    color="success"
                    :hint="activeHint"
                    persistent-hint
                  ></v-switch>
                </v-col>

                <v-col cols="12" md="6">
                  <v-switch
                    v-model="formData.isDefault"
                    label="Default Language"
                    color="primary"
                    :hint="defaultHint"
                    persistent-hint
                    :disabled="!formData.isActive"
                  ></v-switch>
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
              @click="handleCreate" 
              :disabled="!isValid"
            >
              Create Language
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

const formData = ref({
  code: '',
  name: '',
  nativeName: '',
  direction: 'ltr' as 'ltr' | 'rtl',
  isActive: true,
  isDefault: false,
  version: '1.0.0',
  notes: '',
  svgLogo: ''
})

const translations = ref({
  welcome: 'Welcome',
  hello: 'Hello',
})

const codeRules = [
  (v: string) => !!v || 'Language code is required',
  (v: string) => /^[a-z]{2}$/.test(v) || 'Code must be 2 lowercase letters',
  (v: string) => !existingLanguages.value.some((lang) => lang.code === v) || 'Language code already exists',
]

const nameRules = [
  (v: string) => !!v || 'Language name is required',
  (v: string) => !existingLanguages.value.some((lang) => lang.name === v) || 'Language name already exists',
]

const nativeNameRules = [
  (v: string) => !!v || 'Native name is required',
  (v: string) => !existingLanguages.value.some((lang) => lang.nativeName === v) || 'Native name already exists',
]

const svgLogoRules = [
  (v: string) => !!v || 'SVG logo is required',
]

const activeHint = computed(() => {
  const activeCount = existingLanguages.value.filter(l => l.isActive).length
  return `Currently ${activeCount} active language(s). At least 1 must be active.`
})

const defaultHint = computed(() => {
  const defaultLang = existingLanguages.value.find(l => l.isDefault)
  if (defaultLang) {
    return `Current default: ${defaultLang.name} (${defaultLang.code}). Setting this will unset the current default.`
  }
  return 'No default language set. At least 1 active language should be default.'
})

const handleCreate = async () => {
  if (!formRef.value) return
  
  // Validate form
  const { valid } = await (formRef.value as any).validate()
  if (!valid) return

  // Additional validation
  if (formData.value.isDefault && !formData.value.isActive) {
    showErrorToast('Default language must be active!')
    return
  }

  const activeLanguages = existingLanguages.value.filter((l) => l.isActive)
  if (!formData.value.isActive && activeLanguages.length === 1 && activeLanguages[0].isDefault) {
    showErrorToast('Cannot deactivate: at least 1 language must be active!')
    return
  }

  // Validate translations
  if (!translations.value || Object.keys(translations.value).length === 0) {
    showErrorToast('Translations cannot be empty!')
    return
  }

  await asyncGlobalSpinner(
    LanguagesService.create({
      code: formData.value.code,
      name: formData.value.name,
      nativeName: formData.value.nativeName,
      direction: formData.value.direction,
      isActive: formData.value.isActive,
      isDefault: formData.value.isDefault,
      notes: formData.value.notes || undefined,
      svgLogo: formData.value.svgLogo,
      translations: translations.value,
    }),
  )

  showSuccessToast('Language created successfully.')
  router.push('/profile/languages')
}

const goBack = () => {
  router.push('/profile/languages')
}

</script>

