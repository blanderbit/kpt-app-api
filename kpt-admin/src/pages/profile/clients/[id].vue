<route lang="yaml">
name: clients-id
meta:
  layout: profile
</route>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-btn @click="$router.push('/profile/clients')" class="mb-4">
          <v-icon left>mdi-arrow-left</v-icon>
          Back to Clients
        </v-btn>
      </v-col>
    </v-row>

    <!-- Client Summary -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" lg="3">
        <v-card class="info-card h-100">
          <v-card-title>
            <v-icon left>mdi-account</v-icon>
            Client Information
          </v-card-title>
          <v-card-text v-if="client">
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>ID</v-list-item-title>
                <v-list-item-subtitle>{{ client.id }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Email</v-list-item-title>
                <v-list-item-subtitle>{{ client.email }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>First Name</v-list-item-title>
                <v-list-item-subtitle>{{ client.firstName || 'N/A' }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Email Verified</v-list-item-title>
                <v-list-item-subtitle>
                  <v-icon :color="client.emailVerified ? 'success' : 'error'">
                    {{ client.emailVerified ? 'mdi-check-circle' : 'mdi-close-circle' }}
                  </v-icon>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Theme</v-list-item-title>
                <v-list-item-subtitle>{{ client.theme }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Language</v-list-item-title>
                <v-list-item-subtitle>{{ client.language || 'N/A' }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Roles</v-list-item-title>
                <v-list-item-subtitle>{{ client.roles.join(', ') }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Created At</v-list-item-title>
                <v-list-item-subtitle>{{ client.createdAt }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <v-card class="info-card h-100">
          <v-card-title>
            <v-icon left>mdi-cellphone-bell</v-icon>
            Active Device Tokens
            <v-spacer></v-spacer>
            <v-chip color="primary" variant="tonal" size="small">
              Total: {{ devicesPagination.total }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-alert
              v-if="notificationDevices.length === 0"
              type="info"
              variant="tonal"
            >
              No active device tokens for this user.
            </v-alert>
            <v-list v-else density="compact">
              <v-list-item
                v-for="device in notificationDevices"
                :key="device.token"
              >
                <template #prepend>
                  <v-icon>{{ platformIcon(device.platform) }}</v-icon>
                </template>
                <v-list-item-title>{{ shortenToken(device.token) }}</v-list-item-title>
                <v-list-item-subtitle>
                  <span class="text-grey">Last used:</span>
                  <span>{{ device.lastUsedAt ?? '—' }}</span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <VPagination
              v-if="devicesPagination.totalPages && devicesPagination.totalPages > 1"
              v-model="devicesPagination.page"
              :length="devicesPagination.totalPages"
              rounded="circle"
              variant="outlined"
              class="mt-3"
              active-color="blue_dark"
              @update:model-value="handleDevicesPageChange"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <v-card class="info-card h-100">
          <v-card-title>
            <v-icon left>mdi-history</v-icon>
            Notification History
          </v-card-title>
          <v-card-text>
            <v-alert
              v-if="notificationTracker.length === 0"
              type="info"
              variant="tonal"
            >
              No notifications have been sent to this user yet.
            </v-alert>
            <v-list v-else density="compact">
              <v-list-item
                v-for="entry in notificationTracker"
                :key="entry.type"
              >
                <v-list-item-title>
                  {{ formatNotificationType(entry.type) }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  <span class="text-grey">Last sent:</span>
                  <span>{{ entry.lastSentAt ?? '—' }}</span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <v-card class="info-card h-100">
          <v-card-title>
            <v-icon left>mdi-file-chart</v-icon>
            Article Analytics
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-card variant="outlined" class="pa-4 text-center info-card__metric">
                  <div class="text-caption text-grey">Assigned Articles</div>
                  <div class="text-h5 font-weight-bold">
                    {{ articleAnalytics?.assignedArticles ?? 0 }}
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12">
                <v-card variant="outlined" class="pa-4 text-center info-card__metric">
                  <div class="text-caption text-grey">Hidden Articles</div>
                  <div class="text-h5 font-weight-bold">
                    {{ articleAnalytics?.hiddenArticles ?? 0 }}
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-6">
      <v-col cols="12" lg="4">
        <v-card class="info-card h-100">
          <v-card-title class="d-flex align-center">
            <v-icon left>mdi-receipt</v-icon>
            Subscriptions Overview
            <v-spacer></v-spacer>
            <v-btn
              icon
              variant="text"
              size="small"
              :loading="subscriptionLoading"
              @click="refreshClientSubscriptions({ force: true, notify: true })"
            >
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <div class="mb-4">
              <div class="text-subtitle-2 mb-2">Year filter</div>
              <v-select
                v-model="subscriptionStatsYear"
                :items="yearOptions"
                label="Year"
                density="comfortable"
                variant="outlined"
                clearable
                hide-details
                @update:model-value="handleSubscriptionStatsYearChange"
              >
                <template v-slot:item="{ item, props }">
                  <v-list-item v-bind="props">
                    <template v-if="item.value === null">
                      <v-list-item-title>All time</v-list-item-title>
                    </template>
                  </v-list-item>
                </template>
                <template v-slot:selection="{ item }">
                  <span v-if="item.value === null">All time</span>
                  <span v-else>{{ item.value }}</span>
                </template>
              </v-select>
            </div>
            <div class="mb-4">
              <div class="text-subtitle-2 mb-2">Latest status</div>
              <div class="d-flex align-center">
                <v-chip :color="latestSubscriptionColor" size="small" variant="tonal">
                  {{ latestSubscriptionLabel }}
                </v-chip>
                <span class="text-caption text-medium-emphasis ms-2">
                  {{ latestSubscriptionProduct }}
                </span>
              </div>
              <div class="text-caption text-medium-emphasis mt-2">
                Period: {{ latestSubscriptionPeriod }}
              </div>
            </div>

            <div class="text-subtitle-2 mb-2">Plan distribution</div>
            <v-row class="mb-4">
              <v-col cols="12" v-for="card in subscriptionPlanCards" :key="card.key">
                <div class="d-flex justify-space-between stat-line">
                  <span>{{ card.label }}</span>
                  <span>{{ card.value }}</span>
                </div>
              </v-col>
            </v-row>

            <div class="text-subtitle-2 mb-2">Status breakdown</div>
            <v-row class="mb-4">
              <v-col cols="12" v-for="card in subscriptionStatusCards" :key="card.key">
                <div class="d-flex justify-space-between stat-line">
                  <span>{{ card.label }}</span>
                  <span>{{ card.value }}</span>
                </div>
              </v-col>
            </v-row>

            <div class="text-subtitle-2 mb-2">Totals</div>
            <v-row>
              <v-col cols="12" v-for="card in subscriptionTotals" :key="card.key">
                <div class="d-flex justify-space-between stat-line">
                  <span>{{ card.label }}</span>
                  <span>{{ card.value }}</span>
                </div>
                <div class="text-caption text-medium-emphasis">
                  <span v-if="card.endDate">{{ card.startDate }} - {{ card.endDate }}</span>
                  <span v-else>Start: {{ card.startDate }}</span>
                </div>
              </v-col>
            </v-row>

            <div class="text-subtitle-2 mb-2 mt-4">Revenue (USD)</div>
            <v-row>
              <v-col cols="12" v-for="card in subscriptionRevenue" :key="card.key">
                <div class="d-flex justify-space-between stat-line">
                  <span>{{ card.label }}</span>
                  <span>{{ card.value }}</span>
                </div>
                <div class="text-caption text-medium-emphasis">
                  <span v-if="card.endDate">{{ card.startDate }} - {{ card.endDate }}</span>
                  <span v-else>Start: {{ card.startDate }}</span>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8">
        <v-card class="table-card h-100">
          <v-card-title class="d-flex align-center justify-space-between">
            <span>User Subscriptions</span>
            <v-chip color="primary" variant="tonal" size="small">
              Total: {{ subscriptionPagination.total }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-row class="mb-4">
              <v-col cols="12" md="4">
                <v-select
                  v-model="subscriptionFilters.planInterval"
                  :items="subscriptionPlanOptions"
                  label="Plan interval"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  @update:model-value="handleSubscriptionFilterChange"
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="subscriptionFilters.status"
                  :items="subscriptionStatusOptions"
                  label="Status"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  @update:model-value="handleSubscriptionFilterChange"
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="subscriptionFilters.linked"
                  :items="subscriptionLinkedOptions"
                  label="Auth type"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  @update:model-value="handleSubscriptionFilterChange"
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="subscriptionPagination.limit"
                  :items="subscriptionLimitOptions"
                  label="Rows per page"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  @update:model-value="handleSubscriptionLimitChange"
                ></v-select>
              </v-col>
            </v-row>

            <v-data-table
              :headers="subscriptionHeaders"
              :items="subscriptionList"
              :loading="subscriptionLoading"
              item-key="id"
              density="compact"
              hide-default-footer
            >
              <template #item.planInterval="{ item }">
                <v-chip size="small" color="primary" variant="tonal">
                  {{ formatPlanInterval(item.planInterval) }}
                </v-chip>
              </template>
              <template #item.status="{ item }">
                <v-chip size="small" :color="subscriptionStatusColor(item.status)" variant="tonal">
                  {{ formatStatus(item.status) }}
                </v-chip>
              </template>
              <template #item.price="{ item }">
                {{ formatSubscriptionPrice(item) }}
              </template>
              <template #item.period="{ item }">
                <div>{{ item.periodStart || '—' }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ item.periodEnd || '—' }}
                </div>
              </template>
              <template #item.createdAt="{ item }">
                <div>{{ item.createdAt }}</div>
                <div class="text-caption text-medium-emphasis" v-if="item.cancelledAt">
                  Cancelled: {{ item.cancelledAt }}
                </div>
              </template>
            </v-data-table>

            <div class="d-flex justify-end mt-4" v-if="subscriptionPagination.lastPage > 1">
              <v-pagination
                v-model="subscriptionPagination.page"
                :length="subscriptionPagination.lastPage"
                rounded="circle"
                active-color="primary"
                @update:model-value="handleSubscriptionPageChange"
              ></v-pagination>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-6">
      <v-col cols="12" lg="6">
        <v-card class="table-card h-100">
          <v-card-title>
            <v-icon left>mdi-checkbox-marked-circle</v-icon>
            Activities
            <v-spacer></v-spacer>
            <v-text-field
              v-model="activitiesDate"
              type="date"
              label="Select Date"
              style="max-width: 200px;"
              @change="loadActivities"
              density="compact"
              hide-details
            ></v-text-field>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="activityHeaders"
              :items="activities"
              :items-per-page="-1"
              density="compact"
              hide-default-footer
              v-if="activities.length > 0"
            >
              <template v-slot:item.status="{ item }">
                <v-chip :color="item.status === 'closed' ? 'success' : 'primary'" small>
                  {{ item.status }}
                </v-chip>
              </template>
            </v-data-table>
            <v-alert v-else type="info" variant="tonal">
              No activities found for this date.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card class="table-card h-100">
          <v-card-title>
            <v-icon left>mdi-lightbulb-on</v-icon>
            Suggested Activities
            <v-spacer></v-spacer>
            <v-chip>{{ suggestedActivities.length }}</v-chip>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="suggestedActivityHeaders"
              :items="suggestedActivities"
              :items-per-page="-1"
              density="compact"
              hide-default-footer
              v-if="suggestedActivities.length > 0"
            >
              <template v-slot:item.isUsed="{ item }">
                <v-chip :color="item.isUsed ? 'success' : 'warning'" small>
                  {{ item.isUsed ? 'Used' : 'Not Used' }}
                </v-chip>
              </template>
              <template v-slot:item.confidenceScore="{ item }">
                {{ item.confidenceScore.toFixed(2) }}
              </template>
            </v-data-table>
            <v-alert v-else type="info" variant="tonal">
              No suggested activities found.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-6">
      <v-col cols="12" lg="6">
        <v-card class="table-card h-100">
          <v-card-title>
            <v-icon left>mdi-emoticon-happy</v-icon>
            Mood Tracker (Monthly)
            <v-spacer></v-spacer>
            <div class="d-flex align-center gap-2">
              <v-select
                v-model="moodTrackerMonth"
                :items="monthOptions"
                label="Month"
                style="max-width: 150px;"
                @update:model-value="loadMoodTracker"
                density="compact"
                hide-details
              ></v-select>
              <v-select
                v-model="moodTrackerYear"
                :items="yearOptions"
                label="Year"
                style="max-width: 120px;"
                @update:model-value="loadMoodTracker"
                density="compact"
                hide-details
              ></v-select>
            </div>
          </v-card-title>
          <v-card-text>
            <div v-if="moodTracker">
              <v-alert type="info" variant="tonal" class="mb-4">
                Tracked: {{ moodTracker.trackedDays }} / {{ moodTracker.totalDays }} days
              </v-alert>
              <v-data-table
                :headers="moodTrackerHeaders"
                :items="moodTracker.moodTrackers"
                :items-per-page="-1"
                density="compact"
                hide-default-footer
                v-if="moodTracker.moodTrackers.length > 0"
              >
                <template v-slot:item.moodType="{ item }">
                  {{ item.moodType }}
                </template>
                <template v-slot:item.moodDate="{ item }">
                  {{ item.moodDate }}
                </template>
              </v-data-table>
              <v-alert v-else type="info" variant="tonal">
                No mood tracker entries found for this month.
              </v-alert>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card class="info-card h-100">
          <v-card-title>
            <v-icon left>mdi-chart-line</v-icon>
            Analytics
          </v-card-title>
          <v-card-text v-if="analytics">
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Total Tasks</v-list-item-title>
                <v-list-item-subtitle>{{ analytics.totalTasks }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Completed Tasks</v-list-item-title>
                <v-list-item-subtitle>{{ analytics.completedTasks }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Completion Rate</v-list-item-title>
                <v-list-item-subtitle>{{ analytics.taskCompletionRate.toFixed(2) }}%</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="analytics.averageSatisfaction !== null">
                <v-list-item-title>Average Satisfaction</v-list-item-title>
                <v-list-item-subtitle>{{ analytics.averageSatisfaction.toFixed(2) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="analytics.averageHardness !== null">
                <v-list-item-title>Average Hardness</v-list-item-title>
                <v-list-item-subtitle>{{ analytics.averageHardness.toFixed(2) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Rate Activities</v-list-item-title>
                <v-list-item-subtitle>{{ analytics.totalRateActivities }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-6">
      <v-col cols="12" lg="6">
        <v-card class="info-card h-100">
          <v-card-title>
            <v-icon left>mdi-clipboard-text</v-icon>
            Mood Survey Answers Statistics
          </v-card-title>
          <v-card-text v-if="moodSurveyAnswersStats">
            <v-alert
              v-if="Object.keys(moodSurveyAnswersStats).length === 0"
              type="info"
              variant="tonal"
            >
              No mood survey answers found for this user.
            </v-alert>
            <div v-else>
              <v-expansion-panels v-model="moodStatsPanels" variant="accordion" class="mb-2">
                <v-expansion-panel
                  v-for="(stats, language) in moodSurveyAnswersStats"
                  :key="language"
                  :title="`${language || 'Unknown'} (${Object.keys(stats).length} surveys)`"
                >
                  <v-expansion-panel-text>
                    <v-list density="compact">
                      <v-list-item
                        v-for="(count, answer) in stats"
                        :key="answer"
                      >
                        <v-list-item-title>{{ answer }}</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip size="small" color="primary" variant="tonal">
                            {{ count }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="table-card">
          <v-card-title>
            <v-icon left>mdi-clipboard-text</v-icon>
            Surveys
            <v-spacer></v-spacer>
            <v-chip color="primary" variant="tonal" size="small">
              Total: {{ surveysPagination.total }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-list v-if="surveys.length > 0">
              <v-list-item
                v-for="survey in surveys"
                :key="survey.id"
                :title="survey.title"
                :subtitle="survey.description || 'No description'"
              >
                <template v-slot:append>
                  <v-chip :color="surveyStatusColor(survey.status)" small>
                    {{ surveyStatusLabel(survey.status) }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            <v-alert v-else type="info" variant="tonal">
              No surveys found.
            </v-alert>
            <VPagination
              v-if="surveysPagination.totalPages && surveysPagination.totalPages > 1"
              v-model="surveysPagination.page"
              :length="surveysPagination.totalPages"
              rounded="circle"
              variant="outlined"
              class="mt-3"
              active-color="blue_dark"
              @update:model-value="handleSurveysPageChange"
            />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card class="table-card">
          <v-card-title>
            <v-icon left>mdi-file-document</v-icon>
            Hidden Articles
            <v-spacer></v-spacer>
            <v-chip color="primary" variant="tonal" size="small">
              Total: {{ articlesPagination.total }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-list v-if="articles.length > 0">
              <v-list-item
                v-for="article in articles"
                :key="article.id"
                :title="article.title"
                :subtitle="article.text.substring(0, 100) + '...'"
              >
                <template v-slot:append>
                  <v-chip :color="articleStatusColor(article.status)" small>
                    {{ articleStatusLabel(article.status) }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            <v-alert v-else type="info" variant="tonal">
              No hidden articles found.
            </v-alert>
            <VPagination
              v-if="articlesPagination.totalPages && articlesPagination.totalPages > 1"
              v-model="articlesPagination.page"
              :length="articlesPagination.totalPages"
              rounded="circle"
              variant="outlined"
              class="mt-3"
              active-color="blue_dark"
              @update:model-value="handleArticlesPageChange"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="table-card">
          <v-card-title>
            <v-icon left>mdi-close-circle</v-icon>
            Closed Tooltips
            <v-spacer></v-spacer>
            <v-chip color="primary" variant="tonal" size="small">
              Total: {{ closedTooltips.length }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-alert
              v-if="closedTooltips.length === 0"
              type="info"
              variant="tonal"
            >
              No closed tooltips found for this user.
            </v-alert>
            <v-list v-else density="compact">
              <v-list-item
                v-for="tooltip in closedTooltips"
                :key="tooltip.id"
              >
                <template #prepend>
                  <v-icon>{{ getTooltipTypeIcon(tooltip.type) }}</v-icon>
                </template>
                <v-list-item-title>{{ getTooltipTitle(tooltip.json) }}</v-list-item-title>
                <v-list-item-subtitle>
                  <span class="text-grey">Page:</span>
                  <span class="ms-1">{{ tooltip.page }}</span>
                  <span class="text-grey ms-2">Type:</span>
                  <span class="ms-1">{{ tooltip.type }}</span>
                  <span v-if="tooltip.language" class="text-grey ms-2">Language:</span>
                  <span v-if="tooltip.language" class="ms-1">{{ tooltip.language }}</span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ClientsService,
  SubscriptionsService,
  TooltipsService,
  type NotificationDevice,
  type NotificationTrackerEntry,
  type SubscriptionModel,
  type SubscriptionStats,
  type SubscriptionPlanInterval,
  type SubscriptionStatus,
  type Tooltip,
} from '@api'
import type {
  Client,
  Activity,
  SuggestedActivity,
  ClientMoodTrackerMonthlyResponse,
  ClientAnalyticsResponse,
  Survey,
  Article,
  UserArticlesAnalytics,
} from '@api'
import { asyncGlobalSpinner } from '@workers/loading-worker'
import { showSuccessToast } from '@workers/toast-worker'
import dayjs from 'dayjs'
import { NotificationsService } from '@api'

const route = useRoute()
const router = useRouter()

const client = ref<Client | null>(null)
const activities = ref<Activity[]>([])
const suggestedActivities = ref<SuggestedActivity[]>([])
const moodTracker = ref<ClientMoodTrackerMonthlyResponse | null>(null)
const analytics = ref<ClientAnalyticsResponse | null>(null)
const surveys = ref<Survey[]>([])
const surveysPagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
})
const articles = ref<Article[]>([])
const articlesPagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
})
const articleAnalytics = ref<UserArticlesAnalytics | null>(null)
const notificationDevices = ref<NotificationDevice[]>([])
const notificationDevicesPagination = ref<{
  data: NotificationDevice[]
  meta?: { itemsPerPage?: number; totalItems?: number; currentPage?: number; totalPages?: number }
} | undefined>(undefined)
const devicesPagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
})
const notificationTracker = ref<NotificationTrackerEntry[]>([])
const moodSurveyAnswersStats = ref<Record<string, Record<string, number>> | null>(null)
const moodStatsPanels = ref<number[]>([])
const closedTooltips = ref<Tooltip[]>([])

const activitiesDate = ref(new Date().toISOString().split('T')[0])
const currentDate = new Date()
const moodTrackerMonth = ref(currentDate.getMonth() + 1)
const moodTrackerYear = ref(currentDate.getFullYear())

// Данные из резолвера
const clientId = parseInt(route.params.id as string)
const clientData = route.meta.client as Client
const activitiesData = route.meta.activities as { activities: Activity[]; date: string }
const suggestedActivitiesData = route.meta.suggestedActivities as { suggestedActivities: SuggestedActivity[] }
const moodTrackerData = route.meta.moodTracker as ClientMoodTrackerMonthlyResponse
const analyticsData = route.meta.analytics as ClientAnalyticsResponse
const surveysData = route.meta.surveys as
  | { data: Survey[]; meta?: { itemsPerPage?: number; totalItems?: number; currentPage?: number; totalPages?: number } }
  | undefined
const articlesData = route.meta.articles as
  | { data: Article[]; meta?: { itemsPerPage?: number; totalItems?: number; currentPage?: number; totalPages?: number } }
  | undefined
const notificationDevicesData = route.meta.notificationDevices as
  | { data: NotificationDevice[]; meta?: { itemsPerPage?: number; totalItems?: number; currentPage?: number; totalPages?: number } }
  | undefined
const notificationTrackerData = route.meta.notificationTracker as NotificationTrackerEntry[]
const articleAnalyticsData = route.meta.articleAnalytics as UserArticlesAnalytics | undefined
const moodSurveyAnswersStatsData = route.meta.moodSurveyAnswersStats as Record<string, Record<string, number>> | undefined
const closedTooltipsData = route.meta.closedTooltips as Tooltip[] | undefined
const subscriptionListData = route.meta.clientSubscriptions as
  | { data: SubscriptionModel[]; meta?: { itemsPerPage?: number; totalItems?: number; currentPage?: number; totalPages?: number } }
  | undefined
const subscriptionStatsData = route.meta.clientSubscriptionStats as SubscriptionStats | undefined
const latestSubscriptionData = route.meta.clientLatestSubscription as SubscriptionModel | null | undefined

client.value = clientData
activities.value = activitiesData.activities ?? []
activitiesDate.value = activitiesData.date
suggestedActivities.value = suggestedActivitiesData.suggestedActivities ?? []
moodTracker.value = moodTrackerData
moodTrackerMonth.value = moodTrackerData.month
moodTrackerYear.value = moodTrackerData.year
analytics.value = analyticsData
surveys.value = surveysData?.data ?? []
surveysPagination.page = surveysData?.meta?.currentPage ?? 1
surveysPagination.limit = surveysData?.meta?.itemsPerPage ?? 10
surveysPagination.total = surveysData?.meta?.totalItems ?? 0
surveysPagination.totalPages = surveysData?.meta?.totalPages ?? 0

articles.value = articlesData?.data ?? []
articlesPagination.page = articlesData?.meta?.currentPage ?? 1
articlesPagination.limit = articlesData?.meta?.itemsPerPage ?? 10
articlesPagination.total = articlesData?.meta?.totalItems ?? 0
articlesPagination.totalPages = articlesData?.meta?.totalPages ?? 0
notificationDevicesPagination.value = notificationDevicesData
notificationDevices.value = notificationDevicesData?.data ?? []
devicesPagination.page = notificationDevicesData?.meta?.currentPage ?? 1
devicesPagination.limit = notificationDevicesData?.meta?.itemsPerPage ?? 10
devicesPagination.total = notificationDevicesData?.meta?.totalItems ?? 0
devicesPagination.totalPages = notificationDevicesData?.meta?.totalPages ?? 0
notificationTracker.value = notificationTrackerData ?? []
articleAnalytics.value = articleAnalyticsData ?? null
moodSurveyAnswersStats.value = moodSurveyAnswersStatsData ?? null
closedTooltips.value = closedTooltipsData ?? []
const defaultSubscriptionStart = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
const defaultSubscriptionEnd = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')

const subscriptionStats = ref<SubscriptionStats>(
  subscriptionStatsData ?? {
    countByPlanInterval: {},
    countByStatus: {},
    totals: {
      month: { count: 0, startDate: defaultSubscriptionStart },
      year: { count: 0, startDate: defaultSubscriptionStart },
    },
    revenue: {
      month: { amount: 0, currency: 'USD', startDate: defaultSubscriptionStart },
      year: { amount: 0, currency: 'USD', startDate: defaultSubscriptionStart },
    },
    authBreakdown: {
      byPlanInterval: [],
      month: { linked: 0, anonymous: 0, startDate: defaultSubscriptionStart },
      year: { linked: 0, anonymous: 0, startDate: defaultSubscriptionStart },
    },
  },
)

const latestSubscription = ref<SubscriptionModel | null>(latestSubscriptionData ?? null)

const subscriptionList = ref<SubscriptionModel[]>(subscriptionListData?.data ?? [])

const subscriptionPagination = reactive({
  page: subscriptionListData?.meta?.currentPage ?? 1,
  limit: subscriptionListData?.meta?.itemsPerPage ?? 10,
  total: subscriptionListData?.meta?.totalItems ?? subscriptionList.value.length,
  lastPage: subscriptionListData?.meta?.totalPages ?? 1,
})

const subscriptionFilters = reactive({
  planInterval: '' as SubscriptionPlanInterval | '',
  status: '' as SubscriptionStatus | '',
  linked: '' as 'linked' | 'anonymous' | '',
})

const subscriptionStatsYear = ref<number | null>(new Date().getFullYear())
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years: Array<{ title: string; value: number | null }> = [
    { title: 'All time', value: null },
  ]
  for (let year = currentYear; year >= currentYear - 10; year--) {
    years.push({ title: String(year), value: year })
  }
  return years
})

const subscriptionLoading = ref(false)

const subscriptionPlanOptions = [
  { title: 'All plans', value: '' },
  { title: 'Monthly', value: 'monthly' },
  { title: 'Yearly', value: 'yearly' },
  { title: 'Unknown', value: 'unknown' },
]

const subscriptionStatusOptions = [
  { title: 'All statuses', value: '' },
  { title: 'Active', value: 'active' },
  { title: 'Expired', value: 'expired' },
  { title: 'Cancelled', value: 'cancelled' },
  { title: 'Past due', value: 'past_due' },
  { title: 'Unknown', value: 'unknown' },
]

const subscriptionLinkedOptions = [
  { title: 'All', value: '' },
  { title: 'Linked accounts', value: 'linked' },
  { title: 'Anonymous accounts', value: 'anonymous' },
]

const subscriptionLimitOptions = [5, 10, 20, 30].map((value) => ({ title: `${value}`, value }))

const subscriptionHeaders = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'Product', key: 'productId', sortable: false },
  { title: 'Plan', key: 'planInterval', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Price', key: 'price', sortable: false },
  { title: 'Period', key: 'period', sortable: false },
  { title: 'Created', key: 'createdAt', sortable: false },
]

const formatPlanInterval = (value: SubscriptionPlanInterval | string | undefined) => {
  switch (value) {
    case 'monthly':
      return 'Monthly'
    case 'yearly':
      return 'Yearly'
    default:
      return 'Unknown'
  }
}

const formatStatus = (value: SubscriptionStatus | string | undefined) => {
  switch (value) {
    case 'active':
      return 'Active'
    case 'expired':
      return 'Expired'
    case 'cancelled':
      return 'Cancelled'
    case 'past_due':
      return 'Past due'
    default:
      return 'Unknown'
  }
}

const subscriptionStatusColor = (value: SubscriptionStatus | string | undefined) => {
  switch (value) {
    case 'active':
      return 'success'
    case 'expired':
      return 'warning'
    case 'cancelled':
    case 'past_due':
      return 'error'
    default:
      return 'grey'
  }
}

const formatSubscriptionPrice = (subscription: SubscriptionModel) => {
  if (subscription.price) {
    const currency = subscription.currency || ''
    return currency ? `${currency} ${subscription.price}` : subscription.price
  }
  if (subscription.priceInUsd) {
    return `USD ${subscription.priceInUsd}`
  }
  return '—'
}

const subscriptionPlanCards = computed(() => {
  const data = subscriptionStats.value.countByPlanInterval ?? {}
  return [
    { key: 'monthly', label: 'Monthly', value: data.monthly ?? 0 },
    { key: 'yearly', label: 'Yearly', value: data.yearly ?? 0 },
    { key: 'unknown', label: 'Unknown', value: data.unknown ?? 0 },
  ]
})

const subscriptionStatusCards = computed(() => {
  const data = subscriptionStats.value.countByStatus ?? {}
  return [
    { key: 'active', label: 'Active', value: data.active ?? 0 },
    { key: 'expired', label: 'Expired', value: data.expired ?? 0 },
    { key: 'cancelled', label: 'Cancelled', value: data.cancelled ?? 0 },
    { key: 'past_due', label: 'Past due', value: data.past_due ?? 0 },
  ]
})

const subscriptionTotals = computed(() => {
  const yearLabel = subscriptionStatsYear.value 
    ? `${subscriptionStatsYear.value} year` 
    : 'All time'
  const monthLabel = subscriptionStatsYear.value
    ? `Current month (${subscriptionStatsYear.value})`
    : 'Last month'
  
  return [
    {
      key: 'month',
      label: monthLabel,
      value: subscriptionStats.value.totals.month.count,
      startDate: subscriptionStats.value.totals.month.startDate,
    },
    {
      key: 'year',
      label: yearLabel,
      value: subscriptionStats.value.totals.year.count,
      startDate: subscriptionStats.value.totals.year.startDate,
      ...(subscriptionStats.value.totals.year.endDate && { endDate: subscriptionStats.value.totals.year.endDate }),
    },
  ]
})

const subscriptionRevenue = computed(() => {
  const yearLabel = subscriptionStatsYear.value 
    ? `${subscriptionStatsYear.value} year` 
    : 'All time'
  const monthLabel = subscriptionStatsYear.value
    ? `Current month (${subscriptionStatsYear.value})`
    : 'Last month'
  
  return [
    {
      key: 'month',
      label: `Revenue ${monthLabel.toLowerCase()}`,
      value: subscriptionStats.value.revenue.month.amount.toFixed(2),
      startDate: subscriptionStats.value.revenue.month.startDate,
    },
    {
      key: 'year',
      label: `Revenue ${yearLabel.toLowerCase()}`,
      value: subscriptionStats.value.revenue.year.amount.toFixed(2),
      startDate: subscriptionStats.value.revenue.year.startDate,
      ...(subscriptionStats.value.revenue.year.endDate && { endDate: subscriptionStats.value.revenue.year.endDate }),
    },
  ]
})

const buildClientSubscriptionQuery = (pageOverride?: number) => ({
  page: pageOverride ?? subscriptionPagination.page,
  limit: subscriptionPagination.limit,
  planInterval: subscriptionFilters.planInterval || undefined,
  status: subscriptionFilters.status || undefined,
  linked: subscriptionFilters.linked || undefined,
})

const loadClientSubscriptionStats = async () => {
  const response = await SubscriptionsService.getUserStats(clientId, {
    planInterval: subscriptionFilters.planInterval || undefined,
    status: subscriptionFilters.status || undefined,
    linked: subscriptionFilters.linked || undefined,
    year: subscriptionStatsYear.value || undefined,
  })
  subscriptionStats.value = response
}

const handleSubscriptionStatsYearChange = () => {
  loadClientSubscriptionStats()
}

const loadClientSubscriptions = async ({ force = false, page }: { force?: boolean; page?: number } = {}) => {
  subscriptionLoading.value = true
  try {
    const response = await SubscriptionsService.getUserSubscriptions(clientId, buildClientSubscriptionQuery(page))
    subscriptionList.value = response.data
    subscriptionPagination.total = response.meta?.totalItems ?? response.data.length
    subscriptionPagination.page = response.meta?.currentPage ?? page ?? subscriptionPagination.page
    subscriptionPagination.lastPage = response.meta?.totalPages ?? 1
    subscriptionPagination.limit = response.meta?.itemsPerPage ?? subscriptionPagination.limit

    if (force) {
      latestSubscription.value = await SubscriptionsService.getUserLatestSubscription(clientId)
    }
  } finally {
    subscriptionLoading.value = false
  }
}

const refreshClientSubscriptions = async ({ force = false, reset = false, notify = false } = {}) => {
  if (reset) {
    subscriptionPagination.page = 1
  }

  await asyncGlobalSpinner(
    Promise.all([
      loadClientSubscriptionStats(),
      loadClientSubscriptions({ force, page: reset ? 1 : subscriptionPagination.page }),
    ]),
  )
  if (notify) {
    showSuccessToast('Subscription data updated.')
  }
}

const handleSubscriptionFilterChange = () => {
  refreshClientSubscriptions({ force: true, reset: true })
}

const handleSubscriptionPageChange = (page: number) => {
  subscriptionPagination.page = page
  loadClientSubscriptions({ page })
}

const handleSubscriptionLimitChange = (limit: number) => {
  subscriptionPagination.limit = limit
  refreshClientSubscriptions({ reset: true, force: true })
}

const latestSubscriptionStatus = computed(() => latestSubscription.value?.status ?? null)
const latestSubscriptionLabel = computed(() => formatStatus(latestSubscriptionStatus.value ?? undefined))
const latestSubscriptionColor = computed(() => subscriptionStatusColor(latestSubscriptionStatus.value ?? undefined))
const latestSubscriptionProduct = computed(() => latestSubscription.value?.productId ?? '—')
const latestSubscriptionPeriod = computed(() => {
  if (!latestSubscription.value) {
    return '—'
  }
  const { periodStart, periodEnd } = latestSubscription.value
  return [periodStart ?? '—', periodEnd ?? '—'].join(' → ')
})

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  title: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }),
  value: i + 1
}))

// const yearOptions = Array.from({ length: 10 }, (_, i) => {
//   const year = currentDate.getFullYear() - 5 + i
//   return { title: year.toString(), value: year }
// })

const activityHeaders = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'Name', key: 'activityName', sortable: false },
  { title: 'Type', key: 'activityType', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Created', key: 'createdAt', sortable: false },
]

const suggestedActivityHeaders = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'Name', key: 'activityName', sortable: false },
  { title: 'Type', key: 'activityType', sortable: false },
  { title: 'Confidence', key: 'confidenceScore', sortable: false },
  { title: 'Used', key: 'isUsed', sortable: false },
  { title: 'Suggested Date', key: 'suggestedDate', sortable: false },
]

const moodTrackerHeaders = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'Mood Type', key: 'moodType', sortable: false },
  { title: 'Date', key: 'moodDate', sortable: false },
  { title: 'Notes', key: 'notes', sortable: false },
]

const loadActivities = async () => {
  if (!clientId || !activitiesDate.value) return
  const response = (await asyncGlobalSpinner(
    ClientsService.getClientActivities(clientId, activitiesDate.value),
  )) as { activities: Activity[] }
  activities.value = response.activities ?? []
  showSuccessToast('Activities loaded successfully.')
}

const loadMoodTracker = async () => {
  if (!clientId || !moodTrackerMonth.value || !moodTrackerYear.value) return
  moodTracker.value = (await asyncGlobalSpinner(
    ClientsService.getClientMoodTrackerMonthly(clientId, moodTrackerYear.value, moodTrackerMonth.value),
  )) as ClientMoodTrackerMonthlyResponse
  showSuccessToast('Mood tracker updated successfully.')
}

const platformIcon = (platform: string | null): string => {
  switch (platform) {
    case 'ios':
      return 'mdi-apple'
    case 'android':
      return 'mdi-android'
    case 'web':
      return 'mdi-monitor'
    default:
      return 'mdi-cellphone'
  }
}

const shortenToken = (token: string): string => {
  if (token.length <= 16) return token
  return `${token.slice(0, 6)}…${token.slice(-6)}`
}

const loadDevices = async (page?: number) => {
  if (!clientId) return
  const targetPage = page ?? devicesPagination.page
  const response = await asyncGlobalSpinner(
    NotificationsService.getDevices(clientId, { page: targetPage, limit: devicesPagination.limit }),
  )
  notificationDevices.value = response.data ?? []
  devicesPagination.page = response.meta?.currentPage ?? targetPage
  devicesPagination.limit = response.meta?.itemsPerPage ?? devicesPagination.limit
  devicesPagination.total = response.meta?.totalItems ?? 0
  devicesPagination.totalPages = response.meta?.totalPages ?? 0
  
  // Update URL query
  router.replace({
    query: {
      ...route.query,
      devicesPage: targetPage,
      devicesLimit: devicesPagination.limit,
    },
  })
}

const handleDevicesPageChange = (page: number) => {
  loadDevices(page)
}

const loadSurveys = async (page?: number) => {
  if (!clientId) return
  const targetPage = page ?? surveysPagination.page
  const response = await asyncGlobalSpinner(
    ClientsService.getClientSurveys(clientId, { page: targetPage, limit: surveysPagination.limit }),
  )
  surveys.value = response.data ?? []
  surveysPagination.page = response.meta?.currentPage ?? targetPage
  surveysPagination.limit = response.meta?.itemsPerPage ?? surveysPagination.limit
  surveysPagination.total = response.meta?.totalItems ?? 0
  surveysPagination.totalPages = response.meta?.totalPages ?? 0
  
  router.replace({
    query: {
      ...route.query,
      surveysPage: targetPage,
      surveysLimit: surveysPagination.limit,
    },
  })
}

const handleSurveysPageChange = (page: number) => {
  loadSurveys(page)
}

const loadArticles = async (page?: number) => {
  if (!clientId) return
  const targetPage = page ?? articlesPagination.page
  const response = await asyncGlobalSpinner(
    ClientsService.getClientArticles(clientId, { page: targetPage, limit: articlesPagination.limit }),
  )
  articles.value = response.data ?? []
  articlesPagination.page = response.meta?.currentPage ?? targetPage
  articlesPagination.limit = response.meta?.itemsPerPage ?? articlesPagination.limit
  articlesPagination.total = response.meta?.totalItems ?? 0
  articlesPagination.totalPages = response.meta?.totalPages ?? 0
  
  router.replace({
    query: {
      ...route.query,
      articlesPage: targetPage,
      articlesLimit: articlesPagination.limit,
    },
  })
}

const handleArticlesPageChange = (page: number) => {
  loadArticles(page)
}

const getTooltipTitle = (json: any): string => {
  if (!json || typeof json !== 'object') return 'Unknown'
  if ('title' in json && typeof json.title === 'string') return json.title
  return 'Unknown'
}

const getTooltipTypeIcon = (type: string): string => {
  switch (type) {
    case 'swipe':
      return 'mdi-swipe'
    case 'text':
      return 'mdi-text'
    case 'textWithLink':
      return 'mdi-link'
    default:
      return 'mdi-information'
  }
}

const formatNotificationType = (type: string): string =>
  type
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const surveyStatusLabel = (status: Survey['status']): string => {
  switch (status) {
    case 'active':
      return 'Active'
    case 'archived':
      return 'Archived'
    case 'available':
    default:
      return 'Available'
  }
}

const surveyStatusColor = (status: Survey['status']): string => {
  switch (status) {
    case 'active':
      return 'success'
    case 'archived':
      return 'error'
    case 'available':
    default:
      return 'warning'
  }
}

const articleStatusLabel = (status: Article['status']): string => {
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

const articleStatusColor = (status: Article['status']): string => {
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

</script>
