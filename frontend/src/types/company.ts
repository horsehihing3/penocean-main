// Backend: /api/admin/companies
import type { PageResponse } from './common'

export type CompanyStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export interface Company {
  id: number
  businessNumber: string
  name: string
  ceoName: string
  address: string
  phone: string
  email: string
  industryCode: string
  industryName?: string | null
  status: CompanyStatus
  contractStartDate?: string | null
  contractEndDate?: string | null
  createdAt?: string
}

export interface CompanyPayload {
  name: string
  ceoName: string
  address: string
  phone: string
  email: string
  industryCode: string
  status: CompanyStatus
  contractStartDate?: string | null
  contractEndDate?: string | null
}

export interface CompanyCreatePayload extends CompanyPayload {
  businessNumber: string
}

export interface CompanyListParams {
  keyword?: string
  industryCode?: string
  status?: CompanyStatus | ''
  page?: number
  size?: number
}

export type CompanyPage = PageResponse<Company>
