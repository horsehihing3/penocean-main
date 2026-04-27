import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common'
import type {
  SafetyRule,
  SafetyRuleListParams,
  SafetyRulePayload,
} from '../types/safetyRule'

export const safetyRuleApi = {
  list: async (params: SafetyRuleListParams): Promise<SafetyRule[]> => {
    const response = await axiosInstance.get<ApiResponse<SafetyRule[]>>(
      '/safety-rules',
      {
        params: {
          industryCode: params.industryCode || undefined,
        },
      }
    )
    return response.data.data
  },

  create: async (payload: SafetyRulePayload): Promise<{ id: number }> => {
    const response = await axiosInstance.post<ApiResponse<{ id: number }>>(
      '/safety-rules',
      payload
    )
    return response.data.data
  },

  update: async (id: number, payload: SafetyRulePayload): Promise<void> => {
    await axiosInstance.put<ApiResponse<void>>(`/safety-rules/${id}`, payload)
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(`/safety-rules/${id}`)
  },
}
