// Backend 계약: /api/visit-permits
import type { PageResponse } from './common'

export interface VisitPermitResponse {
  id: number
  permitNo: string
  accessRequestId: number
  companyName: string
  vesselName: string
  validFrom: string
  validTo: string
  qrCodeUrl?: string
  revoked: boolean
  revokedReason?: string
  issuedAt: string
}

export interface VisitPermitQrResponse {
  permitNo: string
  validFrom: string
  validTo: string
  companyName: string
  vesselName: string
}

export interface VisitPermitListParams {
  companyId?: number
  validFrom?: string
  validTo?: string
  page?: number
  size?: number
}

export type VisitPermitPage = PageResponse<VisitPermitResponse>
