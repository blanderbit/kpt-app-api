<route lang="yaml">
meta:
  layout: profile
name: queue
</route>

<template>
  <v-container fluid>
    <!-- Header with Queue Names -->
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <div>
          <h2 class="mb-2">Queue Management</h2>
          <div class="chips-container">
            <v-chip
              v-for="name in queueNames"
              :key="name"
              color="primary"
              variant="tonal"
              size="small"
            >
              <v-icon start size="small">mdi-format-list-bulleted</v-icon>
              {{ name }}
            </v-chip>
            <v-chip v-if="!queueNames.length" color="grey" variant="tonal" size="small">
              No queues
            </v-chip>
          </div>
        </div>
        <v-btn color="primary" @click="loadAllQueues">
          <v-icon start>mdi-refresh</v-icon>
          Refresh Statistics
        </v-btn>
      </v-col>
    </v-row>

    <!-- Queue Cards -->
    <v-row v-if="queues.length">
      <v-col cols="12" v-for="queue in queues" :key="queue.name">
        <v-card :class="{ 'border-error': queue.hasError }">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-queue</v-icon>
            {{ queue.name }}
            <v-spacer></v-spacer>
            <v-chip :color="queue.hasError ? 'error' : queue.paused ? 'warning' : 'success'" size="small">
              {{ queue.hasError ? 'Error' : queue.paused ? 'Paused' : 'Active' }}
            </v-chip>
          </v-card-title>

          <v-card-text v-if="queue.hasError">
            <v-alert type="error" variant="tonal">
              {{ queue.errorMessage }}
            </v-alert>
          </v-card-text>

          <v-card-text v-else>
            <v-row dense>
              <v-col>
                <div class="text-caption text-grey">Waiting</div>
                <div class="text-h6">{{ queue.waiting }}</div>
              </v-col>
              <v-col>
                <div class="text-caption text-grey">Active</div>
                <div class="text-h6">{{ queue.active }}</div>
              </v-col>
              <v-col>
                <div class="text-caption text-grey">Completed</div>
                <div class="text-h6 text-success">{{ queue.completed }}</div>
              </v-col>
              <v-col>
                <div class="text-caption text-grey">Failed</div>
                <div class="text-h6 text-error">{{ queue.failed }}</div>
              </v-col>
              <v-col>
                <div class="text-caption text-grey">Delayed</div>
                <div class="text-h6">{{ queue.delayed }}</div>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions v-if="!queue.hasError">
            <v-btn size="small" color="error" variant="outlined" @click="openConfirm('clear', queue)">
              <v-icon start size="small">mdi-delete-sweep</v-icon>
              Clear All
            </v-btn>

            <v-btn
              size="small"
              color="warning"
              variant="outlined"
              @click="openConfirm('clearFailed', queue)"
              :disabled="!queue.failed"
            >
              Clear Failed
            </v-btn>

            <v-btn
              size="small"
              color="info"
              variant="outlined"
              @click="openConfirm('clearCompleted', queue)"
              :disabled="!queue.completed"
            >
              Clear Completed
            </v-btn>

            <v-spacer></v-spacer>

            <v-btn
              v-if="!queue.paused"
              size="small"
              color="warning"
              @click="handlePause(queue.name)"
            >
              <v-icon start size="small">mdi-pause</v-icon>
              Pause
            </v-btn>

            <v-btn v-else size="small" color="success" @click="handleResume(queue.name)">
              <v-icon start size="small">mdi-play</v-icon>
              Resume
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- No Queues Found -->
    <v-row v-else>
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          No queues found. Click "Refresh Statistics" to load queues.
        </v-alert>
      </v-col>
    </v-row>

    <v-dialog v-model="showConfirmDialog" max-width="480">
      <v-card>
        <v-card-title>{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeConfirmDialog">Cancel</v-btn>
          <v-btn :color="confirmDialog.color" @click="confirmAction">{{ confirmDialog.actionLabel }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { QueueService, type QueueInfo, type QueueListResponse } from '@api'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { showSuccessToast, showErrorToast } from '@workers/toast-worker'

interface QueueNamesResponse {
  names: string[]
  total: number
}

const route = useRoute()

const queueListData = route.meta.queueList as QueueListResponse
const queueNamesData = route.meta.queueNames as QueueNamesResponse

const queues = ref<QueueInfo[]>(queueListData?.queues || [])
const queueNames = ref<string[]>(queueNamesData?.names || [])

const showConfirmDialog = ref(false)
const confirmDialog = ref({
  title: '',
  message: '',
  color: 'primary',
  actionLabel: 'Confirm',
})
const pendingAction = ref<() => Promise<void>>(async () => {})

const loadAllQueues = async () => {
  const [listResponse, namesResponse] = (await asyncGlobalSpinner(
    QueueService.getList(),
    QueueService.getNames(),
  )) as [QueueListResponse, QueueNamesResponse]

  queues.value = listResponse.queues
  queueNames.value = namesResponse.names
  showSuccessToast('Queue statistics refreshed.')
}

const refreshQueue = async (queueName: string) => {
  const [stats] = await asyncGlobalSpinner(QueueService.getStats(queueName))
  const index = queues.value.findIndex((queue) => queue.name === queueName)
  if (index !== -1) {
    queues.value[index] = {
      ...queues.value[index],
      ...stats,
      paused: stats.paused,
      hasError: false,
      errorMessage: undefined,
    }
  }
}

const openConfirm = (type: 'clear' | 'clearFailed' | 'clearCompleted', queue: QueueInfo) => {
  const messages = {
    clear: {
      title: 'Clear Queue',
      message: `Clear all jobs in "${queue.name}"?`,
      color: 'error',
      actionLabel: 'Clear All',
      action: () => asyncGlobalSpinner(QueueService.clear(queue.name)),
    },
    clearFailed: {
      title: 'Clear Failed Jobs',
      message: `Clear all failed jobs in "${queue.name}"?`,
      color: 'warning',
      actionLabel: 'Clear Failed',
      action: () => asyncGlobalSpinner(QueueService.clearFailed(queue.name)),
    },
    clearCompleted: {
      title: 'Clear Completed Jobs',
      message: `Clear all completed jobs in "${queue.name}"?`,
      color: 'info',
      actionLabel: 'Clear Completed',
      action: () => asyncGlobalSpinner(QueueService.clearCompleted(queue.name)),
    },
  }

  const config = messages[type]
  confirmDialog.value = {
    title: config.title,
    message: config.message,
    color: config.color,
    actionLabel: config.actionLabel,
  }
  pendingAction.value = async () => {
    await config.action()
    await refreshQueue(queue.name)
    showSuccessToast(`${config.title} completed.`)
  }
  showConfirmDialog.value = true
}

const closeConfirmDialog = () => {
  showConfirmDialog.value = false
  pendingAction.value = async () => {}
}

const confirmAction = async () => {
  await pendingAction.value()
  closeConfirmDialog()
}

const handlePause = async (queueName: string) => {
  await asyncGlobalSpinner(QueueService.pause(queueName))
  await refreshQueue(queueName)
  showSuccessToast(`Queue "${queueName}" paused.`)
}

const handleResume = async (queueName: string) => {
  await asyncGlobalSpinner(QueueService.resume(queueName))
  await refreshQueue(queueName)
  showSuccessToast(`Queue "${queueName}" resumed.`)
}
</script>

<style scoped>
.border-error {
  border: 2px solid rgb(var(--v-theme-error)) !important;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  row-gap: 8px;
}
</style>
