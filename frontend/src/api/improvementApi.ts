import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common'
import type {
  ImprovementCreatePayload,
  ImprovementListParams,
  ImprovementPage,
  ImprovementRespondPayload,
} from '../types/evaluation'

export const improvementApi = {
  list: async (params: ImprovementListParams): Promise<ImprovementPage> => {
    const response = await axiosInstance.get<ApiResponse<ImprovementPage>>(
      '/evaluation-improvements',
      {
        params: {
          evaluationId: params.evaluationId ?? undefined,
          status: params.status || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      }
    )
    return response.data.data
  },

  create: async (payload: ImprovementCreatePayload): Promise<{ id: number }> => {
    const response = await axiosInstance.post<ApiResponse<{ id: number }>>(
      '/evaluation-improvements',
      payload
    )
    return response.data.data
  },

  respond: async (id: number, payload: ImprovementRespondPayload): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>(
      `/evaluation-improvements/${id}/respond`,
      payload
    )
  },

  close: async (id: number): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>(`/evaluation-improvements/${id}/close`)
  },
}
