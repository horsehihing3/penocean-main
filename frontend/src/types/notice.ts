// Backend: /api/notices
import type { PageResponse } from './common'

export type NoticeCategory = 'NOTICE' | 'ANNOUNCEMENT' | 'URGENT'

export interface NoticeListItem {
  id: number
  category: NoticeCategory
  title: string
  authorUserName: string
  publishedAt: string
  pinned: boolean
  viewCount: number
  expiresAt?: string | null
}

export interface NoticeDetail extends NoticeListItem {
  content: string
  attachmentUrl?: string | null
  attachmentName?: string | null
}

export interface NoticePayload {
  category: NoticeCategory
  title: string
  content: string
  pinned?: boolean
  expiresAt?: string | null
}

export interface NoticeListParams {
  category?: NoticeCategory | ''
  keyword?: string
  page?: number
  size?: number
}

export type NoticePage = PageResponse<NoticeListItem>
