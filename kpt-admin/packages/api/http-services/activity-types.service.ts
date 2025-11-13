import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'

export interface ActivityType {
  id: string
  name: string
  description: string
  keywords: string[]
  category: string
  icon: string
  color: string
}

export interface ActivityTypeStats {
  totalCount?: number
  categoryCounts?: Record<string, number>
  averageDifficulty?: number
  totalTypes?: number
  typesByCategory?: Record<string, number>
  totalCategories?: number
}

export interface ActivityCategories {
  [key: string]: string
}

export class ActivityTypesService {
  static getAll(): Promise<ActivityType[]> {
    return axios.get(ApiBaseUrl.ActivityTypes)
  }

  static getByCategory(category: string): Promise<ActivityType[]> {
    return axios.get(`${ApiBaseUrl.ActivityTypes}/by-category`, {
      params: { category },
    })
  }

  static getCategories(): Promise<ActivityCategories> {
    return axios.get(`${ApiBaseUrl.ActivityTypes}/categories`)
  }

  static getStats(): Promise<ActivityTypeStats> {
    return axios.get(`${ApiBaseUrl.ActivityTypes}/stats`)
  }

  static syncWithDrive(): Promise<{ message: string }> {
    return axios.post(`${ApiBaseUrl.ActivityTypes}/sync-with-drive`)
  }
}