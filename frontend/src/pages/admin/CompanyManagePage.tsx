// [2026-04-24] PPT 슬라이드 22(정보수집) 기준으로 전면 재작성
// [2026-04-25] 맨 우측 첨부파일 컬럼 추가 — 클릭 시 이미지 미리보기 다이얼로그
// [2026-05-02] 비로그인 업로드 링크 생성 / 링크 첨부파일 컬럼 분리
// [2026-05-04] 첨부파일 다운로드 JWT 인증 처리 (axios blob) / 첨부파일 컬럼 통합
import { useState } from 'react'
import axiosInstance from '../../api/axiosInstance'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import LinkIcon from '@mui/icons-material/Link'
import SearchIcon from '@mui/icons-material/Search'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accessRequestApi } from '../../api/accessRequestApi'
import type { AccessRequestListItem, AccessRequestStatus } from '../../types/accessRequest'

type StatusFilter = AccessRequestStatus | ''

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'SUBMITTED', label: '제출' },
  { value: 'IN_REVIEW', label: '검토중' },
  { value: 'APPROVED', label: '진행중' },
  { value: 'REJECTED', label: '반려' },
]

const docStatusLabel = (status: AccessRequestStatus): string => {
  switch (status) {
    case 'DRAFT': return '작성중'
    case 'SUBMITTED': return '제출'
    case 'IN_REVIEW': return '검토중'
    case 'IMPROVEMENT_REQUESTED': return '보완요청'
    case 'APPROVED': return '진행중'
    case 'REJECTED': return '반려'
    default: return status
  }
}

const docStatusColor = (
  status: AccessRequestStatus
): 'default' | 'info' | 'warning' | 'success' | 'error' => {
  switch (status) {
    case 'DRAFT': return 'default'
    case 'SUBMITTED': return 'info'
    case 'IN_REVIEW': return 'warning'
    case 'IMPROVEMENT_REQUESTED': return 'warning'
    case 'APPROVED': return 'success'
    case 'REJECTED': return 'error'
    default: return 'default'
  }
}

const formatDateRange = (start: string, end: string): string => {
  const fmt = (d: string) => d?.slice(0, 10).replace(/-/g, '.') ?? ''
  return `${fmt(start)} ~ ${fmt(end)}`
}

const DOC_TYPE_LABEL: Record<string, string> = {
  DAILY_SAFETY_LOG: '일일안전교육일지',
  WORK_PLAN: '작업계획서',
  PLEDGE: '서명본',
  RISK_ASSESSMENT: '위험성평가',
  OTHER: '기타',
}

const PORTAL_URL = window.location.origin

