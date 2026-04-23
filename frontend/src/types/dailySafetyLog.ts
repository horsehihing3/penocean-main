// Backend 계약: /api/daily-safety-logs
import type { PageResponse } from './common'

export type ReceivedVia = 'KAKAO' | 'EMAIL' | 'UPLOAD'

export interface DailySafetyLogResponse {
  id: number
  vesselId: number
  vesselName: string
  companyId: number
  companyName: string
  logDate: string
  representativeName: string
  attendeesCount: number
  trainingContent: string
  scannedFileUrl?: string
  receivedVia: ReceivedVia
  createdAt: string
}

export interface DailySafetyLogListParams {
  vesselId?: number
  dateFrom?: string
  dateTo?: string
  page?: number
  size?: number
}

export interface CreateDailySafetyLogPayload {
  vesselId: number
  companyId?: number
  logDate: string
  representativeName: string
  attendeesCount: number
  trainingContent: string
  receivedVia: ReceivedVia
}

export type DailySafetyLogPage = PageResponse<DailySafetyLogResponse>
