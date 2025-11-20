import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'
import { formatDateSafe } from '../utils/date'

export interface MoodSurvey {
  id: number
  title: string
  isArchived: boolean
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
  archivedBy?: string
  responsesCount: number
}

export interface CreateMoodSurveyDto {
  title: string
}

export interface UpdateMoodSurveyDto {
  title: string
}

export class MoodSurveysService {
  static async getAll(): Promise<MoodSurvey[]> {
    const data = await axios.get<MoodSurvey[], MoodSurvey[]>(ApiBaseUrl.MoodSurveys, {
      params: { isArchived: false },
    })
    return data.map(formatMoodSurvey)
  }

  static async getArchived(): Promise<MoodSurvey[]> {
     const data = await axios.get<MoodSurvey[], MoodSurvey[]>(ApiBaseUrl.MoodSurveys, {
       params: { isArchived: true },
     })
    return data.map(formatMoodSurvey)
  }

  static create(data: CreateMoodSurveyDto): Promise<MoodSurvey> {
    return axios.post<MoodSurvey, MoodSurvey>(ApiBaseUrl.MoodSurveys, data).then(formatMoodSurvey)
  }

  static update(id: number, data: UpdateMoodSurveyDto): Promise<MoodSurvey> {
    return axios.put<MoodSurvey, MoodSurvey>(`${ApiBaseUrl.MoodSurveys}/${id}`, data).then(formatMoodSurvey)
  }

  static archive(id: number): Promise<{ message: string }> {
    return axios.delete(`${ApiBaseUrl.MoodSurveys}/${id}`)
  }

  static restore(id: number): Promise<{ message: string }> {
    return axios.post(`${ApiBaseUrl.MoodSurveys}/${id}/restore`)
  }

  static getUserAnswersStats(userId: number): Promise<Record<string, number>> {
    return axios.get<Record<string, number>, Record<string, number>>(
      `${ApiBaseUrl.MoodSurveys}/user/${userId}/answers-stats`,
    )
  }
}

const formatMoodSurvey = (survey: MoodSurvey): MoodSurvey => {
  const responsesCount = survey.responsesCount ?? 0

  return {
    ...survey,
    responsesCount,
    createdAt: formatDateSafe(survey.createdAt, 'DD.MM.YYYY HH:mm') ?? survey.createdAt,
    updatedAt: formatDateSafe(survey.updatedAt, 'DD.MM.YYYY HH:mm') ?? survey.updatedAt,
    archivedAt: survey.archivedAt
      ? formatDateSafe(survey.archivedAt, 'DD.MM.YYYY HH:mm') ?? survey.archivedAt
      : undefined,
  }
}