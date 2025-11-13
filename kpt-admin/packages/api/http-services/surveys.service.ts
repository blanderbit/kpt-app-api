import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'
import { formatDateSafe } from '../utils/date'
import type { PaginatedResponse } from '../interfaces/pagination'
import { objectToFormData } from '../utils/form-data'

export interface Survey {
  id: number
  title: string
  description: string | null
  questions: SurveyQuestion[] | null
  status: 'active' | 'archived' | 'available'
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  archivedAt?: string | null
  archivedBy?: string | null
  isCompleted?: boolean
  file?: SurveyFile | null
}

export interface SurveyQuestion {
  id: string
  text: string
  type: 'single' | 'multiple' | 'text'
  options: {
    id: string
    text: string
  }[]
}

export interface SurveyQuestionOption {
  id: string
  text: string
}

export interface SurveyAnswerStatistic {
  value: string
  label: string
  count: number
  percentage: number
}

export interface SurveyQuestionStatistic {
  questionId: string
  questionText: string
  type: 'single' | 'multiple' | 'text'
  answers: SurveyAnswerStatistic[]
}

export interface SurveyStatistics {
  surveyId: number
  title: string
  totalResponses: number
  respondedUsers: number
  activeAssignments: number
  questionStats: SurveyQuestionStatistic[]
}

export interface SurveyFile {
  id: number
  fileUrl: string
  fileKey: string
  fileName: string
  mimeType: string
  size: number
}

export interface CreateSurveyDto {
  title: string
  description?: string
  questions?: SurveyQuestion[]
}

export interface UpdateSurveyDto {
  title?: string
  description?: string
  questions?: SurveyQuestion[]
  removeFileId?: number
}

export type PaginatedSurveys = PaginatedResponse<Survey>

export class SurveysService {
  static async getSurveys(params?: Record<string, unknown>): Promise<PaginatedSurveys> {
    const response = await axios.get<PaginatedSurveys, PaginatedSurveys>(ApiBaseUrl.Surveys, {
      params,
    })

    return {
      ...response,
      data: response.data.map(formatSurvey),
    }
  }

  static async getSurveyById(id: number): Promise<Survey> {
    const survey = await axios.get<Survey, Survey>(`${ApiBaseUrl.Surveys}/${id}`)
    return formatSurvey(survey)
  }

  static async createSurvey(data: CreateSurveyDto, file?: File): Promise<Survey> {
    const formData = buildSurveyFormData(data, file)
    const survey = await axios.post<Survey, Survey>(ApiBaseUrl.Surveys, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return formatSurvey(survey)
  }

  static async updateSurvey(id: number, data: UpdateSurveyDto, file?: File): Promise<Survey> {
    const formData = buildSurveyFormData(data, file)
    const survey = await axios.put<Survey, Survey>(`${ApiBaseUrl.Surveys}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return formatSurvey(survey)
  }

  static async deleteSurvey(id: number): Promise<{ success: boolean; message: string }> {
    return axios.delete<{ success: boolean; message: string }, { success: boolean; message: string }>(
      `${ApiBaseUrl.Surveys}/${id}`,
    )
  }

  static async getSurveyStatistics(id: number): Promise<SurveyStatistics> {
    return axios.get<SurveyStatistics, SurveyStatistics>(`${ApiBaseUrl.Surveys}/${id}/statistics`)
  }

  static async closeSurvey(id: number): Promise<Survey> {
    const survey = await axios.post<Survey, Survey>(`${ApiBaseUrl.Surveys}/${id}/close`)
    return formatSurvey(survey)
  }

  static async duplicateSurvey(id: number): Promise<Survey> {
    const survey = await axios.post<Survey, Survey>(`${ApiBaseUrl.Surveys}/${id}/duplicate`)
    return formatSurvey(survey)
  }

  static async activateSurvey(id: number): Promise<Survey> {
    const survey = await axios.post<Survey, Survey>(`${ApiBaseUrl.Surveys}/${id}/activate`)
    return formatSurvey(survey)
  }
}

const formatSurvey = (survey: Survey): Survey => ({
  ...survey,
  createdAt: formatDateSafe(survey.createdAt) ?? survey.createdAt,
  updatedAt: formatDateSafe(survey.updatedAt) ?? survey.updatedAt,
  archivedAt: survey.archivedAt ? formatDateSafe(survey.archivedAt) ?? survey.archivedAt : survey.archivedAt,
})

const buildSurveyFormData = (
  data: CreateSurveyDto | UpdateSurveyDto,
  file?: File,
): FormData => {
  const formData = new FormData()

  if ('title' in data && data.title !== undefined) {
    formData.append('title', data.title)
  }

  if ('description' in data && data.description !== undefined) {
    formData.append('description', data.description ?? '')
  }

  if ('questions' in data && data.questions !== undefined) {
    formData.append('questions', JSON.stringify(data.questions))
  }

  if ('removeFileId' in data && typeof data.removeFileId === 'number') {
    formData.append('removeFileId', String(data.removeFileId))
  }

  if (file) {
    formData.append('file', file)
  }

  return formData
}

