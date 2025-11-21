import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'
import { formatDateSafe } from '../utils/date'
import type { PaginatedResponse } from '../interfaces'

export interface Client {
  id: number
  email: string
  firstName: string | null
  avatarUrl: string | null
  emailVerified: boolean
  theme: string
  language: string | null
  roles: string[]
  initSatisfactionLevel: number | null
  initHardnessLevel: number | null
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: number
  activityName: string
  activityType: string
  content: string | null
  position: number
  status: 'active' | 'closed'
  closedAt: string | null
  createdAt: string
  updatedAt: string
  userId: number
}

export interface ClientActivitiesResponse {
  activities: Activity[]
  date: string
}

export interface SuggestedActivity {
  id: number
  userId: number
  activityName: string
  activityType: string
  content: string
  reasoning: string | null
  confidenceScore: number
  isUsed: boolean
  suggestedDate: string
  usedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ClientSuggestedActivitiesResponse {
  suggestedActivities: SuggestedActivity[]
}

export interface MoodTracker {
  id: number
  moodType: string
  moodTypeDetails: unknown | null
  moodDate: string
  notes: string | null
  moodSurveys: unknown[]
  createdAt: string
  updatedAt: string
}

export interface ClientMoodTrackerMonthlyResponse {
  year: number
  month: number
  moodTrackers: MoodTracker[]
  totalDays: number
  trackedDays: number
}

export interface ClientAnalyticsResponse {
  totalTasks: number
  completedTasks: number
  taskCompletionRate: number
  averageSatisfaction: number | null
  averageHardness: number | null
  totalRateActivities: number
}

export interface ClientSurvey {
  id: number
  title: string
  description: string | null
  questions: unknown[] | null
  status: 'active' | 'archived' | 'available'
  createdBy: string | null
  updatedBy: string | null
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  archivedBy: string | null
  file?: ClientSurveyFile | null
}

export interface ClientSurveysResponse extends PaginatedResponse<ClientSurvey> {}

export interface ClientSurveyFile {
  id: number
  fileUrl: string
  fileKey: string
  fileName: string
  mimeType: string
  size: number
}

export interface ClientArticleFile {
  id: number
  fileUrl: string
  fileKey: string
  fileName: string
  mimeType: string
  size: number
}

export interface ClientArticle {
  id: number
  title: string
  text: string
  status: 'active' | 'archived' | 'available'
  files?: ClientArticleFile[]
  updatedBy: string | null
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  archivedBy: string | null
}

export interface ClientArticlesResponse extends PaginatedResponse<ClientArticle> {}

export interface ClientsPaginatedResponse {
  data: Client[]
  meta: {
    itemsPerPage: number
    totalItems: number
    currentPage: number
    totalPages: number
  }
  links?: {
    first?: string
    previous?: string | null
    current?: string
    next?: string | null
    last?: string
  }
}

export interface ClientsPaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  'filter.emailVerified'?: string
  'filter.firstName'?: string
  'filter.theme'?: string
  'filter.language'?: string
  'filter.initSatisfactionLevel'?: string
  'filter.initHardnessLevel'?: string
}

const formatClient = (client: Client): Client => ({
  ...client,
  createdAt: formatDateSafe(client.createdAt) ?? client.createdAt,
  updatedAt: formatDateSafe(client.updatedAt) ?? client.updatedAt,
})

const formatActivity = (activity: Activity): Activity => ({
  ...activity,
  createdAt: formatDateSafe(activity.createdAt) ?? activity.createdAt,
  updatedAt: formatDateSafe(activity.updatedAt) ?? activity.updatedAt,
  closedAt: activity.closedAt ? formatDateSafe(activity.closedAt) ?? activity.closedAt : activity.closedAt,
})

const formatSuggestedActivity = (activity: SuggestedActivity): SuggestedActivity => ({
  ...activity,
  suggestedDate: formatDateSafe(activity.suggestedDate) ?? activity.suggestedDate,
  usedAt: activity.usedAt ? formatDateSafe(activity.usedAt) ?? activity.usedAt : activity.usedAt,
  createdAt: formatDateSafe(activity.createdAt) ?? activity.createdAt,
  updatedAt: formatDateSafe(activity.updatedAt) ?? activity.updatedAt,
})

