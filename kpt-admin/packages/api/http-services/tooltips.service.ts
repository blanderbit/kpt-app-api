import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'
import { formatDateSafe } from '../utils/date'

export type TooltipType = 'swipe' | 'text' | 'textWithLink'
export type TooltipPage = string

export interface TooltipLink {
  label: string
  url: string
}

export interface TextTooltipJson {
  title: string
  description: string
  link?: TooltipLink
  [key: string]: unknown
}

export interface SwipeSlideJson {
  title: string
  description: string
  link?: TooltipLink
  [key: string]: unknown
}

export interface SwipeTooltipJson {
  title: string
  description?: string
  steps?: SwipeSlideJson[]
  slides?: SwipeSlideJson[]
  [key: string]: unknown
}

export type TooltipJson = TextTooltipJson | SwipeTooltipJson

export interface Tooltip {
  id: number
  type: TooltipType
  page: TooltipPage
  json: TooltipJson
  language: string | null
  createdAt: string
  updatedAt: string
  closedCount?: number
}

export interface SearchTooltipParams {
  type?: TooltipType
  page?: TooltipPage
  language?: string
}

export interface CreateTooltipPayload {
  type: TooltipType
  page: TooltipPage
  json: TooltipJson
  language?: string
}

export type UpdateTooltipPayload = CreateTooltipPayload

export interface TooltipTableItem extends Tooltip {
  title: string
  description: string
  updatedAtFormatted: string
}

const extractTitle = (json: TooltipJson | undefined): string => {
  if (!json || typeof json !== 'object') return ''
  if ('title' in json && typeof json.title === 'string') return json.title
  return ''
}

const extractDescription = (json: TooltipJson | undefined): string => {
  if (!json || typeof json !== 'object') return ''
  if ('description' in json && typeof json.description === 'string') {
    return json.description
  }
  if ('description' in json && typeof (json as TextTooltipJson).description === 'string') {
    return (json as TextTooltipJson).description
  }
  const swipe = json as SwipeTooltipJson
  const slides = (swipe.slides ?? swipe.steps) ?? []
  if (Array.isArray(slides) && slides.length && typeof slides[0]?.description === 'string') {
    return slides[0].description
  }
  return ''
}

export class TooltipsService {
  private static readonly baseUrl = ApiBaseUrl.Tooltips

  static async getTooltips(params?: SearchTooltipParams): Promise<Tooltip[]> {
    return axios.get<Tooltip[], Tooltip[]>(this.baseUrl, { params })
  }

  static async getTooltipTableItems(params?: SearchTooltipParams): Promise<TooltipTableItem[]> {
    const tooltips = await this.getTooltips(params)
    return tooltips.map((tooltip) => ({
      ...tooltip,
      title: extractTitle(tooltip.json),
      description: extractDescription(tooltip.json),
      updatedAtFormatted: formatDateSafe(tooltip.updatedAt, 'DD.MM.YYYY HH:mm') ?? tooltip.updatedAt,
    }))
  }

  static getTooltip(id: number): Promise<Tooltip> {
    return axios.get<Tooltip, Tooltip>(`${this.baseUrl}/${id}`)
  }

  static createTooltip(payload: CreateTooltipPayload): Promise<Tooltip> {
    return axios.post<Tooltip, Tooltip>(this.baseUrl, payload)
  }

  static updateTooltip(id: number, payload: UpdateTooltipPayload): Promise<Tooltip> {
    return axios.patch<Tooltip, Tooltip>(`${this.baseUrl}/${id}`, payload)
  }

  static deleteTooltip(id: number): Promise<void> {
    return axios.delete<void, void>(`${this.baseUrl}/${id}`)
  }

  static getTooltipTypes(): Promise<TooltipType[]> {
    return axios.get<TooltipType[], TooltipType[]>(`${this.baseUrl}/types`)
  }

  static getPages(): Promise<TooltipPage[]> {
    return axios.get<TooltipPage[], TooltipPage[]>(`${this.baseUrl}/pages`)
  }

  static getClosedTooltipsByUserId(userId: number): Promise<Tooltip[]> {
    return axios.get<Tooltip[], Tooltip[]>(`${this.baseUrl}/user/${userId}/closed`)
  }
}
