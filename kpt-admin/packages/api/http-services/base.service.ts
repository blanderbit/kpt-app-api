import { apiClient } from '../axios.config'
import { ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces'

export abstract class BaseService {
  protected baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  protected async get<T>(endpoint: string = '', params?: any): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}${endpoint}`, { params })
      return response.data
    } catch (error) {
      console.warn(`API not available for ${this.baseUrl}${endpoint}, using mock data:`, error)
      throw error
    }
  }

  protected async post<T>(endpoint: string = '', data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.post(`${this.baseUrl}${endpoint}`, data)
      return response.data
    } catch (error) {
      console.warn(`API not available for ${this.baseUrl}${endpoint}, using mock data:`, error)
      throw error
    }
  }

  protected async put<T>(endpoint: string = '', data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.put(`${this.baseUrl}${endpoint}`, data)
      return response.data
    } catch (error) {
      console.warn(`API not available for ${this.baseUrl}${endpoint}, using mock data:`, error)
      throw error
    }
  }

  protected async delete<T>(endpoint: string = ''): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}${endpoint}`)
      return response.data
    } catch (error) {
      console.warn(`API not available for ${this.baseUrl}${endpoint}, using mock data:`, error)
      throw error
    }
  }

  protected async getPaginated<T>(endpoint: string = '', params?: PaginationParams): Promise<PaginatedResponse<T>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}${endpoint}`, { params })
      return response.data
    } catch (error) {
      console.warn(`API not available for ${this.baseUrl}${endpoint}, using mock data:`, error)
      throw error
    }
  }
}
