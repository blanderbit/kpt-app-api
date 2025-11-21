import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'
import { formatDateSafe } from '../utils/date'
import type { PaginatedResponse } from '../interfaces'

export interface NotificationStats {
  totalUsers: number
  usersWithDeviceToken: number
  usersWithoutDeviceToken: number
}

export interface BroadcastNotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
}

export interface BroadcastNotificationResult {
  status: 'queued' | 'completed'
}

export interface NotificationDevice {
  userId: number
  token: string
  platform: string | null
  lastUsedAt: string | null
}

export interface NotificationTrackerEntry {
  userId: number
  type: string
  lastSentAt: string | null
}

export class NotificationsService {
  static async getStats(): Promise<NotificationStats> {
    return axios.get<NotificationStats, NotificationStats>(`${ApiBaseUrl.Notifications}/stats`)
  }

  static async broadcast(payload: BroadcastNotificationPayload): Promise<BroadcastNotificationResult> {
    return axios.post<BroadcastNotificationResult, BroadcastNotificationResult>(
      `${ApiBaseUrl.Notifications}/broadcast`,
      payload,
    )
  }

  static async getDevices(
    userId: number,
    params?: { page?: number; limit?: number },
  ): Promise<PaginatedResponse<NotificationDevice>> {
    const queryParams = new URLSearchParams()
    queryParams.append('userId', String(userId))
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.limit) queryParams.append('limit', String(params.limit))
    
    const url = `${ApiBaseUrl.Notifications}/devices?${queryParams.toString()}`
    const response = await axios.get<PaginatedResponse<NotificationDevice>, PaginatedResponse<NotificationDevice>>(url)

    return {
      ...response,
      data: response.data.map((device) => ({
        ...device,
        lastUsedAt: device.lastUsedAt ? formatDateSafe(device.lastUsedAt) ?? device.lastUsedAt : null,
      })),
    }
  }

  static async getNotificationTracker(userId: number): Promise<NotificationTrackerEntry[]> {
    const entries = await axios.get<NotificationTrackerEntry[], NotificationTrackerEntry[]>(
      `${ApiBaseUrl.Notifications}/notifications`,
      {
        params: { userId },
      },
    )

    return entries.map((entry) => ({
      ...entry,
      lastSentAt: entry.lastSentAt ? formatDateSafe(entry.lastSentAt) ?? entry.lastSentAt : null,
    }))
  }
}

