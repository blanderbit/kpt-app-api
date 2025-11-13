import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'
import { formatDateSafe } from '../utils/date'

export interface SettingsResponse {
  googleDriveSync: {
    onboardingQuestions: string | null
    languages: string | null
    activityTypes: string | null
    socialNetworks: string | null
    moodTypes: string | null
  }
  suggestedActivities: {
    count: number
    cron: {
      generateDailySuggestions: string
      cleanupOldSuggestions: string
    }
  }
  articles: {
    count: number
    cron: {
      generateArticles: string | null
      cleanupOldArticles: string | null
    }
    expirationDays: number
  }
  surveys: {
    count: number
    cron: {
      generateSurveys: string | null
      cleanupOldSurveys: string | null
    }
    expirationDays: number
  }
  notifications: {
    cron: {
      inactivity: string
      mood: string
      surveys: string
      articles: string
      globalActivity: string
    }
  }
  cronExpressions: string[]
}

export interface UpdateSettingsPayload {
  googleDriveSync?: {
    onboardingQuestions?: string | null
    languages?: string | null
    activityTypes?: string | null
    socialNetworks?: string | null
    moodTypes?: string | null
  }
  suggestedActivities?: {
    count?: number
    cron?: {
      generateDailySuggestions?: string
      cleanupOldSuggestions?: string
    }
  }
  articles?: {
    count?: number
    expirationDays?: number
    cron?: {
      generateArticles?: string | null
      cleanupOldArticles?: string | null
    }
  }
  surveys?: {
    count?: number
    expirationDays?: number
    cron?: {
      generateSurveys?: string | null
      cleanupOldSurveys?: string | null
    }
  }
  notifications?: {
    inactivity?: string
    mood?: string
    surveys?: string
    articles?: string
    globalActivity?: string
  }
}

export type UpdateNotificationCronPayload = Required<SettingsResponse['notifications']>['cron']

export class SettingsService {
  static async getSettings(): Promise<SettingsResponse> {
    const data = await axios.get<SettingsResponse, SettingsResponse>(ApiBaseUrl.Settings)

    const formattedSync = Object.fromEntries(
      Object.entries(data.googleDriveSync ?? {}).map(([key, value]) => [
        key,
        formatDateSafe(value, 'DD.MM.YYYY HH:mm'),
      ]),
    ) as Partial<SettingsResponse['googleDriveSync']>

    return {
      ...data,
      googleDriveSync: {
        onboardingQuestions: null,
        languages: null,
        activityTypes: null,
        socialNetworks: null,
        moodTypes: null,
        ...formattedSync,
      },
    }
  }

  static updateSettings(payload: UpdateSettingsPayload): Promise<SettingsResponse> {
    return axios.put(ApiBaseUrl.Settings, payload)
  }

  static updateNotificationCron(payload: UpdateNotificationCronPayload): Promise<SettingsResponse> {
    return axios.put(`${ApiBaseUrl.Settings}/notifications/cron`, payload)
  }

  static triggerGenerateArticles(): Promise<{ message: string }> {
    return axios.post(`${ApiBaseUrl.Settings}/cron/generate-articles`)
  }

  static triggerCleanupArticles(): Promise<{ message: string }> {
    return axios.post(`${ApiBaseUrl.Settings}/cron/cleanup-articles`)
  }

  static triggerGenerateSurveys(): Promise<{ message: string }> {
    return axios.post(`${ApiBaseUrl.Settings}/cron/generate-surveys`)
  }

  static triggerCleanupSurveys(): Promise<{ message: string }> {
    return axios.post(`${ApiBaseUrl.Settings}/cron/cleanup-surveys`)
  }
}


