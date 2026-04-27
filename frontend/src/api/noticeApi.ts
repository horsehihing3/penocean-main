import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common'
import type {
  NoticeDetail,
  NoticeListParams,
  NoticePage,
  NoticePayload,
} from '../types/notice'

export const noticeApi = {
  list: async (params: NoticeListParams): Promise<NoticePage> => {
    const response = await axiosInstance.get<ApiResponse<NoticePage>>('/notices', {
      params: {
        category: params.category || undefined,
        keyword: params.keyword || undefined,
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    })
    return response.data.data
  },

  detail: async (id: number): Promise<NoticeDetail> => {
    const response = await axiosInstance.get<ApiResponse<NoticeDetail>>(
      `/notices/${id}`
    )
    return response.data.data
  },

  create: async (payload: NoticePayload): Promise<{ id: number }> => {
    const response = await axiosInstance.post<ApiResponse<{ id: number }>>(
      '/notices',
      payload
    )
    return response.data.data
  },

  update: async (id: number, payload: NoticePayload): Promise<void> => {
    await axiosInstance.put<ApiResponse<void>>(`/notices/${id}`, payload)
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(`/notices/${id}`)
  },

  pin: async (id: number): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>(`/notices/${id}/pin`)
  },

  unpin: async (id: number): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>(`/notices/${id}/unpin`)
  },
}
