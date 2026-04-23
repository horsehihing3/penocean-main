import { useMemo, useState } from 'react'
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
  Grid,
  Divider,
  IconButton,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from '@mui/material'
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import CheckIcon from '@mui/icons-material/CheckCircleOutline'
import BlockIcon from '@mui/icons-material/Block'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import * as XLSX from 'xlsx'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { approvalApi } from '../../api/approvalApi'
import type { ApprovalListItem, ApprovalStatus } from '../../types/approval'

type StatusFilter = ApprovalStatus | ''
type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' }

const statusChipColor = (s: ApprovalStatus): 'warning' | 'success' | 'error' | 'default' => {
  switch (s) {
    case 'PENDING':
      return 'warning'
    case 'APPROVED':
      return 'success'
    case 'REJECTED':
      return 'error'
    default:
      return 'default'
  }
}

const ApprovalPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [status, setStatus] = useState<StatusFilter>('PENDING')
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false)

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(
    () =>
      isMobile
        ? {
            createdAt: false,
            email: false,
            phone: false,
            businessNumber: false,
          }
        : {},
    [isMobile]
  )

  const listQuery = useQuery({
    queryKey: ['admin', 'approvals', { status, keyword, page, pageSize }],
    queryFn: () =>
      approvalApi.list({
        status: status || undefined,
        keyword: keyword || undefined,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const detailQuery = useQuery({
    queryKey: ['admin', 'approvals', 'detail', selectedUserId],
    queryFn: () => approvalApi.detail(selectedUserId as number),
    enabled: selectedUserId != null,
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
      setApproveConfirmOpen(false)
      setSelectedUserId(null)
    },
    onError: (err) => {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    },
  })

  const rejectMut = useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason?: string }) =>
      approvalApi.reject(userId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'approvals'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
      setSnackbar({ open: true, message: t('approval.rejectSuccess'), severity: 'success' })
      setRejectOpen(false)
      setRejectReason('')
      setSelectedUserId(null)
    },
    onError: (err) => {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: 'error' })
    },
  })

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const statusLabel = (s: ApprovalStatus): string => {
    switch (s) {
      case 'PENDING':
        return t('approval.statusPending')
      case 'APPROVED':
        return t('approval.statusApproved')
      case 'REJECTED':
        return t('approval.statusRejected')
      case 'INACTIVE':
        return t('approval.statusInactive')
    }
  }

  const columns: GridColDef<ApprovalListItem>[] = [
    {
      field: 'createdAt',
      headerName: t('approval.colCreatedAt'),
      width: 150,
      valueFormatter: (p) => (p.value ? formatDate(p.value as string) : ''),
    },
    { field: 'name', headerName: t('approval.colName'), width: 120, flex: 0 },
    { field: 'email', headerName: t('approval.colEmail'), flex: 1, minWidth: 180 },
    { field: 'phone', headerName: t('approval.colPhone'), width: 140 },
    { field: 'companyName', headerName: t('approval.colCompany'), flex: 1, minWidth: 160 },
    { field: 'businessNumber', headerName: t('approval.colBusinessNumber'), width: 140 },
    {
      field: 'status',
      headerName: t('approval.colStatus'),
      width: 120,
      renderCell: (p) => (
        <Chip
          size="small"
          label={statusLabel(p.value as ApprovalStatus)}
          color={statusChipColor(p.value as ApprovalStatus)}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: t('approval.colActions'),
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Button
          size="small"
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedUserId(p.row.userId)
          }}
        >
          {t('approval.detail')}
        </Button>
      ),
    },
  ]

  const applyKeyword = () => {
    setKeyword(keywordInput.trim())
    setPage(0)
  }

  // PPT slide 22: 가입신청 LIST Excel export
  const handleExcelExport = () => {
    const rows = listQuery.data?.content ?? []
    const data = rows.map((r) => ({
      '업체명': r.companyName ?? '',
      '사업자등록번호': r.businessNumber ?? '',
      '담당자명': r.name ?? '',
      '이메일': r.email ?? '',
      '연락처': r.phone ?? '',
      '상태': statusLabel(r.status as ApprovalStatus),
      '신청일': r.createdAt ? formatDate(r.createdAt) : '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [
      { wch: 24 }, { wch: 18 }, { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 10 }, { wch: 18 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '가입신청')
    const ts = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `approval_${ts}.xlsx`)
  }

  const handleRowClick = (params: GridRowParams<ApprovalListItem>) => {
    setSelectedUserId(params.row.userId)
  }

  const closeDetail = () => {
    setSelectedUserId(null)
    setRejectOpen(false)
    setApproveConfirmOpen(false)
    setRejectReason('')
  }

  const detail = detailQuery.data
  const detailOpen = selectedUserId != null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('approval.pageTitle')}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/admin/company')}
        >
          {t('approval.goToCompanyMgmt')}
        </Button>
      </Stack>

      {/* Filter bar */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t('approval.filterStatus')}</InputLabel>
            <Select
              label={t('approval.filterStatus')}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StatusFilter)
                setPage(0)
              }}
            >
              <MenuItem value="">{t('approval.filterAll')}</MenuItem>
              <MenuItem value="PENDING">{t('approval.statusPending')}</MenuItem>
              <MenuItem value="APPROVED">{t('approval.statusApproved')}</MenuItem>
              <MenuItem value="REJECTED">{t('approval.statusRejected')}</MenuItem>
              <MenuItem value="INACTIVE">{t('approval.statusInactive')}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label={t('approval.filterKeyword')}
            placeholder={t('approval.filterKeywordPlaceholder')}
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyKeyword()
            }}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={applyKeyword}
          >
            {t('common.search')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExcelExport}
            disabled={!(listQuery.data?.content?.length)}
          >
            Excel
          </Button>
        </Stack>
      </Paper>

      {/* DataGrid */}
      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 480,
          height: { xs: '60vh', md: '65vh' },
        }}
      >
        {listQuery.isError && (
          <Alert severity="error" sx={{ m: 2 }}>
            {t('approval.loadError')}
          </Alert>
        )}
        <DataGrid
          rows={listQuery.data?.content ?? []}
          getRowId={(r) => r.userId}
          columns={columns}
          columnVisibilityModel={columnVisibilityModel}
          loading={listQuery.isLoading || listQuery.isFetching}
          onRowClick={handleRowClick}
          paginationMode="server"
          rowCount={listQuery.data?.total ?? 0}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(m) => {
            setPage(m.page)
            setPageSize(m.pageSize)
          }}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          localeText={{
            noRowsLabel: t('approval.empty'),
          }}
          sx={{
            border: 0,
            flex: 1,
            '& .MuiDataGrid-row': { cursor: 'pointer' },
          }}
        />
      </Paper>

      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={closeDetail}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t('approval.detailTitle')}
          <IconButton onClick={closeDetail} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailQuery.isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={32} />
            </Box>
          )}

          {detail && (
            <Stack spacing={3}>
              {/* Basic info */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  {t('approval.sectionBasic')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('approval.colName')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {detail.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('approval.colEmail')}
                    </Typography>
                    <Typography variant="body1">{detail.email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('approval.colPhone')}
                    </Typography>
                    <Typography variant="body1">{detail.phone}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('approval.colCompany')}
                    </Typography>
                    <Typography variant="body1">{detail.companyName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('approval.colBusinessNumber')}
                    </Typography>
                    <Typography variant="body1">{detail.businessNumber}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('approval.colCreatedAt')}
                    </Typography>
                    <Typography variant="body1">{formatDate(detail.createdAt)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('approval.colStatus')}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        size="small"
                        label={statusLabel(detail.status)}
                        color={statusChipColor(detail.status)}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Industries */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  {t('approval.sectionIndustries')}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {detail.industries.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {t('common.noData')}
                    </Typography>
                  )}
                  {detail.industries.map((code) => (
                    <Chip key={code} label={code} size="small" />
                  ))}
                </Stack>
              </Box>

              <Divider />

              {/* Contract departments */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  {t('approval.sectionDepartments')}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {detail.contractDepartments.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {t('common.noData')}
                    </Typography>
                  )}
                  {detail.contractDepartments.map((d) => (
                    <Chip key={d.code} label={d.name} size="small" color="primary" variant="outlined" />
                  ))}
                </Stack>
              </Box>

              {/* Reject reason entry */}
              {detail.status === 'PENDING' && rejectOpen && (
                <>
                  <Divider />
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label={t('approval.rejectReasonLabel')}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          {detail?.status === 'PENDING' && !rejectOpen && !approveConfirmOpen && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<BlockIcon />}
                onClick={() => setRejectOpen(true)}
              >
                {t('approval.reject')}
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={() => setApproveConfirmOpen(true)}
              >
                {t('approval.approve')}
              </Button>
            </>
          )}
          {detail?.status === 'PENDING' && approveConfirmOpen && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                {t('approval.approveConfirm')}
              </Typography>
              <Button onClick={() => setApproveConfirmOpen(false)} disabled={approveMut.isPending}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="contained"
                color="success"
                disabled={approveMut.isPending}
                onClick={() => approveMut.mutate(detail.userId)}
              >
                {approveMut.isPending ? <CircularProgress size={20} /> : t('common.confirm')}
              </Button>
            </Stack>
          )}
          {detail?.status === 'PENDING' && rejectOpen && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                {t('approval.rejectConfirm')}
              </Typography>
              <Button
                onClick={() => {
                  setRejectOpen(false)
                  setRejectReason('')
                }}
                disabled={rejectMut.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={rejectMut.isPending}
                onClick={() =>
                  rejectMut.mutate({ userId: detail.userId, reason: rejectReason.trim() || undefined })
                }
              >
                {rejectMut.isPending ? <CircularProgress size={20} /> : t('common.confirm')}
              </Button>
            </Stack>
          )}
          {detail && detail.status !== 'PENDING' && (
            <Button onClick={closeDetail} variant="contained">
              {t('common.close')}
            </Button>
          )}
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
