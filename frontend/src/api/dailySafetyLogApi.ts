import axiosInstance from './axiosInstance'
import type { ApiResponse } from './types'
import type {
  CreateDailySafetyLogPayload,
  DailySafetyLogListParams,
  DailySafetyLogPage,
  DailySafetyLogResponse,
} from '../types/dailySafetyLog'

export const dailySafetyLogApi = {
  list: async (params: DailySafetyLogListParams): Promise<DailySafetyLogPage> => {
    const response = await axiosInstance.get<ApiResponse<DailySafetyLogPage>>(
      '/daily-safety-logs',
      {
        params: {
          vesselId: params.vesselId ?? undefined,
          dateFrom: params.dateFrom || undefined,
          dateTo: params.dateTo || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      }
    )
    return response.data.data
  },

  detail: async (id: number): Promise<DailySafetyLogResponse> => {
    const response = await axiosInstance.get<ApiResponse<DailySafetyLogResponse>>(
      `/daily-safety-logs/${id}`
    )
    return response.data.data
  },

  create: async (payload: CreateDailySafetyLogPayload): Promise<{ id: number }> => {
    const response = await axiosInstance.post<ApiResponse<{ id: number }>>(
      '/daily-safety-logs',
      payload
    )
    return response.data.data
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(`/daily-safety-logs/${id}`)
  },
}
