// Backend 계약: /admin/approvals*
// Backend team 이 합의한 단순한 Page shape (Spring PageResponse 와 다름)
export interface SimplePageResponse<T> {
  content: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INACTIVE'

export interface ApprovalListItem {
  userId: number
  username: string
  name: string
  email: string
  phone: string
  companyId: number
  companyName: string
  businessNumber: string
  status: ApprovalStatus
  createdAt: string
  // [2026-04-24] PPT 슬라이드 22
  industryName?: string | null
  industryOther?: string | null
  contractDeptName?: string | null
  title?: string | null
}

export interface ContractDepartment {
  code: string
  name: string
}

export interface ApprovalDetail extends ApprovalListItem {
  industries: string[]
  contractDepartments: ContractDepartment[]
}

export interface ApprovalActionRequest {
  reason?: string
}

export interface ApprovalListParams {
  status?: ApprovalStatus | ''
  keyword?: string
  companyName?: string
  businessNumber?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  size?: number
}
