import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common'
import type {
  IndustrialAccidentDetail,
  IndustrialAccidentListParams,
  IndustrialAccidentPage,
  IndustrialAccidentPayload,
} from '../types/industrialAccident'

export const industrialAccidentApi = {
  list: async (
    params: IndustrialAccidentListParams
  ): Promise<IndustrialAccidentPage> => {
    const response = await axiosInstance.get<ApiResponse<IndustrialAccidentPage>>(
      '/industrial-accidents',
      {
        params: {
          companyId: params.companyId ?? undefined,
          businessNumber: params.businessNumber || undefined,
          severity: params.severity || undefined,
          accidentType: params.accidentType || undefined,
          dateFrom: params.dateFrom || undefined,
          dateTo: params.dateTo || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      }
    )
    return response.data.data
  },

  detail: async (id: number): Promise<IndustrialAccidentDetail> => {
    const response = await axiosInstance.get<ApiResponse<IndustrialAccidentDetail>>(
      `/industrial-accidents/${id}`
    )
    return response.data.data
  },

  create: async (
    payload: IndustrialAccidentPayload
  ): Promise<{ id: number }> => {
    const response = await axiosInstance.post<ApiResponse<{ id: number }>>(
      '/industrial-accidents',
      payload
    )
    return response.data.data
  },

  update: async (id: number, payload: IndustrialAccidentPayload): Promise<void> => {
    await axiosInstance.put<ApiResponse<void>>(
      `/industrial-accidents/${id}`,
      payload
    )
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(`/industrial-accidents/${id}`)
  },
}
