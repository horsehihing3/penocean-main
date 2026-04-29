import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common'
import type {
  SafetyPerformanceLandListParams,
  SafetyPerformanceLandPage,
  SafetyPerformanceLandUpsertPayload,
  SafetyPerformanceSeaListParams,
  SafetyPerformanceSeaPage,
  SafetyPerformanceSeaUpsertPayload,
  SeaCrewIncidentBulkPayload,
  SeaCrewIncidentListParams,
  SeaCrewIncidentPage,
  SeaYearlyStats,
} from '../types/safetyPerformance'

export const safetyPerformanceLandApi = {
  list: async (
    params: SafetyPerformanceLandListParams
  ): Promise<SafetyPerformanceLandPage> => {
    const response = await axiosInstance.get<ApiResponse<SafetyPerformanceLandPage>>(
      '/safety-performance/land',
      {
        params: {
          periodYear: params.periodYear ?? undefined,
          periodMonth: params.periodMonth ?? undefined,
          departmentId: params.departmentId ?? undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      }
    )
    return response.data.data
  },

  upsert: async (payload: SafetyPerformanceLandUpsertPayload): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>('/safety-performance/land', payload)
  },

  exportUrl: (periodYear?: number, periodMonth?: number): string => {
    const base = import.meta.env.VITE_API_URL || '/api'
    const qs = new URLSearchParams()
    if (periodYear != null) qs.set('year', String(periodYear))
    if (periodMonth != null) qs.set('month', String(periodMonth))
    const query = qs.toString()
    return `${base}/safety-performance/land/export${query ? `?${query}` : ''}`
  },
}

export const safetyPerformanceSeaApi = {
  list: async (
    params: SafetyPerformanceSeaListParams
  ): Promise<SafetyPerformanceSeaPage> => {
    const response = await axiosInstance.get<ApiResponse<SafetyPerformanceSeaPage>>(
      '/safety-performance/sea',
      {
        params: {
          periodYear: params.periodYear ?? undefined,
          periodMonth: params.periodMonth ?? undefined,
          vesselId: params.vesselId ?? undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      }
    )
    return response.data.data
  },

  upsert: async (payload: SafetyPerformanceSeaUpsertPayload): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>('/safety-performance/sea', payload)
  },

  importExcel: async (file: File): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)
    await axiosInstance.post<ApiResponse<void>>(
      '/safety-performance/sea/import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  // [2026-04-30] 연도별 집계 통계
  yearlyStats: async (years = 4): Promise<SeaYearlyStats[]> => {
    const res = await axiosInstance.get<ApiResponse<SeaYearlyStats[]>>(
      '/safety-performance/sea/yearly-stats',
      { params: { years } }
    )
    return res.data.data
  },
}

export const seaCrewIncidentApi = {
  list: async (
    params: SeaCrewIncidentListParams
  ): Promise<SeaCrewIncidentPage> => {
    const response = await axiosInstance.get<ApiResponse<SeaCrewIncidentPage>>(
      '/sea-crew-incidents',
      {
        params: {
          periodYear: params.periodYear ?? undefined,
          periodMonth: params.periodMonth ?? undefined,
          vesselId: params.vesselId ?? undefined,
          incidentType: params.incidentType || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      }
    )
    return response.data.data
  },

  bulkCreate: async (payload: SeaCrewIncidentBulkPayload): Promise<void> => {
    await axiosInstance.post<ApiResponse<void>>('/sea-crew-incidents/bulk', payload)
  },
}
