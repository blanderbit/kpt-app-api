import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'

export interface SocialNetwork {
  id: string
  name: string
  description: string
  svg: string
  color: string
  category: string
}

export interface SocialNetworksStats {
  totalCount: number
  categoryCounts: Record<string, number>
  categories: string[]
}

export class SocialNetworksService {
  static async getAll(): Promise<SocialNetwork[]> {
    return axios.get<SocialNetwork[], SocialNetwork[]>(ApiBaseUrl.SocialNetworks)
  }

  static async getByCategory(category: string): Promise<SocialNetwork[]> {
    return axios.get<SocialNetwork[], SocialNetwork[]>(`${ApiBaseUrl.SocialNetworks}/by-category`, {
      params: { category },
    })
  }

  static async getCategories(): Promise<Record<string, string>> {
    return axios.get<Record<string, string>, Record<string, string>>(`${ApiBaseUrl.SocialNetworks}/categories`)
  }

  static async getStats(): Promise<SocialNetworksStats> {
    return axios.get<SocialNetworksStats, SocialNetworksStats>(`${ApiBaseUrl.SocialNetworks}/stats`)
  }

  static async getById(id: string): Promise<SocialNetwork | undefined> {
    return axios.get<SocialNetwork | undefined, SocialNetwork | undefined>(`${ApiBaseUrl.SocialNetworks}/${id}`)
  }

  static async syncWithDrive(): Promise<{ message: string }> {
    return axios.post<{ message: string }, { message: string }>(`${ApiBaseUrl.SocialNetworks}/sync-with-drive`)
  }
}
