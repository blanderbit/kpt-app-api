import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'
import { formatDateSafe } from '../utils/date'

export interface Backup {
  id: string
  name: string
  size: number
  modifiedTime: string
  mimeType: string
}

export interface BackupSettings {
  autoBackup: boolean
  frequency: number
  retentionDays: number
}

export interface BackupListResponse {
  success: boolean
  message: string
  backups: Backup[]
}

export class BackupService {
  static async getList(): Promise<BackupListResponse> {
    const response = await axios.get<BackupListResponse, BackupListResponse>(`${ApiBaseUrl.Backup}/list`)
    return {
      ...response,
      backups: response.backups.map((item) => ({
        ...item,
        modifiedTime: formatDateSafe(item.modifiedTime, 'DD.MM.YYYY HH:mm') ?? item.modifiedTime,
      })),
    }
  }

  static download(fileId: string): Promise<Blob> {
    return axios.get(`${ApiBaseUrl.Backup}/download/${fileId}`, {
      responseType: 'blob',
    })
  }

  static create(): Promise<{ success: boolean; message: string }> {
    return axios.post<{ success: boolean; message: string }, { success: boolean; message: string }>(
      `${ApiBaseUrl.Backup}/create`,
    )
  }

  static restore(fileName: string): Promise<{ success: boolean; message: string }> {
    return axios.post<{ success: boolean; message: string }, { success: boolean; message: string }>(
      `${ApiBaseUrl.Backup}/restore/${fileName}`,
    )
  }
}
