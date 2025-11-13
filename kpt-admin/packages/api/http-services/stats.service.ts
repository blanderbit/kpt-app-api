import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'

export interface ClientStaticFilterParams {
  dateFrom?: string
  dateTo?: string
  registrationMethod?: 'firebase' | 'email'
  age?: string
  socialNetworks?: string[]
  theme?: string
}

export interface MoodTrackerFilterParams extends ClientStaticFilterParams {
  days?: number
  moodType?: string
}

export interface ClientStaticCountResponse {
  count: number
}

export class StatsService {
  private static get baseUrl(): string {
    return `${ApiBaseUrl.Stats}/client-static`
  }

  static getRegisteredUsersCount(params?: ClientStaticFilterParams): Promise<ClientStaticCountResponse> {
    return axios.get<ClientStaticCountResponse, ClientStaticCountResponse>(`${this.baseUrl}/registered-users`, {
      params,
      paramsSerializer: {
        indexes: null,
      },
    })
  }

  static getInactiveUsersCount(params?: ClientStaticFilterParams): Promise<ClientStaticCountResponse> {
    return axios.get<ClientStaticCountResponse, ClientStaticCountResponse>(`${this.baseUrl}/inactive-users`, {
      params,
      paramsSerializer: {
        indexes: null,
      },
    })
  }

  static getSurveyRespondedUsersCount(params?: ClientStaticFilterParams): Promise<ClientStaticCountResponse> {
    return axios.get<ClientStaticCountResponse, ClientStaticCountResponse>(
      `${this.baseUrl}/survey-responded-users`,
      {
        params,
        paramsSerializer: {
          indexes: null,
        },
      },
    )
  }

  static getArticleVisitedUsersCount(params?: ClientStaticFilterParams): Promise<ClientStaticCountResponse> {
    return axios.get<ClientStaticCountResponse, ClientStaticCountResponse>(
      `${this.baseUrl}/article-visited-users`,
      {
        params,
        paramsSerializer: {
          indexes: null,
        },
      },
    )
  }

  static getMoodTrackedUsersCount(params?: MoodTrackerFilterParams): Promise<ClientStaticCountResponse> {
    return axios.get<ClientStaticCountResponse, ClientStaticCountResponse>(`${this.baseUrl}/mood-tracked-users`, {
      params,
      paramsSerializer: {
        indexes: null,
      },
    })
  }
}
