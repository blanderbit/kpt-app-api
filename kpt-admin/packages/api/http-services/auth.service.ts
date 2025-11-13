import { apiClient } from '../axios.config'
import { LoginRequest, AdminLoginResponse, AdminProfile } from '../interfaces'

export class AuthService {
  async login(credentials: LoginRequest): Promise<AdminLoginResponse> {
    return apiClient.post('/admin/login', credentials)
  }

  async getMe(): Promise<AdminProfile> {
    return apiClient.get('/admin/me')
  }

  async logout(): Promise<void> {
    await apiClient.post('/admin/logout')
  }
}

export const authService = new AuthService()