// ─── 첨부파일 다이얼로그 ────────────────────────────────────────────────────
const AttachmentDialog: React.FC<{
  row: AccessRequestListItem
  onClose: () => void
}> = ({ row }) => {
  const detailQuery = useQuery({
    queryKey: ['accessRequest', 'detail', row.id],
    queryFn: () => accessRequestApi.detail(row.id),
  })

  const all = detailQuery.data?.attachments ?? []
  // uploadedBy === null → 토큰 링크 업로드 (비로그인)
  // uploadedBy !== null → 출입신청 시 업로드 (로그인 사용자)
  const reqAttachments  = all.filter((a) => a.uploadedBy !== null)
  const linkAttachments = all.filter((a) => a.uploadedBy === null)

  const handleDownload = async (requestId: number, attId: number, fileName: string) => {
    const response = await axiosInstance.get(
      `/access-requests/${requestId}/attachments/${attId}/download`,
      { responseType: 'blob' }
    )
    const url = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      {/* 출입신청 첨부파일 */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <AttachFileIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" fontWeight={700}>
            출입신청 첨부파일
          </Typography>
          <Chip label={reqAttachments.length} size="small" />
        </Stack>
        {detailQuery.isLoading && <CircularProgress size={18} />}
        {!detailQuery.isLoading && reqAttachments.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
            첨부파일 없음
          </Typography>
        )}
        <Stack spacing={0.75}>
          {reqAttachments.map((att) => (
            <Stack key={att.id} direction="row" spacing={1} alignItems="center">
              <Chip
                label={DOC_TYPE_LABEL[att.attachmentType] ?? att.attachmentType}
                size="small"
                variant="outlined"
                color="default"
              />
              <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
                {att.fileName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {att.uploadedAt ? new Date(att.uploadedAt).toLocaleDateString('ko-KR') : ''}
              </Typography>
              <IconButton size="small" onClick={() => handleDownload(row.id, att.id, att.fileName)}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Divider />

      {/* 링크 제출 파일 */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <CloudUploadIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" fontWeight={700} color="primary">
            링크 제출 파일 (승선 당일)
          </Typography>
          <Chip label={linkAttachments.length} size="small" color="primary" />
        </Stack>
        {detailQuery.isLoading && <CircularProgress size={18} />}
        {!detailQuery.isLoading && linkAttachments.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
            아직 제출된 파일 없음
          </Typography>
        )}
        <Stack spacing={0.75}>
          {linkAttachments.map((att) => (
            <Stack key={att.id} direction="row" spacing={1} alignItems="center">
              <Chip
                label={DOC_TYPE_LABEL[att.attachmentType] ?? att.attachmentType}
                size="small"
                variant="outlined"
                color="primary"
              />
              <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
                {att.fileName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {att.uploadedAt ? new Date(att.uploadedAt).toLocaleDateString('ko-KR') : ''}
              </Typography>
              <IconButton size="small" color="primary" onClick={() => handleDownload(row.id, att.id, att.fileName)}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Stack>
  )
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────
const CompanyManagePage: React.FC = () => {
  const qc = useQueryClient()

  const [keywordInput, setKeywordInput] = useState('')
  const [statusInput, setStatusInput] = useState<StatusFilter>('')
  const [dateFromInput, setDateFromInput] = useState('')
  const [dateToInput, setDateToInput] = useState('')

  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [attachDialogRow, setAttachDialogRow] = useState<AccessRequestListItem | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })

  const listQuery = useQuery({
    queryKey: ['admin', 'info-collection', { keyword, statusFilter, dateFrom, dateTo, page, pageSize }],
    queryFn: () =>
      accessRequestApi.list({
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const generateTokenMut = useMutation({
    mutationFn: (id: number) => accessRequestApi.generateUploadToken(id),
    onSuccess: (token, id) => {
      qc.invalidateQueries({ queryKey: ['admin', 'info-collection'] })
      const url = `${PORTAL_URL}/?upload=${token}`
      navigator.clipboard.writeText(url).catch(() => {})
      setSnackbar({ open: true, message: '업로드 링크가 클립보드에 복사되었습니다.', severity: 'success' })
      // 다이얼로그 열려있으면 row의 uploadToken 갱신
      if (attachDialogRow?.id === id) {
        setAttachDialogRow((prev) => prev ? { ...prev, uploadToken: token } : prev)
      }
    },
    onError: () => {
      setSnackbar({ open: true, message: '링크 생성에 실패했습니다.', severity: 'error' })
    },
  })

  const handleSearch = () => {
    setKeyword(keywordInput.trim())
    setStatusFilter(statusInput)
    setDateFrom(dateFromInput)
    setDateTo(dateToInput)
    setPage(0)
  }

  const handleCopyLink = (row: AccessRequestListItem) => {
    if (row.uploadToken) {
      const url = `${PORTAL_URL}/?upload=${row.uploadToken}`
      navigator.clipboard.writeText(url).catch(() => {})
      setSnackbar({ open: true, message: '링크가 클립보드에 복사되었습니다.', severity: 'success' })
    } else {
      generateTokenMut.mutate(row.id)
    }
  }

  const rows = listQuery.data?.content ?? []
  const total = listQuery.data?.totalElements ?? 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        정보수집
      </Typography>

      {/* 검색 조건 */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Typography variant="body2" sx={{ minWidth: 52, fontWeight: 500 }}>작업일정</Typography>
            <TextField
              type="date"
              size="small"
              value={dateFromInput}
              onChange={(e) => setDateFromInput(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            <Typography variant="body2">~</Typography>
            <TextField
              type="date"
              size="small"
              value={dateToInput}
              onChange={(e) => setDateToInput(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel shrink>상태</InputLabel>
              <Select
                label="상태"
                value={statusInput}
                displayEmpty
                notched
                onChange={(e) => setStatusInput(e.target.value as StatusFilter)}
                renderValue={(v) => STATUS_OPTIONS.find((o) => o.value === v)?.label ?? '전체'}
              >
                {STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <TextField
              size="small"
              label="방문사업장/선박·업체명 검색"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              sx={{ flex: 1 }}
            />
            <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>
              검색
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* 목록 */}
      <Paper variant="outlined">
        {listQuery.isError && (
          <Alert severity="error" sx={{ m: 2 }}>목록을 불러오지 못했습니다.</Alert>
        )}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 48 }}>No.</TableCell>
                <TableCell sx={{ width: 90 }}>상태</TableCell>
                <TableCell sx={{ width: 70 }}>구분</TableCell>
                <TableCell sx={{ width: 100 }}>업종</TableCell>
                <TableCell>방문사업장/선박</TableCell>
                <TableCell sx={{ width: 90 }}>지역/항구</TableCell>
                <TableCell sx={{ width: 190 }}>작업일정</TableCell>
                <TableCell sx={{ width: 120 }}>작업상세</TableCell>
                <TableCell align="right" sx={{ width: 90 }}>출입신청인원</TableCell>
                <TableCell align="center" sx={{ width: 95 }}>첨부파일</TableCell>
                <TableCell align="center" sx={{ width: 110 }}>업로드 링크</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!listQuery.isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    조회된 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row, idx) => (
                <TableRow key={row.id} hover>
                  <TableCell>{page * pageSize + idx + 1}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={docStatusLabel(row.status)}
                      color={docStatusColor(row.status)}
                      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                    />
                  </TableCell>
                  <TableCell>선박</TableCell>
                  <TableCell>{row.industryName ?? '-'}</TableCell>
                  <TableCell>{row.vesselName}</TableCell>
                  <TableCell>{row.portName ?? '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem' }}>
                    {formatDateRange(
                      row.plannedStartDate as unknown as string,
                      row.plannedEndDate as unknown as string,
                    )}
                  </TableCell>
                  <TableCell>{row.workType ?? '-'}</TableCell>
                  <TableCell align="right">{row.workerCount ?? '-'}</TableCell>

                  {/* 첨부파일 (출입신청 + 링크 제출 합산) */}
                  {(() => {
                    const total = (row.attachmentCount ?? 0) + (row.linkAttachmentCount ?? 0)
                    return (
                      <TableCell align="center">
                        <Tooltip title={total > 0 ? `${total}건` : '파일 없음'}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => setAttachDialogRow(row)}
                              disabled={total === 0}
                            >
                              <AttachFileIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        {total > 0 && (
                          <Chip
                            label={total}
                            size="small"
                            sx={{ ml: 0.5, height: 18, fontSize: '0.7rem' }}
                          />
                        )}
                      </TableCell>
                    )
                  })()}

                  {/* 업로드 링크 */}
                  <TableCell align="center">
                    <Tooltip title={row.uploadToken ? '링크 복사' : '링크 생성'}>
                      <span>
                        <IconButton
                          size="small"
                          color={row.uploadToken ? 'success' : 'default'}
                          disabled={generateTokenMut.isPending}
                          onClick={() => handleCopyLink(row)}
                        >
                          {row.uploadToken
                            ? <ContentCopyIcon fontSize="small" />
                            : <LinkIcon fontSize="small" />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[10, 20, 50]}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}
        />
      </Paper>

      {/* 첨부파일 다이얼로그 */}
      <Dialog
        open={attachDialogRow != null}
        onClose={() => setAttachDialogRow(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          파일 현황 — {attachDialogRow?.vesselName}
          <IconButton size="small" onClick={() => setAttachDialogRow(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {attachDialogRow && (
            <AttachmentDialog
              row={attachDialogRow}
              onClose={() => setAttachDialogRow(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default CompanyManagePage
