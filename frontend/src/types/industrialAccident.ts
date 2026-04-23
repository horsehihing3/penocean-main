// Backend: /api/industrial-accidents
import type { PageResponse } from './common'

export type AccidentSeverity = 'MINOR' | 'SERIOUS' | 'FATAL'
export type AccidentType =
  | 'FALL'
  | 'STRUCK'
  | 'CUT'
  | 'BURN'
  | 'ELECTRIC'
  | 'OTHER'
export type VictimGender = 'MALE' | 'FEMALE'

export interface IndustrialAccidentListItem {
  id: number
  accidentNo: string
  companyName: string
  businessNumber: string
  vesselName?: string | null
  accidentDate: string
  accidentLocation: string
  victimName: string
  accidentType: AccidentType
  severity: AccidentSeverity
  createdAt: string
}

export interface IndustrialAccidentDetail extends IndustrialAccidentListItem {
  companyId: number
  vesselId?: number | null
  victimAge: number
  victimGender: VictimGender
  victimRole: string
  description: string
  treatmentDays: number
  absenceDays: number
  reportedBy: number
  reportedByName?: string | null
  reportedAt: string
  reportFileUrl?: string | null
}

export interface IndustrialAccidentPayload {
  companyId: number
  vesselId?: number | null
  accidentDate: string
  accidentLocation: string
  victimName: string
  victimAge: number
  victimGender: VictimGender
  victimRole: string
  accidentType: AccidentType
  severity: AccidentSeverity
  description: string
  treatmentDays: number
  absenceDays: number
}

export interface IndustrialAccidentListParams {
  companyId?: number
  businessNumber?: string
  severity?: AccidentSeverity | ''
  accidentType?: AccidentType | ''
  dateFrom?: string
  dateTo?: string
  page?: number
  size?: number
}

export type IndustrialAccidentPage = PageResponse<IndustrialAccidentListItem>
