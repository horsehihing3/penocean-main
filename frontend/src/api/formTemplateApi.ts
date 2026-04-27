import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common'
import type {
  FormTemplate,
  FormTemplateListParams,
  FormTemplatePage,
} from '../types/formTemplate'

interface CreateFormTemplateInput {
  code: string
  category: string
  title: string
  description?: string
  version: string
}

export const formTemplateApi = {
  list: async (params: FormTemplateListParams): Promise<FormTemplatePage> => {
    const response = await axiosInstance.get<ApiResponse<FormTemplatePage>>(
      '/form-templates',
      {
        params: {
          category: params.category || undefined,
          keyword: params.keyword || undefined,
          page: params.page ?? 0,
          size: params.size ?? 40,
        },
      }
    )
    return response.data.data
  },

  detail: async (id: number): Promise<FormTemplate> => {
    const response = await axiosInstance.get<ApiResponse<FormTemplate>>(
      `/form-templates/${id}`
    )
    return response.data.data
  },

  create: async (
    payload: CreateFormTemplateInput,
    file: File
  ): Promise<{ id: number }> => {
    const fd = new FormData()
    fd.append(
      'data',
      new Blob([JSON.stringify(payload)], { type: 'application/json' })
    )
    fd.append('file', file)
    const response = await axiosInstance.post<ApiResponse<{ id: number }>>(
      '/form-templates',
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(`/form-templates/${id}`)
  },
}
