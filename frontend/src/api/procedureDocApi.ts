import axiosInstance from './axiosInstance'

export type ProcType = 'ACCESS_SAFETY' | 'RISK_ASSESSMENT'

export interface ProcedureDocResponse {
  id: number
  procType: ProcType
  fileName: string
  fileSize: number
  mimeType: string
  uploaderName: string | null
  createdAt: string
}

/** 절차서 최신 1건 조회 (없으면 data.data === null) */
export const getLatestProcedureDoc = (procType: ProcType) =>
  axiosInstance.get<{ data: ProcedureDocResponse | null }>('/procedure-docs/latest', {
    params: { procType },
  })

/** 절차서 등재 (ADMIN, multipart) */
export const uploadProcedureDoc = (procType: ProcType, file: File) => {
  const fd = new FormData()
  fd.append('file', file)
  return axiosInstance.post('/procedure-docs', fd, {
    params: { procType },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** 절차서 삭제 (ADMIN) */
export const deleteProcedureDoc = (id: number) =>
  axiosInstance.delete(`/procedure-docs/${id}`)

/** 다운로드 URL (직접 링크) */
export const getProcedureDocDownloadUrl = (id: number) => {
  const base = import.meta.env.VITE_API_URL || '/api'
  return `${base}/procedure-docs/${id}/download`
}
