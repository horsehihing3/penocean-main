import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common'

export interface VesselLookupItem {
  id: number
  code?: string | null
  name: string
  imoNumber?: string | null
  flag?: string | null
  vesselType?: string | null
  status?: string | null
  currentPort?: string | null
}

export interface PortLookupItem {
  id: number
  code: string
  name: string
  country?: string | null
}

export const lookupApi = {
  vessels: async (): Promise<VesselLookupItem[]> => {
    const { data } = await axiosInstance.get<ApiResponse<VesselLookupItem[]>>('/lookup/vessels')
    return data.data
  },
  ports: async (): Promise<PortLookupItem[]> => {
    const { data } = await axiosInstance.get<ApiResponse<PortLookupItem[]>>('/lookup/ports')
    return data.data
  },
}
