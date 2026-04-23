// Pan Ocean portal roles (matches backend tb_role.code)
export type Role =
  | 'ADMIN'           // 안전경영팀 / 시스템 관리자
  | 'CONTRACTOR'      // 협력업체
  | 'CONTRACT_DEPT'   // 팬오션 계약부서

export interface User {
  id: number
  username: string
  name: string
  email: string
  phone?: string
  role: Role
  companyId?: number | null      // CONTRACTOR 한정
  departmentId?: number | null   // CONTRACT_DEPT 한정
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INACTIVE'
  lastLoginAt?: string | null
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username?: string                 // 아이디 (PPT slide 6). 없으면 서버가 email 사용
  companyName: string
  companyNameEn?: string            // 업체 영문명
  businessNumber: string
  businessLicenseFilePath?: string  // 사업자등록증 업로드 경로
  companyPhone?: string             // 회사전화번호 (안전담당자 휴대전화와 구분)
  postalCode?: string
  address?: string
  addressDetail?: string
  contactName: string               // 안전담당자 성명
  contactTitle?: string             // 안전담당자 직책
  email: string                     // 안전담당자 E-mail
  phone: string                     // 안전담당자 휴대전화
  password: string
  industryCodes: string[]
  industryOther?: string            // 기타업종 자유 입력
  contractDepartments: string[]
  privacyAgreed: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
