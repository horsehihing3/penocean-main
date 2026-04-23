import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common'
import type { SomCompanyLookup } from '../types/som'

export const somApi = {
  lookup: async (businessNumber: string): Promise<SomCompanyLookup | null> => {
    const normalized = businessNumber.replace(/[^0-9]/g, '')
    const response = await axiosInstance.get<ApiResponse<SomCompanyLookup | null>>(
      `/som/lookup/${encodeURIComponent(normalized)}`
    )
    return response.data.data
  },
}
