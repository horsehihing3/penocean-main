// Backend: /api/form-templates
import type { PageResponse } from './common'

export interface FormTemplate {
  id: number
  code: string
  category: string
  title: string
  description?: string | null
  fileName: string
  filePath: string
  fileSize: number
  version: string
  downloadCount: number
  active: boolean
  createdAt?: string
}

export interface FormTemplateListParams {
  category?: string
  keyword?: string
  page?: number
  size?: number
}

export type FormTemplatePage = PageResponse<FormTemplate>
