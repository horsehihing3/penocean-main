import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common'

export interface CodeMaster {
  id: number
  groupCode: string
  code: string
  name: string
  description?: string | null
  sortOrder?: number | null
  active?: boolean
}

export interface Department {
  id: number
  code: string
  name: string
  parentId?: number | null
  managerUserId?: number | null
}

export const codeMasterApi = {
  listByGroup: async (groupCode: string, activeOnly = false): Promise<CodeMaster[]> => {
    const { data } = await axiosInstance.get<ApiResponse<CodeMaster[]>>(
      `/code-masters/groups/${encodeURIComponent(groupCode)}`,
      { params: { activeOnly } }
    )
    return data.data
  },

  createInGroup: async (groupCode: string, payload: Partial<CodeMaster>): Promise<{ id: number }> => {
    const { data } = await axiosInstance.post<ApiResponse<{ id: number }>>(
      `/code-masters/groups/${encodeURIComponent(groupCode)}`,
      payload
    )
    return data.data
  },

  updateCode: async (id: number, payload: Partial<CodeMaster>): Promise<void> => {
    await axiosInstance.put<ApiResponse<void>>(`/code-masters/codes/${id}`, payload)
  },

  deleteCode: async (id: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(`/code-masters/codes/${id}`)
  },

  listDepartments: async (): Promise<Department[]> => {
    const { data } = await axiosInstance.get<ApiResponse<Department[]>>('/code-masters/departments')
    return data.data
  },

  createDepartment: async (payload: Partial<Department>): Promise<{ id: number }> => {
    const { data } = await axiosInstance.post<ApiResponse<{ id: number }>>(
      '/code-masters/departments',
      payload
    )
    return data.data
  },

  updateDepartment: async (id: number, payload: Partial<Department>): Promise<void> => {
    await axiosInstance.put<ApiResponse<void>>(`/code-masters/departments/${id}`, payload)
  },

  deleteDepartment: async (id: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(`/code-masters/departments/${id}`)
  },
}
