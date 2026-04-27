import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common'
import type {
  EvaluationCreatePayload,
  EvaluationDetailResponse,
  EvaluationHistoryEntry,
  EvaluationItem,
  EvaluationItemReorderEntry,
  EvaluationItemSavePayload,
  EvaluationListParams,
  EvaluationPage,
  EvaluationReviewPayload,
  EvaluationUpdatePayload,
} from '../types/evaluation'

export const evaluationItemApi = {
  list: async (activeOnly = false): Promise<EvaluationItem[]> => {
    const response = await axiosInstance.get<ApiResponse<EvaluationItem[]>>(
      '/evaluation-items',
      { params: { activeOnly } }
    )
    return response.data.data
  },

  create: async (payload: EvaluationItemSavePayload): Promise<{ id: number }> => {
    const response = await axiosInstance.post<ApiResponse<{ id: number }>>(
      '/evaluation-items',
      payload
    )
    return response.data.data
  },

  update: async (id: number, payload: EvaluationItemSavePayload): Promise<void> => {
    await axiosInstance.put<ApiResponse<void>>(`/evaluation-items/${id}`, payload)
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(`/evaluation-items/${id}`)
  },

  reorder: async (items: EvaluationItemReorderEntry[]): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>('/evaluation-items/reorder', { items })
  },
}

export const evaluationApi = {
  list: async (params: EvaluationListParams): Promise<EvaluationPage> => {
    const response = await axiosInstance.get<ApiResponse<EvaluationPage>>(
      '/evaluations',
      {
        params: {
          status: params.status || undefined,
          companyId: params.companyId ?? undefined,
          periodYear: params.periodYear ?? undefined,
          periodHalf: params.periodHalf || undefined,
          keyword: params.keyword || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      }
    )
    return response.data.data
  },

  detail: async (id: number): Promise<EvaluationDetailResponse> => {
    const response = await axiosInstance.get<ApiResponse<EvaluationDetailResponse>>(
      `/evaluations/${id}`
    )
    return response.data.data
  },

  history: async (id: number): Promise<EvaluationHistoryEntry[]> => {
    const response = await axiosInstance.get<ApiResponse<EvaluationHistoryEntry[]>>(
      `/evaluations/${id}/history`
    )
    return response.data.data
  },

  create: async (payload: EvaluationCreatePayload): Promise<{ id: number }> => {
    const response = await axiosInstance.post<ApiResponse<{ id: number }>>(
      '/evaluations',
      payload
    )
    return response.data.data
  },

  update: async (id: number, payload: EvaluationUpdatePayload): Promise<void> => {
    await axiosInstance.put<ApiResponse<void>>(`/evaluations/${id}`, payload)
  },

  submit: async (id: number): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>(`/evaluations/${id}/submit`)
  },

  review: async (id: number, payload: EvaluationReviewPayload): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>(`/evaluations/${id}/review`, payload)
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(`/evaluations/${id}`)
  },

  uploadAttachment: async (
    id: number,
    file: File,
    itemId?: number
  ): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)
    if (itemId != null) formData.append('itemId', String(itemId))
    await axiosInstance.post<ApiResponse<void>>(
      `/evaluations/${id}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  deleteAttachment: async (id: number, attachmentId: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(
      `/evaluations/${id}/attachments/${attachmentId}`
    )
  },
}
