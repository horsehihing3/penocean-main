import axiosInstance from './axiosInstance'
import type { ApiResponse } from './types'
import type {
  VisitPermitListParams,
  VisitPermitPage,
  VisitPermitQrResponse,
  VisitPermitResponse,
} from '../types/visitPermit'

export const visitPermitApi = {
  list: async (params: VisitPermitListParams): Promise<VisitPermitPage> => {
    const response = await axiosInstance.get<ApiResponse<VisitPermitPage>>(
      '/visit-permits',
      {
        params: {
          companyId: params.companyId ?? undefined,
          validFrom: params.validFrom || undefined,
          validTo: params.validTo || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      }
    )
    return response.data.data
  },

  detail: async (id: number): Promise<VisitPermitResponse> => {
    const response = await axiosInstance.get<ApiResponse<VisitPermitResponse>>(
      `/visit-permits/${id}`
    )
    return response.data.data
  },

  byAccessRequest: async (accessRequestId: number): Promise<VisitPermitResponse> => {
    const response = await axiosInstance.get<ApiResponse<VisitPermitResponse>>(
      `/visit-permits/by-access-request/${accessRequestId}`
    )
    return response.data.data
  },

  revoke: async (id: number, reason?: string): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>(`/visit-permits/${id}/revoke`, {
      reason: reason || undefined,
    })
  },

  getQr: async (id: number): Promise<VisitPermitQrResponse> => {
    const response = await axiosInstance.get<ApiResponse<VisitPermitQrResponse>>(
      `/visit-permits/${id}/qr`
    )
    return response.data.data
  },
}
