// Backend: /api/audit-inspections
import type { PageResponse } from './common'

export type AuditInspectionType = 'REGULAR' | 'SPECIAL' | 'FOLLOW_UP'
export type AuditInspectionStatus = 'OPEN' | 'CLOSED'

export interface AuditInspectionListItem {
  id: number
  inspectionType: AuditInspectionType
  targetCompanyId?: number | null
  targetCompanyName?: string | null
  targetVesselId?: number | null
  targetVesselName?: string | null
  inspectionDate: string
  inspectorUserId?: number | null
  inspectorName: string
  status: AuditInspectionStatus
  createdAt?: string | null
}

export interface AuditInspectionDetail extends AuditInspectionListItem {
  findings: string
  actionItems: string
  closedAt?: string | null
  updatedAt?: string | null
}

export interface AuditInspectionPayload {
  inspectionType: AuditInspectionType
  targetCompanyId?: number | null
  targetVesselId?: number | null
  inspectionDate: string
  inspectorUserId?: number | null
  findings: string
  actionItems: string
}

export interface AuditInspectionListParams {
  inspectionType?: AuditInspectionType | ''
  status?: AuditInspectionStatus | ''
  dateFrom?: string
  dateTo?: string
  page?: number
  size?: number
}

export type AuditInspectionPage = PageResponse<AuditInspectionListItem>
