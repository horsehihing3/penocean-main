import axiosInstance from './axiosInstance'
import type { ApiResponse } from './types'
import type {
  ApprovalDetail,
  ApprovalListItem,
  ApprovalListParams,
  SimplePageResponse,
} from '../types/approval'

export const approvalApi = {
  list: async (params: ApprovalListParams): Promise<SimplePageResponse<ApprovalListItem>> => {
    const response = await axiosInstance.get<ApiResponse<SimplePageResponse<ApprovalListItem>>>(
      '/admin/approvals',
      {
        params: {
          status: params.status || undefined,
          keyword: params.keyword || undefined,
          companyName: params.companyName || undefined,
          businessNumber: params.businessNumber || undefined,
          dateFrom: params.dateFrom || undefined,
          dateTo: params.dateTo || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      }
    )
    return response.data.data
  },

  detail: async (userId: number): Promise<ApprovalDetail> => {
    const response = await axiosInstance.get<ApiResponse<ApprovalDetail>>(
      `/admin/approvals/${userId}`
    )
    return response.data.data
  },

  approve: async (userId: number): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>(`/admin/approvals/${userId}/approve`)
  },

  reject: async (userId: number, reason?: string): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>(`/admin/approvals/${userId}/reject`, {
      reason: reason || undefined,
    })
  },
}
