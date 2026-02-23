import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'

export interface Program {
  name: string
}

export interface ProgramsResponse {
  programs: Program[]
  totalCount: number
  lastSyncDate: string | null
}

export interface ProgramsStats {
  totalCount: number
}

export interface UpdateProgramsDto {
  programs: Program[]
}

export class ProgramsService {
  static getAll(): Promise<ProgramsResponse> {
    return axios.get<ProgramsResponse, ProgramsResponse>(ApiBaseUrl.Programs)
  }

  static getStats(): Promise<ProgramsStats> {
    return axios.get<ProgramsStats, ProgramsStats>(`${ApiBaseUrl.Programs}/stats`)
  }

  static syncWithDrive(): Promise<{ success: boolean; message: string }> {
    return axios.post<{ success: boolean; message: string }, { success: boolean; message: string }>(
      `${ApiBaseUrl.Programs}/sync-with-drive`
    )
  }

  static update(programs: Program[]): Promise<{ success: boolean; message: string }> {
    return axios.put<{ success: boolean; message: string }, { success: boolean; message: string }>(
      ApiBaseUrl.Programs,
      { programs }
    )
  }
}
