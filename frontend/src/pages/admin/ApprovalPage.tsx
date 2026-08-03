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
  Pagination,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import CheckIcon from '@mui/icons-material/CheckCircleOutline'
import BlockIcon from '@mui/icons-material/Block'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import * as XLSX from 'xlsx'
import { useTranslation } from 'react-i18next'
import { useConfirm } from '../../components/common/ConfirmDialogProvider'
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
  const confirm = useConfirm()
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
  const pageSize = 20

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
      '업체명': r.companyName ?? '-',
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

  // [2026-08-03] 승인 전 커스텀 confirm — 되돌릴 수 없는 처리라 오클릭 방지
  const handleApproveClick = async (row: (typeof rows)[number]) => {
    const ok = await confirm({
      title: '가입 승인',
      message: `${row.companyName ?? '-'} (${row.businessNumber}) 의 가입을 승인하시겠습니까?`,
      description: '승인 시 협력업체에 안내 이메일이 발송되며 포털 이용이 즉시 가능해집니다.',
      severity: 'success',
      confirmText: '승인',
    })
    if (ok) approveMut.mutate(row.userId)
  }

  // [2026-08-03] 거절 확정 전 커스텀 confirm — 사유 입력 후 최종 확인
  const handleRejectSubmit = async () => {
    if (!rejectTarget) return
    const ok = await confirm({
      title: '가입 거절',
      message: `${rejectTarget.companyName ?? '-'} (${rejectTarget.businessNumber}) 의 가입을 거절하시겠습니까?`,
      description: rejectReason.trim()
        ? '입력한 거절 사유가 협력업체 이메일로 발송됩니다.'
        : '거절 사유 없이 처리됩니다.',
      severity: 'error',
      confirmText: '거절',
    })
    if (ok) {
      rejectMut.mutate({
        userId: rejectTarget.userId,
        reason: rejectReason.trim() || undefined,
      })
    }
  }

  // [2026-08-03] PC 테이블·모바일 카드 양쪽에서 재사용하는 승인/거절 액션
  const renderApprovalActions = (row: (typeof rows)[number]) =>
    row.status === 'PENDING' ? (
      <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ flexWrap: 'nowrap' }}>
        <Button
          size="small"
          variant="contained"
          color="success"
          startIcon={approveMut.isPending ? <CircularProgress size={12} /> : <CheckIcon />}
          disabled={approveMut.isPending}
          onClick={() => handleApproveClick(row)}
          // [2026-08-03] 좁은 셀에서 "승 인" 세로 줄바꿈 방지
          sx={{ px: 1, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          승인
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<BlockIcon />}
          onClick={() => { setRejectTarget(row); setRejectReason('') }}
          sx={{ px: 1, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          거절
        </Button>
      </Stack>
    ) : (
      <Chip
        size="small"
        label={statusLabel(row.status as ApprovalStatus)}
        color={statusChipColor(row.status as ApprovalStatus)}
      />
    )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {t('approval.pageTitle')}
      </Typography>

      {/* ── 검색 조건 — PPT 슬라이드 22 ── */}
      <Box>
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
              <InputLabel shrink>{t('approval.filterStatus')}</InputLabel>
              <Select
                label={t('approval.filterStatus')}
                value={status}
                displayEmpty
                notched
                onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(0) }}
                renderValue={(v) => v === '' ? t('approval.filterAll') : statusLabel(v as ApprovalStatus)}
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
          {/* [2026-08-03] flex:1 로 행 전체를 채우던 검색 입력을 고정 폭으로 변경 */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ sm: 'center' }}
            flexWrap="wrap"
            useFlexGap
          >
            <TextField
              size="small"
              label="협력업체명"
              placeholder="업체명 검색"
              value={companyNameInput}
              onChange={(e) => setCompanyNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              sx={{ width: { xs: '100%', sm: 220 } }}
            />
            <TextField
              size="small"
              label="사업자등록번호"
              placeholder="000-00-00000"
              value={bizNoInput}
              onChange={(e) => setBizNoInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              sx={{ width: { xs: '100%', sm: 180 } }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {t('common.search')}
            </Button>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={handleExcelExport}
              disabled={!rows.length}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Excel
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* ── 목록 — PPT 슬라이드 22 컬럼: 업종|기타업종|계약팀|사업자등록번호|[안전팀담당자: 직책|성명|Tel|E-Mail]|승인/거절 ── */}
      {listQuery.isError && <Alert severity="error">{t('approval.loadError')}</Alert>}

      {/* Table - PC */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
        <Table size="small" sx={{ minWidth: 1000 }}>
          <TableHead>
            {/* 1행: 그룹 헤더 */}
            <TableRow>
              <TableCell rowSpan={2} align="center">업종</TableCell>
              <TableCell rowSpan={2} align="center">기타업종</TableCell>
              <TableCell rowSpan={2} align="center">계약팀</TableCell>
              <TableCell rowSpan={2} align="center">업체명</TableCell>
              <TableCell rowSpan={2} align="center">사업자 등록번호</TableCell>
              <TableCell colSpan={4} align="center">안전팀담당자</TableCell>
              {/* [2026-08-03] 헤더 2행의 E-Mail 이 :last-child 가 되어 테마 규칙에 우측 보더가
                  지워지므로, rowSpan 된 이 셀의 왼쪽 보더로 구분선을 그림 */}
              <TableCell
                rowSpan={2}
                align="center"
                sx={{
                  width: 180,
                  minWidth: 180,
                  borderLeft: (th: any) =>
                    `1px solid ${th.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : th.palette.divider}`,
                }}
              >
                승인/거절
              </TableCell>
            </TableRow>
            {/* 2행: 안전팀담당자 세부 */}
            <TableRow>
              <TableCell align="center">직책</TableCell>
              <TableCell align="center">성명</TableCell>
              <TableCell align="center">Tel</TableCell>
              <TableCell align="center">E-Mail</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}
            {!listQuery.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('approval.empty')}</Typography>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.userId} hover>
                <TableCell align="center">{row.industryName ?? '-'}</TableCell>
                <TableCell align="center">{row.industryOther ?? '-'}</TableCell>
                <TableCell align="center">{row.contractDeptName ?? '-'}</TableCell>
                <TableCell align="center">{row.companyName ?? '-'}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{row.businessNumber}</TableCell>
                <TableCell align="center">{row.title ?? '-'}</TableCell>
                <TableCell align="center">{row.name}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{row.phone}</TableCell>
                <TableCell align="center">{row.email}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  {renderApprovalActions(row)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Card List */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {listQuery.isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}
        {!listQuery.isLoading && rows.length === 0 && (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('approval.empty')}</Typography>
          </Paper>
        )}
        {rows.map((row) => (
          <Paper key={row.userId} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
            <Typography fontWeight="bold" sx={{ mb: 1, wordBreak: 'keep-all' }}>
              {row.companyName ?? '-'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
              {([
                ['업종', row.industryName ?? '-'],
                ['기타업종', row.industryOther ?? '-'],
                ['계약팀', row.contractDeptName ?? '-'],
                ['사업자번호', row.businessNumber],
                ['직책', row.title ?? '-'],
                ['성명', row.name],
                ['Tel', row.phone],
                ['E-Mail', row.email],
              ] as [string, string][]).map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Typography
                    variant="body2"
                    sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 76, flexShrink: 0 }}
                  >
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{value}</Typography>
                </Box>
              ))}
            </Box>
            {renderApprovalActions(row)}
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={Math.max(1, Math.ceil(total / pageSize))}
          page={page + 1}
          onChange={(_, newPage) => setPage(newPage - 1)}
          color="primary"
        />
      </Box>

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
            onClick={handleRejectSubmit}
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