const formatMoodTracker = (tracker: MoodTracker): MoodTracker => ({
  ...tracker,
  moodDate: formatDateSafe(tracker.moodDate) ?? tracker.moodDate,
  createdAt: formatDateSafe(tracker.createdAt) ?? tracker.createdAt,
  updatedAt: formatDateSafe(tracker.updatedAt) ?? tracker.updatedAt,
})

const formatSurvey = (survey: ClientSurvey): ClientSurvey => ({
  ...survey,
  file: survey.file
    ? {
        ...survey.file,
        size: Number(survey.file.size ?? 0),
      }
    : null,
  createdAt: formatDateSafe(survey.createdAt) ?? survey.createdAt,
  updatedAt: formatDateSafe(survey.updatedAt) ?? survey.updatedAt,
  archivedAt: survey.archivedAt ? formatDateSafe(survey.archivedAt) ?? survey.archivedAt : survey.archivedAt,
})

const formatArticleFile = (file: ClientArticleFile): ClientArticleFile => ({
  ...file,
  size: Number(file.size ?? 0),
})

const formatArticle = (article: ClientArticle): ClientArticle => ({
  ...article,
  createdAt: formatDateSafe(article.createdAt) ?? article.createdAt,
  updatedAt: formatDateSafe(article.updatedAt) ?? article.updatedAt,
  archivedAt: article.archivedAt ? formatDateSafe(article.archivedAt) ?? article.archivedAt : article.archivedAt,
  files: article.files?.map(formatArticleFile),
})

export class ClientsService {
  static async getClients(params?: ClientsPaginationParams): Promise<PaginatedResponse<Client>> {
    const response = await axios.get<PaginatedResponse<Client>, PaginatedResponse<Client>>(ApiBaseUrl.Clients, {
      params,
    })
    return {
      ...response,
      data: response.data.map(formatClient),
    }
  }

  static async getClient(id: number): Promise<Client> {
    const client = await axios.get<Client, Client>(`${ApiBaseUrl.Clients}/${id}`)
    return formatClient(client)
  }

  static async getClientActivities(id: number, date: string): Promise<ClientActivitiesResponse> {
    const response = await axios.get<ClientActivitiesResponse, ClientActivitiesResponse>(
      `${ApiBaseUrl.Clients}/${id}/activities`,
      {
        params: { date },
      },
    )
    return {
      ...response,
      activities: response.activities.map(formatActivity),
    }
  }

  static async getClientSuggestedActivities(id: number): Promise<ClientSuggestedActivitiesResponse> {
    const response = await axios.get<ClientSuggestedActivitiesResponse, ClientSuggestedActivitiesResponse>(
      `${ApiBaseUrl.Clients}/${id}/suggested-activities`,
    )
    return {
      ...response,
      suggestedActivities: response.suggestedActivities.map(formatSuggestedActivity),
    }
  }

  static async getClientMoodTrackerMonthly(
    id: number,
    year: number,
    month: number,
  ): Promise<ClientMoodTrackerMonthlyResponse> {
    const response = await axios.get<ClientMoodTrackerMonthlyResponse, ClientMoodTrackerMonthlyResponse>(
      `${ApiBaseUrl.Clients}/${id}/mood-tracker/monthly`,
      {
        params: { year, month },
      },
    )
    return {
      ...response,
      moodTrackers: response.moodTrackers.map(formatMoodTracker),
    }
  }

  static async getClientAnalytics(id: number): Promise<ClientAnalyticsResponse> {
    return axios.get<ClientAnalyticsResponse, ClientAnalyticsResponse>(`${ApiBaseUrl.Clients}/${id}/analytics`)
  }

  static async getClientSurveys(
    id: number,
    params?: { page?: number; limit?: number },
  ): Promise<ClientSurveysResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.limit) queryParams.append('limit', String(params.limit))
    
    const url = `${ApiBaseUrl.Clients}/${id}/surveys${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axios.get<ClientSurveysResponse, ClientSurveysResponse>(url)
    return {
      ...response,
      data: response.data.map(formatSurvey),
    }
  }

  static async getClientArticles(
    id: number,
    params?: { page?: number; limit?: number },
  ): Promise<ClientArticlesResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.limit) queryParams.append('limit', String(params.limit))
    
    const url = `${ApiBaseUrl.Clients}/${id}/articles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axios.get<ClientArticlesResponse, ClientArticlesResponse>(url)
    return {
      ...response,
      data: response.data.map(formatArticle),
    }
  }
}
