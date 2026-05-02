import axiosInstance from './axiosInstance'
import type { ApiResponse } from './types'
import type {
  AccessRequestDetailResponse,
  AccessRequestListParams,
  AccessRequestPage,
  AddWorkersPayload,
  AttachmentType,
  CreateAccessRequestPayload,
  ReviewPayload,
  UpdateAccessRequestPayload,
} from '../types/accessRequest'

export const accessRequestApi = {
  list: async (params: AccessRequestListParams): Promise<AccessRequestPage> => {
    const response = await axiosInstance.get<ApiResponse<AccessRequestPage>>(
      '/access-requests',
      {
        params: {
          status: params.status || undefined,
          companyId: params.companyId ?? undefined,
          vesselId: params.vesselId ?? undefined,
          keyword: params.keyword || undefined,
          dateFrom: params.dateFrom || undefined,
          dateTo: params.dateTo || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      }
    )
    return response.data.data
  },

  detail: async (id: number): Promise<AccessRequestDetailResponse> => {
    const response = await axiosInstance.get<ApiResponse<AccessRequestDetailResponse>>(
      `/access-requests/${id}`
    )
    return response.data.data
  },

  create: async (payload: CreateAccessRequestPayload): Promise<{ id: number }> => {
    const response = await axiosInstance.post<ApiResponse<{ id: number }>>(
      '/access-requests',
      payload
    )
    return response.data.data
  },

  update: async (id: number, payload: UpdateAccessRequestPayload): Promise<void> => {
    await axiosInstance.put<ApiResponse<void>>(`/access-requests/${id}`, payload)
  },

  submit: async (id: number): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>(`/access-requests/${id}/submit`)
  },

  review: async (id: number, payload: ReviewPayload): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>(`/access-requests/${id}/review`, payload)
  },

  addWorkers: async (id: number, payload: AddWorkersPayload): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>(`/access-requests/${id}/workers`, payload)
  },

  uploadWorkerExcel: async (id: number, file: File): Promise<{ imported: number }> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await axiosInstance.post<ApiResponse<{ imported: number }>>(
      `/access-requests/${id}/workers/excel`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data.data
  },

  parseWorkerExcel: async (
    file: File
  ): Promise<Array<{
    workerName: string
    workerRole?: string | null
    workerBirth?: string | null
    workerPhone?: string | null
  }>> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await axiosInstance.post<ApiResponse<Array<{
      workerName: string
      workerRole?: string | null
      workerBirth?: string | null
      workerPhone?: string | null
    }>>>(
      '/access-requests/workers/excel/parse',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data.data
  },

  downloadWorkerExcelTemplate: async (): Promise<Blob> => {
    const { data } = await axiosInstance.get(
      '/access-requests/workers/excel-template',
      { responseType: 'blob' }
    )
    return data as Blob
  },

  uploadAttachment: async (
    id: number,
    file: File,
    attachmentType: AttachmentType
  ): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('attachmentType', attachmentType)
    await axiosInstance.post<ApiResponse<void>>(
      `/access-requests/${id}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  deleteAttachment: async (id: number, attachmentId: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(
      `/access-requests/${id}/attachments/${attachmentId}`
    )
  },

  generateUploadToken: async (id: number): Promise<string> => {
    const { data } = await axiosInstance.post<ApiResponse<{ token: string }>>(
      `/access-requests/${id}/upload-token`
    )
    return data.data.token
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(`/access-requests/${id}`)
  },

  clone: async (id: number): Promise<{ id: number }> => {
    const { data } = await axiosInstance.post<ApiResponse<{ id: number }>>(
      `/access-requests/${id}/clone`
    )
    return data.data
  },

  setWorkerCheckByShip: async (workerId: number, checked: boolean): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>(
      `/access-requests/workers/${workerId}/check-by-ship`,
      null,
      { params: { checked } }
    )
  },
}
