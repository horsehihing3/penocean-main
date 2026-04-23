// Backend 계약: GET /dashboard/summary
export type MyRegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | null

export interface HighIncidentCompany {
  companyId: number
  companyName: string
  incidentRate: number
}

export interface DashboardNotification {
  id: number
  subject: string
  createdAt: string
}

export interface DashboardSummary {
  pendingApprovalCount: number
  myPendingRegistrationStatus: MyRegistrationStatus
  highIncidentCompanies: HighIncidentCompany[]
  pendingAccessRequests: number
  pendingEvaluations: number
  recentNotifications: DashboardNotification[]
}
