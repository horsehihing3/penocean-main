import type { AccessRequestStatus } from '../types/accessRequest'
import type { EvaluationStatus, ImprovementStatus } from '../types/evaluation'
import type {
  WorkerVoiceSeverity,
  WorkerVoiceStatus,
  WorkerVoiceType,
} from '../types/workerVoice'
import type { AccidentSeverity } from '../types/industrialAccident'

export type ChipColor = 'default' | 'info' | 'warning' | 'success' | 'error' | 'primary' | 'secondary'

export const getAccessRequestStatusColor = (status: AccessRequestStatus): ChipColor => {
  switch (status) {
    case 'DRAFT':
      return 'default'
    case 'SUBMITTED':
      return 'info'
    case 'IN_REVIEW':
      return 'warning'
    case 'IMPROVEMENT_REQUESTED':
      return 'warning'
    case 'APPROVED':
      return 'success'
    case 'REJECTED':
      return 'error'
    default:
      return 'default'
  }
}

export const getEvaluationStatusColor = (status: EvaluationStatus): ChipColor => {
  switch (status) {
    case 'DRAFT':
      return 'default'
    case 'SUBMITTED':
      return 'info'
    case 'APPROVED':
      return 'success'
    case 'REJECTED':
      return 'error'
    default:
      return 'default'
  }
}

export const getImprovementStatusColor = (status: ImprovementStatus): ChipColor => {
  switch (status) {
    case 'OPEN':
      return 'warning'
    case 'RESPONDED':
      return 'info'
    case 'CLOSED':
      return 'success'
    case 'OVERDUE':
      return 'error'
    default:
      return 'default'
  }
}

export const getVisitPermitStatusColor = (
  revoked: boolean,
  validTo: string
): ChipColor => {
  if (revoked) return 'error'
  try {
    if (new Date(validTo).getTime() < Date.now()) return 'default'
  } catch {
    // ignore
  }
  return 'success'
}

export const getWorkerVoiceTypeColor = (type: WorkerVoiceType): ChipColor => {
  switch (type) {
    case 'NEAR_MISS':
      return 'warning'
    case 'INCIDENT':
      return 'error'
    case 'INQUIRY':
      return 'info'
    default:
      return 'default'
  }
}

export const getWorkerVoiceStatusColor = (status: WorkerVoiceStatus): ChipColor => {
  switch (status) {
    case 'SUBMITTED':
      return 'info'
    case 'TRIAGED':
      return 'warning'
    case 'IN_PROGRESS':
      return 'primary'
    case 'RESOLVED':
      return 'success'
    case 'CLOSED':
      return 'default'
    default:
      return 'default'
  }
}

export const getWorkerVoiceSeverityColor = (
  severity: WorkerVoiceSeverity
): ChipColor => {
  switch (severity) {
    case 'LOW':
      return 'default'
    case 'MEDIUM':
      return 'info'
    case 'HIGH':
      return 'warning'
    case 'CRITICAL':
      return 'error'
    default:
      return 'default'
  }
}

export const getAccidentSeverityColor = (severity: AccidentSeverity): ChipColor => {
  switch (severity) {
    case 'MINOR':
      return 'warning'
    case 'SERIOUS':
      return 'error'
    case 'FATAL':
      return 'error'
    default:
      return 'default'
  }
}
