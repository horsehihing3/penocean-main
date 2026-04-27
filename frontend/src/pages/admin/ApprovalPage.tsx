// [2026-04-24] PPT 슬라이드 22 기준으로 검색조건·목록컬럼·승인방식 전면 수정
import { useState } from 'react'
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import CheckIcon from '@mui/icons-material/CheckCircleOutline'
import BlockIcon from '@mui/icons-material/Block'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import * as XLSX from 'xlsx'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { approvalApi } from '../../api/approvalApi'
import type { ApprovalListItem, ApprovalStatus } from '../../types/approval'

type StatusFilter = ApprovalStatus | ''
type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const statusChipColor = (s: ApprovalStatus): 'warning' | 'success' | 'error' | 'default' => {
  switch (s) {
    case 'PENDING': return 'warning'
    case 'APPROVED': return 'success'
    case 'REJECTED': return 'error'
    default: return 'default'
  }
}

const ApprovalPage: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // 검색 조건 — PPT 슬라이드 22
  const [status, setStatus] = useState<StatusFilter>('PENDING')
  const [companyNameInput, setCompanyNameInput] = useState('')
  const [bizNoInput, setBizNoInput] = useState('')
  const [dateFromInput, setDateFromInput] = useState('')
  const [dateToInput, setDateToInput] = useState('')

  // 실제 쿼리 파라미터 (검색 버튼 클릭 시 반영)
  const [companyName, setCompanyName] = useState('')
  const [bizNo, setBizNo] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  // 거절 사유 팝업
  const [rejectTarget, setRejectTarget] = useState<ApprovalListItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' })

  const listQuery = useQuery({
    queryKey: ['admin', 'approvals', { status, companyName, bizNo, dateFrom, dateTo, page, pageSize }],
    queryFn: () =>
      approvalApi.list({
        status: status || undefined,
        companyName: companyName || undefined,
        businessNumber: bizNo || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const m = (err.response?.data as { message?: string } | undefined)?.message
      if (m) return m
    }
    return t('approval.actionFailed')
  }

  const approveMut = useMutation({
    mutationFn: (userId: number) => approvalApi.approve(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'approvals'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
      setSnackbar({ open: true, message: t('approval.approveSuccess'), severity: 'success' })
    },
    onError: (err) => setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' }),
  })

  const rejectMut = useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason?: string }) =>
      approvalApi.reject(userId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'approvals'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
      setSnackbar({ open: true, message: t('approval.rejectSuccess'), severity: 'success' })
      setRejectTarget(null)
      setRejectReason('')
    },
    onError: (err) => setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' }),
  })

  const statusLabel = (s: ApprovalStatus): string => {
    switch (s) {
      case 'PENDING': return t('approval.statusPending')
      case 'APPROVED': return t('approval.statusApproved')
      case 'REJECTED': return t('approval.statusRejected')
      case 'INACTIVE': return t('approval.statusInactive')
    }
  }

  const handleSearch = () => {
    setCompanyName(companyNameInput.trim())
    setBizNo(bizNoInput.trim())
    setDateFrom(dateFromInput)
    setDateTo(dateToInput)
    setPage(0)
  }

  const handleExcelExport = () => {
    const rows = listQuery.data?.content ?? []
    const data = rows.map((r) => ({
      '업종': r.industryName ?? '-',
      '기타업종': r.industryOther ?? '-',
      '계약팀': r.contractDeptName ?? '-',
      '사업자등록번호': r.businessNumber ?? '',
      '직책': r.title ?? '-',
      '성명': r.name ?? '',
      'Tel': r.phone ?? '',
      'E-Mail': r.email ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [
      { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 28 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '가입신청')
    XLSX.writeFile(wb, `approval_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const rows = listQuery.data?.content ?? []
  const total = listQuery.data?.total ?? 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {t('approval.pageTitle')}
      </Typography>

      {/* ── 검색 조건 — PPT 슬라이드 22 ── */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          {/* 1행: 신청일 + 상태 */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Typography variant="body2" sx={{ minWidth: 52, fontWeight: 500 }}>신청일</Typography>
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
              <InputLabel>{t('approval.filterStatus')}</InputLabel>
              <Select
                label={t('approval.filterStatus')}
                value={status}
                onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(0) }}
              >
                <MenuItem value="">{t('approval.filterAll')}</MenuItem>
                <MenuItem value="PENDING">{t('approval.statusPending')}</MenuItem>
                <MenuItem value="APPROVED">{t('approval.statusApproved')}</MenuItem>
                <MenuItem value="REJECTED">{t('approval.statusRejected')}</MenuItem>
                <MenuItem value="INACTIVE">{t('approval.statusInactive')}</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* 2행: 협력업체명 + 사업자등록번호 + 버튼 */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <TextField
              size="small"
              label="협력업체명"
              placeholder="업체명 검색"
              value={companyNameInput}
              onChange={(e) => setCompanyNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="사업자등록번호"
              placeholder="000-00-00000"
              value={bizNoInput}
              onChange={(e) => setBizNoInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExcelExport}
              disabled={!rows.length}
            >
              Excel
            </Button>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
            >
              {t('common.search')}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* ── 목록 — PPT 슬라이드 22 컬럼: 업종|기타업종|계약팀|사업자등록번호|[안전팀담당자: 직책|성명|Tel|E-Mail]|승인/거절 ── */}
      <Paper variant="outlined">
        {listQuery.isError && (
          <Alert severity="error" sx={{ m: 2 }}>{t('approval.loadError')}</Alert>
        )}
        <TableContainer>
          <Table size="small">
            <TableHead>
              {/* 1행: 그룹 헤더 */}
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, borderRight: '1px solid', borderColor: 'divider' }}>업종</TableCell>
                {!isMobile && <TableCell rowSpan={2} sx={{ fontWeight: 700, borderRight: '1px solid', borderColor: 'divider' }}>기타업종</TableCell>}
                {!isMobile && <TableCell rowSpan={2} sx={{ fontWeight: 700, borderRight: '1px solid', borderColor: 'divider' }}>계약팀</TableCell>}
                <TableCell rowSpan={2} sx={{ fontWeight: 700, borderRight: '1px solid', borderColor: 'divider' }}>사업자 등록번호</TableCell>
                <TableCell colSpan={4} align="center" sx={{ fontWeight: 700, borderRight: '1px solid', borderColor: 'divider' }}>안전팀담당자</TableCell>
                <TableCell rowSpan={2} align="center" sx={{ fontWeight: 700, width: 140 }}>승인/거절</TableCell>
              </TableRow>
              {/* 2행: 안전팀담당자 세부 */}
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>직책</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>성명</TableCell>
                {!isMobile && <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Tel</TableCell>}
                {!isMobile && <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', borderRight: '1px solid', borderColor: 'divider' }}>E-Mail</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {listQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!listQuery.isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {t('approval.empty')}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.userId} hover>
                  <TableCell>{row.industryName ?? '-'}</TableCell>
                  {!isMobile && <TableCell>{row.industryOther ?? '-'}</TableCell>}
                  {!isMobile && <TableCell>{row.contractDeptName ?? '-'}</TableCell>}
                  <TableCell>{row.businessNumber}</TableCell>
                  <TableCell>{row.title ?? '-'}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  {!isMobile && <TableCell>{row.phone}</TableCell>}
                  {!isMobile && <TableCell>{row.email}</TableCell>}
                  <TableCell align="center">
                    {row.status === 'PENDING' ? (
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={approveMut.isPending ? <CircularProgress size={12} /> : <CheckIcon />}
                          disabled={approveMut.isPending}
                          onClick={() => approveMut.mutate(row.userId)}
                          sx={{ minWidth: 0, px: 1, fontSize: '0.75rem' }}
                        >
                          승인
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<BlockIcon />}
                          onClick={() => { setRejectTarget(row); setRejectReason('') }}
                          sx={{ minWidth: 0, px: 1, fontSize: '0.75rem' }}
                        >
                          거절
                        </Button>
                      </Stack>
                    ) : (
                      <Chip
                        size="small"
                        label={statusLabel(row.status as ApprovalStatus)}
                        color={statusChipColor(row.status as ApprovalStatus)}
                        sx={{ fontWeight: 600 }}
                      />
                    )}
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

      {/* ── 거절 사유 팝업 — PPT 슬라이드 22 note: "거절을 누르면 사유를 쓸 수 있는 팝업" ── */}
      <Dialog
        open={rejectTarget != null}
        onClose={() => setRejectTarget(null)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight={700}>거절 사유 입력</Typography>
          <IconButton onClick={() => setRejectTarget(null)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {rejectTarget && (
              <Typography variant="body2" color="text.secondary">
                {rejectTarget.companyName} ({rejectTarget.businessNumber}) — {rejectTarget.name}
              </Typography>
            )}
            <TextField
              fullWidth
              multiline
              minRows={3}
              label={t('approval.rejectReasonLabel')}
              placeholder="거절 사유를 입력하면 협력업체 이메일로 자동 발송됩니다."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setRejectTarget(null)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            disabled={rejectMut.isPending}
            onClick={() =>
              rejectMut.mutate({
                userId: rejectTarget!.userId,
                reason: rejectReason.trim() || undefined,
              })
            }
          >
            {rejectMut.isPending ? <CircularProgress size={20} /> : t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ApprovalPage
