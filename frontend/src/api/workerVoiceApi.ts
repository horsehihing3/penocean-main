import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common'
import type {
  WorkerVoiceCreatePayload,
  WorkerVoiceDetail,
  WorkerVoiceListParams,
  WorkerVoicePage,
  WorkerVoiceStatusPayload,
} from '../types/workerVoice'

export const workerVoiceApi = {
  list: async (params: WorkerVoiceListParams): Promise<WorkerVoicePage> => {
    const response = await axiosInstance.get<ApiResponse<WorkerVoicePage>>(
      '/worker-voices',
      {
        params: {
          voiceType: params.voiceType || undefined,
          status: params.status || undefined,
          keyword: params.keyword || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      }
    )
    return response.data.data
  },

  detail: async (id: number): Promise<WorkerVoiceDetail> => {
    const response = await axiosInstance.get<ApiResponse<WorkerVoiceDetail>>(
      `/worker-voices/${id}`
    )
    return response.data.data
  },

  create: async (payload: WorkerVoiceCreatePayload): Promise<{ id: number }> => {
    const response = await axiosInstance.post<ApiResponse<{ id: number }>>(
      '/worker-voices',
      payload
    )
    return response.data.data
  },

  updateStatus: async (
    id: number,
    payload: WorkerVoiceStatusPayload
  ): Promise<void> => {
    await axiosInstance.put<ApiResponse<void>>(`/worker-voices/${id}/status`, payload)
  },

  uploadAttachment: async (id: number, file: File): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)
    await axiosInstance.post<ApiResponse<void>>(
      `/worker-voices/${id}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  deleteAttachment: async (id: number, attachmentId: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(
      `/worker-voices/${id}/attachments/${attachmentId}`
    )
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(`/worker-voices/${id}`)
  },
}
