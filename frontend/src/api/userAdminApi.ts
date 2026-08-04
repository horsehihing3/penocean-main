// 관리자 사용자 관리 API (검색·수정·비밀번호 변경·탈퇴)
import axiosInstance from './axiosInstance'
import type { PageResponse } from '../types/common'

export type AdminUserRole = 'ADMIN' | 'CONTRACTOR' | 'CONTRACT_DEPT'
export type AdminUserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INACTIVE'

export interface AdminUser {
  id: number
  username: string
  name: string | null
  title: string | null
  email: string | null
  phone: string | null
  role: AdminUserRole
  companyId: number | null
  companyName: string | null
  departmentId: number | null
  departmentName: string | null
  status: AdminUserStatus
  createdAt: string | null
  lastLoginAt: string | null
}

export interface AdminUserUpdatePayload {
  name?: string | null
  title?: string | null
  email?: string | null
  phone?: string | null
  roleCode?: AdminUserRole
  status?: AdminUserStatus
}

export const userAdminApi = {
  search: async (params: {
    roleCode?: string
    status?: string
    keyword?: string
    page?: number
    size?: number
  }): Promise<PageResponse<AdminUser>> => {
    const res = await axiosInstance.get('/admin/users', { params })
    return res.data.data
  },

  update: async (id: number, payload: AdminUserUpdatePayload): Promise<void> => {
    await axiosInstance.put(`/admin/users/${id}`, payload)
  },

  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    await axiosInstance.patch(`/admin/users/${id}/password`, { newPassword })
  },

  withdraw: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/admin/users/${id}`)
  },
}
