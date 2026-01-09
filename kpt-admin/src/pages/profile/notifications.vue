<route lang="yaml">
name: notifications
meta:
  layout: profile
</route>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-bell</v-icon>
            Notifications Overview
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-card variant="outlined">
                  <v-card-text class="text-center py-6">
                    <div class="text-overline text-grey">Total Active Users</div>
                    <div class="text-h4 font-weight-bold">{{ stats.totalUsers }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="outlined">
                  <v-card-text class="text-center py-6">
                    <div class="text-overline text-grey">Users With Device Token</div>
                    <div class="text-h4 font-weight-bold text-success">{{ stats.usersWithDeviceToken }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="outlined">
                  <v-card-text class="text-center py-6">
                    <div class="text-overline text-grey">Users Without Device Token</div>
                    <div class="text-h4 font-weight-bold text-error">{{ stats.usersWithoutDeviceToken }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-bullhorn</v-icon>
            Broadcast Custom Notification
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-form @submit.prevent="handleBroadcast">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.title"
                    label="Title"
                    placeholder="Enter notification title"
                    density="comfortable"
                    variant="outlined"
                    :rules="titleRules"
                    :counter="120"
                    maxlength="120"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="form.body"
                    label="Message"
                    placeholder="Enter notification body"
                    density="comfortable"
                    variant="outlined"
                    :rules="bodyRules"
                    :counter="512"
                    maxlength="512"
                    rows="3"
                  ></v-textarea>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="form.link"
                    label="Link (optional)"
                    placeholder="https://example.com"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-alert
                v-if="errorMessage"
                type="error"
                variant="tonal"
                class="mb-4"
              >
                {{ errorMessage }}
              </v-alert>

              <v-btn
                color="primary"
                type="submit"
              >
                Send Notification
              </v-btn>
            </v-form>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-text v-if="lastResult">
            <v-alert type="info" variant="tonal" border="start" colored-border>
              <div class="font-weight-medium">Broadcast queued</div>
              <div class="text-body-2">Notifications will be delivered in background.</div>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  NotificationsService,
  type BroadcastNotificationResult,
  type NotificationStats,
} from '@api'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { showSuccessToast } from '@workers/toast-worker'

const route = useRoute()

const stats = computed<NotificationStats>(() => {
  const value = route.meta.stats as NotificationStats | undefined
  return value ?? {
    totalUsers: 0,
    usersWithDeviceToken: 0,
    usersWithoutDeviceToken: 0,
  }
})

const form = reactive({
  title: '',
  body: '',
  link: '',
})

const errorMessage = ref<string | null>(null)
const lastResult = ref<BroadcastNotificationResult | null>(null)

const requiredRule = (value: string) => (value && value.trim().length > 0) || 'Field is required'
const maxLengthRule = (max: number) => (value: string) => 
  (!value || value.length <= max) || `Must be ${max} characters or less`

const titleRules = [
  requiredRule,
  maxLengthRule(120),
]

const bodyRules = [
  requiredRule,
  maxLengthRule(512),
]

const handleBroadcast = async () => {
  errorMessage.value = null

  if (!form.title.trim() || !form.body.trim()) {
    errorMessage.value = 'Title and message are required.'
    return
  }

  // Проверка длины перед отправкой
  if (form.title.length > 120) {
    errorMessage.value = 'Title must be 120 characters or less.'
    return
  }

  if (form.body.length > 512) {
    errorMessage.value = 'Message must be 512 characters or less.'
    return
  }

  const payload = {
    title: form.title.trim(),
    body: form.body.trim(),
    data: form.link.trim() ? { link: form.link.trim() } : undefined,
  }

  try {
    lastResult.value = (await asyncGlobalSpinner(
      NotificationsService.broadcast(payload),
    )) as BroadcastNotificationResult

    showSuccessToast('Notification broadcast started.')
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || error.message || 'Failed to send notification.'
  }
}
</script>

<style scoped>
.result-grid {
  gap: 16px;
}

.result-item {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 120px;
}

.label {
  font-weight: 500;
}

.value {
  font-weight: 600;
}
</style>

