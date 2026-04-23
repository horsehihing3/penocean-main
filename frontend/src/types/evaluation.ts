// Backend 계약:
//   /api/evaluation-items
//   /api/evaluations
//   /api/evaluation-improvements
import type { PageResponse } from './common'

export type EvaluationStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export type EvaluationType = 'REGULAR' | 'SPECIAL'

export type PeriodHalf = 'H1' | 'H2'

export type ReviewAction = 'APPROVE' | 'REJECT'

export type ImprovementStatus = 'OPEN' | 'RESPONDED' | 'CLOSED' | 'OVERDUE'

export interface EvaluationHistoryEntry {
  id: number
  evaluationId: number
  improvementId?: number | null
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'SUBMIT'
    | 'APPROVE'
    | 'REJECT'
    | 'IMPROVE_REQUEST'
    | 'IMPROVE_RESPOND'
    | 'IMPROVE_CLOSE'
  actorUserId?: number | null
  actorName?: string | null
  detail?: string | null
  createdAt: string
}

// -------- Evaluation Items --------

export interface EvaluationItem {
  id: number
  code: string
  category: string
  title: string
  description?: string
  maxScore: number
  weight: number
  sortOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface EvaluationItemSavePayload {
  code: string
  category: string
  title: string
  description?: string
  maxScore: number
  weight: number
  sortOrder?: number
  active?: boolean
}

export interface EvaluationItemReorderEntry {
  id: number
  sortOrder: number
}

// -------- Evaluations --------

export interface EvaluationListItem {
  id: number
  evaluationNo: string
  companyId: number
  companyName: string
  businessNumber: string
  periodYear: number
  periodHalf: PeriodHalf
  evaluationType: EvaluationType
  evaluatorName?: string | null
  status: EvaluationStatus
  totalScore: number
  maxTotalScore: number
  scorePercentage: number
  qualified: boolean
  attachmentCount?: number | null
  submittedAt?: string | null
  approvedAt?: string | null
}

export interface EvaluationItemScore {
  itemId: number
  itemCode: string
  itemCategory: string
  itemTitle: string
  score: number
  maxScore: number
  weight: number
  weightedScore: number
  notApplicable?: boolean | null
  comment?: string | null
}

export interface EvaluationAttachment {
  id: number
  itemId?: number | null
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedAt: string
}

export interface EvaluationDetailResponse extends EvaluationListItem {
  comment?: string | null
  rejectedReason?: string | null
  approvedByName?: string | null
  itemScores: EvaluationItemScore[]
  attachments: EvaluationAttachment[]
}

export interface EvaluationItemScorePayload {
  itemId: number
  score: number
  notApplicable?: boolean
  comment?: string
}

export interface EvaluationCreatePayload {
  companyId?: number | null
  businessNumber?: string
  periodYear: number
  periodHalf: PeriodHalf
  evaluationType: EvaluationType
  evaluatorName?: string
  comment?: string
  itemScores: EvaluationItemScorePayload[]
}

export interface EvaluationUpdatePayload extends EvaluationCreatePayload {}

export interface EvaluationListParams {
  status?: EvaluationStatus | ''
  companyId?: number
  periodYear?: number
  periodHalf?: PeriodHalf | ''
  keyword?: string
  page?: number
  size?: number
}

export interface EvaluationReviewPayload {
  action: ReviewAction
  reason?: string
}

export type EvaluationPage = PageResponse<EvaluationListItem>

// -------- Improvements --------

export interface EvaluationImprovement {
  id: number
  evaluationId: number
  evaluationNo: string
  itemId?: number | null
  itemTitle?: string | null
  requestedByName: string
  requestedAt: string
  requestContent: string
  responseContent?: string | null
  respondedAt?: string | null
  responseDueDate: string
  status: ImprovementStatus
  companyName: string
}

export interface ImprovementListParams {
  evaluationId?: number
  status?: ImprovementStatus | ''
  page?: number
  size?: number
}

export interface ImprovementCreatePayload {
  evaluationId: number
  itemId?: number
  content: string
  responseDueDate: string
}

export interface ImprovementRespondPayload {
  responseContent: string
}

export type ImprovementPage = PageResponse<EvaluationImprovement>
