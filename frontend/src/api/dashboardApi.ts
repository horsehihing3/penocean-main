import axiosInstance from './axiosInstance'
import type { ApiResponse } from './types'
import type { DashboardSummary } from '../types/dashboard'

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await axiosInstance.get<ApiResponse<DashboardSummary>>('/dashboard/summary')
    return response.data.data
  },
}
