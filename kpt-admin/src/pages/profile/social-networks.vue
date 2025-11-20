<route lang="yaml">
name: social-networks
meta:
  layout: profile
</route>

<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="text-caption text-grey">Total Count</div>
            <div class="text-h4">{{ stats?.totalCount || 0 }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="text-caption text-grey">Last Sync</div>
            <div class="text-body-1 font-weight-medium">{{ lastSync || 'Never' }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-grey">Synchronization</div>
              <div class="text-body-1 font-weight-medium">Google Drive</div>
            </div>
            <v-btn
              color="primary"
              prepend-icon="mdi-sync"
              @click="handleSync"
              :loading="syncing"
            >
              Sync
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- No Data -->
    <v-row v-if="!socialNetworks.length">
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          No social networks found. Try syncing with Google Drive.
        </v-alert>
      </v-col>
    </v-row>

    <!-- Social Networks Cards -->
    <v-row v-else>
      <v-col cols="12" md="6" lg="4" v-for="socialNetwork in socialNetworks" :key="socialNetwork.id">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center mb-3">
              <div 
                class="social-icon mr-3"
                v-html="socialNetwork.svg"
              ></div>
              <div>
                <div class="text-h6">{{ socialNetwork.name }}</div>
                <v-chip 
                  color="primary" 
                  size="small"
                  class="mt-1"
                >
                  {{ socialNetwork.category }}
                </v-chip>
              </div>
            </div>
            
            <div class="text-body-2 text-grey mb-3">{{ socialNetwork.description }}</div>
            
            <!-- Color indicator -->
            <div class="d-flex justify-space-between align-center">
              <div class="text-caption text-grey">Brand Color</div>
              <div 
                class="color-indicator" 
                :style="{ backgroundColor: socialNetwork.color }"
              ></div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { SocialNetworksService, type SocialNetwork, type SocialNetworksStats, type SettingsResponse } from '@api'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { showSuccessToast } from '@workers/toast-worker'

const route = useRoute()

const allSocialNetworks = ref<SocialNetwork[]>([])
const socialNetworks = ref<SocialNetwork[]>([])
const stats = ref<SocialNetworksStats | null>(null)

// Данные из резолвера
const socialNetworksData = route.meta.socialNetworks as SocialNetwork[]
const socialNetworksStatsData = route.meta.socialNetworksStats as SocialNetworksStats
const settingsData = route.meta.settings as SettingsResponse

allSocialNetworks.value = socialNetworksData || []
socialNetworks.value = allSocialNetworks.value
stats.value = socialNetworksStatsData || null

const lastSync = computed(() => settingsData?.googleDriveSync?.socialNetworks || null)

const loadSocialNetworks = async () => {
  const [networks, statsData] = (await asyncGlobalSpinner(
    SocialNetworksService.getAll(),
    SocialNetworksService.getStats(),
  )) as [SocialNetwork[], SocialNetworksStats]

  allSocialNetworks.value = networks
  socialNetworks.value = networks
  stats.value = statsData
}

const handleSync = async () => {
  await asyncGlobalSpinner(SocialNetworksService.syncWithDrive())
  await loadSocialNetworks()
  showSuccessToast('Synchronization completed successfully.')
}
</script>

<style scoped>
.social-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #e0e0e0;
}
</style>
