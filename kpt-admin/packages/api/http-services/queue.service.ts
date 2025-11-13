import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'

export interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  total: number
  isPaused: boolean
}

export interface QueueInfo {
  name: string
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  paused: boolean
  hasError: boolean
  errorMessage?: string
}

export interface QueueListResponse {
  queues: QueueInfo[]
  total: number
}

export class QueueService {
  static getNames(): Promise<{ names: string[]; total: number }> {
    return axios.get(`${ApiBaseUrl.Queue}/names`)
  }

  static getList(): Promise<QueueListResponse> {
    return axios.get(`${ApiBaseUrl.Queue}/list`)
  }

  static getStats(queueName: string): Promise<QueueStats> {
    return axios.get(`${ApiBaseUrl.Queue}/${queueName}/stats`)
  }

  static clear(queueName: string): Promise<void> {
    return axios.delete(`${ApiBaseUrl.Queue}/${queueName}/clear`)
  }

  static clearFailed(queueName: string): Promise<{ cleared: number }> {
    return axios.delete(`${ApiBaseUrl.Queue}/${queueName}/clear-failed`)
  }

  static clearCompleted(queueName: string): Promise<{ cleared: number }> {
    return axios.delete(`${ApiBaseUrl.Queue}/${queueName}/clear-completed`)
  }

  static pause(queueName: string): Promise<void> {
    return axios.post(`${ApiBaseUrl.Queue}/${queueName}/pause`)
  }

  static resume(queueName: string): Promise<void> {
    return axios.post(`${ApiBaseUrl.Queue}/${queueName}/resume`)
  }
}
