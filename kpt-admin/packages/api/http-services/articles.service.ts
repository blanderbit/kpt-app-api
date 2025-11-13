import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'
import type { PaginatedResponse } from '../interfaces'
import { objectToFormData } from '../utils/form-data'
import { formatDateSafe } from '../utils/date'

export interface ArticleFile {
  id: number
  fileUrl: string
  fileKey: string
  fileName: string
  mimeType: string
  size: number
}

export type ArticleStatus = 'active' | 'archived' | 'available'

export interface Article {
  id: number
  title: string
  text: string
  status: ArticleStatus
  files?: ArticleFile[]
  updatedBy: string
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  archivedBy: string | null
  isHidden?: boolean
}

export interface CreateArticleDto {
  title: string
  text: string
}

export interface UpdateArticleDto {
  title?: string
  text?: string
  removeFileId?: number
}

export type PaginatedArticles = PaginatedResponse<Article>

export interface ArticleStatistics {
  assignedUsers: number
  hiddenUsers: number
}

export interface UserArticlesAnalytics {
  assignedArticles: number
  hiddenArticles: number
}

export class ArticlesService {
  static async getArticles(params?: Record<string, unknown>): Promise<PaginatedArticles> {
    const data = await axios.get<PaginatedArticles, PaginatedArticles>(ApiBaseUrl.Articles, { params })

    const formattedData = data.data.map((article) => ({
      ...article,
      createdAt: formatDateSafe(article.createdAt, 'DD.MM.YYYY HH:mm') ?? article.createdAt,
      updatedAt: formatDateSafe(article.updatedAt, 'DD.MM.YYYY HH:mm') ?? article.updatedAt,
      archivedAt: article.archivedAt ? formatDateSafe(article.archivedAt, 'DD.MM.YYYY HH:mm') ?? article.archivedAt : null,
    }))

    return {
      ...data,
      data: formattedData,
    }
  }

  static async getArticleById(id: number): Promise<Article> {
    const article = await axios.get<Article, Article>(`${ApiBaseUrl.Articles}/${id}`)
    return {
      ...article,
      createdAt: formatDateSafe(article.createdAt, 'DD.MM.YYYY HH:mm') ?? article.createdAt,
      updatedAt: formatDateSafe(article.updatedAt, 'DD.MM.YYYY HH:mm') ?? article.updatedAt,
      archivedAt: article.archivedAt ? formatDateSafe(article.archivedAt, 'DD.MM.YYYY HH:mm') ?? article.archivedAt : null,
    }
  }

  static createArticle(data: CreateArticleDto, files?: File[]): Promise<Article> {
    const formData = objectToFormData({ ...data }, files)
    return axios.post(ApiBaseUrl.Articles, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  static updateArticle(id: number, data: UpdateArticleDto, files?: File[]): Promise<Article> {
    const formData = objectToFormData({ ...data }, files)
    return axios.put(`${ApiBaseUrl.Articles}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  static deleteArticle(id: number): Promise<{ success: boolean; message: string }> {
    return axios.delete(`${ApiBaseUrl.Articles}/${id}`)
  }

  static closeArticle(id: number): Promise<Article> {
    return axios.post<Article, Article>(`${ApiBaseUrl.Articles}/${id}/close`, {})
  }

  static activateArticle(id: number): Promise<Article> {
    return axios.post<Article, Article>(`${ApiBaseUrl.Articles}/${id}/activate`, {})
  }

  static duplicateArticle(id: number): Promise<Article> {
    return axios.post<Article, Article>(`${ApiBaseUrl.Articles}/${id}/duplicate`, {})
  }

  static getArticleStatistics(id: number): Promise<ArticleStatistics> {
    return axios.get<ArticleStatistics, ArticleStatistics>(`${ApiBaseUrl.Articles}/${id}/statistics`)
  }

  static getUserArticlesAnalytics(userId: number): Promise<UserArticlesAnalytics> {
    return axios.get<UserArticlesAnalytics, UserArticlesAnalytics>(`${ApiBaseUrl.Articles}/users/${userId}/analytics`)
  }
}

