import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'
import { formatDateSafe } from '../utils/date'

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

  static async getDevices(userId: number): Promise<NotificationDevice[]> {
    const devices = await axios.get<NotificationDevice[], NotificationDevice[]>(
      `${ApiBaseUrl.Notifications}/devices`,
      {
        params: { userId },
      },
    )

    return devices.map((device) => ({
      ...device,
      lastUsedAt: device.lastUsedAt ? formatDateSafe(device.lastUsedAt) ?? device.lastUsedAt : null,
    }))
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

