import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common'
import type {
  HealthCheckupDetail,
  HealthCheckupListParams,
  HealthCheckupPage,
  HealthCheckupPayload,
  HealthConsultation,
  HealthConsultationPayload,
  HealthTrend,
  HealthVital,
  HealthVitalPayload,
} from '../types/health'

export const healthApi = {
  list: async (params: HealthCheckupListParams): Promise<HealthCheckupPage> => {
    const response = await axiosInstance.get<ApiResponse<HealthCheckupPage>>(
      '/health/checkups',
      {
        params: {
          userId: params.userId ?? undefined,
          keyword: params.keyword || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      }
    )
    return response.data.data
  },

  detail: async (id: number): Promise<HealthCheckupDetail> => {
    const response = await axiosInstance.get<ApiResponse<HealthCheckupDetail>>(
      `/health/checkups/${id}`
    )
    return response.data.data
  },

  create: async (
    payload: HealthCheckupPayload,
    vital?: HealthVitalPayload,
    file?: File
  ): Promise<{ id: number }> => {
    const fd = new FormData()
    const body = { ...payload, vital }
    fd.append(
      'data',
      new Blob([JSON.stringify(body)], { type: 'application/json' })
    )
    if (file) {
      fd.append('file', file)
    }
    const response = await axiosInstance.post<ApiResponse<{ id: number }>>(
      '/health/checkups',
      fd,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    return response.data.data
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(`/health/checkups/${id}`)
  },

  addVital: async (
    checkupId: number,
    payload: HealthVitalPayload
  ): Promise<HealthVital> => {
    const response = await axiosInstance.post<ApiResponse<HealthVital>>(
      `/health/checkups/${checkupId}/vitals`,
      payload
    )
    return response.data.data
  },

  trends: async (userId: number, years = 3): Promise<HealthTrend> => {
    const response = await axiosInstance.get<ApiResponse<HealthTrend>>(
      '/health/trends',
      { params: { userId, years } }
    )
    return response.data.data
  },

  consultations: async (userId: number): Promise<HealthConsultation[]> => {
    const response = await axiosInstance.get<ApiResponse<HealthConsultation[]>>(
      '/health/consultations',
      { params: { userId } }
    )
    return response.data.data
  },

  createConsultation: async (
    payload: HealthConsultationPayload
  ): Promise<HealthConsultation> => {
    const response = await axiosInstance.post<ApiResponse<HealthConsultation>>(
      '/health/consultations',
      payload
    )
    return response.data.data
  },
}
