// Backend: /api/health/*
import type { PageResponse } from './common'

export type HealthCheckupType = 'GENERAL' | 'SPECIAL' | 'PRE_EMPLOYMENT'

export interface HealthCheckupListItem {
  id: number
  userId: number
  userName: string
  checkupDate: string
  hospitalName: string
  checkupType: HealthCheckupType
  summary: string
  reportFileUrl?: string | null
}

export interface HealthVital {
  id: number
  checkupId: number
  measuredDate: string
  systolicBp?: number | null
  diastolicBp?: number | null
  fastingGlucose?: number | null
  hba1c?: number | null
  totalCholesterol?: number | null
  ldl?: number | null
  hdl?: number | null
  triglyceride?: number | null
  bmi?: number | null
  waistCm?: number | null
  isHypertension?: boolean
  isDiabetes?: boolean
  isDyslipidemia?: boolean
}

export interface HealthConsultation {
  id: number
  userId: number
  consultationDate: string
  counselor: string
  content: string
  createdAt: string
}

export interface HealthCheckupDetail extends HealthCheckupListItem {
  vitals: HealthVital[]
  consultations: HealthConsultation[]
}

export interface HealthCheckupPayload {
  userId: number
  checkupDate: string
  hospitalName: string
  checkupType: HealthCheckupType
  summary: string
}

export interface HealthVitalPayload {
  measuredDate: string
  systolicBp?: number | null
  diastolicBp?: number | null
  fastingGlucose?: number | null
  hba1c?: number | null
  totalCholesterol?: number | null
  ldl?: number | null
  hdl?: number | null
  triglyceride?: number | null
  bmi?: number | null
  waistCm?: number | null
  isHypertension?: boolean
  isDiabetes?: boolean
  isDyslipidemia?: boolean
}

export interface HealthConsultationPayload {
  userId: number
  consultationDate: string
  counselor: string
  content: string
}

export interface HealthTrendPoint {
  year: number
  month: number
  systolicBp?: number | null
  diastolicBp?: number | null
  fastingGlucose?: number | null
  hba1c?: number | null
  totalCholesterol?: number | null
  ldl?: number | null
}

export interface HealthTrend {
  userId: number
  userName?: string
  isHypertension?: boolean
  isDiabetes?: boolean
  isDyslipidemia?: boolean
  years: HealthTrendPoint[]
}

export interface HealthCheckupListParams {
  userId?: number
  keyword?: string
  page?: number
  size?: number
}

export type HealthCheckupPage = PageResponse<HealthCheckupListItem>
