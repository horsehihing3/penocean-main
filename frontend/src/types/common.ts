export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

export interface PageResponse<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      sorted: boolean
      unsorted: boolean
      empty: boolean
    }
  }
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface FileMetadata {
  id: number
  originalFilename: string
  storedFilename: string
  filePath: string
  fileSize: number
  contentType: string
  entityType: string
  entityId: string
  uploadedBy: string
  createdAt: string
}
