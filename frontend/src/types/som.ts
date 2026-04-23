// Backend 계약: /api/som/lookup/{businessNumber}

export interface SomCompanyLookup {
  businessNumber: string
  companyName: string
  ceoName?: string | null
  address?: string | null
  industry?: string | null
  employeeCount?: number | null
  annualRevenue?: number | null
  lastSyncedAt?: string | null
}
