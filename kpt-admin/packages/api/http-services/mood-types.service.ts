import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'
import { formatDateSafe } from '../utils/date'

export interface MoodType {
  id: string
  name: string
  description: string
  emoji: string
  color: string
  score: number
  category: 'positive' | 'neutral' | 'negative'
  createdAt: string
  updatedAt: string
}

export interface MoodTypesData {
  moodTypes: MoodType[]
  categories: Record<string, string>
  defaultMood: string
}

export interface MoodTypeStats {
  totalCount: number
  categoryCounts: Record<string, number>
  averageScore: number
}
export class MoodTypesService {
  static async getAll(): Promise<MoodType[]> {
    return axios.get<MoodType[], MoodType[]>(ApiBaseUrl.MoodTypes)
  }

  static async getStats(): Promise<MoodTypeStats> {
    return axios.get<MoodTypeStats, MoodTypeStats>(`${ApiBaseUrl.MoodTypes}/stats`)
  }

  static syncWithDrive(): Promise<{ message: string }> {
    return axios.post(`${ApiBaseUrl.MoodTypes}/sync-with-drive`)
  }
}