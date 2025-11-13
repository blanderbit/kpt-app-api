import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'
import { formatDateSafe } from '../utils/date'

export interface Language {
  id: string
  code: string
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  isActive: boolean
  isDefault: boolean
  version: string
  googleDriveFileId: string
  googleDriveFileUrl?: string
  googleDriveFolderId: string
  totalKeys: number
  totalTranslations: number
  completionRate: number
  notes?: string
  svgLogo?: string
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
  isArchived: boolean
}

export interface LanguageCache {
  languages: Language[]
  total: number
  lastSyncDate: string | null
}

export interface LanguageStatistics {
  totalLanguages: number
  activeLanguages: number
  archivedLanguages: number
  defaultLanguages: number
  totalKeys: number
  totalTranslations: number
  averageCompletionRate: number
}

export interface CreateLanguageDto {
  code: string
  name: string
  nativeName: string
  direction?: 'ltr' | 'rtl'
  isActive?: boolean
  isDefault?: boolean
  notes?: string
  svgLogo?: string
  translations?: Record<string, any>
}

export interface UpdateLanguageDto {
  name?: string
  nativeName?: string
  direction?: 'ltr' | 'rtl'
  notes?: string
  svgLogo?: string
  translations?: Record<string, any>
}

const formatLanguage = (language: Language): Language => ({
  ...language,
  createdAt: formatDateSafe(language.createdAt) ?? language.createdAt,
  updatedAt: formatDateSafe(language.updatedAt) ?? language.updatedAt,
})

export class LanguagesService {
  static async getCache(): Promise<LanguageCache> {
    const response = await axios.get<LanguageCache, LanguageCache>(`${ApiBaseUrl.Languages}/cache`)
    return {
      ...response,
      languages: response.languages.map(formatLanguage),
      lastSyncDate: response.lastSyncDate ? formatDateSafe(response.lastSyncDate) ?? response.lastSyncDate : null,
    }
  }

  static getStatistics(): Promise<LanguageStatistics> {
    return axios.get<LanguageStatistics, LanguageStatistics>(`${ApiBaseUrl.Languages}/statistics`)
  }

  static async getById(id: string): Promise<Language> {
    const language = await axios.get<Language, Language>(`${ApiBaseUrl.Languages}/${id}`)
    return formatLanguage(language)
  }

  static async sync(): Promise<LanguageCache & { message: string; syncedAt: string }> {
    const response = await axios.post<LanguageCache & { message: string; syncedAt: string }, LanguageCache & { message: string; syncedAt: string }>(
      `${ApiBaseUrl.Languages}/sync`,
    )
    return {
      ...response,
      languages: response.languages.map(formatLanguage),
      lastSyncDate: response.lastSyncDate ? formatDateSafe(response.lastSyncDate) ?? response.lastSyncDate : null,
      syncedAt: formatDateSafe(response.syncedAt) ?? response.syncedAt,
    }
  }

  static async create(data: CreateLanguageDto): Promise<Language> {
    const language = await axios.post<Language, Language>(ApiBaseUrl.Languages, data)
    return formatLanguage(language)
  }

  static async update(id: string, data: UpdateLanguageDto): Promise<Language> {
    const language = await axios.put<Language, Language>(`${ApiBaseUrl.Languages}/${id}`, data)
    return formatLanguage(language)
  }

  static archive(id: string, reason?: string): Promise<{ message: string }> {
    return axios.delete<{ message: string }, { message: string }>(`${ApiBaseUrl.Languages}/${id}`, {
      data: { reason },
    })
  }

  static async restore(id: string): Promise<Language> {
    const language = await axios.post<Language, Language>(`${ApiBaseUrl.Languages}/${id}/restore`)
    return formatLanguage(language)
  }

  static async setDefault(id: string): Promise<Language> {
    const language = await axios.patch<Language, Language>(`${ApiBaseUrl.Languages}/${id}/set-default`)
    return formatLanguage(language)
  }

  static async setActive(id: string, isActive: boolean): Promise<Language> {
    const language = await axios.patch<Language, Language>(`${ApiBaseUrl.Languages}/${id}/set-active`, { isActive })
    return formatLanguage(language)
  }

  static setAllActive(): Promise<{ message: string; updatedCount: number }> {
    return axios.patch<{ message: string; updatedCount: number }, { message: string; updatedCount: number }>(
      `${ApiBaseUrl.Languages}/set-all-active`,
    )
  }

  static downloadTemplate(code: string): Promise<Blob> {
    return axios.post(`${ApiBaseUrl.Languages}/download-template`, { code }, {
      responseType: 'blob',
    })
  }

  static async getArchivedCache(): Promise<LanguageCache> {
    const response = await axios.get<LanguageCache, LanguageCache>(`${ApiBaseUrl.Languages}/archived/cache`)
    return {
      ...response,
      languages: response.languages.map(formatLanguage),
      lastSyncDate: response.lastSyncDate ? formatDateSafe(response.lastSyncDate) ?? response.lastSyncDate : null,
    }
  }

  static async syncArchived(): Promise<LanguageCache & { message: string; syncedAt: string }> {
    const response = await axios.post<LanguageCache & { message: string; syncedAt: string }, LanguageCache & { message: string; syncedAt: string }>(
      `${ApiBaseUrl.Languages}/archived/sync`,
    )
    return {
      ...response,
      languages: response.languages.map(formatLanguage),
      lastSyncDate: response.lastSyncDate ? formatDateSafe(response.lastSyncDate) ?? response.lastSyncDate : null,
      syncedAt: formatDateSafe(response.syncedAt) ?? response.syncedAt,
    }
  }

  static deleteArchived(id: string): Promise<{ message: string }> {
    return axios.delete<{ message: string }, { message: string }>(`${ApiBaseUrl.Languages}/archived/${id}`)
  }
}

