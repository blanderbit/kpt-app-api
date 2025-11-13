export * from './pagination'

// Common interfaces
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: number
  success: boolean
}

export interface PaginationParams {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ErrorResponse {
  message: string
  code: string
  details?: any
  status: number
}

// Auth interfaces
export interface LoginRequest {
  email: string
  password: string
}

export interface AdminProfile {
  id: number
  email: string
  firstName?: string | null
  avatarUrl?: string | null
  emailVerified: boolean
  roles: string[]
  createdAt: string
  updatedAt: string
}

export interface AdminLoginResponse {
  accessToken: string
  admin: AdminProfile
}

export interface LoginResponse {
  token: string
  user: User
  refreshToken: string
}

export interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

// Client interfaces
export interface Client {
  id: number
  name: string
  email: string
  phone?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface CreateClientRequest {
  name: string
  email: string
  phone?: string
  status?: 'active' | 'inactive'
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  id: number
}

// Admin interfaces
export interface Admin {
  id: number
  name: string
  email: string
  role: 'Super Admin' | 'Admin' | 'Moderator'
  status: 'active' | 'inactive'
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface CreateAdminRequest {
  name: string
  email: string
  role: 'Super Admin' | 'Admin' | 'Moderator'
  password: string
  status?: 'active' | 'inactive'
}

export interface UpdateAdminRequest extends Partial<CreateAdminRequest> {
  id: number
}

// Statistics interfaces
export interface UserStats {
  totalUsers: number
  activeUsers: number
  newThisMonth: number
  conversionRate: number
}

export interface Activity {
  id: number
  title: string
  description: string
  value: string
  color: string
}

// Queue interfaces
export interface QueueItem {
  id: number
  type: string
  priority: 'High' | 'Medium' | 'Low'
  createdAt: string
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed'
}

// Language interfaces
export interface Language {
  id: number
  name: string
  code: string
  flag: string
  isActive: boolean
  translationCount: number
}

// Tooltip interfaces
export interface Tooltip {
  id: number
  key: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right'
  isActive: boolean
}

// Mood Type interfaces
export interface MoodType {
  id: number
  name: string
  icon: string
  color: string
  description: string
  sortOrder: number
  isActive: boolean
}

// Activity Type interfaces
export interface ActivityType {
  id: number
  name: string
  icon: string
  color: string
  category: string
  description: string
  duration: number
  sortOrder: number
  isActive: boolean
}

// Mood Survey interfaces
export interface MoodSurvey {
  id: number
  title: string
  description: string
  type: 'Daily' | 'Weekly' | 'Monthly' | 'Custom'
  frequency: number
  responseCount: number
  isActive: boolean
}

export interface SurveyResponse {
  id: number
  userName: string
  response: string
  score: number
  createdAt: string
}

// Backup interfaces
export interface Backup {
  id: number
  name: string
  size: number
  status: 'Completed' | 'In Progress' | 'Failed'
  createdAt: string
}

export interface BackupSettings {
  autoBackup: boolean
  frequency: number
  retentionDays: number
}



