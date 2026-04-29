// Backend 계약: /api/access-requests
import type { PageResponse } from './common'

export type AccessRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'IMPROVEMENT_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'

export type AttachmentType =
  | 'RISK_ASSESSMENT'
  | 'PLEDGE'
  | 'WORK_PLAN'
  | 'OTHER'

export type ReviewAction =
  | 'START'
  | 'IMPROVEMENT'
  | 'APPROVE'
  | 'REJECT'

export interface AccessRequestListItem {
  id: number
  requestNo: string
  companyName: string
  vesselName: string
  portName: string | null      // [2026-04-23] PPT 슬라이드 13: 지역/항구
  industryName: string | null  // [2026-04-23] PPT 슬라이드 13: 업종
  workType: string
  plannedStartDate: string
  plannedEndDate: string
  workerCount: number
  status: AccessRequestStatus
  submittedAt: string | null
  improvementRequestReason?: string | null
}

export interface AccessRequestWorker {
  id?: number
  workerName: string
  workerBirth?: string
  workerPhone?: string
  workerRole?: string
  safetyEduCompleted: boolean
  safetyEduCompletedAt?: string
  safetyEduCertificateUrl?: string
  checkByShip?: boolean
  checkByShipAt?: string | null
}

export interface AccessRequestAttachment {
  id: number
  attachmentType: AttachmentType
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedAt: string
}

export interface AccessRequestReviewLog {
  id: number
  action: ReviewAction
  comment?: string
  actorUserName?: string
  actedAt: string
}

export interface AccessRequestDetailResponse extends AccessRequestListItem {
  companyId: number
  vesselId: number
  portId?: number
  workDescription: string
  // [2026-04-23] PPT 슬라이드 14: 안전담당자 정보
  safetyManagerName?: string | null
  safetyManagerTel?: string | null
  safetyManagerEmail?: string | null
  noRiskAssessment?: boolean
  workers: AccessRequestWorker[]
  attachments: AccessRequestAttachment[]
  reviewLogs: AccessRequestReviewLog[]
}

export interface AccessRequestListParams {
  status?: AccessRequestStatus | ''
  companyId?: number
  vesselId?: number
  keyword?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  size?: number
}

export interface CreateAccessRequestPayload {
  vesselId: number
  portId?: number
  companyId?: number
  workType: string
  workDescription: string
  plannedStartDate: string
  plannedEndDate: string
  // [2026-04-23] PPT 슬라이드 14: 안전담당자 정보
  safetyManagerName?: string | null
  safetyManagerTel?: string | null
  safetyManagerEmail?: string | null
  noRiskAssessment?: boolean
  workers?: Array<Omit<AccessRequestWorker, 'id' | 'safetyEduCertificateUrl'>>
}

export interface UpdateAccessRequestPayload extends CreateAccessRequestPayload {}

export interface ReviewPayload {
  action: ReviewAction
  comment?: string
}

export interface AddWorkersPayload {
  workers: Array<Omit<AccessRequestWorker, 'id' | 'safetyEduCertificateUrl'>>
}

export type AccessRequestPage = PageResponse<AccessRequestListItem>
