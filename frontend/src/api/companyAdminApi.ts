import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common'
import type {
  Company,
  CompanyCreatePayload,
  CompanyListParams,
  CompanyPage,
  CompanyPayload,
} from '../types/company'

export const companyAdminApi = {
  list: async (params: CompanyListParams): Promise<CompanyPage> => {
    const response = await axiosInstance.get<ApiResponse<CompanyPage>>(
      '/admin/companies',
      {
        params: {
          keyword: params.keyword || undefined,
          industryCode: params.industryCode || undefined,
          status: params.status || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      }
    )
    return response.data.data
  },

  create: async (payload: CompanyCreatePayload): Promise<{ id: number }> => {
    const { data } = await axiosInstance.post<ApiResponse<{ id: number }>>(
      '/admin/companies',
      payload
    )
    return data.data
  },

  detail: async (id: number): Promise<Company> => {
    const response = await axiosInstance.get<ApiResponse<Company>>(
      `/admin/companies/${id}`
    )
    return response.data.data
  },

  update: async (id: number, payload: CompanyPayload): Promise<void> => {
    await axiosInstance.put<ApiResponse<void>>(
      `/admin/companies/${id}`,
      payload
    )
  },

  inactivate: async (id: number): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>(
      `/admin/companies/${id}/inactivate`
    )
  },
}
