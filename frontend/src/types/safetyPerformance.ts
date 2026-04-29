// Backend: /api/safety-performance/{land,sea}, /api/sea-crew-incidents
import type { PageResponse } from './common'

// ---------- Land ----------

export interface SafetyPerformanceLand {
  id: number
  departmentId: number
  departmentName?: string | null
  periodYear: number
  periodMonth: number
  manhours: number
  accidentCount: number
  lostTimeCount: number
  fatalityCount: number
  trir: number
  ltir: number
  budgetPlanned: number
  budgetUsed: number
  fcmProjectCode?: string | null
  vbpProjectCode?: string | null
  comment?: string | null
}

export interface SafetyPerformanceLandUpsertPayload {
  departmentId: number
  periodYear: number
  periodMonth: number
  manhours: number
  accidentCount: number
  lostTimeCount: number
  fatalityCount: number
  budgetPlanned: number
  budgetUsed: number
  fcmProjectCode?: string
  vbpProjectCode?: string
  comment?: string
}

export interface SafetyPerformanceLandListParams {
  periodYear?: number
  periodMonth?: number
  departmentId?: number
  page?: number
  size?: number
}

export type SafetyPerformanceLandPage = PageResponse<SafetyPerformanceLand>

// ---------- Sea (monthly) ----------

export interface SafetyPerformanceSea {
  id: number
  vesselId: number
  vesselName?: string | null
  periodYear: number
  periodMonth: number
  crewCount: number
  illnessCount: number
  injuryCount: number
  evacuationCount: number
  sickLeaveDays: number
  posSmSyncedAt?: string | null
  comment?: string | null
}

export interface SafetyPerformanceSeaUpsertPayload {
  vesselId: number
  periodYear: number
  periodMonth: number
  crewCount: number
  illnessCount: number
  injuryCount: number
  evacuationCount: number
  sickLeaveDays: number
  comment?: string
}

export interface SafetyPerformanceSeaListParams {
  periodYear?: number
  periodMonth?: number
  vesselId?: number
  page?: number
  size?: number
}

export type SafetyPerformanceSeaPage = PageResponse<SafetyPerformanceSea>

// ---------- Sea crew incidents ----------

export type SeaCrewIncidentType = 'ILLNESS' | 'INJURY'

export interface SeaCrewIncident {
  id: number
  vesselId: number
  vesselName?: string | null
  periodYear: number
  periodMonth: number
  crewName: string
  crewRole: string
  incidentType: SeaCrewIncidentType
  incidentDate: string
  diagnosis: string
  evacuationRequired: boolean
  returnToDutyDate?: string | null
}

export interface SeaCrewIncidentBulkPayload {
  items: Omit<SeaCrewIncident, 'id' | 'vesselName'>[]
}

export interface SeaCrewIncidentListParams {
  periodYear?: number
  periodMonth?: number
  vesselId?: number
  incidentType?: SeaCrewIncidentType | ''
  page?: number
  size?: number
}

export type SeaCrewIncidentPage = PageResponse<SeaCrewIncident>

// [2026-04-30] 연도별 집계 통계
export interface SeaYearlyStats {
  year: number
  vesselCount: number
  illnessTotal: number
  injuryTotal: number
  incidentTotal: number
  incidentRate: number
}
