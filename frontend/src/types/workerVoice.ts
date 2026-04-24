// Backend: /api/worker-voices
import type { PageResponse } from './common'

export type WorkerVoiceType = 'NEAR_MISS' | 'INCIDENT' | 'INQUIRY'
export type WorkerVoiceSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type WorkerVoiceStatus =
  | 'SUBMITTED'
  | 'TRIAGED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'

export interface WorkerVoiceAttachment {
  id: number
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedAt: string
}

export interface WorkerVoiceListItem {
  id: number
  voiceNo: string
  voiceType: WorkerVoiceType
  title: string
  companyId: number
  companyName: string
  vesselId?: number | null
  vesselName?: string | null
  severity?: WorkerVoiceSeverity | null
  status: WorkerVoiceStatus
  reporterAnonymous: boolean
  createdAt: string
  resolvedAt?: string | null
  commentCount: number
}

export interface WorkerVoiceDetail extends WorkerVoiceListItem {
  content: string
  reporterUserId?: number | null
  reporterName?: string | null
  assignedTo?: number | null
  assigneeName?: string | null
  resolution?: string | null
  resolvedAt?: string | null
  updatedAt?: string | null
  emailSentTo?: string | null
  attachments: WorkerVoiceAttachment[]
}

export interface WorkerVoiceCreatePayload {
  voiceType: WorkerVoiceType
  title: string
  content: string
  companyId?: number | null
  vesselId?: number | null
  severity?: WorkerVoiceSeverity | null
  reporterAnonymous: boolean
}

export interface WorkerVoiceStatusPayload {
  status: WorkerVoiceStatus
  assignedTo?: number | null
  resolution?: string | null
}

export interface WorkerVoiceListParams {
  voiceType?: WorkerVoiceType | ''
  status?: WorkerVoiceStatus | ''
  keyword?: string
  page?: number
  size?: number
}

export type WorkerVoicePage = PageResponse<WorkerVoiceListItem>
