import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'
import type { PaginationLinks, PaginationMeta } from '../interfaces'

export interface User {
  id: number
  email: string
  firstName: string
  avatarUrl: string | null
  emailVerified: boolean
  googleId: string | null
  firebaseUid: string | null
  appleId: string | null
  theme: string
  roles: string
  createdAt: string
  updatedAt: string
}

export interface AdminUsersStats {
  totalUsers: number
  verifiedUsers: number
  unverifiedUsers: number
  usersThisMonth: number
  usersLastMonth: number
}

export interface AdminAdminsStats {
  totalAdmins: number
}

export interface UsersResponse {
  data: User[]
  meta: PaginationMeta
  links?: PaginationLinks
}

export interface AdminUsersFilters {
  roles?: string
  emailVerified?: boolean
  page?: number
  limit?: number
}

export class AdminsService {
  static getUsers(filters?: AdminUsersFilters): Promise<UsersResponse> {
    const params: Record<string, unknown> = {}

    if (filters?.roles) {
      params['filter.roles'] = filters.roles
    }
    if (filters?.emailVerified !== undefined) {
      params['filter.emailVerified'] = filters.emailVerified
    }
    if (filters?.page) {
      params.page = filters.page
    }
    if (filters?.limit) {
      params.limit = filters.limit
    }

    return axios.get(`${ApiBaseUrl.Admins}/users`, { params })
  }

  static getUsersStats(): Promise<AdminUsersStats> {
    return axios.get(`${ApiBaseUrl.Admins}/stats/users`)
  }

  static getAdminsStats(): Promise<AdminAdminsStats> {
    return axios.get(`${ApiBaseUrl.Admins}/stats/admins`)
  }
}