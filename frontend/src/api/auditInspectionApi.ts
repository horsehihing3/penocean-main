import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common'
import type {
  AuditInspectionDetail,
  AuditInspectionListParams,
  AuditInspectionPage,
  AuditInspectionPayload,
  AuditInspectionStatus,
} from '../types/auditInspection'

export const auditInspectionApi = {
  list: async (params: AuditInspectionListParams): Promise<AuditInspectionPage> => {
    const response = await axiosInstance.get<ApiResponse<AuditInspectionPage>>(
      '/audit-inspections',
      {
        params: {
          inspectionType: params.inspectionType || undefined,
          status: params.status || undefined,
          dateFrom: params.dateFrom || undefined,
          dateTo: params.dateTo || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      }
    )
    return response.data.data
  },

  detail: async (id: number): Promise<AuditInspectionDetail> => {
    const response = await axiosInstance.get<ApiResponse<AuditInspectionDetail>>(
      `/audit-inspections/${id}`
    )
    return response.data.data
  },

  create: async (payload: AuditInspectionPayload): Promise<{ id: number }> => {
    const response = await axiosInstance.post<ApiResponse<{ id: number }>>(
      '/audit-inspections',
      payload
    )
    return response.data.data
  },

  changeStatus: async (
    id: number,
    status: AuditInspectionStatus
  ): Promise<void> => {
    // 백엔드가 @RequestParam 으로 status 를 기대하므로 query string 으로 전송
    await axiosInstance.post<ApiResponse<void>>(
      `/audit-inspections/${id}/status`,
      null,
      { params: { status } }
    )
  },
}
